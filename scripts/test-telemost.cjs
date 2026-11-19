// Hard-coded disposable DB and mocked external boundaries: never sends messages or calls providers.
const esbuild = require('esbuild');
const vm = require('vm');
process.env.DATABASE_URL='postgresql://gate47_test@127.0.0.1:55447/gate50b_disposable';
process.env.YANDEX_TELEMOST_ENABLED='true';
process.env.YANDEX_TELEMOST_OAUTH_TOKEN='synthetic-test-token';
process.env.EMERGENCY_BOOKING_DISABLED='false';
(async()=>{
 const built=await esbuild.build({entryPoints:['scripts/test-telemost-fixture.ts'],bundle:true,platform:'node',format:'cjs',packages:'external',write:false,plugins:[{name:'external-boundaries',setup(b){
 b.onResolve({filter:/^(?:@\/src\/lib\/|\.\/)(telegram|account-invitations|yookassa|yookassa-refunds|admin-api)$/},a=>({path:a.path.split('/').pop(),namespace:'mock'}));
 b.onLoad({filter:/.*/,namespace:'mock'},a=>({loader:'js',contents:{
 telegram:'export async function sendTelegramMessage(m){globalThis.__owner.push(m.text);return {ok:true}} export async function notifyOwnerPayment(){return {ok:true}} export async function notifyTelegramClientPaidAppointment(){globalThis.__clientTelegram++;return {ok:true}}',
 'account-invitations':'export async function sendPaidAppointmentInvitation(){globalThis.__emails++;return {ok:true}}',
 yookassa:'export function isYooKassaConfigured(){return true} export async function getYooKassaPayment(){return globalThis.__provider} export function mapYooKassaPaymentStatus(s){return s.status==="succeeded"?"paid":s.status} export function parseYooKassaAmountKopeks(v){return Math.round(Number(v)*100)}',
 'yookassa-refunds':'export async function syncRefund(){throw Error("Unexpected refund")}',
 'admin-api':'export async function requireAdminApiSession(r){return r.headers.get("x-test-admin")==="yes"?{authorized:true}:{authorized:false,response:new Response("Unauthorized",{status:401})}}'
 }[a.path]}));
 }}]});
 const target={exports:{}};
 vm.runInThisContext(require('module').wrap(built.outputFiles[0].text))(target.exports,require,target,__filename,__dirname);
 await target.exports.run();
})().catch(e=>{console.error(e);process.exitCode=1});
