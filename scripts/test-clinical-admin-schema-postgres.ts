import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, mkdir, readFile, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { verifyPassword } from "@/src/lib/password";

async function main() {
  const url = process.env.CLINICAL_SCHEMA_TEST_DATABASE_URL;
  assert.ok(url, "CLINICAL_SCHEMA_TEST_DATABASE_URL required");
  const target = new URL(url);
  assert.equal(target.hostname, "127.0.0.1");
  assert.match(target.pathname, /^\/clinical_schema_(fresh|legacy)_test(?:_diagnostics|_envpassword)?$/u);
  const legacy = target.pathname.includes("legacy");
  const pool = new Pool({ connectionString: url });
  const database = drizzle(pool);
  const temporary = await mkdtemp(path.join(tmpdir(), "clinical-schema-"));
  let delivered = 0;
  let authFailure = true;
  let connections = 0;
  const capturedPasswords: string[] = [];
  const smtp = createServer((socket) => {
    connections += 1;
    let stage = 0;
    let body = "";
    socket.write("220 localhost ESMTP\r\n");
    socket.on("data", (chunk) => {
      const incoming = chunk.toString();
      if (stage === 3) {
        body += incoming;
        if (body.endsWith("\r\n.\r\n")) {
          delivered += 1;
          const temporaryPassword = body.match(/Временный пароль: ([^\r\n]+)/u)?.[1];
          assert.ok(temporaryPassword);
          capturedPasswords.push(temporaryPassword);
          body = "";
          stage = 0;
          socket.write("250 accepted\r\n");
        }
        return;
      }
      for (const line of incoming.split("\r\n").filter(Boolean)) {
        if (line.startsWith("EHLO")) socket.write("250 localhost\r\n");
        else if (line === "AUTH LOGIN") { stage = 1; socket.write("334 username\r\n"); }
        else if (stage === 1) { stage = 2; socket.write("334 password\r\n"); }
        else if (stage === 2) { stage = 0; socket.write(authFailure ? `535 authentication failed password=diagnostic-password ${line}\r\n` : "235 authenticated\r\n"); }
        else if (line === "DATA") { stage = 3; socket.write("354 continue\r\n"); }
        else if (line === "QUIT") socket.end("221 goodbye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  try {
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public'")).rows[0].count, 0);
    if (legacy) {
      const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
      journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx <= 34);
      await mkdir(path.join(temporary, "meta"));
      await writeFile(path.join(temporary, "meta/_journal.json"), JSON.stringify(journal));
      for (const entry of journal.entries) {
        await copyFile(`drizzle/${entry.tag}.sql`, path.join(temporary, `${entry.tag}.sql`));
      }
      await migrate(database, { migrationsFolder: temporary });
      await pool.query("INSERT INTO admin_settings(id,email,password_hash) VALUES ('legacy','legacy@local.test','synthetic-hash')");
    }
    await migrate(database, { migrationsFolder: "drizzle" });
    await migrate(database, { migrationsFolder: "drizzle" });
    if (legacy) {
      const row = (await pool.query("SELECT role,is_active,must_change_password,password_hash FROM admin_settings WHERE id='legacy'")).rows[0];
      assert.deepEqual(row, { role: "admin", is_active: true, must_change_password: false, password_hash: "synthetic-hash" });
    }
    const columns = (await pool.query("SELECT column_name,is_nullable FROM information_schema.columns WHERE table_name='admin_settings' AND column_name IN ('role','is_active','must_change_password')")).rows;
    assert.equal(columns.length, 3);
    assert.ok(columns.every((row) => row.is_nullable === "NO"));
    await new Promise<void>((resolve) => smtp.listen(0, "127.0.0.1", resolve));
    const address = smtp.address();
    assert.ok(address && typeof address !== "string");
    const bootstrap = (expectedCode = 0, overrides: Record<string, string | undefined> = {}) => new Promise<string>((resolve, reject) => {
      let output = "";
      const child = spawn(process.execPath, ["--import", "tsx", "scripts/bootstrap-clinical-admin-recovery.ts"], {
        env: { ...process.env, DATABASE_URL: url, RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: "true",
          RECOVERY_CLINICAL_ADMIN_EMAIL: "qa.clinical@local.test", RECOVERY_CLINICAL_ADMIN_ALLOW_ROLE_UPDATE: "false",
          ADMIN_ACCEPTANCE_BASE_URL: "https://qa.local.test", SMTP_HOST: "127.0.0.1", SMTP_PORT: String(address.port),
          RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: undefined,
          SMTP_USER: "diagnostic-user", SMTP_PASSWORD: "diagnostic-password", SMTP_FROM: "qa@local.test", SMTP_SECURE: "false", ...overrides },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (chunk) => { output += chunk.toString(); });
      child.stderr.on("data", (chunk) => { output += chunk.toString(); });
      const timer = setTimeout(() => { child.kill(); reject(new Error("Bootstrap timed out")); }, 30000);
      child.on("error", reject);
      child.on("exit", (code) => { clearTimeout(timer); if (code === expectedCode) resolve(output); else reject(new Error("Unexpected bootstrap exit")); });
    });
    const assertSafe = (output: string) => {
      for (const secret of ["diagnostic-password", "diagnostic-user", "qa@local.test", ...capturedPasswords]) {
        assert.ok(!output.includes(secret), "Secret leaked");
        assert.ok(!output.includes(Buffer.from(secret).toString("base64")), "Encoded secret leaked");
      }
    };
    const authOutput = await bootstrap(1);
    assertSafe(authOutput);
    assert.ok(authOutput.includes("BOOTSTRAP SMTP FAILURE"));
    assert.ok(authOutput.includes("535 authentication failed"));
    assert.ok(authOutput.includes("rollback-after-email-failure"));
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM admin_settings WHERE email='qa.clinical@local.test'")).rows[0].count, 0);
    await new Promise<void>((resolve) => smtp.close(() => resolve()));
    const connectionOutput = await bootstrap(1);
    assertSafe(connectionOutput);
    assert.ok(connectionOutput.includes("ECONNREFUSED"));
    assert.ok(connectionOutput.includes("rollback-after-email-failure"));
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM admin_settings WHERE email='qa.clinical@local.test'")).rows[0].count, 0);
    authFailure = false;
    await new Promise<void>((resolve) => smtp.listen(address.port, "127.0.0.1", resolve));
    const successOutput = await bootstrap();
    assertSafe(successOutput);
    for (const stage of ["guard-ok", "db-ready", "account-created", "smtp-start", "smtp-sent", "committed"]) assert.ok(successOutput.includes(`BOOTSTRAP STAGE: ${stage}`));
    const before = (await pool.query("SELECT * FROM admin_settings WHERE email='qa.clinical@local.test'")).rows;
    assert.equal(before.length, 1);
    assert.equal(before[0].role, "clinical_admin");
    assert.equal(before[0].is_active, true);
    assert.equal(before[0].must_change_password, true);
    assert.equal(before[0].totp_enabled, false);
    assert.equal(before[0].totp_secret, null);
    assert.ok(before[0].password_hash);
    const repeatOutput = await bootstrap();
    assertSafe(repeatOutput);
    assert.ok(!repeatOutput.includes("smtp-start"));
    assert.deepEqual((await pool.query("SELECT * FROM admin_settings WHERE email='qa.clinical@local.test'")).rows, before);
    assert.equal(delivered, 1);
    const envPassword = "synthetic-env-password-only";
    const envOptions = { RECOVERY_CLINICAL_ADMIN_EMAIL: "env.clinical@local.test", RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: envPassword, ADMIN_ACCEPTANCE_BASE_URL: "" };
    capturedPasswords.push(envPassword);
    const connectionCountBefore = connections;
    for (const overrides of [
      { ...envOptions, RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: "false" },
      { ...envOptions, RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: "short" },
    ]) {
      const rejected = await bootstrap(1, overrides);
      assertSafe(rejected);
      assert.ok(!rejected.includes("account-created"));
      assert.equal((await pool.query("SELECT count(*)::int AS count FROM admin_settings WHERE email='env.clinical@local.test'")).rows[0].count, 0);
    }
    const envOutput = await bootstrap(0, envOptions);
    assertSafe(envOutput);
    assert.ok(envOutput.includes("BOOTSTRAP DELIVERY MODE: secure-env-password"));
    assert.ok(envOutput.includes("BOOTSTRAP STAGE: committed"));
    assert.ok(!envOutput.includes("smtp-start"));
    const envRows = (await pool.query("SELECT * FROM admin_settings WHERE email='env.clinical@local.test'")).rows;
    assert.equal(envRows.length, 1);
    const account = envRows[0];
    assert.equal(account.role, "clinical_admin");
    assert.equal(account.is_active, true);
    assert.equal(account.must_change_password, true);
    assert.equal(account.totp_enabled, false);
    assert.equal(account.totp_secret, null);
    assert.ok(verifyPassword(envPassword, account.password_hash));
    assert.ok(!JSON.stringify(account).includes(envPassword));
    assertSafe(await bootstrap(0, { ...envOptions, RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD: "different-synthetic-password" }));
    assert.deepEqual((await pool.query("SELECT * FROM admin_settings WHERE email='env.clinical@local.test'")).rows, envRows);
    await pool.query("INSERT INTO admin_settings(id,email,password_hash,role) VALUES ('ordinary-env','ordinary@local.test','synthetic-legacy-hash','admin')");
    const ordinaryBefore = (await pool.query("SELECT * FROM admin_settings WHERE id='ordinary-env'")).rows;
    assertSafe(await bootstrap(1, { ...envOptions, RECOVERY_CLINICAL_ADMIN_EMAIL: "ordinary@local.test" }));
    assert.deepEqual((await pool.query("SELECT * FROM admin_settings WHERE id='ordinary-env'")).rows, ordinaryBefore);
    assert.equal(connections, connectionCountBefore);
    assert.equal(delivered, 1);
    console.log("Env-password: guard + length + creation + valid hash + flags + zero SMTP connections + idempotency + ordinary admin guard: PASS");
    console.log(`${legacy ? "LEGACY" : "FRESH"} DB + real bootstrap + SMTP diagnostics/auth/connection failures + rollback + no secret leakage + idempotency: PASS`);
  } finally {
    smtp.close();
    await pool.end();
    await rm(temporary, { recursive: true, force: true });
  }
}

main().catch(() => { console.error("Clinical schema isolated test: FAIL"); process.exitCode = 1; });
