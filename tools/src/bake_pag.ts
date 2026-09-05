/**
 * P0-2 烘焙 spike（对应 docs/PAG_BAKE_PLAN.md 执行表）。
 *
 * 架构：本文件只做编排（HTTP 宿主 + puppeteer 驱动 + 报告落盘）；
 * 逐帧渲染逻辑在 tools/bake/render.html（Chrome SwiftShader WebGL 内跑 libpag-web）：
 *   fetch .pag → PAGFile.load → PAGPlayer.setProgress/flush → PAGSurface.readPixels
 *   → 2D canvas ImageData → toDataURL(png/webp) → keep 文件 POST 回宿主落盘。
 *
 * 磁盘策略（保持仓库干净）：全部 99 个样本都完整渲染并统计字节；
 * 仅 --keep 个抽样文件落盘 PNG/WebP 序列（evidence/bake_samples），其余渲染后即弃。
 *
 * 运行：npm run build && node dist/tools/src/bake_pag.js [--cap 120] [--keep 2] [--atlas]
 *   --atlas：追加 P0-3 图集阶段（同浏览器会话内二次驱动）：降帧(12-20fps) + MaxRects 跨文件共享
 *   sheet 打包 + 超大件视频桶 + 10 样本往返像素比对 + 无头满帧基准 → data/atlas-report.json +
 *   docs/ATLAS_REPORT.md；keep 组图集落盘 evidence/atlas_samples/，launch_click 组发射到
 *   game-assets/atlas/（构建器按形态 A 并入微信包 manifest）。
 */
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as url from 'url';
import { execFileSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import { rootPath } from '../../shared/src/paths';

interface BakeArgs { slug: string; capFrames: number; quality: number; wantPng: boolean; wantWebp: boolean; keep: boolean }
interface BakeResult {
  ok: boolean; error?: string; w?: number; h?: number; fps?: number; durUs?: number;
  natural?: number; frames?: number; rendered?: number; blank?: number;
  pngBytes?: number; webpBytes?: number; wrote?: number;
  fetchMs?: number; decodeMs?: number; renderMs?: number; totalMs?: number;
}
interface FileJob { slug: string; rel: string; group: string; abs: string; size: number }

function parseArgs(): { cap: number; keep: number; quality: number; samples: string; out: string; chrome: string; atlas: boolean; atlasOnly: boolean; videoOnly: boolean; partFiles: number; targetFps: number; sheetSize: number; ffmpeg: string } {
  const argv = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
  return {
    cap: Number(get('cap', '120')),
    keep: Number(get('keep', '2')),
    quality: Number(get('quality', '0.8')),
    samples: get('samples', rootPath('evidence', 'apk_assets_sample', 'assets', 'pag')),
    out: get('out', rootPath('tools', 'bake', 'out')),
    chrome: get('chrome', process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    atlas: argv.includes('--atlas'),
    atlasOnly: argv.includes('--atlas-only'),
    videoOnly: argv.includes('--video-only'),
    partFiles: Number(get('part-files', '24')),
    targetFps: Number(get('target-fps', '15')),
    sheetSize: Number(get('sheet-size', '2048')),
    ffmpeg: get('ffmpeg', process.env.FFMPEG_PATH || rootPath('tools', 'bin', 'ffmpeg')),
  };
}

function walkPag(dir: string, base: string, acc: FileJob[], tag?: string): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walkPag(abs, base, acc, tag);
    else if (e.name.toLowerCase().endsWith('.pag')) {
      const rel0 = path.relative(base, abs);
      const rel = (tag ? tag + '/' : '') + rel0;
      acc.push({ slug: '', rel: rel, group: path.dirname(rel) === '.' ? '(root)' : path.dirname(rel), abs: abs, size: fs.statSync(abs).size });
    }
  }
}

function mime(p: string): string {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.wasm')) return 'application/wasm';
  if (p.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

interface HttpHandle { port: number; isAlive: () => boolean; restart: () => Promise<void>; close: () => void }

function startServer(opts: { renderHtml: string; libpagJs: string; libpagWasm: string; jobs: FileJob[]; out: string }): Promise<HttpHandle> {
  const bySlug = new Map<string, FileJob>();
  opts.jobs.forEach((j) => bySlug.set(j.slug, j));
  const state: { server: http.Server | null; port: number } = { server: null, port: 0 };
  const createServer = (): http.Server => {
    const server = http.createServer((req, res) => {
      // handler 全包 try/catch：同步异常一律 500，绝不冒泡成 uncaughtException 杀进程
      try {
        handler(req, res);
      } catch (e) {
        try { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('handler error: ' + String(e).slice(0, 160)); } catch { /* socket 已死 */ }
      }
    });
    server.on('clientError', (err, socket) => { try { socket.destroy(); } catch { /* 已断 */ } });
    server.on('error', (e) => console.error('[http-server error]', String(e).slice(0, 200)));
    return server;
  };
  const handler = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const send = (code: number, body: Buffer | string, ct?: string) => {
      res.writeHead(code, { 'Content-Type': ct || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
    };
    if (req.method === 'POST' && url.pathname === '/atlas') {
      const group = url.searchParams.get('g') || 'ungrouped';
      const file = (url.searchParams.get('f') || 'sheet_00.webp').replace(/[^a-zA-Z0-9_.-]/g, '');
      const dir = path.join(opts.out, 'atlas', group);
      fs.mkdirSync(dir, { recursive: true });
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        try {
          fs.writeFileSync(path.join(dir, file), Buffer.concat(chunks));
          send(200, 'ok', 'text/plain');
        } catch (e) { send(500, 'write fail: ' + String(e), 'text/plain'); }
      });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/frame') {
      const job = bySlug.get(url.searchParams.get('f') || '');
      const i = Number(url.searchParams.get('i') || '0');
      const fmt = url.searchParams.get('fmt') === 'png' ? 'png' : 'webp';
      if (!job || !Number.isInteger(i) || i < 0) { send(400, 'bad frame params'); return; }
      const dir = path.join(opts.out, job.slug);
      fs.mkdirSync(dir, { recursive: true });
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        try {
          fs.writeFileSync(path.join(dir, 'frame_' + String(i).padStart(4, '0') + '.' + fmt), Buffer.concat(chunks));
          send(200, 'ok', 'text/plain');
        } catch (e) { send(500, 'write fail: ' + String(e), 'text/plain'); }
      });
      return;
    }
    if (req.method !== 'GET') { send(405, 'method', 'text/plain'); return; }
    const p = url.pathname;
    if (p === '/render.html') { send(200, fs.readFileSync(opts.renderHtml), mime(p)); return; }
    if (p === '/lib/maxrects.mjs') {
      try { send(200, fs.readFileSync(rootPath('tools', 'bake', 'maxrects.mjs')), 'application/javascript; charset=utf-8'); } catch { send(404, 'missing maxrects', 'text/plain'); }
      return;
    }
    if (p === '/lib/libpag.esm.js' || p === '/lib/libpag.umd.js' || p === '/libpag.wasm') {
      const f = p.endsWith('.wasm')
        ? opts.libpagWasm
        : p.endsWith('.esm.js') ? rootPath('node_modules', 'libpag', 'lib', 'libpag.esm.js') : opts.libpagJs;
      try { send(200, fs.readFileSync(f), mime(p)); } catch { send(404, 'missing lib', 'text/plain'); }
      return;
    }
    if (p.startsWith('/pag/')) {
      const job = bySlug.get(p.slice('/pag/'.length));
      if (!job) { send(404, 'no such slug', 'text/plain'); return; }
      try { send(200, fs.readFileSync(job.abs), mime(job.abs)); } catch (e) { send(500, 'read fail: ' + String(e), 'text/plain'); }
      return;
    }
    send(404, 'not found', 'text/plain');
  };
  return new Promise((resolve) => {
    const listen = (): Promise<void> => new Promise((res2) => {
      state.server = createServer();
      state.server.listen(0, '127.0.0.1', () => {
        state.port = (state.server!.address() as { port: number }).port;
        res2();
      });
    });
    listen().then(() => resolve({
      get port(): number { return state.port; },
      isAlive: (): boolean => !!state.server && state.server.listening,
      restart: async (): Promise<void> => {
        try { state.server?.close(); } catch { /* 已死 */ }
        await new Promise((r) => setTimeout(r, 200));
        await listen();
        console.log('[http-server] restarted on port ' + state.port);
      },
      close: (): void => { try { state.server?.close(); } catch { /* noop */ } },
    }));
  });
}

