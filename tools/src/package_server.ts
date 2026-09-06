/**
 * 组装云托管（CloudBase Run）部署源 —— build/cloudrun/
 *
 * 内容：Dockerfile（模板 + 注入的密钥 ENV）+ 运行期 package.json + dist(server/shared) + configs。
 * 密钥策略：首次生成后写入本地 .env.cloud（gitignored）并复用 —— 否则每次部署都会换签名密钥、
 * 把所有已登录用户踢下线。产物目录 build/cloudrun 不入库。
 *
 * 运行：npm run package:server
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
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

/** 读取或生成并持久化一个密钥（写入 .env.cloud，不入库） */
function ensureSecret(key: string): string {
  const envPath = rootPath('.env.cloud');
  let existing: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m) existing[m[1]] = m[2];
    }
  }
  if (existing[key]) return existing[key];
  const value = crypto.randomBytes(24).toString('hex');
  fs.appendFileSync(envPath, `${key}=${value}\n`);
  return value;
}

function main(): void {
  const out = rootPath('build', 'cloudrun');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'dist'), { recursive: true });

  const tpl = rootPath('deploy', 'cloudrun', 'Dockerfile');
  if (!fs.existsSync(tpl)) throw new Error('missing deploy/cloudrun/Dockerfile');
  fs.copyFileSync(tpl, path.join(out, 'Dockerfile'));
  fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify(RUNTIME_PKG, null, 2));

  for (const sub of ['server', 'shared']) {
    const src = rootPath('dist', sub);
    if (!fs.existsSync(src)) throw new Error(`missing dist/${sub} — run: npm run build`);
    execFileSync('cp', ['-R', src, path.join(out, 'dist', sub)]);
  }
  execFileSync('cp', ['-R', rootPath('configs'), path.join(out, 'configs')]);

  const secret = process.env.APP_SECRET || ensureSecret('APP_SECRET');
  const adminToken = process.env.APP_ADMIN_TOKEN || ensureSecret('APP_ADMIN_TOKEN');
  fs.appendFileSync(path.join(out, 'Dockerfile'), `\n# 注入密钥（产物专用，不入库；生产建议控制台环境变量覆盖）\nENV APP_SECRET="${secret}"\nENV APP_ADMIN_TOKEN="${adminToken}"\n`);
  fs.writeFileSync(path.join(out, '.deploy-notes.json'), JSON.stringify({
    builtAt: new Date().toISOString(),
    note: 'secrets injected into Dockerfile ENV; console env vars override them in production',
    profile: 'wechat-release',
    port: 8080,
  }, null, 2));

  const bytes = execFileSync('du', ['-sh', out], { encoding: 'utf8' }).split('\t')[0];
  console.log(`package:server → ${out} (${bytes.trim()})`);
  console.log('deploy: set -a; . ./.env.cloud; set +a && npx -p @cloudbase/cli tcb cloudrun deploy -s ape-island --port 8080 --source build/cloudrun --wait --force');
}

main();
