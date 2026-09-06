/**
 * 组装云托管（CloudBase Run）部署源 —— build/cloudrun/
 *
 * 内容：Dockerfile + 运行期 package.json + dist(server/shared) + configs。
 * 密钥通过云托管运行时环境变量提供，构建产物不读取或包含密钥。
 *
 * 运行：npm run package:server
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rootPath } from '../../shared/src/paths';

const RUNTIME_PKG = {
  name: 'ape-island-server',
  private: true,
  version: '1.0.0',
  description: 'ApeIsland (猿岛) authoritative game server for CloudBase Run',
  main: 'dist/server/src/index.js',
  scripts: { start: 'node dist/server/src/index.js' },
  dependencies: {},
};

export function packageServer(out = rootPath('build', 'cloudrun')): void {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'dist'), { recursive: true });

  const tpl = rootPath('deploy', 'cloudrun', 'Dockerfile');
  if (!fs.existsSync(tpl)) throw new Error('missing deploy/cloudrun/Dockerfile');
  fs.copyFileSync(tpl, path.join(out, 'Dockerfile'));
  const sourcePackage = JSON.parse(fs.readFileSync(rootPath('package.json'), 'utf8'));
  const runtimePackage = { ...RUNTIME_PKG, dependencies: sourcePackage.dependencies || {} };
  fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify(runtimePackage, null, 2));
  const lock = JSON.parse(fs.readFileSync(rootPath('package-lock.json'), 'utf8'));
  lock.name = runtimePackage.name;
  lock.packages[''] = { name: runtimePackage.name, version: runtimePackage.version, dependencies: runtimePackage.dependencies };
  for (const [packagePath, entry] of Object.entries(lock.packages)) if ((entry as any).dev) delete lock.packages[packagePath];
  fs.writeFileSync(path.join(out, 'package-lock.json'), JSON.stringify(lock, null, 2));

  for (const sub of ['server', 'shared']) {
    const src = rootPath('dist', sub);
    if (!fs.existsSync(src)) throw new Error(`missing dist/${sub} — run: npm run build`);
    execFileSync('cp', ['-R', src, path.join(out, 'dist', sub)]);
  }
  execFileSync('cp', ['-R', rootPath('configs'), path.join(out, 'configs')]);

  fs.writeFileSync(path.join(out, '.deploy-notes.json'), JSON.stringify({
    builtAt: new Date().toISOString(),
    note: 'Inject APP_SECRET, APP_WX_APPID, APP_WX_APPSECRET and APP_CLOUD_ENV through the Cloud Run runtime environment. Provision APP_DB_COLLECTION and deny client access before deployment. APP_PERSISTENCE=cloudbase is mandatory in production. Use the Cloud Run runtime identity for database access. Never supply secrets as Docker build arguments.',
    loginRateLimit: 'Single process only: 300 attempts/minute total and 30 attempts/minute per socket peer. Forwarded headers are ignored. Configure shared limits at the trusted gateway for multiple replicas; proxy peers share a bucket.',
    profile: 'wechat-release',
    port: 8080,
  }, null, 2));

  const bytes = execFileSync('du', ['-sh', out], { encoding: 'utf8' }).split('\t')[0];
  console.log(`package:server → ${out} (${bytes.trim()})`);
  console.log('Configure Cloud Run runtime credentials before deploying this package.');
}

if (require.main === module) packageServer();
