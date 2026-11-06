import assert from "node:assert/strict";

import { getRecoveryClinicalAdminBootstrapConfig } from "@/scripts/clinical-admin-recovery-bootstrap";

assert.throws(() => getRecoveryClinicalAdminBootstrapConfig({}), /RECOVERY_CLINICAL_ADMIN_BOOTSTRAP/u);
assert.throws(
  () => getRecoveryClinicalAdminBootstrapConfig({ RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: "true" }),
  /RECOVERY_CLINICAL_ADMIN_EMAIL/u
);

const config = getRecoveryClinicalAdminBootstrapConfig({
  RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: "true",
  RECOVERY_CLINICAL_ADMIN_EMAIL: "Alexandra@Example.Test",
  RECOVERY_CLINICAL_ADMIN_ALLOW_ROLE_UPDATE: "true",
});

assert.equal(config.email, "alexandra@example.test");
assert.equal(config.allowRoleUpdate, true);
const guarded = { RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: "true", RECOVERY_CLINICAL_ADMIN_EMAIL: "qa@local.test" };
for (const password of ["", "short", "123456789012345"]) {
  assert.throws(() => getRecoveryClinicalAdminBootstrapConfig({ ...guarded, RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: password }), /at least 16/u);
}
assert.throws(() => getRecoveryClinicalAdminBootstrapConfig({ ...guarded, RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: "false", RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: "synthetic-only-password" }), /BOOTSTRAP=true/u);
assert.equal(getRecoveryClinicalAdminBootstrapConfig({ ...guarded, RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: "1234567890123456" }).temporaryPassword?.length, 16);
assert.equal(config.temporaryPassword, undefined);
console.log("Clinical admin recovery bootstrap guard PASS");
