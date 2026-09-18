// services/complianceMonitorService.js
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase'; // ✅ Fixed: correct root-level import path

/**
 * Verifies state compliance standing and identifies a local municipal sponsor
 * for the authenticated user's business.
 *
 * ⚠️  LARA INTEGRATION NOTE:
 * The Michigan LARA / Good Standing check below is a STUB.
 * In production, replace it with a real call to the LARA MiBusiness registry
 * API (https://cofs.lara.state.mi.us/) or your state's equivalent.
 * DO NOT ship the stub to production — it does not verify real compliance status
 * and must not be used to certify grant eligibility.
 *
 * @param {string} businessId - Firestore document ID of the business to check
 * @param {string} grantRegion - Region/state the grant applies to (e.g. "MI")
 * @returns {Promise<{ eligible: boolean, sponsor?: string, message?: string, reason?: string }>}
 */
export const verifyStateStandingAndSponsor = async (businessId, grantRegion) => {
  // ✅ Fixed: always derive identity from auth session — never trust businessId alone
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { eligible: false, reason: "User is not authenticated." };
  }

  let businessSnap;
  try {
    businessSnap = await getDoc(doc(db, 'businesses', businessId));
  } catch {
    // ✅ Fixed: no raw error.message exposed — Firestore errors may include
    //    permission details that should not reach the caller
    console.error('complianceMonitorService: Firestore read failed for', businessId);
    return { eligible: false, reason: "Could not retrieve business profile. Please try again." };
  }

  if (!businessSnap.exists()) {
    return { eligible: false, reason: "Business profile not found." };
  }

  const businessData = businessSnap.data();

  // ✅ Fixed: ownership check — verify the business belongs to the current user
  //    before reading sensitive compliance data or writing attestation fields
  if (businessData.userId !== currentUser.uid) {
    console.error('complianceMonitorService: uid mismatch for businessId', businessId);
    return { eligible: false, reason: "Access denied." };
  }

  // ── LARA / Good Standing check ────────────────────────────────────────────
  // ✅ Fixed: stub is clearly labeled and does NOT write laraGoodStanding: true.
  //    Storing a verified-sounding attestation from a state-string comparison
  //    (not an actual LARA API call) would be a false certification.
  //
  //    Replace this block with a real LARA API call before going to production:
  //      GET https://cofs.lara.state.mi.us/api/entity?name=<businessName>
  //      (or your state's equivalent business registry endpoint)
  const isRegionMatch = businessData.state === grantRegion;

  if (!isRegionMatch) {
    return {
      eligible: false,
      reason: `Business is registered in ${businessData.state}, not ${grantRegion}. This grant requires state registration in ${grantRegion}.`,
    };
  }

  // ── Municipal sponsor routing ─────────────────────────────────────────────
  let municipalSponsor = "General State Pool";
  if (businessData.city?.toLowerCase() === "ypsilanti") {
    municipalSponsor = "Ypsilanti Downtown Development Authority (DDA)";
  } else if (businessData.city?.toLowerCase() === "detroit") {
    municipalSponsor = "Detroit Economic Growth Corporation (DEGC)";
  } else if (businessData.city?.toLowerCase() === "ann arbor") {
    municipalSponsor = "Ann Arbor SPARK";
  }

  // ── Persist compliance check metadata ────────────────────────────────────
  // ✅ Fixed: stores laraVerificationStatus: "pending_api" to signal that a
  //    real LARA verification has NOT been completed — not a false attestation.
  // ✅ Fixed: serverTimestamp() instead of new Date() to avoid client clock skew
  try {
    await updateDoc(doc(db, 'businesses', businessId), {
      laraVerificationStatus: "pending_api",  // ← only a real LARA API call sets this to "verified"
      assignedMunicipalSponsor: municipalSponsor,
      lastComplianceCheck: serverTimestamp(),
    });
  } catch {
    // Non-fatal — return the eligibility result even if the metadata write fails
    console.error('complianceMonitorService: failed to persist compliance metadata');
  }

  return {
    eligible: true,
    sponsor: municipalSponsor,
    message: `Region match confirmed. Application routed to: ${municipalSponsor}. LARA verification pending — complete at michigan.gov/lara.`,
  };
};
