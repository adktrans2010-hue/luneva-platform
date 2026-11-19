import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db, closeDatabase } from '@/src/db';
import { accountInvitations, appointmentRequests, users, yookassaPayments } from '@/src/db/schema';
import { hashInvitationToken, sendPaidAppointmentInvitation } from '@/src/lib/account-invitations';
import { notifyTelegramClientPaidAppointment } from '@/src/lib/telegram';

export async function run() {
  const appointmentId = randomUUID(), paymentId = randomUUID(), userId = randomUUID();
  const email = `test54-${randomUUID()}@example.test`;
  const g = globalThis as typeof globalThis & {__parityMail: {text: string; html: string; subject: string; to: string}[]};
  g.__parityMail = [];
  const originalFetch = globalThis.fetch;
  const messages: {text: string; reply_markup: {inline_keyboard: {url?: string; callback_data?: string}[][]}}[] = [];
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.telegram.org/botsynthetic-test-token/sendMessage');
    messages.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ok: true, result: {message_id: 1}}), {status: 200});
  };
  try {
    const target = await db.execute(sql`select current_database() as name, host(inet_server_addr()) as host`);
    assert.equal(target.rows[0].name, 'gate50b_disposable');
    assert.equal(target.rows[0].host, '127.0.0.1');
    const [appointment] = await db.insert(appointmentRequests).values({
      id: appointmentId, name: 'TEST54', message: 'TEST54', contact: 'synthetic', contactMethod: 'telegram',
      normalizedEmail: email, status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'online',
      consultationFormat: 'online', scheduledAt: new Date('2030-11-18T16:00:00Z'),
      attribution: {telegram_user_id: '123'}, meetingUrl: 'https://telemost.yandex.ru/j/never-expose',
    }).returning();
    await db.insert(yookassaPayments).values({id: paymentId, appointmentId, providerPaymentId: randomUUID(),
      idempotenceKey: randomUUID(), amountKopeks: 500000, status: 'paid', sessionsCountSnapshot: 1});
    const args = {appointment, paymentId, serviceName: 'Индивидуальная консультация'};
    assert.equal((await sendPaidAppointmentInvitation(args)).existingUser, false);
    assert.equal(g.__parityMail.length, 1);
    const mail = g.__parityMail[0];
    assert.equal(mail.to, email);
    assert.equal(mail.subject, 'Ваша консультация оплачена и подтверждена');
    for (const text of ['Оплата получена', '19:00 МСК', 'Онлайн', args.serviceName]) assert.ok(mail.text.includes(text));
    assert.ok(!mail.html.includes('telemost.yandex.ru'));
    assert.ok(mail.html.includes(`https://luneva-psy.ru/account/appointments/${appointmentId}/join`));
    const url = new URL(mail.text.match(/https:\/\/luneva-psy.ru\/account\/invite\?token=\S+/)![0]);
    const invitations = await db.select().from(accountInvitations).where(eq(accountInvitations.appointmentId, appointmentId));
    assert.equal(invitations.length, 1);
    assert.equal(invitations[0].tokenHash, hashInvitationToken(url.searchParams.get('token')!));
    assert.equal(invitations[0].usedAt, null);
    assert.ok(Math.abs(invitations[0].expiresAt.getTime() - Date.now() - 7 * 86400000) < 5000);
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 0);

    await db.insert(users).values({id: userId, name: 'TEST54', email, passwordHash: 'synthetic-not-a-password'});
    assert.equal((await sendPaidAppointmentInvitation(args)).existingUser, true);
    assert.ok(!g.__parityMail[1].text.includes('/account/invite?'));
    assert.ok(g.__parityMail[1].text.includes('https://luneva-psy.ru/account'));
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 1);
    assert.equal((await db.select().from(accountInvitations).where(eq(accountInvitations.appointmentId, appointmentId))).length, 1);
    await notifyTelegramClientPaidAppointment(args);
    assert.equal(messages.length, 1);
    assert.ok(messages[0].text.includes('19:00 МСК'));
    assert.ok(messages[0].text.includes('за 30 минут'));
    assert.ok(messages[0].reply_markup.inline_keyboard.flat().some(b => b.callback_data === 'account:bookings'));
    for (const button of messages[0].reply_markup.inline_keyboard.flat()) {
      if (button.url) assert.equal(new URL(button.url).host, 'luneva-psy.ru');
    }
    assert.ok(!JSON.stringify(messages).includes('telemost.yandex.ru'));
    console.log('PARITY PASS: normalized email, new/existing user, hashed 7-day invite, no duplicate user, Moscow text, protected links, Telegram buttons; external calls MOCKED');
  } finally {
    globalThis.fetch = originalFetch;
    await db.delete(accountInvitations).where(eq(accountInvitations.appointmentId, appointmentId));
    await db.delete(yookassaPayments).where(eq(yookassaPayments.id, paymentId));
    await db.delete(appointmentRequests).where(eq(appointmentRequests.id, appointmentId));
    await db.delete(users).where(eq(users.id, userId));
    await closeDatabase();
  }
}
