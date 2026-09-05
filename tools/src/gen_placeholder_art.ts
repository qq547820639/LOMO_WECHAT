/**
 * 自有像素美术工坊（SANITIZATION_ASSESSMENT P0-1 处置 · 精绘版）。
 *
 * 工艺（经典 pixel-art 管线，全部代码实现，零外部素材）：
 *   1. 材质三阶色阶：每种材质定义 高光/基色/暗部 三色 + 全局描边色；
 *   2. 骨骼姿态系统：每帧手调参数（躯干倾角/手臂角度/镐旋转/腿部开合/岩石状态/尘土/矿石）；
 *   3. 造型原语：锥形肢干、圆颅、头盔沿、镐刃面 —— 带 1px 内高光与暗部；
 *   4. 后处理三连：上缘提亮（光源自左上）→ 下缘压暗 → 轮廓自动描边（经典 pixel-art 告示）；
 *   5. 2× 最近邻放大输出（48→96px），并对 marbles 发射特效逐帧手排爆点构图。
 *
 * 槽位：game-assets/miner/f00–07.png（96×96）· game-assets/fx_launch/f00–05.png（96×96）
 * 预览拼板：docs/ART_PREVIEW.png（自制，随仓库）
 * 运行：node dist/tools/src/gen_placeholder_art.js
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { rootPath } from '../../shared/src/paths';

// ================= PNG 编码 =================
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
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (1 + width * 4) + 1 + x * 4;
      raw[di] = rgba[si]; raw[di + 1] = rgba[si + 1]; raw[di + 2] = rgba[si + 2]; raw[di + 3] = rgba[si + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ================= 调色板（三阶色阶） =================
type RGB = [number, number, number];
interface Ramp { hi: RGB; base: RGB; lo: RGB }
const R = {
  skin: { hi: [255, 214, 178], base: [235, 172, 132], lo: [196, 130, 94] } as Ramp,
  helmet: { hi: [255, 226, 120], base: [246, 178, 40], lo: [198, 126, 22] } as Ramp,
  lamp: { hi: [255, 255, 240], base: [255, 232, 150], lo: [230, 180, 80] } as Ramp,
  suit: { hi: [116, 164, 210], base: [62, 108, 158], lo: [38, 72, 112] } as Ramp,
  steel: { hi: [228, 234, 244], base: [164, 172, 190], lo: [104, 110, 130] } as Ramp,
  wood: { hi: [188, 138, 84], base: [150, 104, 58], lo: [108, 72, 40] } as Ramp,
  ore: { hi: [170, 245, 255], base: [72, 206, 230], lo: [30, 148, 180] } as Ramp,
  rock: { hi: [164, 158, 150], base: [124, 118, 110], lo: [88, 82, 76] } as Ramp,
  dust: { hi: [238, 238, 246], base: [198, 198, 212], lo: [156, 156, 176] } as Ramp,
  boot: { hi: [116, 82, 54], base: [84, 58, 38], lo: [58, 40, 26] } as Ramp,
  glove: { hi: [170, 122, 74], base: [136, 94, 56], lo: [100, 68, 40] } as Ramp,
};
const OUTLINE: RGB = [28, 22, 40];
export function hsl(h: number, sat: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rampOf(base: RGB): Ramp {
  const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const WHITE: RGB = [255, 255, 250], DARK: RGB = [24, 18, 36];
  return { hi: mix(base, WHITE, 0.45), base, lo: mix(base, DARK, 0.42) };
}
const SPARK: RGB = [255, 255, 255];
const SPARK2: RGB = [255, 214, 96];

// ================= 画布 + 材质缓冲 =================
const W = 48, H = 48;
class Canvas {
  px: Uint8Array;
  mat: Int8Array;
  constructor(public W: number, public H: number, public mats: Ramp[]) {
    this.px = new Uint8Array(W * H * 4);
    this.mat = new Int8Array(W * H).fill(-1);
  }
  put(x: number, y: number, matId: number): void {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    this.mat[y * this.W + x] = matId;
  }
  filled(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.W && y < this.H && this.mat[y * this.W + x] >= 0;
  }
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, matId: number): void {
    const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
    const sign = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const d1 = sign(x, y, x0, y0, x1, y1), d2 = sign(x, y, x1, y1, x2, y2), d3 = sign(x, y, x2, y2, x0, y0);
      const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) this.put(x, y, matId);
    }
  }
  rect(x0: number, y0: number, w: number, h: number, matId: number): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.put(x, y, matId);
  }
  disc(cx: number, cy: number, rad: number, matId: number): void {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) this.put(x, y, matId);
      }
    }
  }
  /** 锥形肢干：从 (x0,y0) 到 (x1,y1)，宽度 w0→w1 */
  limb(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, matId: number): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const w = (w0 + (w1 - w0) * t) / 2;
      this.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.max(0.5, w), matId);
    }
  }
  /** 后处理：上缘提亮 / 下缘压暗 / 轮廓描边，再上色（scale 放大输出） */
  render(scale: number): Buffer {
    const px = new Uint8Array(this.W * scale * this.H * scale * 4);
    const shade = new Uint8Array(W * H); // 0 base 1 hi 2 lo
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const i = y * this.W + x;
        if (this.mat[i] < 0) continue;
        // 左上方向来光：上方/左方为空 → 高光；下方/右方为空 → 暗部
        const upEmpty = y === 0 || this.mat[i - this.W] < 0;
        const leftEmpty = x === 0 || this.mat[i - 1] < 0;
        const downEmpty = y === this.H - 1 || this.mat[i + this.W] < 0;
        const rightEmpty = x === this.W - 1 || this.mat[i + 1] < 0;
        if ((upEmpty || leftEmpty) && !(downEmpty && rightEmpty)) shade[i] = 1;
        else if (downEmpty || rightEmpty) shade[i] = 2;
      }
    }
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const i = y * this.W + x;
        const m = this.mat[i];
        let rgb: RGB;
        if (m < 0) {
          // 轮廓：空像素且四邻有实体 → 描边色
          const near = (this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1));
          if (!near) continue;
          rgb = OUTLINE;
        } else {
          const ramp = this.mats[m];
          rgb = shade[i] === 1 ? ramp.hi : shade[i] === 2 ? ramp.lo : ramp.base;
        }
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const di = ((y * scale + sy) * this.W * scale + (x * scale + sx)) * 4;
            px[di] = rgb[0]; px[di + 1] = rgb[1]; px[di + 2] = rgb[2]; px[di + 3] = 255;
          }
        }
      }
    }
    return encodePNG(this.W * scale, this.H * scale, px);
  }
}

