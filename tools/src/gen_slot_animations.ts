/**
 * 逐槽位自制动画生成系统（SANITIZATION_ASSESSMENT 视频槽位处置 · 可部署资产）。
 *
 * 209 个长演出槽位（原 videoBucket）→ 全部以自有像素动画替换并入库（game-assets/anims/<slot>/f00–07.png）。
 * 设计体系：12 种手调运动原型（rise/burst/orbit/pulse/run/sway/flow/pop/shake/marbleRain/banner/spark）
 *   × 按槽位语义派生的调色板（名内色彩词→色阶，否则名称哈希定相）与主体剪影（boss/动物/裙装/横幅/飞艇…）
 *   × 名称哈希节奏抖动 —— 每槽产出互不相同、语义对应、风格统一（工作室风）。
 * 全部零外部素材；重生成确定（seed=slotId）。
 * 运行：node dist/tools/src/gen_slot_animations.js
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { rootPath } from '../../shared/src/paths';

// ================= PNG 编码 / 画布 =================
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
export function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
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

export type RGB = [number, number, number];
export interface Ramp { hi: RGB; base: RGB; lo: RGB }

export function hsl(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
export function rampOf(base: RGB): Ramp {
  const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const WHITE: RGB = [255, 255, 250], DARK: RGB = [24, 18, 36];
  return { hi: mix(base, WHITE, 0.45), base, lo: mix(base, DARK, 0.42) };
}

export const OUTLINE: RGB = [26, 20, 38];

export class Canvas {
  px: Uint8Array;
  mat: Int8Array;
  mats: Ramp[];
  constructor(public W: number, public H: number, mats: Ramp[]) {
    this.px = new Uint8Array(W * 2 * H * 2 * 4);
    this.mat = new Int8Array(W * H).fill(-1);
    this.mats = mats;
  }
  put(x: number, y: number, m: number): void {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    this.mat[y * this.W + x] = m;
  }
  filled(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.W && y < this.H && this.mat[y * this.W + x] >= 0;
  }
  rect(x0: number, y0: number, w: number, h: number, m: number): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.put(x, y, m);
  }
  disc(cx: number, cy: number, r: number, m: number): void {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.put(x, y, m);
    }
  }
  limb(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, m: number): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.max(0.5, (w0 + (w1 - w0) * t) / 2), m);
    }
  }
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, m: number): void {
    const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
    const sign = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const d1 = sign(x, y, x0, y0, x1, y1), d2 = sign(x, y, x1, y1, x2, y2), d3 = sign(x, y, x2, y2, x0, y0);
      const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) this.put(x, y, m);
    }
  }
  /** 上缘提亮/下缘压暗 + 轮廓描边 → 放大输出 */
  clear(): void {
    this.px.fill(0);
    this.mat.fill(-1);
  }
  /** 前一帧残影：以暗蓝色印记（在被当前帧覆盖前调用） */
  stampGhost(prev: Int8Array, ghostRGB: RGB): void {
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      if (prev[y * this.W + x] >= 0 && this.mat[y * this.W + x] < 0) this.writeRGB(x, y, ghostRGB);
    }
  }
  render(scale: number): Buffer {
    // v2 合成模式：保留原型已绘的 writeRGB 特效层（修复曾被整体重建吞掉的缺陷）
    const shade = new Uint8Array(this.W * this.H);
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const i = y * this.W + x;
      if (this.mat[i] < 0) continue;
      const up = y === 0 || this.mat[i - this.W] < 0, left = x === 0 || this.mat[i - 1] < 0;
      const down = y === this.H - 1 || this.mat[i + this.W] < 0, right = x === this.W - 1 || this.mat[i + 1] < 0;
      if ((up || left) && !(down && right)) shade[i] = 1;
      else if (down || right) shade[i] = 2;
    }
    const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
    // 1) 材质三阶色阶（不透明，覆盖特效层）
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const i = y * this.W + x;
      const m = this.mat[i];
      if (m < 0) continue;
      const r = this.mats[m];
      const rgb = shade[i] === 1 ? r.hi : shade[i] === 2 ? r.lo : r.base;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const di = ((y * scale + sy) * this.W * scale + (x * scale + sx)) * 4;
        this.px[di] = rgb[0]; this.px[di + 1] = rgb[1]; this.px[di + 2] = rgb[2]; this.px[di + 3] = 255;
      }
    }
    // 2) 描边（空像素且邻接实体；受光侧轮廓混入材质高光）
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const di0 = (y * this.W + x) * 4;
      if (this.px[di0 + 3] !== 0) continue;
      if (!(this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1))) continue;
      const belowM = this.filled(x, y + 1) ? this.mat[(y + 1) * this.W + x] : -1;
      const rgb = belowM >= 0 ? mix(OUTLINE, this.mats[belowM].hi, 0.5) : OUTLINE;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const di = ((y * scale + sy) * this.W * scale + (x * scale + sx)) * 4;
        this.px[di] = rgb[0]; this.px[di + 1] = rgb[1]; this.px[di + 2] = rgb[2]; this.px[di + 3] = 255;
      }
    }
    return encodePNG(this.W * scale, this.H * scale, this.px);
  }
  /** 直接写 RGB 覆盖（光效用，绕过材质） */
  writeRGB(x: number, y: number, rgb: RGB): void {
    for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
      const di = ((y * 2 + sy) * this.W * 2 + (x * 2 + sx)) * 4;
      if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
      this.px[di] = rgb[0]; this.px[di + 1] = rgb[1]; this.px[di + 2] = rgb[2]; this.px[di + 3] = 255;
    }
  }
  writeDisc(cx: number, cy: number, r: number, rgb: RGB): void {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.writeRGB(Math.round(x), Math.round(y), rgb);
    }
  }
}

// ================= 语义解析 =================
export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

