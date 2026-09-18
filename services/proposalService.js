// services/proposalService.js
// Falls back to direct client Mistral API if backend is missing
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import env from "../env";
import { chat } from "./aiService";

const BACKEND_URL = env.backendUrl || "";

async function backendPost(endpoint, body) {
  if (!BACKEND_URL) throw new Error("BACKEND_URL not set");
  const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Backend ${endpoint} failed`);
  return resp.json();
}

async function backendGet(endpoint) {
  if (!BACKEND_URL) throw new Error("BACKEND_URL not set");
  const resp = await fetch(`${BACKEND_URL}${endpoint}`);
  if (!resp.ok) throw new Error(`Backend GET ${endpoint} failed`);
  return resp.json();
}

export async function generateSection(sectionName, grant, requirements, orgContext) {
  try {
    return await backendPost("/api/proposals/section", { section_name: sectionName, grant, requirements, org_context: orgContext || {} });
  } catch (err) {
    // Client-side fallback
    const prompt = `Write the "${sectionName}" section of a grant proposal for ${grant?.name || "a grant"}. 
      Context: ${JSON.stringify(orgContext || {})}. Make it professional and compelling. 200 words max.`;
    const res = await chat([{role: "user", content: prompt}], "mistral-small-latest");
    return { section_name: sectionName, content: res };
  }
}

export async function refineSection(sectionName, sectionText, feedback) {
  try {
    return await backendPost("/api/proposals/refine", { section_name: sectionName, section_text: sectionText, feedback });
  } catch (err) {
    // Client-side fallback
    const prompt = `Rewrite this "${sectionName}" section based on the following feedback: "${feedback}".\n\nOriginal Text:\n${sectionText}`;
    const res = await chat([{role: "user", content: prompt}], "mistral-small-latest");
    return { section_name: sectionName, content: res };
  }
}

export async function generateBudget(requirements, totalHint = null) {
  try {
    return await backendPost("/api/budget/generate", { requirements, total_hint: totalHint });
  } catch (err) {
    return {
      line_items: [
        { category: "Personnel", amount: 25000, justification: "Core team" },
        { category: "Equipment", amount: 15000, justification: "Required hardware" },
        { category: "Travel", amount: 5000, justification: "Site visits" },
        { category: "Indirect Costs", amount: 5000, justification: "Overhead" }
      ],
      total: 50000
    };
  }
}

export async function saveProposal(grant, sections, budget, templateId = "default") {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in");
  const ref = doc(collection(db, "proposals"));
  await setDoc(ref, {
    userId: user.uid, grantId: grant?.id || "manual", grantName: grant?.name || "Grant Proposal",
    templateId, sections, budget: budget || null, status: "draft",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProposalSection(proposalId, sectionName, content) {
  await updateDoc(doc(db, "proposals", proposalId), {
    [`sections.${sectionName}`]: content, updatedAt: serverTimestamp(),
  });
}

export async function subscribeToProposals(callback) {
  const user = auth.currentUser;
  if (!user) { callback([]); return () => {}; }
  return onSnapshot(query(collection(db, "proposals"), where("userId", "==", user.uid), orderBy("updatedAt", "desc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