// ================= 矿工：8 帧手调姿态 =================
// 材质编号
const M = { SKIN: 0, HELM: 1, LAMP: 2, SUIT: 3, STEEL: 4, WOOD: 5, ORE: 6, ROCK: 7, DUST: 8, BOOT: 9, GLOVE: 10 };
const MATS = [R.skin, R.helmet, R.lamp, R.suit, R.steel, R.wood, R.ore, R.rock, R.dust, R.boot, R.glove];

interface MinerPose {
  lean: number;         // 躯干前倾 px
  backArm: number;      // 后臂角（度，0=水平向右，负=向上）
  frontArm: number;     // 前臂角
  pickRot: number;      // 镐整体旋转（度）
  pickGrip: 'back' | 'front' | 'both';
  legSpread: number;    // 前腿跨步
  crouch: number;       // 屈膝下沉 px
  rock: 'none' | 'whole' | 'crack' | 'broken';
  dust: number;         // 尘土量 0-3
  orePop: number;       // 矿石弹飞 0-2
  spark: boolean;
  brow: 'calm' | 'focus' | 'grunt';
}

const FRAMES: MinerPose[] = [
  { lean: 0, backArm: -118, frontArm: -80, pickRot: -30, pickGrip: 'back', legSpread: 0, crouch: 0, rock: 'whole', dust: 0, orePop: 0, spark: false, brow: 'calm' },      // f00 预备：镐扛肩
  { lean: -1, backArm: -138, frontArm: -95, pickRot: -52, pickGrip: 'back', legSpread: 0, crouch: 0, rock: 'whole', dust: 0, orePop: 0, spark: false, brow: 'focus' },    // f01 蓄力：镐拉更高，重心后移
  { lean: 1, backArm: -150, frontArm: -60, pickRot: -12, pickGrip: 'both', legSpread: 1, crouch: 0, rock: 'whole', dust: 0, orePop: 0, spark: false, brow: 'focus' },     // f02 挥出起手：双手过顶
  { lean: 2, backArm: -95, frontArm: -25, pickRot: 28, pickGrip: 'both', legSpread: 1, crouch: 1, rock: 'whole', dust: 0, orePop: 0, spark: false, brow: 'grunt' },       // f03 挥砍中段
  { lean: 4, backArm: -40, frontArm: 18, pickRot: 62, pickGrip: 'both', legSpread: 2, crouch: 2, rock: 'whole', dust: 1, orePop: 0, spark: true, brow: 'grunt' },         // f04 命中！
  { lean: 3, backArm: -34, frontArm: 14, pickRot: 58, pickGrip: 'both', legSpread: 2, crouch: 2, rock: 'crack', dust: 2, orePop: 0, spark: false, brow: 'grunt' },        // f05 反冲：岩裂
  { lean: 2, backArm: -46, frontArm: 4, pickRot: 44, pickGrip: 'both', legSpread: 1, crouch: 1, rock: 'broken', dust: 3, orePop: 1, spark: false, brow: 'focus' },        // f06 碎裂：矿石飞
  { lean: -1, backArm: -100, frontArm: -70, pickRot: -24, pickGrip: 'back', legSpread: 0, crouch: 0, rock: 'broken', dust: 1, orePop: 2, spark: true, brow: 'calm' },     // f07 收势：矿石弹开
];

