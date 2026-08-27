export type AdminAuthStep = "reject" | "password-change" | "mfa-enroll" | "mfa-challenge" | "allow";

export function getAdminAuthStep(input: {
  passwordAccepted: boolean;
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  mustChangePassword: boolean;
}): AdminAuthStep {
  if (!input.passwordAccepted) return "reject";
  if (input.mustChangePassword) return "password-change";
  if (input.mfaRequired && !input.mfaEnrolled) return "mfa-enroll";
  if (input.mfaRequired && input.mfaEnrolled) return "mfa-challenge";
  return "allow";
}