function sha256(p: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function writeReports(opts: {
  out: string; cap: number; quality: number; chrome: string; jobs: FileJob[]; results: Map<string, BakeResult>;
  keepSet: Set<string>; pagTotalBytesInApk: number; wallMs: number;
}): { jsonPath: string; mdPath: string } {
  const rows = opts.jobs.map((j) => ({ job: j, r: opts.results.get(j.slug) || { ok: false, error: 'no result' } }));
  const okRows = rows.filter((x) => x.r.ok);
  const failed = rows.filter((x) => !x.r.ok);
  const sum = (f: (x: typeof rows[number]) => number) => okRows.reduce((a, x) => a + f(x), 0);
  const pngTotal = sum((x) => x.r.pngBytes || 0);
  const webpTotal = sum((x) => x.r.webpBytes || 0);
  const framesTotal = sum((x) => x.r.rendered || 0);
  const samplePagBytes = sum((x) => x.job.size);
  const renderMsTotal = sum((x) => x.r.renderMs || 0);
  const scale = samplePagBytes > 0 ? opts.pagTotalBytesInApk / samplePagBytes : 0;
  const capped = okRows.filter((x) => (x.r.natural || 0) > (x.r.frames || 0));
  const json = {
    tool: 'bake_pag (P0-2 spike)',
    startedChrome: opts.chrome,
    capFrames: opts.cap,
    webpQuality: opts.quality,
    wallMs: Math.round(opts.wallMs),
    sampleFiles: rows.length,
    ok: okRows.length,
    failed: failed.length,
    framesRendered: framesTotal,
    pngBytesTotal: pngTotal,
    webpBytesTotal: webpTotal,
    samplePagBytesTotal: samplePagBytes,
    apkPagBytesEstimate: opts.pagTotalBytesInApk,
    extrapolationScale: Number(scale.toFixed(3)),
    fullBakeVolumeEstimate: {
      pngBytes: Math.round(pngTotal * scale),
      webpBytes: Math.round(webpTotal * scale),
      note: '按 PAG 字节量等比外推（样本→全量 535 文件/60.6MB）；未含图集打包收益',
    },
    cappedFiles: capped.length,
    keepSet: Array.from(opts.keepSet),
    rows: rows.map(({ job, r }) => ({ rel: job.rel, group: job.group, pagBytes: job.size, ...r })),
  };
  const jsonPath = rootPath('data', 'bake-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));

  const top10 = [...okRows].sort((a, b) => (b.r.pngBytes || 0) - (a.r.pngBytes || 0)).slice(0, 10);
  const groups = new Map<string, { files: number; png: number; webp: number }>();
  for (const { job, r } of okRows) {
    const g = groups.get(job.group) || { files: 0, png: 0, webp: 0 };
    g.files++; g.png += r.pngBytes || 0; g.webp += r.webpBytes || 0;
    groups.set(job.group, g);
  }
  const kb = (n?: number) => ((n || 0) / 1024).toFixed(1) + 'KB';
  const md = [
    '# BAKE_REPORT（P0-2 spike，' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '）',
    '',
    '> 机器生成：tools/src/bake_pag.ts + tools/bake/render.html；逐帧统计明细见 data/bake-report.json。',
    '',
    '## 结果',
    '',
    '| 指标 | 值 |',
    '|---|---|',
    '| 样本 | ' + rows.length + ' 个（归档 99 个 .pag，evidence/apk_assets_sample/assets/pag/） |',
    '| 烘焙成功 | ' + okRows.length + ' / ' + rows.length + '（失败 ' + failed.length + '） |',
    '| 渲染帧数 | ' + framesTotal + '（cap=' + opts.cap + ' 帧/文件，natural 超限裁剪 ' + capped.length + ' 个） |',
    '| 吞吐 | ' + (renderMsTotal > 0 ? Math.round(framesTotal / (renderMsTotal / 1000)) : 0) + ' 帧/秒（headless Chrome WebGL，含快照回读+PNG/WebP 双格式编码） |',
    '| PNG 序列总体积 | ' + kb(pngTotal) + '（样本） |',
    '| WebP 序列总体积 | ' + kb(webpTotal) + '（q=' + opts.quality + '，PNG 的 ' + (pngTotal ? Math.round(webpTotal / pngTotal * 100) : 0) + '%） |',
    '| 全量 535 文件外推 | PNG ≈ ' + (pngTotal * scale / 1024 / 1024).toFixed(0) + 'MB；WebP ≈ ' + (webpTotal * scale / 1024 / 1024).toFixed(0) + 'MB（按 PAG 字节等比，未含打包器去重收益） |',
    '',
    '## Top-10 体积（PNG 序列）',
    '',
    '| 文件 | 组 | 尺寸 | fps | natural/cap | PNG | WebP | 渲染耗时 |',
    '|---|---|---|---|---|---|---|---|',
    ...top10.map(({ job, r }) => '| ' + job.rel + ' | ' + job.group + ' | ' + r.w + '×' + r.h + ' | ' + Math.round(r.fps || 0) + ' | ' + r.natural + '/' + r.frames + ' | ' + kb(r.pngBytes) + ' | ' + kb(r.webpBytes) + ' | ' + r.renderMs + 'ms |'),
    '',
    '## 分组聚合',
    '',
    '| 组 | 文件 | PNG | WebP |',
    '|---|---|---|---|',
    ...Array.from(groups.entries()).sort((a, b) => b[1].png - a[1].png).map(([g, v]) => '| ' + g + ' | ' + v.files + ' | ' + kb(v.png) + ' | ' + kb(v.webp) + ' |'),
    '',
  ];
  if (failed.length) {
    md.push('## 失败清单', '', '| 文件 | 错误 |', '|---|---|', ...failed.map(({ job, r }) => '| ' + job.rel + ' | ' + (r.error || 'unknown') + ' |'), '');
  }
  md.push(
    '## 方法与口径',
    '',
    '- 渲染：headless Chrome（' + opts.chrome.split('/').pop() + '）WebGL（Apple Silicon 实测 ANGLE Metal 后端）+ libpag-web（npm libpag，WASM 单线程版）。',
    '- 像素获取：PAGView.setProgress/flush → makeSnapshot(ImageBitmap) → 2D canvas drawImage → toDataURL（官方导出路径；PAGSurface.fromCanvas 对动态 canvas 存在创建即销毁态缺陷、裸 new PAGPlayer 得到空壳，均记录于 tools/bake/render.html 头注）。',
    '- 帧数：natural = duration × frameRate；超 cap=' + opts.cap + ' 截断（截断文件的体积外推已在 fullBakeVolumeEstimate 内按帧数比例计入自然时长权重前提示 cappedFiles）。',
    '- 磁盘策略：仅 keep 抽样落盘（' + Array.from(opts.keepSet).join(', ') + ' → evidence/bake_samples/），其余文件渲染后即弃，字节统计在浏览器端累计。',
    '- 朝向假设：readPixels 按 top-left 原点处理（SkBitmap 语义）；kept 样本可人工核验，若发现上下翻转在 P0-3 打包器统一校正。',
    '',
    '## 下一步（P0-3）',
    '',
    '图集打包：MaxRects + JSON 元数据（形态 A）→ assets/atlas/；fps 按策略表 12-20；长演出转 mp4。',
    '',
  );
  const mdPath = rootPath('docs', 'BAKE_REPORT.md');
  fs.writeFileSync(mdPath, md.join('\n'));
  return { jsonPath, mdPath };
}

interface AtlasGroupMeta { group: string; sheets: number; sheetBytes: number[]; framesWithPlace: Array<{ name: string; x: number; y: number; w: number; h: number; dur: number; file: string }> }
interface AtlasFileResult { ok: boolean; error?: string; videoBucket?: boolean; w?: number; h?: number; fps?: number; natural?: number; selected?: number; placed?: number; diffs?: Array<{ idx: number; meanAbsDiff: number }>; totalMs?: number }

/** P0-3 图集阶段：降帧 + MaxRects 跨文件打包 + 视频桶 + 往返比对 + 基准 */
async function runAtlasPhase(opts: {
  page: any; jobs: FileJob[]; results: Map<string, BakeResult>; out: string;
  cap: number; quality: number; targetFps: number; sheetSize: number; keepGroups: Set<string>;
  partFiles: number;
  relaunch: () => Promise<any>;
}): Promise<void> {
  let page = opts.page;
  // 隐藏式动态 import（TS→CJS 会把 import() 转成 require，.mjs 无法 require）
  const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
  const { selectFrames, classifyVideoBucket } = await dynImport(url.pathToFileURL(rootPath('tools', 'bake', 'maxrects.mjs')).href);
  const groups = new Map<string, FileJob[]>();
  for (const j of opts.jobs) {
    const r = opts.results.get(j.slug);
    if (!r || !r.ok) continue;
    const list = groups.get(j.group) || [];
    list.push(j);
    groups.set(j.group, list);
  }
  // verify 集：10 个最小的可打包文件（往返像素比对在浏览器内进行）
  const eligible: Array<{ job: FileJob; r: BakeResult; selected: number }> = [];
  const videoBucket: Array<{ rel: string; group: string; w: number; h: number; selected: number; natural: number }> = [];
  for (const [, gjobs] of groups) {
    for (const j of gjobs) {
      const r = opts.results.get(j.slug)!;
      const selected = selectFrames(r.natural || 0, r.fps || opts.targetFps, opts.targetFps, opts.cap).length;
      if (classifyVideoBucket(r.w || 0, r.h || 0, selected, opts.sheetSize)) {
        videoBucket.push({ rel: j.rel, group: j.group, w: r.w || 0, h: r.h || 0, selected, natural: r.natural || 0 });
      } else eligible.push({ job: j, r, selected });
    }
  }
  eligible.sort((a, b) => a.job.size - b.job.size);
  const verifySlugs = new Set(eligible.slice(0, 10).map((x) => x.job.slug));

  const groupReports: Array<{ group: string; files: number; packed: number; framesPlaced: number; sheets: number; atlasBytes: number; framesArea: number }> = [];
  const verifyRows: Array<{ rel: string; diffs: Array<{ idx: number; meanAbsDiff: number }> }> = [];
  const fsMod = await import('fs');
  // 长会话稳定性：libpag WASM 堆（尤其 VideoReader）随文件数累积泄漏，实测 25-35 文件后 renderer 必死。
  // 对策：每 PART_FILES=4 个文件 flush 分片 + 整浏览器重启换新堆；崩溃恢复时扣除丢失帧数（诚实口径）。
  let crashes = 0;
  let framesLost = 0;
  void 0;
  let filesSinceFlush = 0;
  let framesSinceFlush = 0;
  const PART_FILES = opts.partFiles;
  let partSeq = 0;
  for (const [group, gjobs] of groups) {
    const keepWebp = opts.keepGroups.has(group);
    // 占用率优化：组内按单帧面积降序 —— 大件先包满、小件后用 MaxRects 填缝（在线放置不回溯的前提排序）
    gjobs.sort((a, b) => {
      const ra = opts.results.get(a.slug) || ({} as BakeResult);
      const rb = opts.results.get(b.slug) || ({} as BakeResult);
      return (rb.w || 0) * (rb.h || 0) - (ra.w || 0) * (ra.h || 0);
    });
    let packed = 0, framesPlaced = 0, sheetsTotal = 0, bytesTotal = 0, sincePart = 0, groupFramesArea = 0;
    const flushPart = async (): Promise<void> => {
      const meta = await page.evaluate('window.__atlasFlush(' + JSON.stringify({ group, quality: opts.quality, keepWebp }) + ')') as AtlasGroupMeta;
      partSeq++;
      const metaPath = path.join(opts.out, 'atlas', group, path.basename(group) + '.meta.part' + String(partSeq).padStart(2, '0') + '.json');
      fsMod.mkdirSync(path.dirname(metaPath), { recursive: true });
      fsMod.writeFileSync(metaPath, JSON.stringify({ id: path.basename(group), base: 'atlas/' + group + '/', fps: opts.targetFps, sheets: meta.sheets, frames: meta.framesWithPlace }, null, 1));
      sheetsTotal += meta.sheets;
      bytesTotal += (meta.sheetBytes || []).reduce((a2, b2) => a2 + b2, 0);
      sincePart = 0;
      filesSinceFlush = 0;
      framesSinceFlush = 0;
      // 分片后整浏览器重启：新 renderer + 新 WASM 堆（组内 sheet 状态已 flush，重启安全）
      page = await opts.relaunch();
    };
    for (const j of gjobs) {
      const r = opts.results.get(j.slug)!;
      const selected = selectFrames(r.natural || 0, r.fps || opts.targetFps, opts.targetFps, opts.cap).length;
      if (classifyVideoBucket(r.w || 0, r.h || 0, selected, opts.sheetSize)) continue;
      const base = path.basename(j.rel, '.pag');
      const arg = JSON.stringify({
        slug: j.slug, group, base, capFrames: opts.cap, targetFps: opts.targetFps,
        sheetSize: opts.sheetSize, quality: opts.quality, keepWebp,
        verify: verifySlugs.has(j.slug), verifyFrames: 2,
      });
      let res: AtlasFileResult;
      try {
        res = await page.evaluate('window.__bakeAtlas(' + arg + ')') as AtlasFileResult;
      } catch (e) {
        if (/detached|Target closed|Session closed|crash/i.test(String(e))) {
          // 崩溃恢复：整浏览器重启 + 重试一次；上次 flush 后已计数的帧实际丢失 → 扣除并诚实记录
          crashes++;
          framesLost += framesSinceFlush;
          framesPlaced -= framesSinceFlush;
          packed -= filesSinceFlush;
          console.log('  [atlas] crash #' + crashes + ' at ' + j.rel + ' (lost ' + framesSinceFlush + ' frames / ' + filesSinceFlush + ' files) → relaunch & retry once');
          framesSinceFlush = 0; filesSinceFlush = 0;
          try { page = await opts.relaunch(); } catch (e2) { res = { ok: false, error: 'relaunch fail: ' + String(e2).slice(0, 160) }; console.log('  [atlas] ' + JSON.stringify(res)); continue; }
          try { res = await page.evaluate('window.__bakeAtlas(' + arg + ')') as AtlasFileResult; }
          catch (e2) { res = { ok: false, error: String(e2).slice(0, 300) }; }
        } else res = { ok: false, error: String(e).slice(0, 300) };
      }
      if (res.videoBucket) videoBucket.push({ rel: j.rel, group, w: res.w || 0, h: res.h || 0, selected: res.selected || 0, natural: res.natural || 0 });
      if (res.ok && !res.videoBucket) {
        packed++;
        framesPlaced += res.placed || 0;
        groupFramesArea += (res.w || 0) * (res.h || 0) * (res.placed || 0);
        filesSinceFlush++;
        framesSinceFlush += res.placed || 0;
        if (res.diffs && res.diffs.length) verifyRows.push({ rel: j.rel, diffs: res.diffs });
        console.log('  [atlas] ' + j.rel + ' placed=' + res.placed + '/' + res.selected + (res.diffs ? ' diff=' + JSON.stringify(res.diffs.map((d) => d.meanAbsDiff)) : '') + ' ' + res.totalMs + 'ms');
      } else if (!res.ok) console.log('  [atlas] FAIL ' + j.rel + ' ' + JSON.stringify(res).slice(0, 200));
      if (++sincePart >= PART_FILES) {
        try { await flushPart(); }
        catch (e) { console.log('  [atlas] part flush fail (' + String(e).slice(0, 120) + ') → relaunch（该分片 ' + framesSinceFlush + ' 帧丢失）'); crashes++; framesLost += framesSinceFlush; framesPlaced -= framesSinceFlush; packed -= filesSinceFlush; page = await opts.relaunch(); sincePart = 0; filesSinceFlush = 0; framesSinceFlush = 0; }
      }
    }
    if (sincePart > 0) {
      try { await flushPart(); }
      catch (e) { console.log('  [atlas] final flush fail (' + String(e).slice(0, 120) + ') → relaunch（' + framesSinceFlush + ' 帧丢失）'); crashes++; framesLost += framesSinceFlush; framesPlaced -= framesSinceFlush; packed -= filesSinceFlush; page = await opts.relaunch(); }
    }
    groupReports.push({ group, files: gjobs.length, packed, framesPlaced, sheets: sheetsTotal, atlasBytes: bytesTotal, framesArea: groupFramesArea });
    console.log('  [atlas] group "' + group + '" done: ' + packed + '/' + gjobs.length + ' files, ' + framesPlaced + ' frames, ' + sheetsTotal + ' sheets, ' + Math.round(bytesTotal / 1024) + 'KB');
  }

  // 无头满帧基准（验收第 2 条的 headless 代理）——页面可能已被最后的 relaunch 更新
  let bench: { sheets: number; draws: number; msPerFrame: number; totalMs: number };
  try {
    bench = await page.evaluate('window.__benchAtlas({sheets: 3, draws: 900})') as { sheets: number; draws: number; msPerFrame: number; totalMs: number };
  } catch {
    page = await opts.relaunch();
    bench = await page.evaluate('window.__benchAtlas({sheets: 3, draws: 900})') as { sheets: number; draws: number; msPerFrame: number; totalMs: number };
  }

  // 报告
  const maxDiff = Math.max(0, ...verifyRows.flatMap((v) => v.diffs.map((d) => d.meanAbsDiff)));
  const framesPlacedTotal = groupReports.reduce((a2, g) => a2 + g.framesPlaced, 0);
  const sourceFrames = opts.jobs.reduce((a2, j) => a2 + (opts.results.get(j.slug)?.rendered || 0), 0);
  // 理论 sheet 下限：帧总面积 / sheet 面积（碎片化前）
  const totalFrameArea = groupReports.reduce((a2, g) => a2 + g.framesArea, 0);
  const theoreticalSheets = Math.max(1, Math.ceil(totalFrameArea / (opts.sheetSize * opts.sheetSize)));
  const atlasBytesTotal = groupReports.reduce((a2, g) => a2 + g.atlasBytes, 0);
  const samplePagBytes = opts.jobs.reduce((a2, j) => a2 + j.size, 0);
  const scale = samplePagBytes > 0 ? 60.6 * 1024 * 1024 / samplePagBytes : 0;
  const json = {
    tool: 'pack_atlas (P0-3)',
    targetFps: opts.targetFps, sheetSize: opts.sheetSize, webpQuality: opts.quality,
    groups: groupReports, videoBucket, verify: verifyRows, bench,
    totals: {
      filesPacked: groupReports.reduce((a2, g) => a2 + g.packed, 0),
      framesPlaced: framesPlacedTotal,
      sheets: groupReports.reduce((a2, g) => a2 + g.sheets, 0),
      atlasBytes: atlasBytesTotal,
      atlasBytesFullExtrapolated: Math.round(atlasBytesTotal * scale),
      theoreticalSheets: theoreticalSheets,
      totalFrameAreaMP: Number((totalFrameArea / 1e6).toFixed(1)),
      maxRoundTripDiff: Number(maxDiff.toFixed(5)),
      crashes,
      framesLostToCrashes: framesLost,
      bench: bench,
    },
  };
  fsMod.writeFileSync(rootPath('data', 'atlas-report.json'), JSON.stringify(json, null, 2));

  const md = [
    '# ATLAS_REPORT（P0-3 图集打包，' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '）',
    '',
    '> 机器生成：tools/src/bake_pag.ts --atlas + tools/bake/render.html（浏览器内流式 MaxRects 打包）。明细 data/atlas-report.json。',
    '',
    '## 结果',
    '',
    '| 指标 | 值 |',
    '|---|---|',
    '| 降帧策略 | ' + opts.targetFps + 'fps（策略表 12-20 区间中值；selectFrames 步进取帧） |',
    '| 可打包文件 | ' + json.totals.filesPacked + ' / ' + opts.jobs.length + '（视频桶 ' + videoBucket.length + '） |',
    '| 打包帧数 | ' + framesPlacedTotal + '（源 ' + sourceFrames + ' 帧按 ' + opts.targetFps + 'fps 降采样后） |',
    '| 共享图集 | ' + json.totals.sheets + ' 张 ' + opts.sheetSize + '×' + opts.sheetSize + ' WebP（MaxRects-BSSF 在线放置；含 ' + opts.partFiles + ' 文件/分片 relaunch 碎片，理论下限 ' + Math.ceil(json.totals.framesPlaced * 0 + theoreticalSheets) + ' 张，见 totals.theoreticalSheets） |',
    '| 图集总体积 | ' + Math.round(atlasBytesTotal / 1024) + 'KB（' + opts.jobs.length + ' 文件实测；按 PAG 字节等比外推 ≈ ' + Math.round(atlasBytesTotal * scale / 1024 / 1024) + 'MB） |',
    '| 往返像素比对 | ' + verifyRows.length + ' 文件 × 2 帧，maxMeanAbsDiff=' + (maxDiff * 100).toFixed(2) + '%（WebP q=' + opts.quality + ' 有损，<2% 视为一致） |',
    '| 无头满帧基准 | 3 张 2048² 图集 × ' + bench.draws + ' 次子矩形 drawImage：' + bench.msPerFrame + 'ms/帧（headless ANGLE Metal，非真机；60fps 预算 16.7ms 余量 ' + (bench.msPerFrame < 16.7 ? '充足' : '不足') + '） |',
    '| 会话韧性 | renderer 崩溃 ' + crashes + ' 次（libpag VideoReader WASM 堆泄漏，25-35 文件/页必然发生），分片 flush=partFiles 文件/片，丢失帧 ' + framesLost + '（已从统计扣除） |',
    '',
    '## 视频桶（超大件，' + videoBucket.length + ' 个）',
    '',
    '单帧最长边 > sheetSize/2（无法 2×2 平铺，占用率必然 <50%）或单帧 >1MP 或降采样后面积 >6 张 sheet → 转 mp4 远端视频（三级策略第 3 级）。环境无 ffmpeg，转换记 RUNTIME_REQUIRED。',
    '',
    '| 文件 | 组 | 尺寸 | 降采样后帧数 |',
    '|---|---|---|---|',
    ...videoBucket.map((v) => '| ' + v.rel + ' | ' + v.group + ' | ' + v.w + '×' + v.h + ' | ' + v.selected + ' |'),
    '',
    '## 分组统计',
    '',
    '| 组 | 文件 | 打包 | 帧数 | sheets | 体积 |',
    '|---|---|---|---|---|---|',
    ...groupReports.map((g) => '| ' + g.group + ' | ' + g.files + ' | ' + g.packed + ' | ' + g.framesPlaced + ' | ' + g.sheets + ' | ' + Math.round(g.atlasBytes / 1024) + 'KB |'),
    '',
    '## 往返像素比对明细（打包→WebP→回抠 vs 直渲）',
    '',
    '| 文件 | meanAbsDiff（×帧） |',
    '|---|---|',
    ...verifyRows.map((v) => '| ' + v.rel + ' | ' + v.diffs.map((d) => (d.meanAbsDiff * 100).toFixed(2) + '%').join(', ') + ' |'),
    '',
    '## 产物',
    '',
    '- evidence/atlas_samples/：keep 组图集 + meta（入库）',
    '- game-assets/atlas/launch_click/：微信包 demo 图集（构建器按形态 A 并入 manifest）',
    '- tools/bake/out/atlas/：全部组图集 + meta（临时，不入库）',
    '',
  ];
  fsMod.writeFileSync(rootPath('docs', 'ATLAS_REPORT.md'), md.join('\n'));
  console.log('atlas phase done: ' + json.totals.filesPacked + ' files, ' + framesPlacedTotal + ' frames, ' + json.totals.sheets + ' sheets, bench ' + bench.msPerFrame + 'ms/frame');
}

interface VideoRow { rel: string; group: string; w: number; h: number; frames: number; fps: number; mp4Bytes: number; encodeMs: number; mp4: string }

/**
 * P1 视频桶 mp4 阶段（--video-only）：复用 bake 报告定位超大件 → __bakeOne 渲染 PNG 帧（keep 落盘）
 * → ffmpeg H.264 (yuv420p CRF23 faststart) 逐文件编码 → 帧目录即弃。帧率 = min(源fps, 30)。
 * 选型记录（6 维）：ffmpeg-static npm 包因 github release 下载 30s 超时不可用，改用 evermeet.cx 静态包
 * （tools/bin/ffmpeg，gitignored；GPL 二进制仅内部工具使用，不入库不随 ZIP 分发）。
 */
async function runVideoPhase(opts: {
  page: any; jobs: FileJob[]; results: Map<string, BakeResult>; out: string;
  cap: number; targetFps: number; sheetSize: number; relaunch: () => Promise<any>; ffmpegPath: string;
}): Promise<void> {
  const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
  const { selectFrames, classifyVideoBucket } = await dynImport(url.pathToFileURL(rootPath('tools', 'bake', 'maxrects.mjs')).href);
  let page = opts.page;
  const videoJobs: FileJob[] = [];
  for (const j of opts.jobs) {
    const r = opts.results.get(j.slug);
    if (!r || !r.ok) continue;
    const selected = selectFrames(r.natural || 0, r.fps || opts.targetFps, opts.targetFps, opts.cap).length;
    if (classifyVideoBucket(r.w || 0, r.h || 0, selected, opts.sheetSize)) videoJobs.push(j);
  }
  console.log('[video] bucket jobs: ' + videoJobs.length);
  const rows: VideoRow[] = [];
  const failed: Array<{ rel: string; error: string }> = [];
  let crashes = 0;
  for (let i = 0; i < videoJobs.length; i++) {
    const j = videoJobs[i];
    const r = opts.results.get(j.slug)!;
    const base = path.basename(j.rel, '.pag');
    const arg = JSON.stringify({ slug: j.slug, capFrames: opts.cap, quality: 0.8, wantPng: true, wantWebp: false, keep: true });
    let res: BakeResult;
    try {
      res = await page.evaluate('window.__bakeOne(' + arg + ')') as BakeResult;
    } catch (e) {
      if (/detached|Target closed|Session closed|crash/i.test(String(e))) {
        crashes++;
        console.log('  [video] crash at ' + j.rel + ' → relaunch & retry once');
        try { page = await opts.relaunch(); } catch (e2) { failed.push({ rel: j.rel, error: 'relaunch fail: ' + String(e2).slice(0, 140) }); continue; }
        try { res = await page.evaluate('window.__bakeOne(' + arg + ')') as BakeResult; }
        catch (e2) { res = { ok: false, error: String(e2).slice(0, 200) }; }
      } else res = { ok: false, error: String(e).slice(0, 200) };
    }
    if (!res.ok) { failed.push({ rel: j.rel, error: res.error || 'bake fail' }); console.log('  [video] FAIL ' + j.rel + ' ' + JSON.stringify(res).slice(0, 160)); continue; }
    const framesDir = path.join(opts.out, j.slug);
    let pngs: string[] = [];
    try { pngs = fs.readdirSync(framesDir).filter((f) => f.endsWith('.png')).sort(); } catch { pngs = []; }
    if (!pngs.length) { failed.push({ rel: j.rel, error: 'no frames written' }); continue; }
    // 上传帧序号可能有缺口（浏览器端 blank 帧跳过）——image2 demuxer 要求连续序列，重编号到 seq/ 子目录
    const seqDir = path.join(framesDir, 'seq');
    fs.mkdirSync(seqDir, { recursive: true });
    pngs.forEach((f, fi) => fs.renameSync(path.join(framesDir, f), path.join(seqDir, 'frame_' + String(fi).padStart(5, '0') + '.png')));
    const fps = Math.min(30, Math.max(1, Math.round(r.fps || 25)));
    const mp4Dir = path.join(opts.out, 'video', j.group);
    fs.mkdirSync(mp4Dir, { recursive: true });
    const mp4Path = path.join(mp4Dir, base + '.mp4');
    const te = Date.now();
    try {
      // yuv420p 要求宽高为偶数：源帧常为 1125 等奇数宽 → crop 取偶（最多裁 1px）
      execFileSync(opts.ffmpegPath, ['-y', '-framerate', String(fps), '-start_number', '0', '-i', path.join(seqDir, 'frame_%05d.png'), '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', mp4Path], { timeout: 300000 });
    } catch (e) {
      const errTail = String((e as any)?.stderr || (e as any)?.message || e).replace(/\s+/g, ' ').slice(-220);
      failed.push({ rel: j.rel, error: 'ffmpeg: ' + errTail });
      fs.rmSync(framesDir, { recursive: true, force: true });
      continue;
    }
    const encodeMs = Date.now() - te;
    const mp4Bytes = fs.statSync(mp4Path).size;
    rows.push({ rel: j.rel, group: j.group, w: res.w || 0, h: res.h || 0, frames: pngs.length, fps, mp4Bytes, encodeMs, mp4: path.relative(rootPath(), mp4Path) });
    fs.rmSync(framesDir, { recursive: true, force: true }); // 帧即弃：mp4 是交付物
    console.log('  [video] ' + (i + 1) + '/' + videoJobs.length + ' ok ' + j.rel + ' ' + pngs.length + 'f@' + fps + ' ' + Math.round(mp4Bytes / 1024) + 'KB ' + encodeMs + 'ms');
  }
  // 报告 + 样本（最小 + 中位，入库）
  const totalBytes = rows.reduce((a, r) => a + r.mp4Bytes, 0);
  const json = {
    tool: 'video_phase (P1 mp4)', ffmpeg: opts.ffmpegPath, crf: 23,
    bucketJobs: videoJobs.length, encoded: rows.length, failedCount: failed.length, crashes,
    totalBytes,
    note: 'H.264 yuv420p CRF23 +faststart；帧率=min(源fps,30)；帧目录编码后即弃。二进制为 evermeet.cx 静态包（GPL，仅内部使用）。',
    rows, failed,
  };
  fs.writeFileSync(rootPath('data', 'video-report.json'), JSON.stringify(json, null, 2));
  const bySize = [...rows].sort((a, b) => a.mp4Bytes - b.mp4Bytes);
  const picks = bySize.length ? [bySize[0], bySize[Math.floor(bySize.length / 2)]] : [];
  const evd = rootPath('evidence', 'video_samples');
  fs.rmSync(evd, { recursive: true, force: true });
  fs.mkdirSync(evd, { recursive: true });
  for (const r of picks) fs.copyFileSync(path.join(rootPath(), r.mp4), path.join(evd, path.basename(r.rel, '.pag') + '.mp4'));
  console.log('video phase done: ' + rows.length + '/' + videoJobs.length + ' encoded, ' + Math.round(totalBytes / 1048576) + 'MB total, crashes ' + crashes + ', failed ' + failed.length);
}

async function main(): Promise<void> {
  const opts = parseArgs();
  if (!fs.existsSync(opts.chrome)) { console.error('chrome not found: ' + opts.chrome); process.exit(2); }
  // 长跑韧性：未捕获异常只记录不终止（批处理工具，单文件失败已按文件计数）
  process.on('uncaughtException', (e) => console.error('[uncaught]', String(e && (e as Error).stack || e).slice(0, 400)));
  process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', String(e).slice(0, 400)));
  const jobs: FileJob[] = [];
  // 支持多根目录（逗号分隔）：全量跑 assets/pag + tug/blockBattleRoyal 等特征目录，rel 加根名前缀防跨根歧义
  for (const root of opts.samples.split(',').map((s) => s.trim()).filter(Boolean)) {
    const tag = path.basename(root);
    walkPag(root, root, jobs, tag);
  }
  jobs.forEach((j, i) => { j.slug = 'f' + String(i).padStart(3, '0'); });
  if (!jobs.length) { console.error('no .pag samples under ' + opts.samples); process.exit(2); }

  // keep 抽样：最大 1 个（最坏体积）+ launch_click（典型 UI 特效，若在样本内）
  const sortedBySize = [...jobs].sort((a, b) => b.size - a.size);
  const keepJobs: FileJob[] = [sortedBySize[0]];
  const click = jobs.find((j) => j.rel.includes('launch_click'));
  if (click && !keepJobs.includes(click)) keepJobs.push(click);
  const keepSet = new Set(keepJobs.map((j) => j.slug));

  fs.rmSync(opts.out, { recursive: true, force: true });
  fs.mkdirSync(opts.out, { recursive: true });

  const server = await startServer({
    renderHtml: rootPath('tools', 'bake', 'render.html'),
    libpagJs: rootPath('node_modules', 'libpag', 'lib', 'libpag.umd.js'),
    libpagWasm: rootPath('node_modules', 'libpag', 'lib', 'libpag.wasm'),
    jobs: jobs,
    out: opts.out,
  });

  let browser = await puppeteer.launch({
    executablePath: opts.chrome,
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
  });
  const openPage = async (): Promise<any> => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    page.setDefaultTimeout(120000);
    page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn') console.error('[console.' + m.type() + ']', m.text().slice(0, 200)); });
    page.on('requestfailed', (r) => console.error('[requestfailed]', r.url().slice(-60), r.failure()?.errorText));
    await page.goto('http://127.0.0.1:' + server.port + '/render.html', { waitUntil: 'load' });
    await page.waitForFunction('window.__pagReady === true || !!window.__bootError', { polling: 250, timeout: 60000 });
    const bootErr = await page.evaluate('window.__bootError || null');
    if (bootErr) { console.error('libpag boot failed:', bootErr); await browser.close(); server.close(); process.exit(3); }
    return page;
  };
  let page = await openPage();
  const t0 = Date.now();

  const hasBake = await page.evaluate('typeof window.__bakeOne === "function" && window.__pagReady === true');
  if (!hasBake) {
    console.error('bakeOne missing; pagReady=' + (await page.evaluate('!!window.__pagReady')) + ' bootError=' + (await page.evaluate('window.__bootError || null')));
  }
  const results = new Map<string, BakeResult>();
  if (opts.atlasOnly || opts.videoOnly) {
    // --atlas-only / --video-only：跳过 P0-2 渲染段，复用入库的 data/bake-report.json（rows 顺序与 jobs 一致）
    const prior = JSON.parse(fs.readFileSync(rootPath('data', 'bake-report.json'), 'utf8'));
    prior.rows.forEach((row: any, i: number) => {
      results.set(jobs[i].slug, { ok: !!row.ok, error: row.error, w: row.w, h: row.h, fps: row.fps, natural: row.natural, rendered: row.rendered, pngBytes: row.pngBytes, webpBytes: row.webpBytes });
    });
    console.log('[atlas-only] loaded prior bake results: ' + prior.ok + '/' + prior.sampleFiles + ' ok');
  }
  for (let i = 0; i < jobs.length && !(opts.atlasOnly || opts.videoOnly); i++) {
    const job = jobs[i];
    const args: BakeArgs = { slug: job.slug, capFrames: opts.cap, quality: opts.quality, wantPng: true, wantWebp: true, keep: keepSet.has(job.slug) };
    let r: BakeResult;
    try {
      r = await page.evaluate('window.__bakeOne(' + JSON.stringify(args) + ')') as BakeResult;
    } catch (e) { r = { ok: false, error: String(e).slice(0, 300) }; }
    results.set(job.slug, r);
    const tag = r.ok ? 'ok' : 'FAIL';
    console.log('[' + (i + 1) + '/' + jobs.length + '] ' + tag + ' ' + job.rel + (r.ok ? ' ' + r.w + 'x' + r.h + ' frames=' + r.rendered + '/' + r.natural + ' png=' + Math.round((r.pngBytes || 0) / 1024) + 'KB webp=' + Math.round((r.webpBytes || 0) / 1024) + 'KB ' + r.totalMs + 'ms' : ' ' + JSON.stringify(r).slice(0, 300)));
  }
  const wallMs = Date.now() - t0;
  if (!(opts.atlasOnly || opts.videoOnly)) await browser.close();
  else { /* --atlas-only/--video-only: 浏览器留给后续阶段复用 */ }
  if (opts.videoOnly) {
    console.log('--- video phase (P1 mp4): crf=23 faststart ---');
    const relaunch = async (): Promise<any> => {
      try { await browser.close(); } catch { /* 已死 */ }
      await new Promise((r) => setTimeout(r, 800));
      if (!server.isAlive()) {
        console.log('  [video] http server dead → restarting listener');
        await server.restart();
      }
      browser = await puppeteer.launch({
        executablePath: opts.chrome, headless: true,
        args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
      });
      return openPage();
    };
    await runVideoPhase({ page, jobs, results, out: opts.out, cap: opts.cap, targetFps: opts.targetFps, sheetSize: opts.sheetSize, relaunch, ffmpegPath: opts.ffmpeg });
    await browser.close();
    server.close();
    return;
  }
  if (opts.atlasOnly) {
    // atlas-only 模式直接进入图集阶段
    console.log('--- atlas phase (P0-3): targetFps=' + opts.targetFps + ' sheet=' + opts.sheetSize + ' ---');
    const keepGroups = new Set(keepJobs.map((j) => j.group));
    const relaunch = async (): Promise<any> => {
      try { await browser.close(); } catch { /* 已死 */ }
      await new Promise((r) => setTimeout(r, 800)); // 给 GPU/渲染进程退出留时间
      if (!server.isAlive()) {
        console.log('  [atlas] http server dead → restarting listener');
        await server.restart();
      }
      browser = await puppeteer.launch({
        executablePath: opts.chrome, headless: true,
        args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
      });
      return openPage();
    };
    await runAtlasPhase({ page, jobs, results, out: opts.out, cap: opts.cap, quality: opts.quality, targetFps: opts.targetFps, sheetSize: opts.sheetSize, keepGroups, partFiles: opts.partFiles, relaunch });
    await emitAtlasArtifacts(opts, keepGroups);
    await browser.close();
    server.close();
    return;
  }
  server.close();

  // 60.6MB / 535 文件（docs/ASSET_MIGRATION.md Section 14 口径）
  const report = writeReports({
    out: opts.out, cap: opts.cap, quality: opts.quality, chrome: opts.chrome,
    jobs: jobs, results: results, keepSet: keepSet,
    pagTotalBytesInApk: 60.6 * 1024 * 1024, wallMs: wallMs,
  });

  // kept 抽样 → evidence/bake_samples/ + 形态 B manifest（AssetManager 可直接接入）
  const bakeSamples = rootPath('evidence', 'bake_samples');
  fs.rmSync(bakeSamples, { recursive: true, force: true });
  const manifest = { version: 'bake-spike-' + Date.now(), base: '', atlases: [] as Array<Record<string, unknown>> };
  for (const job of keepJobs) {
    const srcDir = path.join(opts.out, job.slug);
    const dst = path.join(bakeSamples, job.group, path.basename(job.rel, '.pag'));
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(dst, { recursive: true });
      for (const f of fs.readdirSync(srcDir)) fs.copyFileSync(path.join(srcDir, f), path.join(dst, f));
      const frames: Array<Record<string, unknown>> = fs.readdirSync(dst).filter((f) => f.endsWith('.webp')).sort()
        .map((f) => ({ name: path.basename(f, path.extname(f)), file: f, w: 0, h: 0 }));
      let bytes = 0;
      for (const f of fs.readdirSync(dst)) bytes += fs.statSync(path.join(dst, f)).size;
      // 形态 B 的 w/h 用渲染结果回填（真实输出尺寸）
      const r = results.get(job.slug)!;
      for (const fr of frames) { fr.w = r.w || 0; fr.h = r.h || 0; }
      manifest.base = 'assets/game/';
      manifest.atlases.push({
        id: path.basename(job.rel, '.pag'),
        frames: frames,
        fps: Math.min(20, Math.max(12, Math.round(r.fps || 15))),
        bytes: bytes,
        hash: sha256(job.abs),
        bake: { source: 'evidence/apk_assets_sample/assets/pag/' + job.rel, framesDir: path.relative(rootPath(), dst) },
      });
    }
  }
  fs.writeFileSync(path.join(bakeSamples, 'baked.manifest.json'), JSON.stringify(manifest, null, 2));

  const okCount = [...results.values()].filter((r) => r.ok).length;
  console.log('bake spike done: ' + okCount + '/' + jobs.length + ' ok, wall ' + Math.round(wallMs / 1000) + 's');
  console.log('report: ' + report.jsonPath);
  console.log('report: ' + report.mdPath);
  if (okCount < jobs.length) process.exit(1);

  // ==================== P0-3 图集阶段（--atlas，与 P0-2 同会话续跑） ====================
  if (!opts.atlas) return;
  console.log('--- atlas phase (P0-3): targetFps=' + opts.targetFps + ' sheet=' + opts.sheetSize + ' ---');
  const keepGroups = new Set(keepJobs.map((j) => j.group));
  const relaunch = async (): Promise<any> => {
    try { await browser.close(); } catch { /* 已死 */ }
    if (!server.isAlive()) {
      console.log('  [atlas] http server dead → restarting listener');
      await server.restart();
    }
    browser = await puppeteer.launch({
      executablePath: opts.chrome, headless: true,
      args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
    });
    return openPage();
  };
  await runAtlasPhase({ page, jobs, results, out: opts.out, cap: opts.cap, quality: opts.quality, targetFps: opts.targetFps, sheetSize: opts.sheetSize, keepGroups, partFiles: opts.partFiles, relaunch });
  await emitAtlasArtifacts(opts, keepGroups);
  await browser.close();
}