const COLOR_WORDS: Record<string, RGB> = {
  blue: hsl(212, 0.72, 0.5), red: hsl(354, 0.75, 0.5), orange: hsl(28, 0.9, 0.52),
  purple: hsl(268, 0.6, 0.55), white: hsl(210, 0.15, 0.72), silver: hsl(210, 0.15, 0.68),
  gold: hsl(42, 0.9, 0.52), yellow: hsl(48, 0.9, 0.52), green: hsl(150, 0.6, 0.45),
  pink: hsl(330, 0.7, 0.62), dark: hsl(250, 0.35, 0.32), black: hsl(250, 0.3, 0.28),
  grey: hsl(210, 0.1, 0.55), gray: hsl(210, 0.1, 0.55), cyan: hsl(186, 0.7, 0.48),
};
const ANIMALS = ['cow', 'dog', 'fox', 'monkey', 'pig', 'raccoon', 'tiger', 'lion', 'rabbit', 'head'];
type Archetype = 'rise' | 'burst' | 'orbit' | 'pulse' | 'run' | 'sway' | 'flow' | 'pop' | 'shake' | 'marbleRain' | 'banner' | 'spark' | 'humanoid' | 'chicken' | 'tugpull' | 'victory' | 'ball' | 'iconfx';

function classify(rel: string, group?: string): { arch: Archetype; ramp: Ramp; glyph: string; seed: number } {
  const n = rel.toLowerCase();
  let color: RGB | null = null;
  for (const w of Object.keys(COLOR_WORDS)) if (n.includes(w)) { color = COLOR_WORDS[w]; break; }
  const seed = hashStr(n);
  if (!color) color = hsl(seed % 360, 0.62, 0.5);
  let arch: Archetype = 'spark';
  if (ANIMALS.some((a) => n.includes(a)) || n.includes('escape')) arch = 'run';
  else if (n.includes('dress') || n.includes('swing') || n.includes('skirt') || n.includes('ribbon') || n.includes('silk') || n.includes('cloth')) arch = 'sway';
  else if (n.includes('boss') && n.includes('circle')) arch = 'orbit';
  else if (n.includes('boss')) arch = 'rise';
  else if (n.includes('marbles') || n.includes('spring') || n.includes('ball')) arch = 'marbleRain';
  else if (n.includes('banner') || n.includes('top_banner') || n.includes('word') || n.includes('text') || /_(final|second|first)$/.test(n)) arch = 'banner';
  else if (n.includes('buy') || n.includes('price') || n.includes('sale')) arch = 'pop';
  else if (n.includes('button') || n.includes('click') || n.includes('btn')) arch = 'pop';
  else if (n.includes('flash') || n.includes('shine') || n.includes('light') || n.includes('lamp')) arch = 'burst';
  else if (n.includes('egg') || n.includes('open')) arch = 'burst';
  else if (n.includes('smog') || n.includes('mist') || n.includes('fog') || n.includes('cloud') || n.includes('smoke') || n.includes('wind') || n.includes('snow') || n.includes('rain') || n.includes('bg') || n.includes('background') || n.includes('atmosphere') || n.includes('airship') || n.includes('star') || n.includes('space') || n.includes('sea') || n.includes('water')) arch = 'flow';
  else if (n.includes('result') || n.includes('win') || n.includes('award') || n.includes('prize') || n.includes('success') || n.includes('reward') || n.includes('door') || n.includes('rank')) arch = 'rise';
  else if (n.includes('be_attacked') || n.includes('attack') || n.includes('hit') || n.includes('box') || n.includes('chest') || n.includes('quake')) arch = 'shake';
  else if (n.includes('ring') || n.includes('circle') || n.includes('coin') || n.includes('wheel') || n.includes('rotat') || n.includes('turntable')) arch = 'orbit';
  else if (n.includes('aura') || n.includes('pulse') || n.includes('glow') || n.includes('halo') || n.includes('buff')) arch = 'pulse';
  else if (n.includes('gold') || n.includes('money') || n.includes('jewel') || n.includes('gem') || n.includes('diamond')) arch = 'orbit';
  else if (n.includes('fly') || n.includes('bird') || n.includes('bee') || n.includes('float') || n.includes('balloon')) arch = 'run';
  // 第二轮：剩余槽位按更具体语义归型（卡牌/部位展示/升级/福袋/红包等）
  if (arch === 'spark') {
    if (n.includes('idle')) arch = 'pulse';
    else if (n.includes('compose') || n.includes('synthesis') || n.includes('lucky')) arch = 'burst';
    else if (n.includes('split') || n.includes('fail') || n.includes('du') || n.includes('battle') || n.includes('arrow')) arch = 'shake';
    else if (n.includes('strengthen') || n.includes('friend') || n.includes('product') || n.includes('pool')) arch = n.includes('pool') ? 'orbit' : 'sway';
    else if (n.includes('levelup') || n.includes('upgrade') || n.includes('red_package')) arch = 'rise';
    else if (n.includes('ready_go') || n.includes('nail') || n.includes('puzzle') || n.includes('finger') || n.includes('appear') || n.includes('bmp') || n.includes('play')) arch = 'pop';
    else if (n.includes('seek') || n.includes('updat') || n.includes('index')) arch = 'pulse';
  }
  // 第三轮：图集桶分组映射（角色/特效动画——玩法屏最需要的（SANITIZATION 批 1 补产））
  if (arch === 'spark' && group) {
    const g = group.toLowerCase();
    const n = rel.toLowerCase();
    if (g.includes('battleroyal') || g.includes('battleRoyal')) {
      arch = n.includes('walk') ? 'humanoid' : n.includes('killer') ? 'humanoid' : 'humanoid';
      if (n.includes('killer')) { /* 杀手：深色由调色板外理 */ }
    }
    else if (g.includes('escape_animal') || g.includes('beast')) arch = n.includes('prop') ? 'iconfx' : 'run';
    else if (g.includes('tug')) arch = 'tugpull';
    else if (g.includes('sport')) arch = n.includes('win') ? 'victory' : n.includes('stay') ? 'humanoid' : 'run';
    else if (g.includes('chicken')) arch = 'chicken';
    else if (g.includes('monkeyfighting') || g.includes('ap_rabbit')) arch = 'humanoid';
    else if (g.includes('marbles')) arch = 'ball';
    else if (g.includes('buff') || g.includes('debuff') || g.includes('prop')) arch = 'iconfx';
    else if (g.includes('challenge_boss')) arch = 'rise';
    else if (g.includes('arena')) arch = n.includes('pool') ? 'orbit' : n.includes('btn') ? 'pop' : n.includes('vs') ? 'burst' : n.includes('bg') ? 'flow' : 'shake';
    else if (g.includes('dagger') || g.includes('rob') || g.includes('robbery')) arch = 'burst';
    else if (g.includes('idle')) arch = 'humanoid';
    else if (g.includes('strengthen')) arch = 'sway';
    else if (g.includes('run')) arch = 'run';
    else if (g.includes('me')) arch = 'humanoid';
  }
  let glyph = 'diamond';
  if (n.includes('boss')) glyph = 'boss';
  else if (ANIMALS.some((a) => n.includes(a))) glyph = (ANIMALS.find((a) => n.includes(a)) || 'monkey');
  else if (n.includes('dress') || n.includes('skirt')) glyph = 'dress';
  else if (n.includes('star')) glyph = 'star';
  else if (n.includes('coin')) glyph = 'coin';
  else if (n.includes('airship')) glyph = 'airship';
  else if (n.includes('heart') || n.includes('strengthen')) glyph = 'heart';
  else if (n.includes('red_package') || n.includes('lucky')) glyph = 'coin';
  else if (n.includes('card')) glyph = 'button';
  else if (n.includes('button') || n.includes('click')) glyph = 'button';
  return { arch, ramp: rampOf(color), glyph, seed };
}

