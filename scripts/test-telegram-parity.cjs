// Local disposable DB only. All outgoing email/Telegram calls are intercepted.
const esbuild = require('esbuild');
const vm = require('vm');
process.env.DATABASE_URL = 'postgresql://gate47_test@127.0.0.1:55447/gate50b_disposable';
process.env.NEXT_PUBLIC_SITE_URL = 'https://luneva-psy.ru';
process.env.TELEGRAM_BOT_TOKEN = 'synthetic-test-token';
(async () => {
  const built = await esbuild.build({
    entryPoints: ['scripts/test-telegram-parity-fixture.ts'], bundle: true,
    platform: 'node', format: 'cjs', packages: 'external', write: false,
    plugins: [{ name: 'mock-email', setup(b) {
      b.onResolve({filter: /^(?:@\/src\/lib\/|\.\/)email$/}, () => ({path: 'email', namespace: 'mock'}));
      b.onLoad({filter: /.*/, namespace: 'mock'}, () => ({loader: 'js', contents:
        'export function isEmailConfigured(){return true} export async function sendMail(m){globalThis.__parityMail.push(m);return {ok:true}}'}));
    }}],
  });
  const target = {exports: {}};
  vm.runInThisContext(require('module').wrap(built.outputFiles[0].text))(target.exports, require, target, __filename, __dirname);
  await target.exports.run();
})().catch(error => { console.error(error); process.exitCode = 1; });
