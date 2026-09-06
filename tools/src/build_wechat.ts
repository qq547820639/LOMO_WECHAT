/**
 * 微信小游戏构建器 —— 产出可直接导入微信开发者工具的两套产物：
 *   build/wechat-full-clone/    （FULL CLONE / 沙盒）
 *   build/wechat-release/       （WECHAT RELEASE / 合规裁剪）
 *
 * 结构:
 *   game.js            入口 require('./dist/client/src/app/wx_entry.js')
 *   game.json          小游戏配置
 *   project.config.json appid=游客 / 编译设置
 *   dist/              共享+客户端+服务端(app) 编译产物（standalone 仅供 Node 验收）
 *   config.json        当前 profile 的发布配置（被打包读取）
 *
 * 说明: 不做字符串加密/混淆（开发基线），不内嵌任何真实 AppID/密钥。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rootPath } from '../../shared/src/paths';

interface GameManifest { version: string; base: string; atlases: Array<{ id: string; file?: string; frames: Array<{ name: string; x?: number; y?: number; w: number; h: number; dur?: number; file?: string }>; fps?: number; hash?: string; bytes?: number }> }

export function build(profile: 'full-clone' | 'wechat-release'): string {
  const root = rootPath();
  const outDir = path.join(root, 'build', profile === 'full-clone' ? 'wechat-full-clone' : 'wechat-release');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'dist'), { recursive: true });

  // 1. 编译 TypeScript（共享+客户端+服务端 app；排除 tools/tests/node 专用入口）
  const tsconfig = {
    compilerOptions: {
      target: 'ES2019', module: 'commonjs', moduleResolution: 'node',
      lib: ['ES2019'], strict: true, esModuleInterop: true, skipLibCheck: true,
      rootDir: root, outDir: path.join(outDir, 'dist'),
      types: [],
    },
    include: [
      path.join(root, 'shared/src/**/*.ts'),
      path.join(root, 'client/src/**/*.ts'),
      path.join(root, 'server/src/app.ts'),
      path.join(root, 'server/src/store.ts'),
      path.join(root, 'server/src/economy.ts'),
      path.join(root, 'server/src/util.ts'),
      path.join(root, 'server/src/http_type_shim.d.ts'),
      path.join(root, 'server/src/games/**/*.ts'),
      path.join(root, 'server/src/commerce.ts'),
    ],
  };
  const tmpCfg = path.join(root, 'build', `tsconfig.wechat-${profile}.json`);
  fs.mkdirSync(path.dirname(tmpCfg), { recursive: true });
  fs.writeFileSync(tmpCfg, JSON.stringify(tsconfig, null, 1));
  execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', tmpCfg], { stdio: 'inherit' });

  // 2. 复制 game.json / project.config.json / config
  fs.copyFileSync(path.join(root, 'wechat', 'game.json'), path.join(outDir, 'game.json'));
  const projCfg = JSON.parse(fs.readFileSync(path.join(root, 'wechat', 'project.config.json'), 'utf8'));
  projCfg.projectname = `ape-island-${profile}`;
  fs.writeFileSync(path.join(outDir, 'project.config.json'), JSON.stringify(projCfg, null, 2));
  fs.copyFileSync(path.join(root, 'configs', profile === 'full-clone' ? 'full-clone.json' : 'wechat-release.json'), path.join(outDir, 'config.json'));

  // 3. 入口 game.js
  const serverUrl = process.env.APP_SERVER_URL ?? '';
  fs.writeFileSync(path.join(outDir, 'game.js'), `// ApeIsland (猿岛) mini game entry — profile: ${profile}\n// WeChat runtime uses the remote server; standalone is reserved for Node/test smoke runs.\nrequire('./dist/client/src/app/wx_entry.js').start(${JSON.stringify({ profile, serverUrl, standalone: false })});\n`);

  // 4. README（构建产物级）
  fs.writeFileSync(path.join(outDir, 'README.txt'), [
    `猿岛 ApeIsland · ${profile === 'full-clone' ? '研究沙盒构建（FULL CLONE）' : '发布构建（WECHAT RELEASE）'}`,
    '',
    '导入方式: 微信开发者工具 → 导入项目 → 选择本目录 → AppID 使用测试号（touristappid）。',
    '微信运行时必须连接远端权威服务端；构建时通过 APP_SERVER_URL 注入自有 HTTPS 域名。',
    '进程内服务端仅供 Node/验收 mock 的 standalone 模式使用，不支持微信真机运行。',
    profile === 'wechat-release' ? 'RELEASE: 现金钱包/提现/下注/竞拍/P2P 交易/代理/现金红包已被客户端+服务端+配置三层关闭。' : 'FULL CLONE: 研究沙盒构建，仅限内部研究环境，禁止对外分发或提审。含沙盒结算桥（TEST_CREDIT），任何界面都不会实际兑付。',
  ].join('\n'));

  // 4. 游戏资源 bundle（P0-1 demo：game-assets → assets/game/ + manifest.json）
  const manifest = copyGameAssets(outDir);

  console.log(`[build_wechat] ${profile} → ${outDir} (atlases: ${manifest?.atlases.length ?? 0})`);
  return outDir;
}

