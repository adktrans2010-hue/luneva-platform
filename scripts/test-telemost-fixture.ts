import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { db, closeDatabase } from '@/src/db';
import { appointmentRequests, yookassaPayments, users, userConsultationPackages, appointmentHistory } from '@/src/db/schema';
import { ensureTelemostForAppointment } from '@/src/lib/appointment-telemost';
import { getTelemostConference } from '@/src/lib/yandex-telemost';
import { consultationAccess, withoutMeetingUrl } from '@/src/lib/consultation-access';
import { formatMoscowTime } from '@/src/lib/appointment-time';
import { POST as webhook } from '../app/api/yookassa/webhook/route';
import { POST as adminCreate } from '../app/api/admin/appointments/[id]/telemost/route';

const g=globalThis as typeof globalThis & {__owner:string[];__ownerPayment:number;__emails:number;__clientTelegram:number;__provider:unknown};
export async function run(){
 const ids:string[]=[];let calls=0;let responseStatus=201;let invalid=false;let timeout=false;
 g.__owner=[];g.__ownerPayment=0;g.__emails=0;g.__clientTelegram=0;
 const testUserId=randomUUID();
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{
  assert.ok(String(input).startsWith('https://cloud-api.yandex.net/v1/telemost-api/conferences'));
  assert.equal((init?.headers as Record<string,string>).Authorization,'OAuth synthetic-test-token');
  if(init?.method==='POST'){calls++;assert.deepEqual(JSON.parse(init.body as string),{waiting_room_level:'PUBLIC'});}
  if(timeout)throw Error('untrusted-token-and-url-must-not-leak');
  return new Response(JSON.stringify(responseStatus<300?{id:'synthetic-conference',join_url:invalid?'https://evil.example/j/private':'https://telemost.yandex.ru/j/synthetic-conference'}:{message:'untrusted-secret-error'}),{status:responseStatus});
 };
 const fixture=async(extra:Partial<typeof appointmentRequests.$inferInsert>={})=>{
  const id=randomUUID();ids.push(id);
  await db.insert(appointmentRequests).values({id,name:'TEST50B',contact:'test@example.test',contactMethod:'email',message:'TEST50B',status:'confirmed',paymentMethod:'online',paymentStatus:'paid',consultationFormat:'online',scheduledAt:new Date('2030-11-18T16:00:00Z'),...extra});return id;
 };
 const row=async(id:string)=>(await db.select().from(appointmentRequests).where(eq(appointmentRequests.id,id)))[0];
 const business=(a:typeof appointmentRequests.$inferSelect)=>Object.fromEntries(Object.entries(a).filter(([k])=>!k.startsWith('telemost')&&k!=='meetingUrl'));
 try{
  const target=await db.execute(sql`select current_database() as name,host(inet_server_addr()) as host`);
  assert.equal(target.rows[0].name,'gate50b_disposable');assert.equal(target.rows[0].host,'127.0.0.1');
  const a=await fixture();process.env.YANDEX_TELEMOST_ENABLED='false';
  assert.equal((await ensureTelemostForAppointment(a)).state,'disabled');assert.equal(calls,0);
  process.env.YANDEX_TELEMOST_ENABLED='true';
  const before=business(await row(a));
  const concurrent=await Promise.all([ensureTelemostForAppointment(a),ensureTelemostForAppointment(a)]);
  assert.ok(concurrent.some(r=>r.state==='created'));assert.equal(calls,1);
  assert.equal((await ensureTelemostForAppointment(a)).state,'existing');assert.equal(calls,1);
  assert.deepEqual(business(await row(a)),before);assert.equal(g.__owner.length,0);
  assert.equal((await getTelemostConference('synthetic-conference')).id,'synthetic-conference');
  for(const extra of [{status:'awaiting_payment'},{status:'expired'},{status:'payment_conflict'},{status:'cancelled'},{consultationFormat:'office'},{paymentStatus:'pending'}]){
   assert.equal((await ensureTelemostForAppointment(await fixture(extra))).state,'ineligible');
  }
  assert.equal(calls,1);
  const manual=await fixture({meetingUrl:'https://telemost.yandex.ru/j/manual'});
  assert.equal((await ensureTelemostForAppointment(manual,{retry:true})).state,'manual');assert.equal(calls,1);
  for(const status of [401,403,500]){
   responseStatus=status;const id=await fixture(),old=business(await row(id));const sent:number=g.__owner.length;
   assert.equal((await ensureTelemostForAppointment(id)).state,'failed');
   assert.deepEqual(business(await row(id)),old);assert.equal((await row(id)).telemostLastError,`HTTP_${status}`);
   assert.equal(g.__owner.length,sent+1);assert.ok(g.__owner.at(-1)?.includes('19:00'));
   assert.ok(!g.__owner.at(-1)?.includes('example.test'));assert.ok(!g.__owner.at(-1)?.includes('https://'));
   const previous:number=calls;await ensureTelemostForAppointment(id);assert.equal(calls,previous);
   responseStatus=201;assert.equal((await ensureTelemostForAppointment(id,{retry:true})).state,'created');
   await ensureTelemostForAppointment(id,{retry:true});assert.equal(calls,previous+1);
  }
  invalid=true;const bad=await fixture();await ensureTelemostForAppointment(bad);
  assert.equal((await row(bad)).meetingUrl,null);assert.equal((await row(bad)).telemostLastError,'INVALID_RESPONSE');
  const count=calls;await ensureTelemostForAppointment(bad,{retry:true});assert.equal(calls,count);invalid=false;
  timeout=true;const unknown=await fixture();await ensureTelemostForAppointment(unknown);timeout=false;
  const unknownCalls=calls;assert.equal((await ensureTelemostForAppointment(unknown,{retry:true})).state,'review_required');assert.equal(calls,unknownCalls);
  const safe=withoutMeetingUrl(await row(a));assert.ok(!('meetingUrl' in safe));assert.ok(!('telemostConferenceId' in safe));
  const access=consultationAccess(await row(a),60,new Date('2030-11-18T15:30:00Z'));
  assert.equal(access.state,'active');
  assert.equal(formatMoscowTime(new Date('2030-11-18T15:30:00Z')),'18:30');
  assert.equal(consultationAccess(await row(a),60,new Date('2030-11-18T15:29:00Z')).state,'waiting');
  assert.equal((await adminCreate(new Request('https://example.test',{method:'POST'}),{params:Promise.resolve({id:a})})).status,401);
  const adminResponse=await adminCreate(new Request('https://example.test',{method:'POST',headers:{'x-test-admin':'yes'}}),{params:Promise.resolve({id:a})});
  assert.equal(adminResponse.status,200);assert.ok(!(await adminResponse.text()).includes('telemost.yandex.ru'));
  // Execute the real webhook twice against local ORM rows; only provider/notification boundaries mocked.
  for(const http of [201,500]){
   responseStatus=http;const id=await fixture({status:'awaiting_payment',paymentStatus:'pending',holdExpiresAt:new Date(Date.now()+3600000)});
   const paymentId=randomUUID(),providerId=randomUUID();
   await db.insert(yookassaPayments).values({id:paymentId,appointmentId:id,providerPaymentId:providerId,idempotenceKey:randomUUID(),amountKopeks:500000,status:'pending',sessionsCountSnapshot:1});
   g.__provider={id:providerId,status:'succeeded',amount:{value:'5000.00',currency:'RUB'},metadata:{appointmentId:id,internalPaymentId:paymentId}};
   const request=()=>new Request('https://example.test/api/yookassa/webhook',{method:'POST',body:JSON.stringify({event:'payment.succeeded',object:{id:providerId}})});
   const previous:number=calls,emails:number=g.__emails,clientTelegram:number=g.__clientTelegram,ownerPayment:number=g.__ownerPayment;
   const parallel = await Promise.all([webhook(request()), webhook(request())]);
   assert.ok(parallel.every(response => response.status === 200));
   assert.equal((await webhook(request())).status,200);
   assert.equal(calls,previous+1);assert.equal(g.__emails,emails+1);
   assert.equal(g.__clientTelegram,clientTelegram+1);
   assert.equal(g.__ownerPayment,ownerPayment+1);
   assert.equal((await row(id)).status,'confirmed');assert.equal((await row(id)).paymentStatus,'paid');
   assert.equal((await db.select().from(yookassaPayments).where(eq(yookassaPayments.id,paymentId)))[0].status,'paid');
   assert.equal((await row(id)).telemostSyncStatus,http===201?'created':'failed');
  }
  await db.insert(users).values({id:testUserId,name:'TEST55A',email:`test55a-${testUserId}@example.test`,passwordHash:'synthetic'});
  const effects=()=>({calls,emails:g.__emails,telegram:g.__clientTelegram,owner:g.__ownerPayment});
  for(const status of ['cancelled','expired','payment_conflict','completed','unknown_status','awaiting_payment']){
   const id=await fixture({userId:testUserId,status,paymentStatus:'invoice_sent',holdExpiresAt:new Date(Date.now()-60000)});
   const paymentId=randomUUID(),providerId=randomUUID();
   await db.insert(yookassaPayments).values({id:paymentId,appointmentId:id,providerPaymentId:providerId,idempotenceKey:randomUUID(),amountKopeks:500000,status:'invoice_sent',sessionsCountSnapshot:3});
   g.__provider={id:providerId,status:'succeeded',amount:{value:'5000.00',currency:'RUB'},metadata:{appointmentId:id,internalPaymentId:paymentId}};
   const request=()=>new Request('https://example.test/api/yookassa/webhook',{method:'POST',body:JSON.stringify({event:'payment.succeeded',object:{id:providerId}})});
   const before=effects();
   assert.ok((await Promise.all([webhook(request()),webhook(request())])).every(r=>r.status===200));
   assert.equal((await webhook(request())).status,200);
   assert.deepEqual(effects(),before);
   assert.equal((await row(id)).status,status==='awaiting_payment'?'payment_conflict':status);
   const [payment]=await db.select().from(yookassaPayments).where(eq(yookassaPayments.id,paymentId));
   assert.equal(payment.status,'paid');assert.equal(payment.providerStatus,'succeeded');assert.equal(payment.paidAmountKopeks,500000);
   assert.ok(payment.capturedAt);assert.equal(payment.notifiedAt,null);
   const history=await db.select().from(appointmentHistory).where(eq(appointmentHistory.appointmentId,id));
   const skipped=history.filter(h=>h.action==='late_payment_side_effects_skipped');
   assert.equal(skipped.length,1);
   if(status==='cancelled')assert.equal(skipped[0].details,'Оплата получена после отмены записи; автоматическое подтверждение и уведомления не выполнялись.');
   assert.equal((await db.select().from(userConsultationPackages).where(eq(userConsultationPackages.userId,testUserId))).length,0);
  }
  const beforeMissing=effects();
  assert.equal((await webhook(new Request('https://example.test/api/yookassa/webhook',{method:'POST',body:JSON.stringify({event:'payment.succeeded',object:{id:randomUUID()}})}))).status,200);
  assert.deepEqual(effects(),beforeMissing);
  console.log('55A PASS: normal/concurrent duplicate exactly once; cancelled/expired/conflict/completed/unknown/late hold reconciled with zero owner/email/invite/Telegram/Telemost/package effects; missing payment safe');
 }finally{
  globalThis.fetch=originalFetch;
  if(ids.length)await db.delete(appointmentRequests).where(inArray(appointmentRequests.id,ids));
  await db.delete(userConsultationPackages).where(eq(userConsultationPackages.userId,testUserId));
  await db.delete(users).where(eq(users.id,testUserId));
  await closeDatabase();
 }
}
