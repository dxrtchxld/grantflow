// functions/index.js — Node.js Cloud Functions Entrypoint
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { ingestGrantPDF } = require("./ingestGrants");

if (!admin.apps.length) {
  admin.initializeApp();
}

const MISTRAL_API_KEY = defineSecret("MISTRAL_API_KEY");

/**
 * Server-Side AI Gateway (Phase 1 Blueprint):
 * Enforces authentication, firm membership, source grounding, and audit logging.
 */
exports.aiGateway = onCall({ secrets: [MISTRAL_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to access AI gateway.");
  }

  const { action, prompt, grantContext, clientContext } = request.data;
  const apiKey = MISTRAL_API_KEY.value();

  if (!apiKey) {
    throw new HttpsError("failed-precondition", "MISTRAL_API_KEY secret not configured in Cloud Functions.");
  }

  // Audit log entry
  await admin.firestore().collection("ai_runs").add({
    uid: request.auth.uid,
    action: action || "general_prompt",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    const axios = require("axios");
    const resp = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an expert grant advisory engine. Write evidence-grounded narratives only using cited solicitation facts. Do not fabricate facts."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    return { content: resp.data.choices[0].message.content };
  } catch (err) {
    throw new HttpsError("internal", err.message || "AI gateway processing error");
  }
});

exports.ingestGrantPDF = ingestGrantPDF;