// ================= 主体剪影 =================
function drawGlyph(c: Canvas, glyph: string, cx: number, cy: number, s: number, bodyM: number, accM: number, t: number): void {
  switch (glyph) {
    case 'boss': { // 角+宽肩剪影
      c.disc(cx, cy, s, bodyM);
      c.rect(Math.floor(cx - s * 0.9), Math.floor(cy + s * 0.4), Math.floor(s * 1.8), Math.floor(s * 0.8), bodyM);
      c.tri(cx - s * 0.7, cy - s * 0.6, cx - s * 1.15, cy - s * 1.5, cx - s * 0.25, cy - s * 0.85, accM);
      c.tri(cx + s * 0.7, cy - s * 0.6, cx + s * 1.15, cy - s * 1.5, cx + s * 0.25, cy - s * 0.85, accM);
      const glow = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      c.put(Math.round(cx - s * 0.35), Math.round(cy - s * 0.1), accM);
      c.put(Math.round(cx + s * 0.35), Math.round(cy - s * 0.1), accM);
      void glow;
      break;
    }
    case 'cow': case 'dog': case 'fox': case 'monkey': case 'pig': case 'raccoon': case 'tiger': case 'lion': case 'rabbit': {
      // 四足动物剪影：身/头/耳/尾/腿（参数随种类微调）
      const ear = glyph === 'rabbit' ? 4 : glyph === 'fox' ? 3 : 2;
      const tail = glyph === 'monkey' ? 5 : glyph === 'fox' ? 4 : 2;
      const bodyL = glyph === 'dog' || glyph === 'fox' ? 11 : glyph === 'cow' ? 10 : 9;
      c.disc(cx, cy, s * 0.42, bodyM);
      c.rect(Math.floor(cx - bodyL), Math.floor(cy - s * 0.18), bodyL * 2, Math.floor(s * 0.5), bodyM);
      c.disc(cx + bodyL + 1, cy - s * 0.35, s * 0.3, bodyM);
      c.tri(cx + bodyL + 1, cy - s * 0.55, cx + bodyL + 1 + ear * 0.4, cy - s * 0.55 - ear, cx + bodyL + 2, cy - s * 0.5, bodyM);
      const tw = Math.sin(t * Math.PI * 2) * 2;
      c.limb(cx - bodyL, cy - s * 0.1, cx - bodyL - tail, cy - s * 0.1 + tw, 1.6, 0.8, bodyM);
      for (let l = 0; l < 4; l++) {
        const ph = Math.sin(t * Math.PI * 2 + l * Math.PI / 2) * 1.5;
        const lx = cx - bodyL * 0.6 + l * (bodyL * 0.4);
        c.limb(lx, cy + s * 0.25, lx + ph, cy + s * 0.7, 1.4, 1, bodyM);
      }
      break;
    }
    case 'dress': { // v3 裙装：吊脖领 + 收腰 + 双层裙摆扇贝 + 高光
      const sway = Math.sin(t * Math.PI * 2) * 2;
      const hem = cy + s * 0.9;
      c.rect(Math.floor(cx - 2), Math.floor(cy - s * 0.95), 5, Math.floor(s * 0.35), accM);           // 吊脖带
      c.rect(Math.floor(cx - 3), Math.floor(cy - s * 0.62), 7, Math.floor(s * 0.34), bodyM);          // 上衣
      c.put(Math.floor(cx - 1), Math.floor(cy - s * 0.5), accM);                                       // 胸口高光
      c.rect(Math.floor(cx - 3), Math.floor(cy - s * 0.3), 7, 2, accM);                                // 腰带
      c.tri(cx - 3, cy - s * 0.28, cx + 4, cy - s * 0.28, cx + 6 + sway, hem, bodyM);                  // 裙右
      c.tri(cx - 3, cy - s * 0.28, cx + 4, cy - s * 0.28, cx - 5 + sway, hem, bodyM);                  // 裙左
      for (let k = -2; k <= 2; k++) {                                                                  // 扇贝下摆
        const hx = cx + sway + k * 2.4;
        c.disc(hx, hem - 1, 1.2, bodyM);
      }
      c.limb(cx - 5 + sway, hem, cx + 6 + sway, hem, 0.8, 0.8, accM);                                  // 下摆描线
      break;
    }
    case 'coin': {
      c.disc(cx, cy, s * 0.7, bodyM);
      c.disc(cx, cy, s * 0.42, accM);
      c.put(Math.round(cx - s * 0.25), Math.round(cy - s * 0.3), -2);
      break;
    }
    case 'star': {
      const r1 = s, r2 = s * 0.42;
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? r1 : r2;
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        i === 0 ? c.put(Math.round(x), Math.round(y), bodyM) : c.limb(cx + Math.cos(ang - Math.PI / 5) * (i % 2 === 0 ? r2 : r1), cy + Math.sin(ang - Math.PI / 5) * (i % 2 === 0 ? r2 : r1), x, y, 1.2, 1.2, bodyM);
      }
      break;
    }
    case 'airship': {
      c.disc(cx, cy, s * 0.55, bodyM);
      c.rect(Math.floor(cx - s * 1.05), Math.floor(cy - s * 0.3), Math.floor(s * 2.1), Math.floor(s * 0.6), bodyM);
      c.rect(Math.floor(cx - 2), Math.floor(cy + s * 0.45), 5, Math.floor(s * 0.4), accM);
      c.tri(cx + s * 1.0, cy - s * 0.2, cx + s * 1.45, cy, cx + s * 1.0, cy + s * 0.2, accM);
      break;
    }
    case 'button': {
      c.rect(Math.floor(cx - s), Math.floor(cy - s * 0.45), Math.floor(s * 2), Math.floor(s * 0.9), bodyM);
      c.rect(Math.floor(cx - s + 1), Math.floor(cy - s * 0.3), Math.floor(s * 2 - 2), 2, accM);
      break;
    }
    case 'heart': {
      c.disc(cx - s * 0.4, cy - s * 0.25, s * 0.45, bodyM);
      c.disc(cx + s * 0.4, cy - s * 0.25, s * 0.45, bodyM);
      c.tri(cx - s * 0.8, cy, cx + s * 0.8, cy, cx, cy + s, bodyM);
      break;
    }
    default: { // diamond
      const r = s;
      c.tri(cx, cy - r, cx + r * 0.7, cy, cx, cy + r, bodyM);
      c.tri(cx, cy - r, cx - r * 0.7, cy, cx, cy + r, bodyM);
      c.put(Math.round(cx - r * 0.2), Math.round(cy - r * 0.4), accM);
    }
  }
}

