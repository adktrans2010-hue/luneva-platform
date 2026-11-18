const esbuild=require('esbuild');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
(async()=>{
 const live=process.argv.includes('--live');
 const result=await esbuild.build({entryPoints:['src/lib/telegram.ts'],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'synthetic-only',setup(b){
 b.onResolve({filter:/^@\/src\/(db|lib\/(email|admin-settings))$/},a=>({path:a.path,namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path.endsWith('admin-settings')?'export async function getAdminSettings(){return null}':a.path.endsWith('email')?'export function isEmailConfigured(){return false} export async function sendMail(){throw Error("EMAIL_NOT_ALLOWED_IN_TELEGRAM_TEST")}':'export const db={select:()=>({from:()=>({where:()=>({limit:async()=>[{name:"TEST консультация"}]})})})}',loader:'js'}));
 }}]});
 const code=result.outputFiles[0].text;
 if(live){fs.writeFileSync('C:/LUNEVA_RECOVERY_REPORTS/gate46b_synthetic_bundle.cjs',code);return;}
 const messages=[];const logs=[];const module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require,process:{env:{TELEGRAM_BOT_TOKEN:'synthetic',TELEGRAM_OWNER_CHAT_ID:'123'}},console:{info:(x)=>logs.push(x),warn:(x)=>logs.push(x)},fetch:async(_,init)=>{messages.push(JSON.parse(init.body).text);return {ok:true,json:async()=>({ok:true})}},Date,Intl,URL,Buffer,setTimeout,clearTimeout,AbortSignal});
 const a={id:'00000000-0000-4000-8000-000000000001',name:'TEST',contact:'test@example.test',consultationFormat:'online',scheduledAt:new Date('2030-01-01T12:00:00Z'),paymentStatus:'paid',paymentAmount:5000,productId:'00000000-0000-4000-8000-000000000002'};
 assert.equal((await module.exports.notifyOwnerPayment(a)).ok,true);
 assert.equal((await module.exports.notifyOwnerNewAppointment(a)).ok,true);
 assert.equal(messages.length,2);
 assert.match(messages[0],/Оплата по записи/);assert.match(messages[1],/Новая запись/);
 for(const text of messages)for(const part of ['TEST консультация','5000','Онлайн','Дата:'])assert.ok(text.includes(part));
 assert.equal(logs.filter(x=>x==='owner_telegram_sent').length,2);
 const skipped=await module.exports.notifyTelegramClientPaidAppointment({appointment:a,serviceName:'TEST'});assert.equal(skipped.skipped,true);assert.equal(messages.length,2);
 console.log('OWNER_NOTIFICATION_TESTS PASS; REAL_SENDS 0; DB_WRITES 0');
})().catch(()=>{console.error('OWNER_NOTIFICATION_TESTS_FAILED');process.exit(1)});
