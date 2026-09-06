import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { build } from '../tools/src/build_wechat';
import { rootPath } from '../shared/src/paths';

interface Manifest {
  atlases: Array<{ id: string; file?: string; frames: Array<{ name: string; file?: string }> }>;
}

function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name) => {
    const filename = path.join(dir, name);
    return fs.statSync(filename).isDirectory() ? filesUnder(filename) : [filename];
  });
}

export function assertBundleAssets(outputDir: string, cloudBase: string): void {
  const sourceRoot = rootPath('game-assets');
  const packageRoot = path.join(outputDir, 'assets/game');
  const source: Manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'manifest.json'), 'utf8'));
  const packaged: Manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'manifest.json'), 'utf8'));
  const base = cloudBase.replace(/\/?$/, '/');
  let remotePaths = 0;
  let localPaths = 0;
  let originalDoubleUnderscorePaths = 0;
  const checkPath = (sourceFile?: string, packageFile?: string): void => {
    assert.equal(Boolean(sourceFile), Boolean(packageFile));
    if (!sourceFile || !packageFile) return;
    assert.ok(fs.existsSync(path.join(sourceRoot, sourceFile)), `source manifest resolves: ${sourceFile}`);
    if (sourceFile.includes('__')) originalDoubleUnderscorePaths++;
    if (/^https?:\/\//.test(packageFile)) {
      remotePaths++;
      assert.equal(packageFile, base + sourceFile, 'remote URL preserves the existing CDN path');
    } else {
      localPaths++;
      assert.ok(!packageFile.includes('__'), `package path is DevTools compatible: ${packageFile}`);
      assert.ok(fs.existsSync(path.join(packageRoot, packageFile)), `package manifest resolves: ${packageFile}`);
      assert.deepEqual(fs.readFileSync(path.join(packageRoot, packageFile)), fs.readFileSync(path.join(sourceRoot, sourceFile)));
    }
  };
  assert.equal(packaged.atlases.length, source.atlases.length);
  for (const sourceAtlas of source.atlases) {
    const packagedAtlas = packaged.atlases.find((atlas) => atlas.id === sourceAtlas.id);
    assert.ok(packagedAtlas, `logical atlas id preserved: ${sourceAtlas.id}`);
    assert.ok(sourceAtlas.frames.length > 0, `image atlas has frames: ${sourceAtlas.id}`);
    checkPath(sourceAtlas.file, packagedAtlas.file);
    assert.equal(packagedAtlas.frames.length, sourceAtlas.frames.length);
    for (const sourceFrame of sourceAtlas.frames) {
      const packagedFrame = packagedAtlas.frames.find((frame) => frame.name === sourceFrame.name);
      assert.ok(packagedFrame);
      checkPath(sourceFrame.file, packagedFrame.file);
    }
  }
  for (const audioFile of filesUnder(path.join(sourceRoot, 'audio'))) {
    const packageFile = path.join(packageRoot, path.relative(sourceRoot, audioFile));
    assert.deepEqual(fs.readFileSync(packageFile), fs.readFileSync(audioFile), `audio packaged: ${audioFile}`);
  }
  assert.ok(fs.statSync(path.join(packageRoot, 'audio/sfx/nav.mp3')).size > 0);
  assert.ok(filesUnder(packageRoot).every((filename) => !path.relative(packageRoot, filename).includes('__')));
  assert.ok(remotePaths > 0 && localPaths > 0 && originalDoubleUnderscorePaths > 0);
}

export function run(): void {
  fs.mkdirSync(rootPath('build'), { recursive: true });
  const outputDir = fs.mkdtempSync(rootPath('build', 'asset-build-test-'));
  const originalInode = fs.statSync(outputDir).ino;
  const staleFile = path.join(outputDir, 'stale.txt');
  const staleModule = path.join(outputDir, 'dist', 'obsolete.js');
  const privateConfigPath = path.join(outputDir, 'project.private.config.json');
  const privateConfig = { libVersion: '3.16.2', setting: { urlCheck: false, compileHotReLoad: true }, simulatorType: 'wechat', description: 'user project preferences' };
  const privateBytes = JSON.stringify(privateConfig, null, 2);
  fs.writeFileSync(privateConfigPath, privateBytes);
  fs.mkdirSync(path.dirname(staleModule), { recursive: true });
  fs.writeFileSync(staleModule, 'obsolete output');
  const formalEntry = rootPath('build/wechat-release/game.js');
  const formalBytes = fs.existsSync(formalEntry) ? fs.readFileSync(formalEntry) : null;
  const cloudBase = process.env.APP_CLOUD_BASE || 'https://assets.invalid/assets/game/';
  const configNames = ['APP_WX_APPID', 'APP_SERVER_URL', 'APP_CLOUD_ENV', 'APP_CLOUD_SERVICE'] as const;
  const prior = Object.fromEntries(configNames.map((name) => [name, process.env[name]]));
  fs.writeFileSync(staleFile, 'stale build output');
  try {
    build('full-clone', { cloudBase, outputDir });
    assert.equal(fs.statSync(outputDir).ino, originalInode, 'build keeps the project root directory inode');
    assert.ok(!fs.existsSync(staleFile), 'build removes stale contents');
    assert.ok(!fs.existsSync(staleModule), 'build removes obsolete compiled modules');
    assert.equal(fs.readFileSync(privateConfigPath, 'utf8'), privateBytes, 'sandbox build preserves private user settings byte for byte');
    if (formalBytes) assert.deepEqual(fs.readFileSync(formalEntry), formalBytes, 'isolated build leaves formal entry unchanged');
    assertBundleAssets(outputDir, cloudBase);
    process.env.APP_WX_APPID = 'wx1111111111111111';
    process.env.APP_SERVER_URL = 'https://api.example.test';
    process.env.APP_CLOUD_ENV = 'test-cloud-env';
    process.env.APP_CLOUD_SERVICE = 'test-cloud-service';
    build('wechat-release', { cloudBase, outputDir });
    assert.equal(fs.statSync(outputDir).ino, originalInode, 'formal build keeps the project root directory inode');
    assert.deepEqual(JSON.parse(fs.readFileSync(privateConfigPath, 'utf8')), { ...privateConfig, setting: { ...privateConfig.setting, urlCheck: true } }, 'formal build preserves user settings while enforcing private URL validation');
    assert.equal(JSON.parse(fs.readFileSync(path.join(outputDir, 'project.config.json'), 'utf8')).setting.urlCheck, true);
    if (formalBytes) assert.deepEqual(fs.readFileSync(formalEntry), formalBytes, 'isolated formal build leaves the open formal entry unchanged');
    assertBundleAssets(outputDir, cloudBase);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
    for (const name of configNames) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  }
  console.log('build-assets ok: source/CDN paths preserved, assets/audio resolve, root inode/private settings preserved, stale modules removed, formal URL validation enforced');
}

if (require.main === module) run();
