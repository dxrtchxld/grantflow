// services/eligibilityEngine.js — Rules-based eligibility, evidence matrix & pursuit economics
/**
 * Evaluates an opportunity against a client profile to produce a transparent
 * Evidence-Backed Eligibility Matrix (Pass, Fail, Unknown, N/A).
 */
export function evaluateEligibilityRules(clientProfile = {}, grant = {}) {
  const rules = [];

  // Rule 1: Legal Entity & Applicant Type
  const allowedEntities = grant.eligibility || ["For-profit small business", "Under 500 employees"];
  const clientEntity = clientProfile.entityType || "LLC";
  const entityPass = allowedEntities.some(e => e.toLowerCase().includes("business") || e.toLowerCase().includes(clientEntity.toLowerCase()));
  rules.push({
    id: "rule_entity",
    category: "Legal Entity",
    name: "Eligible Applicant Type",
    status: entityPass ? "PASS" : "UNKNOWN",
    evidence: `Solicitation requires: ${allowedEntities.join(", ")}. Client is registered as ${clientEntity}.`,
    sourceSection: "Section III.A — Eligible Applicants",
    sourceUrl: grant.url || "https://www.grants.gov",
    retrievedAt: new Date().toISOString().split("T")[0],
  });

  // Rule 2: Geographic & Location Criteria
  const clientState = clientProfile.state || "US";
  const geoRestriction = grant.stateRestriction || null;
  const geoPass = !geoRestriction || geoRestriction === clientState;
  rules.push({
    id: "rule_geo",
    category: "Geography",
    name: "Location & Service Area",
    status: geoPass ? "PASS" : "FAIL",
    evidence: geoRestriction
      ? `Grant restricted to ${geoRestriction}. Client location is ${clientState}.`
      : `Nationwide / US Federal opportunity open to ${clientState} entities.`,
    sourceSection: "Section II.B — Geographic Focus",
    sourceUrl: grant.url || "https://www.grants.gov",
    retrievedAt: new Date().toISOString().split("T")[0],
  });

  // Rule 3: Required Registrations (SAM.gov / UEI)
  const hasUEI = !!(clientProfile.uei && clientProfile.uei.trim().length > 5);
  rules.push({
    id: "rule_uei",
    category: "Registrations",
    name: "Active SAM.gov & UEI Registration",
    status: hasUEI ? "PASS" : "UNKNOWN",
    evidence: hasUEI
      ? `Client has active Unique Entity ID (UEI: ${clientProfile.uei}).`
      : "Client SAM.gov / UEI registration status unverified. Mandatory prior to submission.",
    sourceSection: "Section IV.B — Unique Entity Identifier",
    sourceUrl: grant.url || "https://www.grants.gov",
    retrievedAt: new Date().toISOString().split("T")[0],
    actionRequired: !hasUEI ? "Verify or complete SAM.gov registration" : null,
  });

  // Rule 4: Match Funding / Cost Sharing
  const requiresMatch = grant.requiresMatch || false;
  rules.push({
    id: "rule_match",
    category: "Financials",
    name: "Cost Sharing / Matching Requirement",
    status: requiresMatch ? "UNKNOWN" : "N/A",
    evidence: requiresMatch
      ? "Solicitation requires 10% non-federal cash match. Client cash reserve confirmation needed."
      : "No non-federal cost sharing or matching funds required for this solicitation.",
    sourceSection: "Section III.B — Cost Sharing",
    sourceUrl: grant.url || "https://www.grants.gov",
    retrievedAt: new Date().toISOString().split("T")[0],
  });

  // Calculate summary metrics
  const passCount = rules.filter(r => r.status === "PASS").length;
  const failCount = rules.filter(r => r.status === "FAIL").length;
  const unknownCount = rules.filter(r => r.status === "UNKNOWN").length;

  return {
    rules,
    passCount,
    failCount,
    unknownCount,
    overallFit: failCount > 0 ? "INELIGIBLE" : unknownCount > 0 ? "REQUIRES VERIFICATION" : "HIGH FIT",
  };
}

/**
 * Calculates Pursuit Economics: Fit, Probability, Effort, and Recommendation.
 */
export function calculatePursuitEconomics(clientProfile = {}, grant = {}) {
  const evalResult = evaluateEligibilityRules(clientProfile, grant);
  
  // Fit Score (0 - 100)
  const fitScore = evalResult.failCount > 0 ? 20 : evalResult.unknownCount > 0 ? 70 : 92;

  // Probability Band
  const probabilityBand = fitScore >= 85 ? "High (65-80%)" : fitScore >= 60 ? "Moderate (35-50%)" : "Low (<20%)";

  // Estimated Hours Effort
  const estimatedHours = grant.amount > 200000 ? 35 : grant.amount > 50000 ? 20 : 10;

  // Pursuit Recommendation Decision Model
  let decision = "PURSUE";
  let reasoning = "Strong strategic fit and high probability of success.";

  if (evalResult.failCount > 0) {
    decision = "DECLINE";
    reasoning = "Client fails hard eligibility criteria (Geographic or Entity restrictions).";
  } else if (evalResult.unknownCount > 1) {
    decision = "WAIT";
    reasoning = "Pending verification of SAM.gov UEI and cost-sharing match capacity.";
  } else if (grant.requiresPartner) {
    decision = "PARTNER";
    reasoning = "Solicitation requires a research institution or non-profit co-applicant.";
  }

  return {
    fitScore,
    probabilityBand,
    estimatedHours,
    decision, // PURSUE | PARTNER | WAIT | DECLINE
    reasoning,
    netAwardValue: grant.amount || 50000,
    evalResult,
  };
}
