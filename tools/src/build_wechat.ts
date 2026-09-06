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

export function build(profile: 'full-clone' | 'wechat-release', opts: { cloudBase?: string; bootBudget?: number } = {}): string {
  const cloudBase = process.env.APP_CLOUD_BASE ?? opts.cloudBase ?? '';
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
  const cloudEnv = process.env.APP_CLOUD_ENV ?? '';
  fs.writeFileSync(path.join(outDir, 'game.js'), `// ApeIsland (猿岛) mini game entry — profile: ${profile}\n// WeChat runtime uses the remote server; standalone is reserved for Node/test smoke runs.\n// cloudEnv/cloudBase 仅注入环境标识，不含任何密钥。\nrequire('./dist/client/src/app/wx_entry.js').start(${JSON.stringify({ profile, serverUrl, cloudEnv, standalone: false })});\n`);

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
  const manifest = copyGameAssets(outDir, { cloudBase, bootBudget: opts.bootBudget });
  const pkgBytes = dirSizeBytes(outDir);
  const mode = cloudBase ? `cloud-assets (boot pack ${manifest ? countBootAtlases(manifest, cloudBase) : 0})` : 'packaged-assets';
  console.log(`[build_wechat] ${profile} → ${outDir} (atlases: ${manifest?.atlases.length ?? 0}, ${mode}, main pkg ${(pkgBytes / 1048576).toFixed(2)}MB)`);
  return outDir;
}

/** 统计仍指向包内的图集数（boot pack 规模，云模式下用于日志核对） */
function countBootAtlases(m: GameManifest, cloudBase: string): number {
  const isRemote = (f?: string): boolean => !!f && /^https?:\/\//.test(f);
  return m.atlases.filter((a) => !isRemote(a.file) && !a.frames.some((f) => isRemote(f.file))).length;
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

/**
 * 复制 game-assets/** → outDir/assets/game/** 并生成 manifest.json（含 sha256 与真实尺寸）。
 *
 * 云资源模式（cloudBase 非空）：微信主包红线 4MB，23MB 自制动画不能全塞包内 ——
 *  - 主包仅保留 boot pack（首屏必需，默认 miner + 按 id 序填充至预算，默认 1.5MB）
 *  - 其余图集的帧 file 改写为**远端绝对 URL**（AssetManager.url() 对 http(s) 直连，不再拼 base）
 *  - 仓库内 game-assets/manifest.json 始终写**本地形态**（Node 验收镜像用，不依赖网络）
 */
function copyGameAssets(outDir: string, opts: { cloudBase?: string; bootBudget?: number }): GameManifest | null {
  const srcDir = rootPath('game-assets');
  if (!fs.existsSync(srcDir)) return null;
  const dstBase = path.join(outDir, 'assets', 'game');
  fs.mkdirSync(dstBase, { recursive: true });
  const manifest: GameManifest = { version: `game-assets-${Date.now()}`, base: 'assets/game/', atlases: [] };
  // atlas id → 该图集涉及的源文件相对路径（用于 boot pack 精确复制）
  const atlasFiles = new Map<string, Set<string>>();
  const register = (id: string, relPath: string): void => {
    const s = atlasFiles.get(id) ?? new Set<string>();
    s.add(relPath);
    atlasFiles.set(id, s);
  };
  const walk = (dir: string, rel: string): void => {
    for (const name of fs.readdirSync(dir)) {
      if (rel === '' && name === 'manifest.json') continue; // 仓库镜像 manifest 重新生成
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
              const id = si === 0 ? meta.id : `${meta.id}_s${si}`;
              manifest.atlases.push({
                id,
                file: `atlas/${meta.id}/${sheetFile}`,
                frames: meta.frames.filter((f: any) => f.file === sheetFile).map((f: any) => ({ name: f.name, x: f.x, y: f.y, w: f.w, h: f.h, dur: f.dur })),
                fps: meta.fps,
              });
              register(id, `atlas/${meta.id}/${String(sheetFile)}`);
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
      register(parent, relPath);
    }
  };
  walk(srcDir, '');
  for (const a of manifest.atlases) a.frames.sort((x, y) => x.name.localeCompare(y.name));
  // 仓库镜像始终本地形态（Node 验收不依赖网络）
  fs.writeFileSync(rootPath('game-assets', 'manifest.json'), JSON.stringify(manifest));

  // 云资源模式：挑选 boot pack 并将其余图集改写为远端 URL
  const bootIds = new Set<string>();
  if (opts.cloudBase) {
    const budget = opts.bootBudget ?? 1_500_000;
    const sizeOf = (id: string): number => Array.from(atlasFiles.get(id) ?? []).reduce((n, p) => n + fs.statSync(path.join(srcDir, p)).size, 0);
    if (atlasFiles.has('miner')) bootIds.add('miner'); // 首屏演示帧
    let used = sizeOf('miner');
    for (const a of manifest.atlases) {
      if (bootIds.has(a.id)) continue;
      const sz = sizeOf(a.id);
      if (used + sz > budget) continue;
      bootIds.add(a.id);
      used += sz;
    }
    const base = opts.cloudBase.replace(/\/?$/, '/');
    for (const a of manifest.atlases) {
      if (bootIds.has(a.id)) continue;
      if (a.file) a.file = base + a.file;
      for (const f of a.frames) if (f.file) f.file = base + f.file;
    }
  }

  // 复制：云模式仅 boot pack；否则全量（保留原有 cp -R 语义）
  if (opts.cloudBase) {
    const copyRel = (relPath: string): void => {
      const dst = path.join(dstBase, relPath);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(path.join(srcDir, relPath), dst);
    };
    for (const id of bootIds) for (const rel of atlasFiles.get(id) ?? []) copyRel(rel);
  } else {
    const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
    for (const name of fs.readdirSync(srcDir)) {
      if (name === 'manifest.json') continue;
      execFileSync('cp', ['-R', path.join(srcDir, name), path.join(dstBase, name)]);
    }
  }
  fs.writeFileSync(path.join(dstBase, 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}

/** 目录总字节数（微信主包体积门禁用） */
export function dirSizeBytes(dir: string): number {
  let total = 0;
  const walk = (d: string): void => {
    for (const name of fs.readdirSync(d)) {
      const fp = path.join(d, name);
      const st = fs.statSync(fp);
      if (st.isDirectory()) walk(fp);
      else total += st.size;
    }
  };
  walk(dir);
  return total;
}

if (require.main === module) {
  const profile = (process.argv[process.argv.indexOf('--profile') + 1] as 'full-clone' | 'wechat-release') || 'full-clone';
  build(profile);
}
