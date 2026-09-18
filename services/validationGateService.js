// services/validationGateService.js
// Pure validation utility — no network calls, no Firebase, no side effects.
// All checks here are deterministic and cannot be overridden by AI output.

/**
 * Resolves a deadline value to a plain JS Date, accepting either a
 * Firestore Timestamp (has .toDate()) or an existing Date object.
 * Returns null if the deadline is missing or not resolvable.
 *
 * @param {import('firebase/firestore').Timestamp | Date | null | undefined} deadline
 * @returns {Date | null}
 */
function resolveDeadline(deadline) {
  if (!deadline) return null;
  // Firestore Timestamp has a toDate() method
  if (typeof deadline.toDate === 'function') return deadline.toDate();
  // Already a plain JS Date
  if (deadline instanceof Date) return deadline;
  return null;
}

/**
 * Validates a business profile against grant requirements before submission.
 * All checks are hard gates — the AI layer cannot override them.
 *
 * @param {object} businessProfile
 * @param {string[]} [businessProfile.certifications] - Array of held certification IDs
 *
 * @param {object} grantRequirements
 * @param {string}  [grantRequirements.requiresCert] - Required certification ID, if any
 * @param {import('firebase/firestore').Timestamp | Date} [grantRequirements.deadline]
 *
 * @returns {{ canSubmitDirectly: boolean, errors: string[] }}
 */
export const validateApplicationBeforeSubmission = (businessProfile, grantRequirements) => {
  // Guard: handle missing or malformed arguments gracefully
  if (!businessProfile || !grantRequirements) {
    return {
      canSubmitDirectly: false,
      errors: ["Validation failed: business profile or grant requirements are missing."],
    };
  }

  const errors = [];

  // ── 1. Certification check ────────────────────────────────────────────────
  // ✅ Fixed: Array.isArray() guard prevents false positives if `certifications`
  //    is a string (String.prototype.includes exists and would match substrings)
  if (grantRequirements.requiresCert) {
    const heldCerts = Array.isArray(businessProfile.certifications)
      ? businessProfile.certifications
      : [];

    if (!heldCerts.includes(grantRequirements.requiresCert)) {
      errors.push(
        `Disqualification risk: This grant strictly requires a ${grantRequirements.requiresCert} certification.`
      );
    }
  }

  // ── 2. Deadline checks ────────────────────────────────────────────────────
  // ✅ Fixed: resolveDeadline() handles both Firestore Timestamp and plain Date,
  //    and returns null when the field is missing — no more TypeError crash.
  const deadlineDate = resolveDeadline(grantRequirements.deadline);

  if (deadlineDate === null) {
    // No deadline set — not a blocking error, but flag it for review
    errors.push("Warning: No deadline found for this grant. Confirm the closing date before submitting.");
  } else {
    const daysToDeadline = Math.ceil(
      (deadlineDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    // ✅ Fixed: expired deadline check — negative days silently passed before
    if (daysToDeadline < 0) {
      errors.push(
        `Disqualification: This grant's deadline passed ${Math.abs(daysToDeadline)} day(s) ago. Applications are no longer accepted.`
      );
    } else if (daysToDeadline < 2) {
      errors.push(
        "Critical Warning: Deadline is within 48 hours. Auto-fill submission disabled to prevent portal rejection. Manual review required."
      );
    }
  }

  return {
    canSubmitDirectly: errors.length === 0,
    errors,
  };
};