function drawMiner(phase: number): Buffer {
  const P = FRAMES[phase];
  const c = new Canvas(W, H, MATS);
  const cx = 20 + P.lean; // 身体中轴
  const hipY = 34 + P.crouch;
  const shoulderY = 20 + P.crouch;
  const headCY = 12 + P.crouch;

  // ---- 岩石目标（右下）----
  if (P.rock !== 'none') {
    const rx = 38, ry = 42;
    if (P.rock === 'broken') {
      c.disc(rx - 3, ry + 2, 3, M.ROCK);
      c.disc(rx + 4, ry + 1, 2, M.ROCK);
      c.disc(rx + 1, ry - 3, 2, M.ROCK);
    } else {
      c.disc(rx, ry, 4, M.ROCK);
      if (P.rock === 'crack') {
        // 裂纹（描边色刻线）
        c.put(rx, ry - 2, -2); c.put(rx + 1, ry - 1, -2); c.put(rx, ry, -2); c.put(rx + 1, ry + 1, -2);
      }
    }
  }
  // ---- 矿石弹飞 ----
  if (P.orePop >= 1) {
    c.disc(34 - P.orePop * 4, 34 - P.orePop * 6, 2, M.ORE);
    c.put(35 - P.orePop * 4, 33 - P.orePop * 6, -3); // 高光点（借用临时材质位→下方统一按 ORE 提亮，简单用描边色当闪点）
  }
  if (P.orePop >= 2) {
    c.disc(26 - P.orePop, 22 - P.orePop * 2, 1, M.ORE);
  }

  // ---- 腿（前后开立）----
  const legY = hipY + 1;
  c.limb(cx - 3, legY, cx - 4 - P.legSpread, legY + 8 - P.crouch, 3.4, 2.6, M.SUIT);
  c.limb(cx + 3, legY, cx + 4 + P.legSpread, legY + 8 - P.crouch, 3.4, 2.6, M.SUIT);
  // 靴
  c.rect(Math.floor(cx - 6 - P.legSpread), legY + 7 - P.crouch, 5, 3, M.BOOT);
  c.rect(Math.floor(cx + 2 + P.legSpread), legY + 7 - P.crouch, 5, 3, M.BOOT);

  // ---- 躯干（背带裤：上肤下蓝）----
  c.rect(Math.floor(cx - 5), shoulderY, 11, 7, M.SUIT);          // 上身工装
  c.rect(Math.floor(cx - 5), shoulderY + 7, 11, 8, M.SUIT);      // 下身
  c.rect(Math.floor(cx - 5), shoulderY, 11, 2, M.SUIT);          // 肩
  // 背带
  c.put(Math.floor(cx - 3), shoulderY + 1, M.SUIT); c.put(Math.floor(cx + 3), shoulderY + 1, M.SUIT);
  // 腰带
  c.rect(Math.floor(cx - 5), hipY - 2, 11, 2, M.GLOVE);

  // ---- 头 + 头盔 ----
  c.disc(cx + 1, headCY, 5.4, M.SKIN);
  // 面向右：眼/眉
  const eyeY = headCY - 0;
  c.put(Math.floor(cx + 3), eyeY, -2);
  if (P.brow === 'calm') c.put(Math.floor(cx + 3), eyeY - 1, M.SKIN);
  else if (P.brow === 'focus') { c.put(Math.floor(cx + 3), eyeY - 1, -2); }
  else { c.put(Math.floor(cx + 2), eyeY - 1, -2); c.put(Math.floor(cx + 4), eyeY - 1, -2); } // 咬牙眉
  // 胡子茬（下颌暗部）
  c.put(Math.floor(cx + 2), headCY + 2, M.SKIN); c.put(Math.floor(cx + 3), headCY + 3, M.SKIN);
  // 头盔：穹顶 + 帽沿 + 顶灯
  c.disc(cx + 1, headCY - 2, 6, M.HELM);
  c.rect(Math.floor(cx - 5), headCY - 2, 13, 2, M.HELM);
  c.rect(Math.floor(cx - 1), headCY - 8, 4, 2, M.LAMP);
  c.put(Math.floor(cx), headCY - 7, M.LAMP);
  if (phase <= 2) { c.put(Math.floor(cx + 6), headCY - 7, -3); c.put(Math.floor(cx + 7), headCY - 6, -3); } // 灯光晕（蓄力时亮）

  // ---- 手臂 + 镐 ----
  const grip = (gx: number, gy: number) => c.disc(gx, gy, 1.6, M.GLOVE);
  const shX = cx + 4, shY = shoulderY + 2;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  if (P.pickGrip === 'back') {
    // 单手（后手）持镐扛肩
    const hx = shX + Math.cos(rad(P.backArm)) * 8, hy = shY + Math.sin(rad(P.backArm)) * 8;
    c.limb(shX - 1, shY, hx, hy, 3, 2.4, M.SUIT);
    grip(hx, hy);
    // 镐：柄从手向后上
    const wx = hx + Math.cos(rad(P.pickRot + 180)) * 9, wy = hy + Math.sin(rad(P.pickRot + 180)) * 9;
    c.limb(hx, hy, wx, wy, 2.2, 1.6, M.WOOD);
    // 镐头（垂直于柄的钢刃，两面）
    const px2 = wx + Math.cos(rad(P.pickRot + 90)) * 4, py2 = wy + Math.sin(rad(P.pickRot + 90)) * 4;
    const qx2 = wx + Math.cos(rad(P.pickRot - 90)) * 4, qy2 = wy + Math.sin(rad(P.pickRot - 90)) * 4;
    c.limb(px2, py2, qx2, qy2, 2.6, 2.6, M.STEEL);
    // 前臂搭在身前
    const fx = shX - 2 + Math.cos(rad(P.frontArm + 180)) * 6, fy = shY + 2 + Math.sin(rad(P.frontArm + 180)) * 4;
    c.limb(shX - 2, shY + 1, fx, fy, 2.8, 2.2, M.SUIT);
    grip(fx, fy);
  } else {
    // 双手握镐（挥砍）
    const hx = shX + Math.cos(rad(P.backArm)) * 9, hy = shY + Math.sin(rad(P.backArm)) * 9;
    c.limb(shX - 1, shY, hx, hy, 3, 2.4, M.SUIT);
    const fx = shX + 1 + Math.cos(rad(P.frontArm)) * 7, fy = shY + 1 + Math.sin(rad(P.frontArm)) * 7;
    c.limb(shX + 1, shY + 1, fx, fy, 2.8, 2.2, M.SUIT);
    // 双手交汇点
    const gx = (hx + fx) / 2, gy = (hy + fy) / 2;
    grip(gx, gy); grip(hx, hy); grip(fx, fy);
    // 镐柄沿挥转角伸出
    const wx = gx + Math.cos(rad(P.pickRot)) * 10, wy = gy + Math.sin(rad(P.pickRot)) * 10;
    c.limb(gx - Math.cos(rad(P.pickRot)) * 3, gy - Math.sin(rad(P.pickRot)) * 3, wx, wy, 2.2, 1.6, M.WOOD);
    const px2 = wx + Math.cos(rad(P.pickRot + 90)) * 4.5, py2 = wy + Math.sin(rad(P.pickRot + 90)) * 4.5;
    const qx2 = wx + Math.cos(rad(P.pickRot - 90)) * 4.5, qy2 = wy + Math.sin(rad(P.pickRot - 90)) * 4.5;
    c.limb(px2, py2, qx2, qy2, 2.8, 2.8, M.STEEL);
  }

  // ---- 尘土（命中后）----
  for (let i = 0; i < P.dust * 3; i++) {
    const dx = 34 + ((i * 7 + phase * 3) % 11);
    const dy = 40 - ((i * 5 + phase * 2) % 8);
    c.put(dx, dy, M.DUST);
    if (P.dust >= 2) c.put(dx + 1, dy - 1, M.DUST);
    if (P.dust >= 3) { c.put(dx - 2, dy - 2, M.DUST); c.put(dx + 2, dy + 1, M.DUST); }
  }
  // ---- 命中星芒 ----
  if (P.spark) {
    const sx2 = 44, sy2 = 38;
    c.put(sx2, sy2, -3); c.put(sx2 + 1, sy2, -3); c.put(sx2 - 2, sy2 - 3, -3); c.put(sx2 + 3, sy2 - 2, -3);
  }

  return c.render(2);
}

