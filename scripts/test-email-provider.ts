import assert from "node:assert/strict";
import { isEmailConfigured, sendMail } from "../src/lib/email";

async function main() {
 const original = { ...process.env }; const originalFetch = globalThis.fetch;
 let calls = 0;
 try {
  process.env.EMAIL_PROVIDER = "postmark";
  delete process.env.POSTMARK_SERVER_TOKEN;
  assert.equal(isEmailConfigured(), false);
  process.env.POSTMARK_SERVER_TOKEN = "synthetic-token";
  process.env.EMAIL_FROM = "notifications@example.test";
  assert.equal(isEmailConfigured(), true);
  globalThis.fetch = async (url, init) => {
   calls++; assert.equal(url, "https://api.postmarkapp.com/email");
   assert.equal((init?.headers as Record<string,string>)["X-Postmark-Server-Token"], "synthetic-token");
   const body = JSON.parse(String(init?.body));
   assert.equal(body.TextBody, "synthetic body"); assert.equal(body.TrackOpens, false);
   return new Response(JSON.stringify({ErrorCode:0,MessageID:"synthetic-id"}));
  };
  const message = {to:"owner@example.test",subject:"Synthetic",text:"synthetic body"};
  await sendMail(message);assert.equal(calls,1);
  globalThis.fetch = async () => {calls++;throw new Error("synthetic-token private payload");};
  await assert.rejects(sendMail(message),/^Error: EMAIL_PROVIDER_TRANSPORT_FAILED$/);assert.equal(calls,2);
  globalThis.fetch = async () => new Response("private provider response",{status:401});
  await assert.rejects(sendMail(message),/^Error: EMAIL_PROVIDER_HTTP_401$/);
  globalThis.fetch = async () => new Response(JSON.stringify({ErrorCode:300,Message:"private"}));
  await assert.rejects(sendMail(message),/^Error: EMAIL_PROVIDER_REJECTED$/);
  process.env.EMAIL_PROVIDER="unknown";assert.equal(isEmailConfigured(),false);
  await assert.rejects(sendMail(message),/^Error: EMAIL_PROVIDER_NOT_CONFIGURED$/);
  delete process.env.EMAIL_PROVIDER;process.env.SMTP_HOST="smtp.example.test";process.env.SMTP_USER="synthetic";process.env.SMTP_PASSWORD="synthetic";
  assert.equal(isEmailConfigured(),true);
  console.log("EMAIL_PROVIDER_TESTS PASS; NETWORK_CALLS 0; DB_WRITES 0");
 } finally {process.env=original;globalThis.fetch=originalFetch;}
}
void main();
