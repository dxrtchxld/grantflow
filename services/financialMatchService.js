// services/financialMatchService.js
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // ✅ Fixed: correct root-level path

/**
 * Evaluates whether the currently authenticated user's verified financial
 * profile meets a grant's financial criteria.
 *
 * Reads from `users/{uid}/financialProfile` which is populated server-side
 * after a successful Plaid token exchange — never set by the client directly.
 *
 * @param {object} grantCriteria
 * @param {number} [grantCriteria.maxRevenue]    - Revenue cap in dollars
 * @param {number} [grantCriteria.minRunwayMonths] - Minimum cash runway required
 * @returns {Promise<{
 *   financiallyEligible: boolean,
 *   liquidityScore: number,
 *   isPlaidVerified: boolean,
 *   summary: string,
 * }>}
 */
export const evaluateGrantFinancialFit = async (grantCriteria) => {
  // ✅ Fixed: uid always comes from the verified auth session — never a parameter
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to evaluate financial fit.');
  }

  let userDoc;
  try {
    userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  } catch (error) {
    // ✅ Fixed: fail-closed — a Firestore error does NOT grant eligibility
    console.error('financialMatchService: Firestore read failed:', error.message);
    return {
      financiallyEligible: false,
      liquidityScore: 0,
      isPlaidVerified: false,
      summary: 'Financial data unavailable. Manual review required.',
    };
  }

  // ✅ Fixed: explicit existence check before reading data
  if (!userDoc.exists()) {
    return {
      financiallyEligible: false,
      liquidityScore: 0,
      isPlaidVerified: false,
      summary: 'No financial profile found. Please connect your bank account.',
    };
  }

  const userData = userDoc.data();
  const financialProfile = userData?.financialProfile;

  // ✅ Fixed: no hardcoded fallback — missing profile is an explicit ineligible state,
  // not a silent substitution that could produce fraudulent "Plaid Verified" claims
  if (!financialProfile) {
    return {
      financiallyEligible: false,
      liquidityScore: 0,
      isPlaidVerified: false,
      summary: 'Bank account not yet connected. Link your account via Plaid to unlock financial matching.',
    };
  }

  const { cashFlow = 0, burnRate = 0, plaidVerified = false } = financialProfile;

  // ── Eligibility checks ──────────────────────────────────────────────────
  const meetsRevenueCap =
    grantCriteria.maxRevenue != null
      ? cashFlow <= grantCriteria.maxRevenue
      : true;

  // ✅ Fixed: runway-based liquidity score (months of runway = cashFlow / burnRate)
  // replaces the binary cashFlow > 0 check that ignored burnRate entirely.
  // Capped at 100 at 12+ months of runway.
  const runwayMonths = burnRate > 0 ? cashFlow / burnRate : (cashFlow > 0 ? 12 : 0);
  const liquidityScore = Math.min(100, Math.round((runwayMonths / 12) * 100));

  const meetsRunwayThreshold =
    grantCriteria.minRunwayMonths != null
      ? runwayMonths >= grantCriteria.minRunwayMonths
      : true;

  const financiallyEligible = meetsRevenueCap && meetsRunwayThreshold;

  // ✅ Fixed: "Plaid Verified" label only appears when the profile is actually
  // Plaid-verified (set server-side after exchangePublicToken succeeds)
  const verificationLabel = plaidVerified ? 'Plaid Verified ✓' : 'Unverified';
  const summary = financiallyEligible
    ? `${verificationLabel}: ${runwayMonths.toFixed(1)} months runway. Meets funder threshold.`
    : `${verificationLabel}: Does not meet all financial criteria for this grant.`;

  return {
    financiallyEligible,
    liquidityScore,
    isPlaidVerified: plaidVerified,
    summary,
  };
};