// ================= 发射特效：6 帧手排爆点 =================
interface FxFrame { shards: Array<[number, number, number]>; ring: number; core: number; motes: number }
const FX: FxFrame[] = [
  { shards: [[24, 22, 2]], ring: 0, core: 3, motes: 0 },                                        // f00 聚核
  { shards: [[24, 22, 4], [30, 18, 2], [18, 26, 2]], ring: 5, core: 4, motes: 2 },              // f01 破核
  { shards: [[24, 22, 5], [33, 14, 3], [15, 30, 3], [31, 29, 2], [17, 15, 2]], ring: 9, core: 3, motes: 4 },  // f02 全开星芒
  { shards: [[36, 10, 3], [12, 34, 3], [34, 32, 2], [14, 12, 2], [24, 8, 2], [40, 22, 2]], ring: 13, core: 2, motes: 5 }, // f03 环扩
  { shards: [[40, 6, 2], [8, 40, 2], [38, 36, 2], [10, 8, 2], [42, 16, 2], [6, 26, 2], [24, 4, 2]], ring: 16, core: 1, motes: 6 }, // f04 碎片散
  { shards: [[44, 3, 1], [4, 44, 1], [43, 40, 1], [5, 6, 1], [45, 20, 1]], ring: 18, core: 0, motes: 4 },           // f05 余韵
];
const FX_MATS = [R.ore, R.dust]; // 借用双色（蓝青 + 灰白）+ 金白火花专用
const FX_PALETTE: Ramp[] = [R.helmet /*金*/, R.ore /*青*/, R.dust /*白*/, R.lamp /*亮白*/];

