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
console.log("Clinical admin recovery bootstrap guard PASS");
