// Modes run independently. Only the DB/account modes connect to the guarded local fixture DB.
const esbuild=require('esbuild');
const fs=require('fs');
const vm=require('vm');
const mode=process.argv[2];
if(!['db','email','account','admin'].includes(mode))throw Error('Choose db/email/account/admin');
const dbUrl='postgresql://gate47_test@127.0.0.1:55447/gate48_current_disposable';
process.env.DATABASE_URL=dbUrl;
process.env.NEXT_PUBLIC_SITE_URL='https://luneva-psy.ru';
process.env.USER_SESSION_SECRET='synthetic-local-tests-only';
(async()=>{
const built=await esbuild.build({entryPoints:['scripts/test-consultation-access-fixture.tsx'],bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',write:false,plugins:[{name:'test-boundaries',setup(b){
b.onResolve({filter:/^(?:@\/src\/lib\/|\.\/)(auth-user|admin-api|email)$/},a=>({path:a.path,namespace:'fixture'}));
b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path.endsWith('auth-user')?'export async function getCurrentUser(){return globalThis.__accessUser||null}':a.path.endsWith('admin-api')?'export async function requireAdminApiSession(request){return request.headers.get("x-fixture-admin")==="yes"?{authorized:true}:{authorized:false,response:new Response("Unauthorized",{status:401})}}':'export function isEmailConfigured(){return true} export async function sendMail(message){globalThis.__accessMail=message;globalThis.__mailCount=(globalThis.__mailCount||0)+1}'}));
b.onResolve({filter:/^@\/components\/AccountNotifications$/},()=>({path:'notifications',namespace:'fixture-ui'}));
b.onLoad({filter:/.*/,namespace:'fixture-ui'},()=>({contents:'export default function Notifications(){return null}',loader:'js'}));
}}]});
const target={exports:{}};
vm.runInThisContext(require('module').wrap(built.outputFiles[0].text))(target.exports,require,target,__filename,__dirname);
await target.exports.run(mode);
})().catch(e=>{console.error(e);process.exitCode=1});