function drawFx(phase: number): Buffer {
  const W2 = 48, H2 = 48;
  const px = new Uint8Array(W2 * H2 * 4 * 4); // 2× 后再写
  const put = (x: number, y: number, rgb: RGB, a = 255) => {
    for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
      const di = ((y * 2 + sy) * W2 * 2 + (x * 2 + sx)) * 4;
      if (x < 0 || y < 0 || x >= W2 || y >= H2) return;
      px[di] = rgb[0]; px[di + 1] = rgb[1]; px[di + 2] = rgb[2]; px[di + 3] = a;
    }
  };
  const disc = (cx: number, cy: number, r: number, rgb: RGB) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(x, y, rgb);
    }
  };
  const f = FX[phase];
  const GOLD: RGB = [255, 204, 84], AMBER: RGB = [255, 158, 54], WHITE: RGB = [255, 255, 244], TEAL: RGB = [96, 216, 235];
  // 环（金→白渐弱）
  if (f.ring > 0) {
    for (let a = 0; a < 360; a += 4) {
      const x = 24 + Math.cos((a * Math.PI) / 180) * f.ring;
      const y = 24 + Math.sin((a * Math.PI) / 180) * f.ring * 0.85;
      put(Math.round(x), Math.round(y), a % 30 < 12 ? WHITE : GOLD);
    }
  }
  // 核心
  if (f.core > 0) {
    disc(24, 24, f.core, WHITE);
    disc(24, 24, f.core * 0.55, GOLD);
  }
  // 碎片（金/琥珀交替，带 1px 拖尾）
  for (const [sx2, sy2, r] of f.shards) {
    const col: RGB = (sx2 + sy2) % 2 === 0 ? GOLD : AMBER;
    disc(sx2, sy2, r, col);
    put(sx2 + (sx2 < 24 ? 2 : -2), sy2 + (sy2 < 24 ? 2 : -2), TEAL);
  }
  // 游离光点
  for (let i = 0; i < f.motes; i++) {
    const mx = (i * 17 + phase * 11) % 46 + 1;
    const my = (i * 29 + phase * 7) % 44 + 2;
    put(mx, my, i % 3 === 0 ? WHITE : TEAL);
  }
  return encodePNG(W2 * 2, H2 * 2, px);
}

