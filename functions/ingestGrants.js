// functions/ingestGrants.js
// Admin-only Cloud Function — ingests a grant PDF from an approved source,
// extracts its text, and indexes it in Firestore for AI/RAG matching.
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");
const pdfParse = require("pdf-parse");

// ✅ Fixed: guard prevents "app already exists" crash on warm-start invocations
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Store the ingest API key as a Cloud Functions secret (never in source code):
//   firebase functions:secrets:set INGEST_API_KEY
const INGEST_API_KEY = defineSecret("INGEST_API_KEY");

// ── SSRF allowlist ────────────────────────────────────────────────────────────
// Only fetch PDFs from pre-approved grant source domains.
// Add legitimate grant portal hostnames here as needed.
const ALLOWED_PDF_HOSTS = new Set([
  "grants.gov",
  "www.grants.gov",
  "sbir.gov",
  "www.sbir.gov",
  "storage.googleapis.com",   // your own GCS bucket
]);

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB hard cap

/** Returns true only if the URL is HTTPS and its hostname is on the allowlist. */
function isAllowedPdfUrl(rawUrl) {
  try {
    const { protocol, hostname } = new URL(rawUrl);
    return protocol === "https:" && ALLOWED_PDF_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

/** Sanitize grantId — Firestore document IDs must not contain '/' or be empty. */
function isValidGrantId(id) {
  return typeof id === "string" && id.length > 0 && id.length <= 128 && !/[\/.]/.test(id);
}

exports.ingestGrantPDF = onRequest(
  { secrets: [INGEST_API_KEY] },
  async (req, res) => {

    // ── 1. Authentication ────────────────────────────────────────────────────
    // ✅ Fixed: require a secret API key in the Authorization header.
    //    This key is stored as a Cloud Functions secret, never in source.
    //    Rotate via: firebase functions:secrets:set INGEST_API_KEY
    const authHeader = req.headers["authorization"] ?? "";
    const providedKey = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!providedKey || providedKey !== INGEST_API_KEY.value()) {
      // Return 404 not 401 — don't confirm the endpoint exists to unauthenticated callers
      return res.status(404).json({ error: "Not found." });
    }

    // ── 2. Input validation ──────────────────────────────────────────────────
    const { grantId, pdfUrl } = req.body ?? {};

    if (!isValidGrantId(grantId)) {
      return res.status(400).json({ error: "Invalid or missing grantId." });
    }

    // ✅ Fixed: SSRF protection — only HTTPS URLs on the allowlist are fetched
    if (!pdfUrl || !isAllowedPdfUrl(pdfUrl)) {
      return res.status(400).json({
        error: "pdfUrl must be an HTTPS URL from an approved grant source domain.",
      });
    }

    try {
      // ── 3. Download PDF with size cap ────────────────────────────────────
      // ✅ Fixed: maxContentLength prevents OOM from multi-GB attacker payloads
      const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
        maxContentLength: MAX_PDF_BYTES,
        maxBodyLength: MAX_PDF_BYTES,
        timeout: 30_000,
      });

      // ✅ Fixed: Content-Type validation — reject non-PDF responses
      const contentType = response.headers["content-type"] ?? "";
      if (!contentType.includes("application/pdf")) {
        return res.status(422).json({ error: "URL did not return a PDF document." });
      }

      // ── 4. Parse PDF text ────────────────────────────────────────────────
      const pdfBuffer = Buffer.from(response.data);
      const parsedData = await pdfParse(pdfBuffer);
      const rawText = parsedData.text;

      // ── 5. Persist to Firestore ──────────────────────────────────────────
      await db.collection("grants").doc(grantId).update({
        fullGuidelinesText: rawText.substring(0, 10_000),
        lastIndexed: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        message: "Grant guidelines successfully indexed for AI matching.",
      });

    } catch (error) {
      // ✅ Fixed: never expose error.message — log server-side only
      console.error(`ingestGrantPDF error [grantId=${grantId}]:`, error);
      return res.status(500).json({ error: "Internal error. Check server logs." });
    }
  }
);