/** PNG 尺寸解析（IHDR，无需解码） */
function pngSize(buf: Buffer): { w: number; h: number } | null {
  try {
    if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/** WebP 尺寸解析（RIFF 头，无需解码）：支持 VP8/VP8L/VP8X */
function webpSize(buf: Buffer): { w: number; h: number } | null {
  try {
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
    const fourcc = buf.toString('ascii', 12, 16);
    if (fourcc === 'VP8 ') {
      const w = buf.readUInt16LE(26) & 0x3fff;
      const h = buf.readUInt16LE(28) & 0x3fff;
      return { w, h };
    }
    if (fourcc === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === 'VP8X') {
      const w = buf.readUIntLE(24, 3) + 1;
      const h = buf.readUIntLE(27, 3) + 1;
      return { w, h };
    }
    return null;
  } catch {
    return null;
  }
}

/** 复制 game-assets/** → outDir/assets/game/** 并生成 manifest.json（含 sha256 与真实尺寸） */
function copyGameAssets(outDir: string): GameManifest | null {
  const srcDir = rootPath('game-assets');
  if (!fs.existsSync(srcDir)) return null;
  const dstBase = path.join(outDir, 'assets', 'game');
  fs.mkdirSync(dstBase, { recursive: true });
  const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
  for (const name of fs.readdirSync(srcDir)) {
    if (name === 'manifest.json') continue; // manifest 重新生成
    execFileSync('cp', ['-R', path.join(srcDir, name), path.join(dstBase, name)]);
  }
  const manifest: GameManifest = { version: `game-assets-${Date.now()}`, base: 'assets/game/', atlases: [] };
  const walk = (dir: string, rel: string): void => {
    for (const name of fs.readdirSync(dir)) {
      const fp = path.join(dir, name);
      const relPath = rel ? `${rel}/${name}` : name;
      if (fs.statSync(fp).isDirectory()) {
        walk(fp, relPath);
        continue;
      }
      // P0-3 形态 A 图集： atlas/<group>/sheet_XX.webp + <group>.meta.json → 单 sheet 形态 A 条目
      if (relPath.startsWith('atlas/')) {
        if (relPath.includes('.meta.part') || relPath.endsWith('.meta.json')) {
          try {
            const meta = JSON.parse(fs.readFileSync(fp, 'utf8'));
            const sheetFiles = Array.from(new Set(meta.frames.map((f: any) => f.file)));
            sheetFiles.forEach((sheetFile, si) => {
              manifest.atlases.push({
                id: si === 0 ? meta.id : `${meta.id}_s${si}`,
                file: `atlas/${meta.id}/${sheetFile}`,
                frames: meta.frames.filter((f: any) => f.file === sheetFile).map((f: any) => ({ name: f.name, x: f.x, y: f.y, w: f.w, h: f.h, dur: f.dur })),
                fps: meta.fps,
              });
            });
          } catch { /* 损坏 meta 跳过 */ }
        }
        continue; // atlas/ 下文件不作逐帧形态 B 处理
      }
      // 目录即图集： miner/f00.webp... → id=miner
      const parent = relPath.split('/').slice(0, -1).join('/');
      if (!parent) continue;
      let atlas = manifest.atlases.find((a) => a.id === parent);
      if (!atlas) { atlas = { id: parent, frames: [], fps: 12 }; manifest.atlases.push(atlas); }
      const buf = fs.readFileSync(fp);
      const size = (name.endsWith('.png') ? pngSize(buf) : webpSize(buf)) || (name.endsWith('.png') ? { w: 64, h: 64 } : null);
      if (!size) continue;
      atlas.frames.push({
        name: path.basename(name, path.extname(name)),
        file: relPath,
        w: size.w, h: size.h,
      });
    }
  };
  walk(srcDir, '');
  // 帧排序（f00 < f01 ...）
  for (const a of manifest.atlases) a.frames.sort((x, y) => x.name.localeCompare(y.name));
  fs.writeFileSync(path.join(dstBase, 'manifest.json'), JSON.stringify(manifest));
  // 同步生成仓库内副本（NodePlatform 测试镜像读这里）
  fs.writeFileSync(rootPath('game-assets', 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}

if (require.main === module) {
  const profile = (process.argv[process.argv.indexOf('--profile') + 1] as 'full-clone' | 'wechat-release') || 'full-clone';
  build(profile);
}
