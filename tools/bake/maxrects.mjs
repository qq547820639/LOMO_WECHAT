/**
 * MaxRects 在线图集打包器（P0-3）—— 单实现双端共用（纯 JS + JSDoc，浏览器 ESM / Node 动态 import）：
 *   - 浏览器：render.html `import { Sheet, selectFrames, classifyVideoBucket } from '/lib/maxrects.mjs'`
 *   - Node：tests/unit_pack.ts `await import(pathToFileURL(...))`（纯算法单测）
 *
 * 算法：MaxRects-BSSF（best-short-side-fit），在线插入（帧到达即放置，不回溯）。
 * 不启用旋转：FrameClip 客户端按 axis-aligned 子矩形绘制，旋转会破坏 dur 语义与渲染路径。
 * 满页判定由调用方负责（insert 返回 null 即当前 sheet 放不下）。
 */

/**
 * @param {number} width
 * @param {number} height
 */
export class Sheet {
  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
    /** @type {Array<{x:number,y:number,w:number,h:number}>} */
    this.free = [{ x: 0, y: 0, w: width, h: height }];
    /** @type {Array<{x:number,y:number,w:number,h:number,tag?:string}>} */
    this.placed = [];
  }

  usedArea() {
    return this.placed.reduce((s, p) => s + p.w * p.h, 0);
  }

  occupancy() {
    return this.usedArea() / (this.width * this.height);
  }

  /**
   * 放置一个 w×h 矩形；成功返回 {x,y}，放不下返回 null。
   * BSSF：所有可容纳自由矩形中，选「放置后剩余短边最小」者（次选长边）。
   * @param {number} w @param {number} h @param {string=} tag
   */
  insert(w, h, tag) {
    if (w <= 0 || h <= 0 || w > this.width || h > this.height) return null;
    let best = -1;
    let bestShort = Infinity;
    let bestLong = Infinity;
    for (let i = 0; i < this.free.length; i++) {
      const f = this.free[i];
      if (f.w < w || f.h < h) continue;
      const leftoverH = f.w - w;
      const leftoverV = f.h - h;
      const shortSide = Math.min(leftoverH, leftoverV);
      const longSide = Math.max(leftoverH, leftoverV);
      if (shortSide < bestShort || (shortSide === bestShort && longSide < bestLong)) {
        best = i;
        bestShort = shortSide;
        bestLong = longSide;
      }
    }
    if (best < 0) return null;
    const f = this.free[best];
    const pos = { x: f.x, y: f.y };
    this.placed.push({ x: pos.x, y: pos.y, w, h, tag });
    // 切分所有与放置矩形相交的自由矩形
    const px = pos.x, py = pos.y, pw = w, ph = h;
    const nextFree = [];
    for (const fr of this.free) {
      for (const part of splitFreeRect(fr, { x: px, y: py, w: pw, h: ph })) nextFree.push(part);
    }
    this.free = pruneContained(nextFree);
    return pos;
  }
}

/**
 * 自由矩形对放置矩形的 MaxRects 切分（最多产生 4 个子矩形）
 * @param {{x:number,y:number,w:number,h:number}} fr
 * @param {{x:number,y:number,w:number,h:number}} r
 */
function splitFreeRect(fr, r) {
  if (r.x >= fr.x + fr.w || r.x + r.w <= fr.x || r.y >= fr.y + fr.h || r.y + r.h <= fr.y) return [fr];
  const out = [];
  if (r.y > fr.y) out.push({ x: fr.x, y: fr.y, w: fr.w, h: r.y - fr.y });
  if (r.y + r.h < fr.y + fr.h) out.push({ x: fr.x, y: r.y + r.h, w: fr.w, h: fr.y + fr.h - (r.y + r.h) });
  if (r.x > fr.x) out.push({ x: fr.x, y: fr.y, w: r.x - fr.x, h: fr.h });
  if (r.x + r.w < fr.x + fr.w) out.push({ x: r.x + r.w, y: fr.y, w: fr.x + fr.w - (r.x + r.w), h: fr.h });
  return out;
}

/**
 * 移除被其他自由矩形完全包含的项（MaxRects prune）
 * @param {Array<{x:number,y:number,w:number,h:number}>} rects
 */
function pruneContained(rects) {
  const out = [];
  for (let i = 0; i < rects.length; i++) {
    const a = rects[i];
    let contained = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      const b = rects[j];
      if (b.x <= a.x && b.y <= a.y && b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h) {
        if (b.w * b.h > a.w * a.h || (b.w * b.h === a.w * a.h && j < i)) { contained = true; break; }
      }
    }
    if (!contained) out.push(a);
  }
  return out;
}

/**
 * 降采样选帧（策略表 12-20fps）：stride = max(1, round(srcFps / targetFps))。
 * @param {number} naturalFrames @param {number} srcFps @param {number} targetFps @param {number} capFrames
 * @returns {number[]}
 */
export function selectFrames(naturalFrames, srcFps, targetFps, capFrames) {
  const stride = Math.max(1, Math.round((srcFps || targetFps) / Math.max(1, targetFps)));
  const out = [];
  for (let i = 0; i < naturalFrames && out.length < capFrames; i += stride) out.push(i);
  return out;
}

/**
 * 超大件分类（mp4 远端视频桶）：
 *  - 单帧最长边 > sheetSize/2（无法 2×2 平铺，图集占用率必然 <50%，如 800×1100 竖屏大帧）；
 *  - 单帧面积 > 1MP；
 *  - 降采样后总帧面积 > 6 张 sheet。
 * @param {number} w @param {number} h @param {number} selectedFrames @param {number=} sheetSize
 * @returns {boolean}
 */
export function classifyVideoBucket(w, h, selectedFrames, sheetSize) {
  const S = sheetSize || 2048;
  if (Math.max(w, h) > S / 2) return true;
  if (w * h > 1024 * 1024) return true;
  return w * h * selectedFrames > S * S * 6;
}
