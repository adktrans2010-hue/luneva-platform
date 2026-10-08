import assert from "node:assert/strict";

const originalFetch = global.fetch;
const originalToken = process.env.TELEGRAM_BOT_TOKEN;
const originalLegacy = process.env.TELEGRAM_OWNER_CHAT_ID;
const originalRecipients = process.env.TELEGRAM_OWNER_CHAT_IDS;

async function run() {
  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  const telegram = await import("../src/lib/telegram");
  const calls: string[] = [];

  try {
    process.env.TELEGRAM_OWNER_CHAT_IDS = "alexandra,andrey,alexandra";
    delete process.env.TELEGRAM_OWNER_CHAT_ID;
    global.fetch = (async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      calls.push(payload.chat_id);
      return new Response("{}", { status: payload.chat_id === "alexandra" ? 500 : 200 });
    }) as typeof fetch;

    const result = await telegram.sendOwnerTelegramNotifications("<b>Тест</b>");
    assert.deepEqual(calls.sort(), ["alexandra", "andrey"]);
    assert.equal(result.ok, true);
    assert.match(result.reason ?? "", /1 из 2/);

    calls.length = 0;
    delete process.env.TELEGRAM_OWNER_CHAT_IDS;
    process.env.TELEGRAM_OWNER_CHAT_ID = "alexandra";
    assert.deepEqual(telegram.getOwnerChatIds(), ["alexandra"]);
    assert.equal(telegram.isTelegramConfigured(), true);
    const legacy = await telegram.sendOwnerTelegramNotifications("Тест");
    assert.equal(calls.length, 1);
    assert.equal(legacy.ok, false);

    delete process.env.TELEGRAM_OWNER_CHAT_ID;
    assert.equal(telegram.isTelegramConfigured(), false);
    const missing = await telegram.sendOwnerTelegramNotifications("Тест");
    assert.equal(missing.ok, false);
  } finally {
    global.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = originalToken;
    if (originalLegacy === undefined) delete process.env.TELEGRAM_OWNER_CHAT_ID;
    else process.env.TELEGRAM_OWNER_CHAT_ID = originalLegacy;
    if (originalRecipients === undefined) delete process.env.TELEGRAM_OWNER_CHAT_IDS;
    else process.env.TELEGRAM_OWNER_CHAT_IDS = originalRecipients;
  }
}

void run().then(() => console.log("Telegram owner notification contracts: PASS"));
