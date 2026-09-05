/**
 * 自制替代素材生成器（SANITIZATION_ASSESSMENT P0-1 处置）。
 * 用纯 JS 像素缓冲 + zlib 生成完全自有的矿工挖矿帧序列 PNG（64×64×8 帧），
 * 替代原 APK 提取帧。零第三方/原版内容；生成器即出处。
 * 运行：node dist/tools/src/gen_placeholder_art.js
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { rootPath } from '../../shared/src/paths';

// ---------- 最小 PNG 编码器（真彩 RGBA，无压缩过滤花样：每行 filter 0） ----------
function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (1 + width * 4) + 1 + x * 4;
      raw[di] = rgba[si]; raw[di + 1] = rgba[si + 1]; raw[di + 2] = rgba[si + 2]; raw[di + 3] = rgba[si + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 自有矿工形象（几何构图：安全帽+工装+镐摆动，逐帧相位） ----------
const W = 64, H = 64;

function put(buf: Uint8Array, x: number, y: number, r: number, g: number, b: number, a = 255): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}
function rect(buf: Uint8Array, x0: number, y0: number, w: number, h: number, c: [number, number, number]): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(buf, x, y, c[0], c[1], c[2]);
}
function disc(buf: Uint8Array, cx: number, cy: number, rad: number, c: [number, number, number]): void {
  for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
    for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) put(buf, x, y, c[0], c[1], c[2]);
    }
  }
}
function line(buf: Uint8Array, x0: number, y0: number, x1: number, y1: number, w: number, c: [number, number, number]): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    disc(buf, x, y, w / 2, c);
  }
}

const SKIN: [number, number, number] = [244, 176, 132];
const HELMET: [number, number, number] = [255, 179, 32];
const SUIT: [number, number, number] = [46, 92, 138];
const PICK: [number, number, number] = [120, 124, 134];
const HANDLE: [number, number, number] = [146, 102, 60];
const ORE: [number, number, number] = [80, 200, 220];

/** frame 相位 0..7：镐从举起到落下的弧线 + 矿石闪光 */
function minerFrame(phase: number): Uint8Array {
  const buf = new Uint8Array(W * H * 4);
  // 背景：透明（客户端叠加在面板上）
  // 腿
  rect(buf, 26, 46, 5, 12, SUIT);
  rect(buf, 34, 46, 5, 12, SUIT);
  // 身体
  rect(buf, 23, 28, 19, 19, SUIT);
  rect(buf, 23, 40, 19, 3, [36, 70, 105]); // 腰带
  // 头 + 安全帽
  disc(buf, 32.5, 20, 8, SKIN);
  rect(buf, 23, 12, 19, 6, HELMET);
  disc(buf, 32.5, 12, 9, HELMET);
  rect(buf, 30, 8, 5, 5, HELMET); // 帽灯
  // 眼睛
  put(buf, 36, 20, 30, 34, 46); put(buf, 37, 20, 30, 34, 46);
  // 手臂 + 镐（弧线摆动：phase 0 举起 → 7 落下）
  const t = phase / 8;
  const ang = -2.1 + t * 2.4; // 弧度
  const sx = 42, sy = 32; // 肩
  const hx = sx + Math.cos(ang) * 14, hy = sy + Math.sin(ang) * 14;
  line(buf, sx, sy, hx, hy, 4, SUIT);
  // 镐柄（从手向外延伸）
  const px2 = hx + Math.cos(ang + 0.5) * 16, py2 = hy + Math.sin(ang + 0.5) * 16;
  line(buf, hx, hy, px2, py2, 3, HANDLE);
  // 镐头
  line(buf, px2 + Math.cos(ang - 1.2) * 6, py2 + Math.sin(ang - 1.2) * 6, px2 + Math.cos(ang + 0.9) * 6, py2 + Math.sin(ang + 0.9) * 6, 3, PICK);
  // 落镐帧（6-7）在右下画矿石 + 火花
  if (phase >= 6) {
    disc(buf, 50, 55, 4, ORE);
    if (phase === 7) {
      line(buf, 50, 55, 58, 47, 1, [255, 255, 255]);
      line(buf, 50, 55, 44, 60, 1, [255, 255, 255]);
    }
  }
  return buf;
}

export function generate(): void {
  const outDir = rootPath('game-assets', 'miner');
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < 8; i++) {
    const png = encodePNG(W, H, minerFrame(i));
    fs.writeFileSync(path.join(outDir, `f0${i}.png`), png);
  }
  console.log('[gen_placeholder_art] 8 self-made miner frames → game-assets/miner/ (64x64 PNG, procedurally drawn)');
}

if (require.main === module) generate();
