import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const auth = read("src/lib/admin-auth.ts");
const login = read("app/api/admin/login/route.ts");
const proxy = read("proxy.ts");
const migration = read("drizzle/0035_multi_admin_accounts.sql");
const provision = read("scripts/provision-admin-account.ts");

assert.match(auth, /getAdminAccountByEmail/);
assert.match(auth, /session\.role !== settings\.role/);
assert.match(login, /settings\.role !== "admin"/);
assert.match(proxy, /authorization\.session\.mustChangePassword/);
assert.match(migration, /admin_settings_email_unique/);
assert.match(provision, /randomBytes\(24\)/);
assert.match(provision, /mustChangePassword: true/);
assert.doesNotMatch(provision, /console\.log\([^)]*temporaryPassword/);
console.log("Multi-admin authorization contracts: PASS");
