// services/proposalService.js
// Client-side service for proposal CRUD + backend API calls
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import env from "../env";

const BACKEND_URL = env.backendUrl || "";

async function backendPost(endpoint, body) {
  if (!BACKEND_URL) throw new Error("BACKEND_URL not set in .env");
  const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => "Unknown error");
    throw new Error(`Backend ${endpoint} failed (${resp.status}): ${msg}`);
  }
  return resp.json();
}

async function backendGet(endpoint) {
  if (!BACKEND_URL) throw new Error("BACKEND_URL not set in .env");
  const resp = await fetch(`${BACKEND_URL}${endpoint}`);
  if (!resp.ok) throw new Error(`Backend GET ${endpoint} failed (${resp.status})`);
  return resp.json();
}

// ── AI Generation ─────────────────────────────────────────────────────────────

/**
 * Generate a full proposal (all sections) for a grant.
 */
export async function generateFullProposal(grant, requirements, orgContext, templateId = "default") {
  return backendPost("/api/proposals/generate", {
    grant,
    requirements,
    template_id: templateId,
    org_context: orgContext || {},
  });
}

/**
 * Generate a single section.
 */
export async function generateSection(sectionName, grant, requirements, orgContext) {
  return backendPost("/api/proposals/section", {
    section_name: sectionName,
    grant,
    requirements,
    org_context: orgContext || {},
  });
}

/**
 * Refine a section based on feedback.
 */
export async function refineSection(sectionName, sectionText, feedback) {
  return backendPost("/api/proposals/refine", {
    section_name: sectionName,
    section_text: sectionText,
    feedback,
  });
}

/**
 * Generate an AI budget table from requirements text.
 */
export async function generateBudget(requirements, totalHint = null) {
  return backendPost("/api/budget/generate", {
    requirements,
    total_hint: totalHint,
  });
}

/**
 * Get AI match score (0-100) for an org vs. a grant.
 */
export async function scoreGrantMatch(orgProfile, grant) {
  return backendPost("/api/grants/score", { org_profile: orgProfile, grant });
}

/**
 * Search grants via backend (Grants.gov + SBIR).
 */
export async function searchGrantsFromAPI(keywords, filters = {}) {
  return backendPost("/api/grants/search", { keywords, ...filters });
}

/**
 * Fetch all proposal templates from backend.
 */
export async function getTemplates() {
  return backendGet("/api/templates");
}

// ── Firestore Proposal CRUD ────────────────────────────────────────────────────

/**
 * Save a new proposal draft to Firestore.
 */
export async function saveProposal(grant, sections, budget, templateId = "default") {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to save proposals");

  const ref = doc(collection(db, "proposals"));
  await setDoc(ref, {
    userId: user.uid,
    grantId: grant?.id || "manual",
    grantName: grant?.name || "Grant Proposal",
    templateId,
    sections,
    budget: budget || null,
    status: "draft",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Update a specific section in an existing proposal.
 */
export async function updateProposalSection(proposalId, sectionName, content) {
  await updateDoc(doc(db, "proposals", proposalId), {
    [`sections.${sectionName}`]: content,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update proposal status.
 */
export async function updateProposalStatus(proposalId, status) {
  await updateDoc(doc(db, "proposals", proposalId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to all proposals for the current user.
 * Returns an unsubscribe function.
 */
export function subscribeToProposals(callback) {
  const user = auth.currentUser;
  if (!user) { callback([]); return () => {}; }

  const q = query(
    collection(db, "proposals"),
    where("userId", "==", user.uid),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
