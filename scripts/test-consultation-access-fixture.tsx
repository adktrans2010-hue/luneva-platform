import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { eq, sql } from 'drizzle-orm';
import { db, closeDatabase } from '@/src/db';
import { users, appointmentRequests, appointmentHistory, clientNotifications, consultationProducts, accountInvitations } from '@/src/db/schema';
import { consultationAccess, officeDetails, validMapUrl, withoutMeetingUrl } from '@/src/lib/consultation-access';
import AdminConsultationAccess from '@/components/AdminConsultationAccess';
import JoinPage from '../app/account/appointments/[id]/join/page';
import AccountPage from '../app/account/page';
import { GET as go } from '../app/account/appointments/[id]/join/go/route';
import { PATCH as save, POST as send } from '../app/api/admin/appointments/[id]/access/route';
import { createPaidAppointmentConfirmation, renderPaidAppointmentEmailHtml, consultationEmailAccess } from '@/src/lib/paid-appointment-confirmation';
import { sendPaidAppointmentInvitation, hashInvitationToken } from '@/src/lib/account-invitations';
import { POST as accept } from '../app/api/account/invite/route';
import { NextRequest } from 'next/server';
type TestGlobals = typeof globalThis & {__accessUser?: {id:string;name:string;email:string;preferredContact:string}|null;__accessMail?:{text:string;html:string;subject:string};__mailCount?:number};
const g=globalThis as TestGlobals;
const url='https://telemost.yandex.ru/j/private-synthetic';
const base={id:'48000000-0000-4000-8000-000000000002',status:'confirmed',consultationFormat:'online',consultationLocation:'online',scheduledAt:new Date('2030-01-15T09:00:00Z'),meetingUrl:url};
const context=(id:string)=>({params:Promise.resolve({id})});
function adminRequest(body:unknown,authorized=true){return new Request('https://luneva-psy.ru/api/admin/appointments/test/access',{method:'PATCH',headers:{'Content-Type':'application/json',...(authorized?{'x-fixture-admin':'yes'}:{})},body:JSON.stringify(body)});}
export async function run(mode:string){
if(mode==='email'){
 for(const a of [base,{...base,consultationFormat:'office',consultationLocation:'moscow'},{...base,consultationFormat:'office',consultationLocation:'vidnoye'}]){
 const c=createPaidAppointmentConfirmation(a,'Индивидуальная консультация');const html=renderPaidAppointmentEmailHtml(c,'https://luneva-psy.ru/account/invite?token=synthetic',a);
 for(const v of ['Оплата получена','15 января 2030','12:00','Индивидуальная консультация','Открыть личный кабинет'])assert.ok(html.includes(v));
 assert.ok(!html.includes(url));assert.ok(html.includes('/account/invite?token=synthetic'));
 if(a.consultationFormat==='online'){assert.ok(html.includes(`/account/appointments/${a.id}/join`));assert.ok(html.includes('Онлайн'));}
 else if(a.consultationLocation==='moscow'){assert.ok(html.includes('Кожевнический проезд'));assert.ok(html.includes('https://yandex.ru/maps/'));}
 else assert.ok(html.includes('Точный адрес Александра направит после подтверждения.'));
 }
 assert.equal(consultationEmailAccess({...base,status:'cancelled'}),null);
 console.log('EMAIL_RENDER_TESTS PASS; external sends=0');return;
}
if(mode==='admin'){
 for(const a of [base,{...base,consultationFormat:'office',officeAddress:'TEST address',officeMapUrl:'https://yandex.ru/maps/'}]){
 const html=renderToStaticMarkup(<AdminConsultationAccess appointment={{...a,accessState:'waiting'}}/>);
 assert.ok(html.includes('Сохранить данные встречи'));assert.ok(html.includes('Отправить/обновить данные встречи клиенту'));
 if(a.consultationFormat==='online'){assert.ok(html.includes('Ссылка Яндекс Телемоста'));assert.ok(html.includes('datetime-local'));assert.ok(html.includes('Ожидает активации'));}
 else {assert.ok(html.includes('Адрес консультации'));assert.ok(html.includes('Ссылка на Яндекс Карты'));}
 }
 console.log('ADMIN_UI_TESTS PASS; static controls; persistence/history covered by DB mode');return;
}
assert.equal(process.env.DATABASE_URL,'postgresql://gate47_test@127.0.0.1:55447/gate48_current_disposable');
const u=randomUUID(),other=randomUUID(),p=randomUUID(),a=randomUUID(),later=randomUUID();const email=`test48-${u}@example.test`;
try{
 const target=await db.execute(sql`SELECT current_database() AS name,host(inet_server_addr()) AS host`);assert.equal(target.rows[0].name,'gate48_current_disposable');assert.equal(target.rows[0].host,'127.0.0.1');
 await db.insert(users).values({id:u,name:'TEST48',email,passwordHash:'synthetic',preferredContact:'email'});
 await db.insert(consultationProducts).values({id:p,code:'TEST48-'+p,name:'Индивидуальная консультация',sessionsCount:1,priceKopeks:500000,durationMinutes:60,isPublic:false});
 await db.insert(appointmentRequests).values({id:a,userId:u,productId:p,name:'TEST48',contact:email,normalizedEmail:email,contactMethod:'email',message:'TEST48',status:'confirmed',paymentStatus:'paid',scheduledAt:new Date(Date.now()+31*60000)});
 g.__accessUser={id:u,name:'TEST48',email,preferredContact:'email'};
 const row=async()=>(await db.select().from(appointmentRequests).where(eq(appointmentRequests.id,a)))[0];
 if(mode==='db'){
 assert.equal(consultationAccess(base,60,new Date('2030-01-15T12:00:00Z')).state,'active');
 assert.equal(consultationAccess(base,60,new Date('2030-01-15T12:00:01Z')).state,'ended');
 assert.equal(consultationAccess(base,null).state,'unavailable');
 assert.ok(renderToStaticMarkup(await JoinPage(context(a))).includes('Ссылка ещё не добавлена'));
 assert.equal((await save(adminRequest({meetingUrl:url},false),context(a))).status,401);
 assert.equal((await save(adminRequest({meetingUrl:'https://evil.test/x'}),context(a))).status,400);
 assert.equal((await save(adminRequest({meetingUrl:url}),context(a))).status,200);
 assert.equal(g.__mailCount||0,0);
 const history=await db.select().from(appointmentHistory).where(eq(appointmentHistory.appointmentId,a));assert.equal(history.length,1);assert.ok(!JSON.stringify(history).includes(url));
 const notifications=await db.select().from(clientNotifications).where(eq(clientNotifications.appointmentId,a));assert.equal(notifications.length,1);assert.ok(!JSON.stringify(notifications).includes(url));
 let current=await row();assert.equal(current.meetingUrl,url);assert.equal(consultationAccess(current,60).state,'waiting');
 const html=renderToStaticMarkup(await JoinPage(context(a)));assert.ok(html.includes('станет доступна'));assert.ok(!html.includes(url));assert.ok(!JSON.stringify(withoutMeetingUrl(current)).includes(url));
 assert.equal((await go(new Request('https://luneva-psy.ru'),context(a))).status,403);
 const exact=new Date(current.scheduledAt!.getTime()-30*60000);assert.equal(consultationAccess(current,60,exact).state,'active');
 await db.update(appointmentRequests).set({scheduledAt:new Date(Date.now()+29*60000)}).where(eq(appointmentRequests.id,a));
 const redirect=await go(new Request('https://luneva-psy.ru'),context(a));assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),url);assert.ok(redirect.headers.get('cache-control')?.includes('no-store'));
 g.__accessUser={id:other,name:'Other',email:'other@example.test',preferredContact:'email'};assert.equal((await go(new Request('https://luneva-psy.ru'),context(a))).status,404);
 g.__accessUser=null;assert.ok((await go(new Request('https://luneva-psy.ru'),context(a))).headers.get('location')?.includes('/login?next='));
 g.__accessUser={id:u,name:'TEST48',email,preferredContact:'email'};
 await db.update(appointmentRequests).set({status:'cancelled'}).where(eq(appointmentRequests.id,a));assert.equal((await go(new Request('https://luneva-psy.ru'),context(a))).status,403);
 await db.update(appointmentRequests).set({status:'confirmed',consultationFormat:'office',consultationLocation:'moscow'}).where(eq(appointmentRequests.id,a));
 assert.equal((await save(adminRequest({officeMapUrl:'http://yandex.ru/maps/'}),context(a))).status,400);
 assert.equal((await save(adminRequest({officeAddress:'TEST address',officeMapUrl:'https://yandex.ru/maps/'}),context(a))).status,200);
 assert.equal(officeDetails(await row()).address,'TEST address');assert.equal(validMapUrl('http://yandex.ru/maps/'),false);
 assert.ok(renderToStaticMarkup(await JoinPage(context(a))).includes('Открыть в Яндекс Картах'));
 await db.update(appointmentRequests).set({officeAddress:null,officeMapUrl:null,consultationLocation:'vidnoye'}).where(eq(appointmentRequests.id,a));assert.ok(renderToStaticMarkup(await JoinPage(context(a))).includes('Точный адрес Александра направит'));
 // The explicit email action is the only admin action allowed to call the mocked transport.
 assert.equal((await send(adminRequest({}),context(a))).status,200);assert.equal(g.__mailCount,1);
 // Existing-client invitation must preserve identity and redirect only to its linked appointment.
 for(const existing of [true,false]){
 if(!existing){await db.update(appointmentRequests).set({userId:null}).where(eq(appointmentRequests.id,a));await db.delete(users).where(eq(users.id,u));}
 current=await row();const sent=await sendPaidAppointmentInvitation({appointment:current,paymentId:randomUUID(),serviceName:'Индивидуальная консультация'});assert.equal(sent.ok,true);
 const token=g.__accessMail!.text.match(/token=([^\s]+)/)![1];const [inv]=await db.select().from(accountInvitations).where(eq(accountInvitations.tokenHash,hashInvitationToken(token)));assert.equal(inv.userId,existing?u:null);
 const form=new FormData();form.set('token',token);form.set('password','Synthetic-only-password-48');const make=()=>new NextRequest('https://luneva-psy.ru/api/account/invite',{method:'POST',body:form});
 const accepted=await accept(make());assert.equal(accepted.headers.get('location'),`https://luneva-psy.ru/account/appointments/${a}/join`);assert.equal((await db.select().from(users).where(eq(users.email,email))).length,1);
 assert.equal((await accept(make())).headers.get('location'),'https://luneva-psy.ru/account/invite');
 }
 console.log('DB_INTEGRATION_TESTS PASS A-K; INVITE_NEW_EXISTING PASS; no external sends');
 }else{
 await db.update(appointmentRequests).set({meetingUrl:url}).where(eq(appointmentRequests.id,a));
 await db.insert(appointmentRequests).values({id:later,userId:u,productId:p,name:'TEST48',contact:email,contactMethod:'email',message:'TEST48',scheduledAt:new Date(Date.now()+48*3600000),status:'confirmed'});
 let html=renderToStaticMarkup(await AccountPage({searchParams:Promise.resolve({})}));assert.ok(html.includes(`/account/appointments/${a}/join`));assert.ok(!html.includes(url));assert.ok(html.includes('станет доступна'));
 await db.update(appointmentRequests).set({scheduledAt:new Date(Date.now()+29*60000)}).where(eq(appointmentRequests.id,a));html=renderToStaticMarkup(await AccountPage({searchParams:Promise.resolve({})}));assert.ok(html.includes(`/account/appointments/${a}/join/go`));
 await db.update(appointmentRequests).set({status:'cancelled'}).where(eq(appointmentRequests.id,a));html=renderToStaticMarkup(await AccountPage({searchParams:Promise.resolve({})}));assert.ok(!html.includes(`/account/appointments/${a}/join`));assert.ok(html.includes(`/account/appointments/${later}/join`));
 await db.update(appointmentRequests).set({status:'confirmed',consultationFormat:'office',consultationLocation:'moscow'}).where(eq(appointmentRequests.id,a));html=renderToStaticMarkup(await AccountPage({searchParams:Promise.resolve({})}));assert.ok(html.includes('Кожевнический проезд'));assert.ok(html.includes('Открыть в Яндекс Картах'));
 assert.equal((await db.select().from(appointmentRequests).where(eq(appointmentRequests.id,a))).length,1);
 console.log('ACCOUNT_UI_TESTS PASS; nearest/activation/cancellation/office/history retention');
 }
}finally{
 for(const id of [a,later]){await db.delete(accountInvitations).where(eq(accountInvitations.appointmentId,id));await db.delete(clientNotifications).where(eq(clientNotifications.appointmentId,id));await db.delete(appointmentHistory).where(eq(appointmentHistory.appointmentId,id));await db.delete(appointmentRequests).where(eq(appointmentRequests.id,id));}
 await db.delete(users).where(eq(users.email,email));await db.delete(consultationProducts).where(eq(consultationProducts.id,p));await closeDatabase();
}
}