// ================= 12 种运动原型 =================
const FRAMES_N = 8;
const M_SKIN = 6, M_HELM = 3, M_WOOD = 5, M_GOLD = 3, M_ACC = 1, M_ACC2 = 2, M_BLUE = 4, M_DUST = 5, M_BOOT = 9, M_GLOVE = 10, M_DARK = 11;

function renderSlot(slotId: string, rel: string, wOrig: number, hOrig: number, group?: string, perf = false): Buffer[] {
  const { arch, ramp, glyph, seed } = classify(rel, group);
  const mats = [ramp, rampOf(hsl((seed % 97) + 8, 0.6, 0.55)), rampOf(hsl((seed % 53) + 180, 0.55, 0.6)), rampOf(hsl(45, 0.85, 0.6)), rampOf(hsl(212, 0.62, 0.46)), rampOf(hsl(210, 0.1, 0.7)), rampOf(hsl(28, 0.6, 0.68)), rampOf(hsl(45, 0.75, 0.5)), rampOf(hsl(150, 0.5, 0.5)), rampOf(hsl(28, 0.5, 0.35)), rampOf(hsl(28, 0.45, 0.42)), rampOf(hsl(258, 0.45, 0.2))]; // +6 皮肤 +7 盔/杀手深
  const M_BODY = 0, M_ACC = 1, M_ACC2 = 2, M_GOLD = 3, M_BLUE = 4, M_DUST = 5;
  const aspect = wOrig / hOrig;
  const szMul = perf ? 1.3 : 1;
  const lw = Math.round((aspect > 1.3 ? 84 : aspect < 0.77 ? 42 : 64) * szMul);
  const lh = Math.round((aspect > 1.3 ? 42 : aspect < 0.77 ? 84 : 64) * szMul);
  const FR = perf ? 16 : FRAMES_N;
  const out: Buffer[] = [];
  let prevMat: Int8Array | null = null;
  const GHOST: RGB = [74, 84, 124];
  for (let f = 0; f < FR; f++) {
    const t = f / FRAMES_N;
    const wave = Math.sin(t * Math.PI * 2);
    const c = new Canvas(lw, lh, mats);
    const slotIdForTone = slotId;
    const cx = lw / 2, cy = lh / 2;
    // v2 场景背景层：夜空渐变 + 地平线 + 确定性星点
    const toneA = hsl((seed % 97) + 205, 0.5, 0.12), toneB = hsl((seed % 97) + 215, 0.45, 0.19);
    for (let y = 0; y < lh; y++) {
      const tt = y / lh;
      const row: RGB = [Math.round(toneA[0] + (toneB[0] - toneA[0]) * tt), Math.round(toneA[1] + (toneB[1] - toneA[1]) * tt), Math.round(toneA[2] + (toneB[2] - toneA[2]) * tt)];
      for (let x = 0; x < lw; x++) c.writeRGB(x, y, row);
    }
    const groundY = Math.floor(lh * 0.87);
    for (let x = 0; x < lw; x++) { c.writeRGB(x, groundY, hsl((seed % 89) + 120, 0.25, 0.15)); c.writeRGB(x, groundY + 1, hsl((seed % 89) + 120, 0.25, 0.11)); }
    for (let st = 0; st < 7; st++) {
      const sx2 = (seed >> st) % lw, sy2 = (seed >> (st + 3)) % Math.floor(lh * 0.5);
      c.writeRGB(sx2, sy2, st % 2 ? [206, 216, 255] : [255, 255, 244]);
    }
    if (prevMat) c.stampGhost(prevMat, GHOST);
    const S = Math.min(lw, lh) * 0.24;
    switch (arch) {
      case 'rise': {
        const rise = (1 - t) * S * 2.2;
        const sc = 0.72 + t * 0.28;
        drawGlyph(c, glyph, cx, cy + rise, S * 1.5 * sc, M_BODY, M_ACC, t);
        // 地面裂纹随升起扩展
        const cr = Math.floor(t * S * 1.4);
        for (let k = 0; k < 5; k++) {
          const a = Math.PI + (k / 4) * Math.PI;
          c.limb(cx, cy + S * 1.9, cx + Math.cos(a) * cr, cy + S * 1.9 + Math.sin(a) * cr * 0.4, 1, 0.6, M_ACC2);
        }
        if (f === FRAMES_N - 1) { c.writeDisc(cx - 6, cy + rise - S, 2, [255, 255, 244]); c.writeDisc(cx + 8, cy + rise - S * 0.4, 2, [255, 255, 244]); }
        break;
      }
      case 'burst': {
        const e = 1 - (1 - t) * (1 - t);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + (seed % 20) / 12;
          const r = 3 + e * S * 2.1;
          c.writeDisc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.4 - e, i % 2 ? [255, 204, 84] : [255, 255, 244]);
        }
        if (t < 0.5) c.writeDisc(cx, cy, S * (1.1 - t), [255, 255, 244]);
        drawGlyph(c, glyph, cx, cy, S * 0.8, M_BODY, M_ACC, t);
        break;
      }
      case 'orbit': {
        drawGlyph(c, glyph === 'diamond' ? 'coin' : glyph, cx, cy, S * 0.9, M_BODY, M_ACC, t);
        for (let o = 0; o < 3; o++) {
          const a = t * Math.PI * 2 + (o * Math.PI * 2) / 3;
          const r = S * (1.4 + o * 0.35);
          c.writeDisc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, 2.2 - o * 0.4, o === 0 ? [255, 224, 120] : o === 1 ? [120, 200, 255] : [255, 255, 244]);
        }
        break;
      }
      case 'pulse': {
        const br = 0.75 + 0.25 * wave;
        drawGlyph(c, glyph, cx, cy, S * 1.4 * br, M_BODY, M_ACC, t);
        for (let i = 0; i < 5; i++) {
          const a = t * Math.PI * 2 + i;
          c.writeDisc(cx + Math.cos(a) * S * (1.6 + 0.3 * wave), cy + Math.sin(a) * S * (1.6 + 0.3 * wave), 1.4, [255, 255, 244]);
        }
        break;
      }
      case 'run': {
        // 地面 + 速度线
        for (let gI = 0; gI < 3; gI++) {
          const gx = ((f * 5 + gI * 21) % (lw + 10)) - 5;
          c.limb(gx, lh - 3, gx - 6, lh - 3, 0.8, 0.4, M_DUST);
        }
        drawGlyph(c, glyph, cx + Math.sin(t * Math.PI * 2) * 1.5, cy + Math.abs(Math.sin(t * Math.PI * 4)) * -2, S * 1.15, M_BODY, M_ACC, t);
        break;
      }
      case 'sway': {
        drawGlyph(c, 'dress', cx, cy, S * 1.5, M_BODY, M_ACC, t);
        if (f % 2 === 0) c.writeDisc(cx - S * 1.3, cy - S * 0.8, 1.2, [255, 255, 244]);
        c.writeDisc(cx + S * 1.4, cy + S * 0.3, 1.2, [255, 224, 120]);
        break;
      }
      case 'flow': {
        // 星野/粒子流：向左流动的三层视差
        for (let i = 0; i < 14; i++) {
          const sx2 = (lw + 8 - ((f * 4 + i * (7 + (seed % 5))) % (lw + 8)));
          const sy2 = (i * 37 + seed) % (lh - 4) + 2;
          const layer = i % 3;
          c.writeRGB(Math.round(sx2), Math.round(sy2), layer === 0 ? [255, 255, 244] : layer === 1 ? [160, 200, 255] : [90, 120, 180]);
          if (layer === 0) c.writeRGB(Math.round(sx2 + 1), Math.round(sy2), [120, 150, 210]);
        }
        drawGlyph(c, glyph === 'diamond' ? 'star' : glyph, cx, cy, S * 0.85, M_BODY, M_ACC, t);
        break;
      }
      case 'pop': {
        drawGlyph(c, 'button', cx, cy - (f % 2) * 1 + (f >= 3 ? -2 : 0), S * 1.35, M_BODY, M_ACC, t);
        if (f >= 3) {
          const e = (f - 3) / 5;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            c.writeDisc(cx + Math.cos(a) * (6 + e * 14), cy - S * 0.45 + Math.sin(a) * (4 + e * 9), 2 - e, i % 2 ? [255, 224, 120] : [255, 255, 244]);
          }
        }
        break;
      }
      case 'shake': {
        const jx = f % 2 === 0 ? 2 : -2;
        drawGlyph(c, glyph === 'diamond' ? 'boss' : glyph, cx + jx, cy + (f % 3 - 1), S * 1.35, M_BODY, M_ACC, t);
        for (let dI = 0; dI < 4; dI++) {
          const dx2 = cx + S * 1.6 + ((dI * 5 + f * 3) % 9);
          const dy2 = cy - S + ((dI * 7 + f * 5) % 12);
          c.writeRGB(Math.round(dx2), Math.round(dy2), dI % 2 ? [255, 214, 96] : [200, 200, 220]);
        }
        break;
      }
      case 'marbleRain': {
        // 3 颗弹珠各自弹跳（相位错开）
        for (let b = 0; b < 3; b++) {
          const bt = (t + b / 3) % 1;
          const bx = lw * (0.25 + b * 0.25);
          const by = lh * 0.62 - Math.abs(Math.sin(bt * Math.PI)) * lh * 0.34;
          c.writeDisc(bx, by, 4 - b * 0.5, b === 0 ? [255, 204, 84] : b === 1 ? [120, 200, 255] : [235, 120, 160]);
          c.writeDisc(bx - 1, by - 1, 1.2, [255, 255, 244]);
        }
        c.limb(2, lh - 4, lw - 2, lh - 4, 1, 0.6, M_DUST);
        break;
      }
      case 'banner': {
        // 横幅扫入 + 微光流动
        const sweep = Math.min(1, t * 1.6);
        const bw = Math.floor(lw * 0.86 * sweep);
        c.rect(Math.floor(cx - bw / 2), Math.floor(cy - S * 0.6), bw, Math.floor(S * 1.2), M_BODY);
        c.rect(Math.floor(cx - bw / 2), Math.floor(cy - S * 0.6), bw, 2, M_ACC);
        c.rect(Math.floor(cx - bw / 2), Math.floor(cy + S * 0.6) - 1, bw, 2, M_ACC);
        for (let i = 0; i < 5; i++) {
          const sx2 = cx - bw / 2 + ((i * 13 + f * 6) % Math.max(1, bw - 2)) + 1;
          c.writeRGB(Math.round(sx2), Math.round(cy), [255, 255, 244]);
        }
        break;
      }
      case 'humanoid': {
        // v2 人形：肘/膝两段肢体 + 面部（眨眼/嘴）+ 杀手围巾；杀手=暗色+红眼；铜/金/银=工装变体
        const n = slotIdForTone.toLowerCase();
        const killer = n.includes('killer');
        const suitM = killer ? M_DARK : n.includes('gold') ? M_GOLD : n.includes('copper') ? M_BOOT : n.includes('silver') ? 7 : M_BLUE;
        const walk = n.includes('walk');
        const bob = walk ? Math.abs(Math.sin(t * Math.PI * 4)) * 2 : Math.sin(t * Math.PI * 2) * 1;
        const cx2 = cx, headY = cy - S * 0.95 - bob, bodyY = cy - S * 0.2 - bob;
        const swing = walk ? Math.sin(t * Math.PI * 4) : 0;
        for (const side of [-1, 1]) {
          const hx = cx2 + side * S * 0.22;
          const ph = swing * side;
          const kx = hx + ph * S * 0.18, ky = bodyY + S * 0.62;
          const ax = kx + ph * S * 0.22, ay = bodyY + S * 1.08;
          c.limb(hx, bodyY + S * 0.52, kx, ky, S * 0.22, S * 0.16, killer ? M_DARK : M_BLUE);
          c.limb(kx, ky, ax, ay, S * 0.15, S * 0.1, killer ? M_DARK : M_BLUE);
          c.rect(Math.floor(ax - S * 0.16), Math.floor(ay - 1), Math.floor(S * 0.36), 3, M_BOOT);
        }
        c.rect(Math.floor(cx2 - S * 0.36), Math.floor(bodyY - S * 0.14), Math.floor(S * 0.72), Math.floor(S * 0.72), suitM);
        c.rect(Math.floor(cx2 - S * 0.36), Math.floor(bodyY + S * 0.38), Math.floor(S * 0.72), 2, M_GLOVE);
        for (const side of [-1, 1]) {
          const sx3 = cx2 + side * S * 0.34;
          const sw2 = walk ? Math.sin(t * Math.PI * 4 + (side > 0 ? Math.PI : 0)) : Math.sin(t * Math.PI * 2) * 0.4;
          const ex2 = sx3 + sw2 * S * 0.2, ey2 = bodyY + S * 0.28;
          const hx2 = ex2 + sw2 * S * 0.22, hy2 = ey2 + S * 0.3;
          c.limb(sx3, bodyY - S * 0.05, ex2, ey2, S * 0.18, S * 0.13, suitM);
          c.limb(ex2, ey2, hx2, hy2, S * 0.13, S * 0.1, suitM);
          c.disc(hx2, hy2, S * 0.1, M_GLOVE);
        }
        c.disc(cx2, headY, S * 0.3, killer ? M_ACC : M_SKIN);
        const blink = f === 1 || f === 5;
        const eyeY2 = headY + S * 0.02;
        if (blink) { c.put(Math.round(cx2 + S * 0.1), Math.round(eyeY2), -2); c.put(Math.round(cx2 + S * 0.24), Math.round(eyeY2), -2); }
        else { c.put(Math.round(cx2 + S * 0.1), Math.round(eyeY2), -2); c.put(Math.round(cx2 + S * 0.24), Math.round(eyeY2), -2); c.put(Math.round(cx2 + S * 0.1), Math.round(eyeY2 - 1), M_GLOVE); c.put(Math.round(cx2 + S * 0.24), Math.round(eyeY2 - 1), M_GLOVE); }
        c.put(Math.round(cx2 + S * 0.18), Math.round(headY + S * 0.12), -2);
        c.disc(cx2, headY - S * 0.2, S * 0.33, killer ? M_DARK : M_GOLD);
        c.rect(Math.floor(cx2 - S * 0.36), Math.floor(headY - S * 0.22), Math.floor(S * 0.74), 2, killer ? M_DARK : M_GOLD);
        if (killer) {
          const fl = Math.sin(t * Math.PI * 4) * S * 0.12;
          c.limb(cx2 - S * 0.3, headY + S * 0.12, cx2 - S * 0.75, headY + S * 0.3 + fl, S * 0.16, S * 0.06, M_ACC);
        }
        break;
      }
      case 'chicken': {
        // 母鸡：身体/头/冠/喙，啄食步 cycle
        const peck = Math.sin(t * Math.PI * 2) > 0.4 ? 2 : 0;
        const bx = cx + Math.sin(t * Math.PI * 2) * 1.5;
        c.disc(bx, cy + S * 0.1, S * 0.42, M_BODY);
        c.disc(bx + S * 0.38, cy - S * 0.25 + peck, S * 0.26, M_BODY);
        c.put(Math.round(bx + S * 0.44), Math.round(cy - S * 0.22 + peck), M_GOLD);
        c.put(Math.round(bx + S * 0.32), Math.round(cy - S * 0.52 + peck), M_ACC);
        c.put(Math.round(bx + S * 0.3), Math.round(cy - S * 0.32 + peck), -2);
        for (let l = 0; l < 2; l++) {
          const ph = Math.sin(t * Math.PI * 4 + l * Math.PI) * 1.2;
          c.limb(bx - S * 0.15 + l * S * 0.3, cy + S * 0.42, bx - S * 0.15 + l * S * 0.3 + ph, cy + S * 0.75, 1, 0.6, M_GOLD);
        }
        c.limb(bx - S * 0.35, cy + S * 0.05, bx - S * 0.6, cy - S * 0.15 + Math.sin(t * Math.PI * 2) * S * 0.12, 1, 0.5, M_ACC);
        break;
      }
      case 'tugpull': {
        // 拔河：双人后仰拉绳（绳中红标随 t 摆动）
        const lean = Math.sin(t * Math.PI * 2) * 2;
        for (const side of [-1, 1]) {
          const px2 = cx + side * S * 1.5;
          c.limb(px2, cy - S * 0.3, px2 - side * S * 0.5 - lean * side, cy + S * 0.4, S * 0.3, S * 0.22, side < 0 ? M_BODY : M_ACC);
          c.disc(px2 - side * S * 0.55 - lean * side, cy - S * 0.55, S * 0.24, side < 0 ? M_SKIN : M_ACC);
          c.limb(px2 - side * S * 0.2, cy - S * 0.2, px2 - side * S * 0.9, cy - S * 0.35 + lean, S * 0.18, S * 0.12, side < 0 ? M_BODY : M_ACC);
        }
        const ropeY = cy - S * 0.32 + lean * 0.5;
        c.limb(cx - S * 1.9, ropeY, cx + S * 1.9, ropeY, 1, 0.6, M_WOOD);
        c.writeDisc(cx + Math.sin(t * Math.PI * 4) * S * 0.8, ropeY, 1.6, [255, 80, 80]);
        break;
      }
      case 'victory': {
        // 胜利：双臂高举 V + 跳跃 + 星芒
        const jump = Math.abs(Math.sin(t * Math.PI * 2)) * S * 0.4;
        const jy = cy - jump;
        c.rect(Math.floor(cx - S * 0.35), Math.floor(jy), Math.floor(S * 0.7), Math.floor(S * 0.7), M_BODY);
        c.disc(cx, jy - S * 0.35, S * 0.26, M_SKIN);
        c.limb(cx - S * 0.3, jy + S * 0.05, cx - S * 0.75, jy - S * 0.55, S * 0.2, S * 0.12, M_BODY);
        c.limb(cx + S * 0.3, jy + S * 0.05, cx + S * 0.75, jy - S * 0.55, S * 0.2, S * 0.12, M_BODY);
        for (let i = 0; i < 4; i++) {
          const a = t * Math.PI * 2 + i * Math.PI / 2;
          c.writeDisc(cx + Math.cos(a) * S * 1.15, jy - S * 0.2 + Math.sin(a) * S * 0.7, 1.5, i % 2 ? [255, 224, 120] : [255, 255, 244]);
        }
        break;
      }
      case 'ball': {
        // 彩色弹珠：弹跳 + 压扁 + 高光
        const bt = t;
        const by = cy + S * 0.5 - Math.abs(Math.sin(bt * Math.PI)) * S * 0.9;
        const squash = by > cy + S * 0.3 ? 1.25 : 1;
        c.writeDisc(cx, by, S * 0.42 * squash, [255, 255, 244]);
        const ballColor = (seed % 2 === 0) ? [120, 200, 255] : [235, 120, 160];
        c.writeDisc(cx, by, S * 0.34 * squash, ballColor as RGB);
        c.writeDisc(cx - S * 0.12, by - S * 0.14, S * 0.1, [255, 255, 255]);
        break;
      }
      case 'iconfx': {
        // Buff/道具图标：盾/闪电/星/光圈/泥滴 语义图形 + 脉动
        const pl = 0.8 + 0.2 * Math.sin(t * Math.PI * 4);
        const n = slotIdForTone.toLowerCase();
        if (n.includes('shield') || n.includes('buff')) {
          c.rect(Math.floor(cx - S * 0.5), Math.floor(cy - S * 0.55), Math.floor(S), Math.floor(S * 0.8), M_BODY);
          c.tri(cx - S * 0.5, cy + S * 0.25, cx + S * 0.5, cy + S * 0.25, cx, cy + S * 0.85, M_BODY);
          c.rect(Math.floor(cx - S * 0.28), Math.floor(cy - S * 0.3), Math.floor(S * 0.56), Math.floor(S * 0.16), M_ACC);
        } else if (n.includes('speed')) {
          for (let l = 0; l < 3; l++) c.limb(cx - S * 0.7 + l * S * 0.3, cy - S * 0.4 + l * S * 0.4, cx + S * 0.5 + l * S * 0.2, cy - S * 0.4 + l * S * 0.4, S * 0.14 * pl, S * 0.06, M_BODY);
        } else if (n.includes('invincible')) {
          c.disc(cx, cy, S * 0.55 * pl, M_ACC);
          c.disc(cx, cy, S * 0.3, M_GOLD);
        } else if (n.includes('mud') || n.includes('debuff')) {
          c.disc(cx, cy - S * 0.2, S * 0.3 * pl, M_BODY);
          c.tri(cx - S * 0.25, cy, cx + S * 0.25, cy, cx, cy + S * 0.5, M_BODY);
        } else {
          drawGlyph(c, 'star', cx, cy, S * 0.6 * pl, M_GOLD, M_ACC, t);
        }
        break;
      }
      default: { // spark：菱形旋转 + 双轨道点
        const rot = t * Math.PI / 2;
        drawGlyph(c, 'diamond', cx, cy, S * (1.1 + 0.15 * wave), M_BODY, M_ACC, t);
        for (let o = 0; o < 2; o++) {
          const a = t * Math.PI * 2 + o * Math.PI;
          c.writeDisc(cx + Math.cos(a) * S * 1.5, cy + Math.sin(a) * S * 1.5, 1.6, o ? [255, 224, 120] : [120, 200, 255]);
        }
        void rot;
      }
    }
    if (perf) {
      // 演出级增强：旋转神光 + 彩带屑 + 余焰核
      const rays = 10, rayLen = Math.min(lw, lh) * 0.62;
      for (let rr = 0; rr < rays; rr++) {
        const a = (rr / rays) * Math.PI * 2 + t * Math.PI * 0.5;
        const col: RGB = rr % 2 ? [255, 224, 120] : [140, 190, 255];
        for (let st = 3; st < Math.floor(rayLen / 2); st += 2) {
          c.writeRGB(Math.round(cx + Math.cos(a) * st * 2), Math.round(cy + Math.sin(a) * st * 2), col);
        }
      }
      for (let cf = 0; cf < 12; cf++) {
        const cfx = ((seed >> cf) % lw + cf * 7 + f * 5) % lw;
        const cfy = (f * 11 + cf * 29) % Math.floor(lh * 0.8);
        const cc: RGB = cf % 3 === 0 ? [255, 120, 160] : cf % 3 === 1 ? [120, 220, 160] : [255, 214, 96];
        c.writeDisc(cfx, cfy, 1.6, cc);
      }
      if (arch === 'burst' || arch === 'rise') {
        const after = Math.max(0, t - 0.55) / 0.45;
        if (after > 0) c.writeDisc(cx, cy, S * 0.5 * (1 - after) + 2, [255, 255, 230]);
      }
    }
    prevMat = Int8Array.from(c.mat);
    out.push(c.render(2));
  }
  return out;
}

