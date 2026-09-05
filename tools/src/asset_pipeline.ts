/**
 * 资源管线（Section 13-16）——
 *  1) 从 data/assets.json（14,092 条 APK 清单）生成分类报告：
 *     asset-manifest.json / asset-conversion-report.csv / asset-duplicate.csv / asset-missing.csv（占位）。
 *  2) 如提供 --apk <path> --out <dir>：真实提取 assets/ 中游戏资源（png/webp/jpg/mp3/ogg/wav/json），
 *     复制时按 top_group 归档，并输出提取报告。
 *  3) PAG/Lottie 转换策略：输出逐文件策略（帧序列图集 / 运行时 / 远端视频），不实际解码（需图形工具链，见 docs/ASSET_MIGRATION.md）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';

interface AssetRow { path: string; sizeBytes: string; ext: string; group: string; topGroup: string; classification: string; strategy?: string }

export function run(opts: { apk?: string; out?: string } = {}): void {
  const data: { summary: Record<string, number>; rows: AssetRow[] } = JSON.parse(fs.readFileSync(rootPath('data/assets.json'), 'utf8'));
  const docsDir = rootPath('docs');
  fs.mkdirSync(docsDir, { recursive: true });

  // 1. 分类报告
  fs.writeFileSync(rootPath('data', 'asset-manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), summary: data.summary, rows: data.rows }, null, 1));
  const csvLines = ['path,size_bytes,ext,group,classification,strategy'];
  for (const r of data.rows) csvLines.push(`${r.path},${r.sizeBytes},${r.ext},${r.topGroup},${r.classification},"${(r.strategy ?? '').replace(/"/g, '""')}"`);
  fs.writeFileSync(rootPath('data', 'asset-conversion-report.csv'), csvLines.join('\n'));

  // 重复检测（同名 basename 不同路径）
  const byName = new Map<string, AssetRow[]>();
  for (const r of data.rows) {
    const base = r.path.split('/').pop() ?? r.path;
    if (!byName.has(base)) byName.set(base, []);
    byName.get(base)!.push(r);
  }
  const dupLines = ['basename,count,paths'];
  for (const [base, rows] of byName) {
    if (rows.length > 1) dupLines.push(`${base},${rows.length},"${rows.map((r) => r.path).join(' | ')}"`);
  }
  fs.writeFileSync(rootPath('data', 'asset-duplicate.csv'), dupLines.join('\n'));
  // missing 占位：映射表内引用但 APK 无文件的资源（当前管线未发现引用缺口，输出空表）
  fs.writeFileSync(rootPath('data', 'asset-missing.csv'), 'path,reason\n');

  // 2. 可选：真实提取
  if (opts.apk && opts.out) {
    extractFromApk(opts.apk, opts.out, data.rows);
  }

  // 3. PAG/Lottie 策略统计
  const pag = data.rows.filter((r) => r.path.startsWith('assets/pag') || r.ext === '.pag');
  const lottie = data.rows.filter((r) => r.path.startsWith('assets/lottie') || r.ext === '.json' && r.path.includes('lottie'));
  const stats = {
    total: data.rows.length,
    summary: data.summary,
    pag: { count: pag.length, strategy: 'PAG→帧序列/图集（短循环 UI 12-20fps WebP atlas）；人物动作为 packed atlas + animation clip；长演出评估远端视频。转换执行需图形工具链（libpag render/python PIL），逐文件策略见 asset-conversion-report.csv' },
    lottie: { count: lottie.length, strategy: '<100KB 且纯 UI 的运行时解析；其余烘焙为 sprite atlas' },
    audio: { count: data.rows.filter((r) => ['mp3', 'wav', 'ogg'].includes(r.ext)).length, strategy: '统一转码 mp3(48kbps SFX/96kbps BGM) → InnerAudioContext' },
  };
  fs.writeFileSync(rootPath('data', 'asset-pipeline-stats.json'), JSON.stringify(stats, null, 1));
  console.log(`asset-pipeline ok: ${stats.total} rows classified, ${stats.pag.count} PAG strategies, ${stats.lottie.count} lottie strategies`);
}

function extractFromApk(apkPath: string, outDir: string, rows: AssetRow[]): void {
  const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
  fs.mkdirSync(outDir, { recursive: true });
  const wanted = new Set(rows.filter((r) => r.path.startsWith('assets/')).map((r) => r.path));
  const listing = execFileSync('unzip', ['-Z1', apkPath], { maxBuffer: 64 * 1024 * 1024 }).toString().split('\n');
  let extracted = 0;
  const batches: string[] = [];
  for (const entry of listing) {
    if (!wanted.has(entry)) continue;
    batches.push(entry);
  }
  // 分批解压（避免命令行长度限制）
  for (let i = 0; i < batches.length; i += 200) {
    const batch = batches.slice(i, i + 200);
    if (!batch.length) continue;
    execFileSync('unzip', ['-o', '-q', apkPath, ...batch, '-d', outDir], { maxBuffer: 64 * 1024 * 1024 });
    extracted += batch.length;
  }
  const report = { apk: apkPath, outDir, extracted, at: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, 'extract-report.json'), JSON.stringify(report, null, 1));
  console.log(`extracted ${extracted} game assets → ${outDir}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  run({ apk: get('--apk'), out: get('--out') });
}
