export type RecoveryClinicalAdminBootstrapConfig = {
  email: string;
  allowRoleUpdate: boolean;
};

type Environment = Readonly<Record<string, string | undefined>>;

export function getRecoveryClinicalAdminBootstrapConfig(
  environment: Environment = process.env
): RecoveryClinicalAdminBootstrapConfig {
  if (environment.RECOVERY_CLINICAL_ADMIN_BOOTSTRAP !== "true") {
    throw new Error("RECOVERY_CLINICAL_ADMIN_BOOTSTRAP=true is required");
  }

  const email = environment.RECOVERY_CLINICAL_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  if (!/^\S+@\S+\.\S+$/u.test(email)) {
    throw new Error("RECOVERY_CLINICAL_ADMIN_EMAIL must be a valid email address");
  }

  return {
    email,
    allowRoleUpdate: environment.RECOVERY_CLINICAL_ADMIN_ALLOW_ROLE_UPDATE === "true",
  };
}
