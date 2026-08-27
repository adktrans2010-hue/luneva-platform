import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getAdminAuthStep } from "@/src/lib/admin-mfa-policy";

assert.equal(getAdminAuthStep({ passwordAccepted: true, mfaRequired: true, mfaEnrolled: false, mustChangePassword: false }), "mfa-enroll");
assert.equal(getAdminAuthStep({ passwordAccepted: true, mfaRequired: true, mfaEnrolled: false, mustChangePassword: true }), "password-change");
assert.equal(getAdminAuthStep({ passwordAccepted: true, mfaRequired: true, mfaEnrolled: true, mustChangePassword: false }), "mfa-challenge");
assert.equal(getAdminAuthStep({ passwordAccepted: false, mfaRequired: true, mfaEnrolled: false, mustChangePassword: false }), "reject");

const auth = readFileSync("src/lib/admin-auth.ts", "utf8");
const login = readFileSync("app/api/admin/login/route.ts", "utf8");
const enroll = readFileSync("app/api/admin/mfa-enroll/route.ts", "utf8");
const state = readFileSync("src/lib/admin-mfa-enrollment.ts", "utf8");
assert.match(auth, /ADMIN_BOOTSTRAP_MAX_AGE = 10 \* 60/);
assert.match(auth, /purpose: "admin-mfa-bootstrap"/);
assert.match(login, /replaceAdminMfaEnrollment/);
assert.match(login, /response\.cookies\.delete\(ADMIN_COOKIE_NAME\)/);
assert.match(enroll, /verifyTotpCode/);
assert.match(enroll, /recordAdminMfaEnrollmentFailure/);
assert.match(enroll, /completeAdminMfaEnrollment/);
assert.match(enroll, /createAdminSessionToken/);
assert.match(state, /isNull\(adminMfaEnrollments\.usedAt\)/);
assert.match(state, /eq\(adminMfaEnrollments\.accountId, accountId\)/);
assert.doesNotMatch(enroll, /console\.(log|error).*totp/i);
console.log("Admin MFA bootstrap contracts: PASS");