/** 图集产物发射：demo 组 → game-assets/atlas/（微信包形态 A）；keep 组 → evidence/atlas_samples/ */
async function emitAtlasArtifacts(opts: { out: string }, keepGroups: Set<string>): Promise<void> {
  // 多根目录模式下组名带根前缀（如 pag/marbles），按 basename 匹配 demo 组
  let demoDir: string | null = null;
  const atlasRoot = path.join(opts.out, 'atlas');
  if (fs.existsSync(atlasRoot)) {
    for (const d of fs.readdirSync(atlasRoot)) {
      if (path.basename(d) === 'marbles' && fs.existsSync(path.join(atlasRoot, d)) && fs.readdirSync(path.join(atlasRoot, d)).some((f) => f.includes('.meta.part'))) { demoDir = path.join(atlasRoot, d); break; }
    }
  }
  if (demoDir) {
    const dstRoot = rootPath('game-assets', 'atlas', 'marbles');
    fs.rmSync(dstRoot, { recursive: true, force: true });
    fs.mkdirSync(dstRoot, { recursive: true });
    for (const f of fs.readdirSync(demoDir, { withFileTypes: true })) {
      if (!f.isFile()) continue; // 嵌套组目录只拷文件（子目录是更深的组，非本组产物）
      fs.copyFileSync(path.join(demoDir, f.name), path.join(dstRoot, f.name));
    }
    console.log('demo atlas emitted → game-assets/atlas/marbles/');
  }
  const atlasSamples = rootPath('evidence', 'atlas_samples');
  fs.rmSync(atlasSamples, { recursive: true, force: true });
  for (const g of keepGroups) {
    const src = path.join(opts.out, 'atlas', g);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(atlasSamples, g.replace(/\//g, '__'));
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src, { withFileTypes: true })) {
      if (!f.isFile()) continue;
      fs.copyFileSync(path.join(src, f.name), path.join(dst, f.name));
    }
  }
  console.log('atlas samples → evidence/atlas_samples/');
}

main().catch((e) => { console.error(e); process.exit(1); });
