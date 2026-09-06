import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { build } from '../tools/src/build_wechat';
import { rootPath } from '../shared/src/paths';

export function run(): void {
  const names = ['APP_WX_APPID', 'APP_SERVER_URL', 'APP_CLOUD_BASE', 'APP_CLOUD_ENV', 'APP_CLOUD_SERVICE'] as const;
  const prior = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  fs.mkdirSync(rootPath('build'), { recursive: true });
  const outputDir = fs.mkdtempSync(rootPath('build', 'release-config-test-'));
  const cloudBase = 'https://assets.invalid/assets/game/';
  try {
    for (const name of names) delete process.env[name];
    assert.throws(() => build('wechat-release'), /requires APP_WX_APPID, APP_SERVER_URL, APP_CLOUD_ENV, APP_CLOUD_SERVICE/);
    process.env.APP_WX_APPID = 'wx1111111111111111';
    process.env.APP_SERVER_URL = 'https://api.example.test';
    process.env.APP_CLOUD_ENV = 'test-cloud-env';
    process.env.APP_CLOUD_SERVICE = 'test-cloud-service';
    for (const invalidAppId of ['touristappid', 'wx12345678', 'wx11111111111111111', 'wxabcdefghijklmnop', 'wx111111111111111_']) {
      process.env.APP_WX_APPID = invalidAppId;
      assert.throws(() => build('wechat-release', { cloudBase, outputDir }), /APP_WX_APPID/);
    }
    process.env.APP_WX_APPID = 'wx1111111111111111';
    for (const invalidUrl of ['http://api.example.test', 'https://', 'https:///api.example.test', 'https://api.example.test?x=1', 'https://api.example.test/#fragment', 'https://user:secret@api.example.test', 'https://api.example.test\\path', 'https://api.example.test/with space']) {
      process.env.APP_SERVER_URL = invalidUrl;
      assert.throws(() => build('wechat-release', { cloudBase, outputDir }), /APP_SERVER_URL/);
      process.env.APP_SERVER_URL = 'https://api.example.test';
      assert.throws(() => build('wechat-release', { cloudBase: invalidUrl, outputDir }), /APP_CLOUD_BASE/);
    }
    assert.throws(() => build('wechat-release', { outputDir }), /APP_CLOUD_BASE/);
    process.env.APP_CLOUD_BASE = 'http://invalid-env.example.test';
    build('wechat-release', { cloudBase, outputDir });
    const project = JSON.parse(fs.readFileSync(path.join(outputDir, 'project.config.json'), 'utf8'));
    assert.equal(project.appid, 'wx1111111111111111');
    assert.equal(project.setting.urlCheck, true);
    assert.equal(project.libVersion, '3.16.2');
    const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'assets/game/manifest.json'), 'utf8'));
    const remoteFiles = manifest.atlases.flatMap((atlas: any) => [atlas.file, ...atlas.frames.map((frame: any) => frame.file)]).filter((filename: unknown) => typeof filename === 'string' && /^https?:\/\//.test(filename));
    assert.ok(remoteFiles.length > 0);
    assert.ok(remoteFiles.every((filename: string) => filename.startsWith(cloudBase)), 'explicit cloudBase overrides the environment value');
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
    for (const name of names) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  }
  console.log('release-config ok: fail-closed runtime config, exact AppID, strict HTTPS, explicit cloudBase, URL validation enabled');
}

if (require.main === module) run();
