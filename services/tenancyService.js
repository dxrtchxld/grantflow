// services/tenancyService.js — Multi-client tenancy & firm workspace manager
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const ACTIVE_CLIENT_KEY = "grantflow_active_client_id";

/**
 * Initialize or fetch the current advisor's firm workspace.
 */
export async function getOrCreateFirmWorkspace() {
  const user = auth.currentUser;
  if (!user) return null;

  const firmRef = doc(db, "firms", user.uid);
  const snap = await getDoc(firmRef);

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }

  const newFirm = {
    ownerUid: user.uid,
    name: `${user.displayName || "Advisor"}'s Advisory Practice`,
    plan: "Advisor",
    clientLimit: 10,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(firmRef, newFirm);
  return { id: user.uid, ...newFirm };
}

/**
 * Fetch all clients belonging to the firm.
 */
export async function getFirmClients(firmId) {
  if (!firmId) return [];
  try {
    const q = query(collection(db, "firms", firmId, "clients"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Firestore client fetch fallback:", err);
    return [];
  }
}

/**
 * Create a new client workspace under the firm.
 */
export async function createClientWorkspace(firmId, clientData) {
  if (!firmId) throw new Error("Firm ID required");
  const clientRef = doc(collection(db, "firms", firmId, "clients"));
  const payload = {
    businessName: clientData.businessName || "New Client LLC",
    industry: clientData.industry || "General",
    state: clientData.state || "US",
    entityType: clientData.entityType || "LLC",
    ein: clientData.ein || "",
    uei: clientData.uei || "",
    status: "Active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(clientRef, payload);
  return { id: clientRef.id, ...payload };
}

/**
 * Sample clients for seed/demo if database is fresh.
 */
export const SEED_CLIENTS = [
  { id: "cli_1", businessName: "Apex BioTech Solutions", industry: "Healthcare / Life Sciences", state: "MA", entityType: "C-Corp", status: "Active", uei: "SAM123456789", matchCount: 4 },
  { id: "cli_2", businessName: "Main Street Artisanal Bakery", industry: "Food & Agriculture", state: "MI", entityType: "LLC", status: "Active", uei: "", matchCount: 2 },
  { id: "cli_3", businessName: "CleanGrid Solar Innovations", industry: "Clean Energy / Tech", state: "CA", entityType: "LLC", status: "Active", uei: "SAM987654321", matchCount: 5 },
];