// ================= 主流程 =================
export function generate(): void {
  const report = JSON.parse(fs.readFileSync(rootPath('data', 'video-report.json'), 'utf8'));
  const slots: Array<{ rel: string; w: number; h: number; group?: string; perf?: boolean }> = (report.rows || []).map((r: any) => ({ rel: r.rel, w: r.w, h: r.h, perf: true }));
  // SANITIZATION 批 1：图集桶（326 文件）补产——bake 全量行减去 video 桶行
  try {
    const bake = JSON.parse(fs.readFileSync(rootPath('data', 'bake-report.json'), 'utf8'));
    const videoRels = new Set(slots.map((s2) => s2.rel));
    for (const row of bake.rows || []) {
      if (!row.ok || videoRels.has(row.rel)) continue;
      slots.push({ rel: row.rel, w: row.w, h: row.h, group: row.group, perf: false });
    }
  } catch { /* bake 报告缺失时仅产视频桶 */ }
  if (!slots.length) { console.error('no slots'); process.exit(1); }
  const outRoot = rootPath('game-assets', 'anims');
  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });
  let written = 0;
  const archCount: Record<string, number> = {};
  const previews: string[] = [];
  for (const s of slots) {
    const slotId = s.rel.replace(/\.pag$/i, '').replace(/\//g, '__');
    const frames = renderSlot(slotId, s.rel, s.w, s.h, s.group, s.perf === true);
    const dir = path.join(outRoot, slotId);
    fs.mkdirSync(dir, { recursive: true });
    frames.forEach((buf, i) => fs.writeFileSync(path.join(dir, `f0${i}.png`), buf));
    written += frames.length;
    const { arch } = classify(s.rel, s.group);
    archCount[arch] = (archCount[arch] ?? 0) + 1;
    if (previews.length < 48) previews.push(path.join(dir, s.perf === false ? 'f03.png' : 'f08.png'));
  }
  // 预览拼板（抽 48 槽的 f03）
  const cols = 8, cell = 104, rows = Math.ceil(previews.length / cols);
  const sheet = new Uint8Array(cols * cell * rows * cell * 4);
  const putS = (x: number, y: number, rgb: RGB) => {
    if (x < 0 || y < 0) return;
    const di = (y * (cols * cell) + x) * 4;
    sheet[di] = rgb[0]; sheet[di + 1] = rgb[1]; sheet[di + 2] = rgb[2]; sheet[di + 3] = 255;
  };
  for (let y = 0; y < rows * cell; y++) for (let x = 0; x < cols * cell; x++) putS(x, y, [22, 24, 34]);
  previews.forEach((f, i) => {
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
  fs.writeFileSync(rootPath('docs', 'ANIM_PREVIEW.png'), encodePNG(cols * cell, rows * cell, sheet));
  console.log(`[gen_slot_animations] ${slots.length} 槽位 × ${FRAMES_N} 帧 = ${written} 帧自制动画 → game-assets/anims/`);
  console.log(`[gen_slot_animations] 原型分布: ${JSON.stringify(archCount)}`);
  console.log('[gen_slot_animations] 预览: docs/ANIM_PREVIEW.png（抽 48 槽 f03 帧）');
}

if (require.main === module) generate();
