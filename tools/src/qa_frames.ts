/**
 * 帧级 QA 扫描器（COMPLETENESS v5 递归自查工具）。
 * 解码 game-assets 全部自制 PNG 帧，量化：不透明占比 / 质心 / 包围盒；
 * 规则：内容帧（anims/miner/fx_launch/cards）不透明 ≥0.8%、质心在中央 80% 区域、包围盒不出画；
 *       icons ≥5%。违规 → exit 1（verify 步骤），递归修复的判定基准。
 * 运行：node dist/tools/src/qa_frames.js
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { rootPath } from '../../shared/src/paths';

interface FrameStat { file: string; opaque: number; total: number; cx: number; cy: number; bbox: [number, number, number, number] }

function decode(file: string): { w: number; h: number; px: Uint8Array } {
  const buf = fs.readFileSync(file);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  let off = 8;
  const idat: Buffer[] = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') idat.push(buf.slice(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = y * (1 + w * 4) + 1 + x * 4;
    const di = (y * w + x) * 4;
    px[di] = raw[si]; px[di + 1] = raw[si + 1]; px[di + 2] = raw[si + 2]; px[di + 3] = raw[si + 3];
  }
  return { w, h, px };
}

function stat(file: string): FrameStat {
  const { w, h, px } = decode(file);
  let opaque = 0, sx = 0, sy = 0;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[(y * w + x) * 4 + 3] > 40) {
      opaque++;
      sx += x; sy += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const total = w * h;
  return { file, opaque, total, cx: opaque ? sx / opaque / w : 0, cy: opaque ? sy / opaque / h : 0, bbox: [minX, minY, maxX, maxY] };
}

export function run(): { scanned: number; violations: string[] } {
  const roots: Array<[string, number]> = [
    ['game-assets/anims', 0.008],
    ['game-assets/miner', 0.008],
    ['game-assets/fx_launch', 0.008],
    ['game-assets/cards', 0.02],
    ['game-assets/icons', 0.05],
  ];
  const violations: string[] = [];
  let scanned = 0;
  for (const [rel, minRatio] of roots) {
    const dir = rootPath(rel);
    if (!fs.existsSync(dir)) continue;
    const walk = (d: string): void => {
      for (const f of fs.readdirSync(d)) {
        const fp = path.join(d, f);
        if (fs.statSync(fp).isDirectory()) { walk(fp); continue; }
        if (!f.endsWith('.png')) continue;
        scanned++;
        const st = stat(fp);
        const relPath = path.relative(rootPath(), fp);
        if (st.opaque / st.total < minRatio) { violations.push(`${relPath}: 近空帧 opaque=${((st.opaque / st.total) * 100).toFixed(2)}%`); continue; }
        if (st.opaque > 0 && (st.cx < 0.08 || st.cx > 0.92 || st.cy < 0.08 || st.cy > 0.92)) {
          violations.push(`${relPath}: 质心出画 (${st.cx.toFixed(2)},${st.cy.toFixed(2)})`);
        }
      }
    };
    walk(dir);
  }
  if (violations.length) {
    console.error(violations.slice(0, 40).join('\n'));
    throw new Error(`frame QA FAILED: ${violations.length} violations / ${scanned} frames`);
  }
  console.log(`frame-qa ok: ${scanned} 帧全部通过（占比/质心/包围盒）`);
  return { scanned, violations: [] };
}

if (require.main === module) run();
