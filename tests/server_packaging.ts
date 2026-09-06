import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rootPath } from '../shared/src/paths';
import { validateRuntimeConfig } from '../server/src/index';
import { packageServer } from '../tools/src/package_server';

export function run(): void {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lomo-server-package-'));
  const names = ['APP_SECRET', 'APP_ADMIN_TOKEN', 'APP_WX_APPID', 'APP_WX_APPSECRET'] as const;
  const prior = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const sentinels = names.map((name) => `packaging-sentinel-${name}-${'0'.repeat(32)}`);
  try {
    names.forEach((name, index) => { process.env[name] = sentinels[index]; });
    const configuredOutput = path.join(directory, 'configured');
    packageServer(configuredOutput);
    const scan = (current: string): void => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const entryPath = path.join(current, entry.name);
        if (entry.isDirectory()) scan(entryPath);
        else {
          const content = fs.readFileSync(entryPath, 'utf8');
          for (const sentinel of sentinels) assert.equal(content.includes(sentinel), false, `package file ${entry.name} excludes credential values`);
        }
      }
    };
    scan(configuredOutput);
    const dockerfile = fs.readFileSync(path.join(configuredOutput, 'Dockerfile'), 'utf8');
    assert.equal(/(?:ENV|ARG)\s+APP_(?:SECRET|ADMIN_TOKEN|WX_APPSECRET)\b/.test(dockerfile), false);
    for (const name of names) delete process.env[name];
    packageServer(path.join(directory, 'without-credentials'));
    assert.equal(fs.readFileSync(path.join(directory, 'without-credentials', 'Dockerfile'), 'utf8'), dockerfile);

    assert.throws(() => validateRuntimeConfig({ APP_PROFILE: 'wechat-release' }), /APP_SECRET, APP_WX_APPID, APP_WX_APPSECRET/);
    const valid = { APP_PROFILE: 'wechat-release', APP_SECRET: 'a'.repeat(48), APP_WX_APPID: 'wx1111111111111111', APP_WX_APPSECRET: 'b'.repeat(32), APP_PERSISTENCE: 'cloudbase', APP_CLOUD_ENV: 'test-environment' };
    assert.doesNotThrow(() => validateRuntimeConfig(valid));
    assert.throws(() => validateRuntimeConfig({ ...valid, APP_SECRET: 'short' }), /APP_SECRET/);
    assert.throws(() => validateRuntimeConfig({ ...valid, APP_WX_APPID: 'touristappid' }), /APP_WX_APPID/);
    assert.throws(() => validateRuntimeConfig({ ...valid, APP_PERSISTENCE: 'memory' }), /APP_PERSISTENCE/);
    assert.throws(() => validateRuntimeConfig({ ...valid, APP_CLOUD_ENV: '' }), /APP_CLOUD_ENV/);
    const runtimePackage = JSON.parse(fs.readFileSync(path.join(configuredOutput, 'package.json'), 'utf8'));
    assert.equal(runtimePackage.dependencies['@cloudbase/js-sdk'], '3.9.2');
    assert.equal(runtimePackage.dependencies['@cloudbase/signature-nodejs'], '2.0.0');
    assert.ok(fs.existsSync(path.join(configuredOutput, 'package-lock.json')));
    assert.ok(dockerfile.includes('npm ci --omit=dev --ignore-scripts'));
    assert.throws(() => validateRuntimeConfig({ ...valid, APP_ALLOW_ADMIN: '1' }), /APP_ADMIN_TOKEN/);
    assert.doesNotThrow(() => validateRuntimeConfig({ ...valid, APP_ALLOW_ADMIN: '1', APP_ADMIN_TOKEN: 'c'.repeat(48) }));
    assert.throws(() => validateRuntimeConfig({ NODE_ENV: 'production' }), /runtime configuration/);
    assert.doesNotThrow(() => validateRuntimeConfig({ NODE_ENV: 'test', APP_PROFILE: 'full-clone' }));
    assert.throws(() => execFileSync(process.execPath, [rootPath('dist/server/src/index.js')], {
      env: { ...process.env, NODE_ENV: 'production', APP_PROFILE: 'wechat-release' },
      stdio: 'pipe', timeout: 2000,
    }), (error: unknown) => {
      const failure = error as { status?: number; stderr?: Buffer };
      return failure.status === 1 && String(failure.stderr).includes('Missing or invalid runtime configuration');
    });
    console.log('server-packaging ok: no embedded credentials/build without credentials/runtime fail-closed');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
    for (const name of names) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  }
}

if (require.main === module) run();
