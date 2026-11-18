const assert=require('node:assert/strict'),esbuild=require('esbuild'),vm=require('vm');
function load(path){const text=esbuild.buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',packages:'external',write:false}).outputFiles[0].text;const m={exports:{}};vm.runInThisContext(require('module').wrap(text))(m.exports,require,m,__filename,__dirname);return m.exports;}
const t=load('src/lib/appointment-time.ts'),access=load('src/lib/consultation-access.ts'),mail=load('src/lib/paid-appointment-confirmation.ts');
for(const zone of ['UTC','Europe/Moscow','Europe/Amsterdam','America/Los_Angeles']){
 process.env.TZ=zone;
 const start=t.parseMoscowAppointmentDate('2026-11-18','19:00');
 assert.equal(start.toISOString(),'2026-11-18T16:00:00.000Z');
 assert.equal(t.formatMoscowTime(start),'19:00');
 assert.equal(t.moscowDateTimeInput(start),'2026-11-18T19:00');
 assert.equal(t.parseAppointmentInput('2026-11-18T19:00').toISOString(),start.toISOString());
 assert.equal(t.parseAppointmentInput(start.toISOString()).toISOString(),start.toISOString());
 const a={id:'synthetic',status:'confirmed',scheduledAt:start,consultationFormat:'online',meetingUrl:'https://telemost.yandex.ru/j/test'};
 const gate=access.consultationAccess(a,60,new Date('2026-11-18T15:30:00Z'));
 assert.equal(gate.state,'active');assert.equal(t.formatMoscowTime(gate.availableFrom),'18:30');
 assert.equal(access.consultationAccess(a,60,new Date('2026-11-18T15:29:00Z')).state,'waiting');
 const confirmation=mail.createPaidAppointmentConfirmation(a,'Индивидуальная консультация');
 assert.equal(confirmation.time,'19:00');assert.match(mail.renderPaidAppointmentTelegram(confirmation),/19:00/);
 assert.equal(t.parseMoscowAppointmentDate('2026-02-30','19:00'),null);
 assert.equal(t.parseMoscowAppointmentDate('2026-11-18','24:00'),null);
 assert.equal(t.moscowDateInput(new Date('2026-11-17T22:00:00Z')),'2026-11-18');
 console.log(zone+': PASS (instant, admin input, display, email/Telegram, T-30, validation)');
}