// ================= 预览拼板（自制） =================
function contactSheet(files: string[], out: string, cell: number): void {
  const cols = Math.min(8, files.length);
  const rows = Math.ceil(files.length / cols);
  const sheet = new Uint8Array(cols * cell * rows * cell * 4);
  const putS = (x: number, y: number, rgb: RGB) => {
    const di = (y * (cols * cell) + x) * 4;
    sheet[di] = rgb[0]; sheet[di + 1] = rgb[1]; sheet[di + 2] = rgb[2]; sheet[di + 3] = 255;
  };
  // 深底
  for (let y = 0; y < rows * cell; y++) for (let x = 0; x < cols * cell; x++) putS(x, y, [22, 24, 34]);
  files.forEach((f, i) => {
    const buf = fs.readFileSync(f);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    let off = 8; const idat: Buffer[] = [];
    while (off < buf.length) {
      const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
      if (type === 'IDAT') idat.push(buf.slice(off + 8, off + 8 + len));
      off += 12 + len;
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const ox = (i % cols) * cell + Math.floor((cell - w) / 2);
    const oy = Math.floor(i / cols) * cell + Math.floor((cell - h) / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = y * (1 + w * 4) + 1 + x * 4;
      if (raw[si + 3] > 0) putS(ox + x, oy + y, [raw[si], raw[si + 1], raw[si + 2]]);
    }
  });
  fs.writeFileSync(out, encodePNG(cols * cell, rows * cell, sheet));
}


// ================= 资产图标 ×20 + 卡面 ×18（批 4） =================
function generateIcons(): string[] {
  const c2 = (w: number, h: number, mats: Ramp[]) => new Canvas(w, h, mats);
  const out: string[] = [];
  const dir = rootPath('game-assets', 'icons');
  fs.mkdirSync(dir, { recursive: true });
  const IM = { GOLD: 0, BLUE: 1, CYAN: 2, GREEN: 3, RED: 4, PURPLE: 5, STEEL: 6, WHITE: 7 };
  const iconMats = [rampOf(hsl(45, 0.9, 0.52)), rampOf(hsl(212, 0.7, 0.5)), rampOf(hsl(186, 0.7, 0.48)), rampOf(hsl(150, 0.6, 0.45)), rampOf(hsl(354, 0.75, 0.5)), rampOf(hsl(268, 0.6, 0.55)), rampOf(hsl(210, 0.15, 0.6)), rampOf(hsl(210, 0.1, 0.75))];
  const draw = (id: string, fn: (c: Canvas) => void): void => {
    const c = c2(32, 32, iconMats);
    fn(c);
    const f = path.join(dir, id.toLowerCase() + '.png');
    fs.writeFileSync(f, c.render(2));
    out.push(f);
  };
  draw('COIN', c => { c.disc(16, 16, 11, M_GOLD_I); c.disc(16, 16, 7, M_ACC_I); c.put(14, 12, -3); c.put(15, 11, -3); });
  draw('ENERGY', c => { c.tri(18, 4, 8, 18, 15, 18, M_GOLD_I); c.tri(14, 28, 24, 14, 17, 14, M_GOLD_I); });
  draw('GEMSTONE', c => { c.tri(16, 4, 27, 16, 16, 28, M_CYAN_I); c.tri(16, 4, 5, 16, 16, 28, M_BLUE_I); c.put(13, 12, -3); });
  draw('TICKET', c => { c.rect(5, 10, 22, 12, M_GOLD_I); c.rect(14, 10, 2, 12, M_BLUE_I); c.put(8, 13, -3); c.put(9, 13, -3); });
  draw('ORE', c => { c.disc(13, 18, 7, M_STEEL_I); c.disc(21, 20, 5, M_STEEL_I); c.put(11, 15, -3); c.put(20, 18, M_CYAN_I); });
  draw('GOLD', c => { c.rect(6, 18, 9, 6, M_GOLD_I); c.rect(17, 18, 9, 6, M_GOLD_I); c.rect(11, 11, 9, 6, M_ACC_I); });
  draw('SAND', c => { c.tri(4, 26, 28, 26, 16, 10, M_GOLD_I); c.put(14, 16, -3); c.put(18, 20, M_ACC_I); });
  draw('APE_STONE', c => { c.disc(16, 18, 10, M_STEEL_I); c.disc(12, 14, 3, M_ACC_I); c.put(20, 20, M_BLUE_I); });
  draw('DAGGER', c => { c.tri(22, 6, 26, 10, 12, 22, M_STEEL_I); c.rect(9, 21, 6, 3, M_GOLD_I); c.limb(10, 24, 6, 28, 2, 1.4, M_BLUE_I); });
  draw('INTEGRAL', c => { c.rect(6, 20, 5, 6, M_BLUE_I); c.rect(13, 14, 5, 12, M_ACC_I); c.rect(20, 8, 5, 18, M_GOLD_I); });
  draw('SEASON_SCORE', c => { c.rect(9, 6, 14, 10, M_GOLD_I); c.rect(7, 6, 18, 3, M_ACC_I); c.rect(14, 16, 4, 5, M_GOLD_I); c.rect(10, 21, 12, 3, M_ACC_I); });
  draw('BADGE', c => { c.disc(16, 12, 8, M_GOLD_I); c.put(14, 10, -3); c.tri(11, 19, 21, 19, 16, 29, M_RED_I); c.tri(11, 19, 16, 29, 12, 27, M_BLUE_I); });
  draw('RED_PACKET_PROGRESS', c => { c.rect(8, 5, 16, 22, M_RED_I); c.rect(8, 5, 16, 7, M_ACC_I); c.disc(16, 13, 3, M_GOLD_I); });
  draw('TEST_CREDIT', c => { c.disc(16, 16, 11, M_PURPLE_I); c.disc(16, 16, 7, M_ACC_I); c.rect(14, 11, 3, 10, M_WHITE_I); c.rect(12, 13, 7, 3, M_WHITE_I); });
  draw('APE_CARD', c => { c.rect(7, 4, 18, 24, M_BLUE_I); c.rect(9, 6, 14, 20, M_ACC_I); c.disc(16, 14, 4, M_GOLD_I); c.rect(12, 20, 8, 3, M_GOLD_I); });
  draw('PLANET_CARD', c => { c.rect(7, 4, 18, 24, M_PURPLE_I); c.disc(16, 15, 6, M_ACC_I); c.rect(8, 17, 16, 2, M_CYAN_I); });
  draw('FLASH_CARD', c => { c.rect(7, 4, 18, 24, M_CYAN_I); c.tri(18, 8, 12, 17, 16, 17, M_GOLD_I); c.tri(14, 24, 20, 15, 16, 15, M_GOLD_I); });
  draw('WORLD_COIN', c => { c.disc(16, 16, 11, M_BLUE_I); c.rect(10, 15, 12, 2, M_ACC_I); c.rect(15, 6, 2, 20, M_ACC_I); c.disc(13, 10, 2, M_ACC_I); });
  draw('MEDAL', c => { c.disc(16, 12, 9, M_GOLD_I); c.disc(16, 12, 5, M_ACC_I); c.rect(11, 20, 3, 8, M_BLUE_I); c.rect(18, 20, 3, 8, M_RED_I); });
  draw('DUST', c => { c.disc(11, 20, 4, M_WHITE_I); c.disc(19, 17, 5, M_WHITE_I); c.disc(24, 22, 3, M_WHITE_I); c.put(17, 14, -3); });
  return out;
}
// 图标材质别名（独立于矿工材质表）
const M_GOLD_I = 0, M_BLUE_I = 1, M_CYAN_I = 2, M_GREEN_I = 3, M_RED_I = 4, M_PURPLE_I = 5, M_STEEL_I = 6, M_WHITE_I = 7, M_ACC_I = 7;

function generateCards(): string[] {
  const out: string[] = [];
  const dir = rootPath('game-assets', 'cards');
  fs.mkdirSync(dir, { recursive: true });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CARD_TEMPLATES } = require('../../../server/src/games/card_data');
  const rarityBase: Record<string, RGB> = {
    N: hsl(210, 0.12, 0.5), R: hsl(212, 0.7, 0.5), SR: hsl(268, 0.6, 0.55), SSR: hsl(42, 0.9, 0.5),
  };
  const typeM: Record<string, number> = { APE_CARD: 0, PLANET_CARD: 1, FLASH_CARD: 2 };
  const typeRamp: Ramp[] = [rampOf(hsl(28, 0.6, 0.5)), rampOf(hsl(258, 0.55, 0.55)), rampOf(hsl(196, 0.65, 0.5))];
  for (const t of CARD_TEMPLATES as Array<{ templateId: string; cardType: string; rarity: string; name: string }>) {
    const c = new Canvas(48, 64, [rampOf(rarityBase[t.rarity] ?? rarityBase.N), typeRamp[typeM[t.cardType] ?? 0], rampOf(hsl(45, 0.9, 0.55)), rampOf(hsl(210, 0.1, 0.78))]);
    // 边框（稀有度色）+ 内板（类型色）+ 中心符号（星/环/电）
    c.rect(2, 2, 44, 60, 0);
    c.rect(5, 5, 38, 54, 1);
    const cx = 24, cy = 26;
    if (t.cardType === 'PLANET_CARD') { c.disc(cx, cy, 9, 2); c.rect(10, cy + 2, 28, 3, 3); c.disc(cx - 3, cy - 3, 2, 3); }
    else if (t.cardType === 'FLASH_CARD') { c.tri(cx + 4, cy - 12, cx - 8, cy + 2, cx - 1, cy + 2, 2); c.tri(cx - 4, cy + 12, cx + 8, cy - 2, cx, cy - 2, 2); }
    else { for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 === 0 ? 10 : 4; const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r; i === 0 ? c.put(Math.round(x), Math.round(y), 2) : c.limb(cx + Math.cos(ang - Math.PI / 5) * (i % 2 === 0 ? 4 : 10), cy + Math.sin(ang - Math.PI / 5) * (i % 2 === 0 ? 4 : 10), x, y, 1.2, 1.2, 2); } }
    // 稀有度星（SSR3/SR2/R1）
    const pips = t.rarity === 'SSR' ? 3 : t.rarity === 'SR' ? 2 : 1;
    for (let p = 0; p < pips; p++) c.disc(24 - (pips - 1) * 4 + p * 8, 52, 2.4, 2);
    // 名称条（抽象短线，实际名称由 UI 文本渲染）
    c.rect(9, 42, 30, 4, 3);
    const f = path.join(dir, t.templateId.toLowerCase() + '.png');
    fs.writeFileSync(f, c.render(2));
    out.push(f);
  }
  return out;
}

export function generate(): void {
  const artFiles = [...generateIcons(), ...generateCards()];
  void artFiles;
  const minerDir = rootPath('game-assets', 'miner');
  const fxDir = rootPath('game-assets', 'fx_launch');
  fs.mkdirSync(minerDir, { recursive: true });
  fs.mkdirSync(fxDir, { recursive: true });
  const minerFiles: string[] = [];
  for (let i = 0; i < 8; i++) {
    const f = path.join(minerDir, `f0${i}.png`);
    fs.writeFileSync(f, drawMiner(i));
    minerFiles.push(f);
  }
  const fxFiles: string[] = [];
  for (let i = 0; i < 6; i++) {
    const f = path.join(fxDir, `f0${i}.png`);
    fs.writeFileSync(f, drawFx(i));
    fxFiles.push(f);
  }
  contactSheet([...minerFiles, ...fxFiles, ...generateIcons(), ...generateCards()], rootPath('docs', 'ART_PREVIEW.png'), 104);
  console.log('[gen_placeholder_art] miner 8 帧 + fx_launch 6 帧 + 图标×20 + 卡面×18 + docs/ART_PREVIEW.png');
}

if (require.main === module) generate();
