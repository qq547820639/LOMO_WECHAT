/**
 * 立即模式 UI 组件库 —— 每帧绘制并注册命中区域，touch 按坐标分发。
 * 支持：按钮 / 面板 / 文本 / 进度条 / 列表滚动 / 弹窗 / Toast / 输入选择。
 */
import { THEME, fmtNum } from '../core/theme';

export interface Rect { x: number; y: number; w: number; h: number }

type Draw = {
  fillStyle: string; strokeStyle: string; font: string; globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(t: string, x: number, y: number): void;
  beginPath(): void; moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; arc(x: number, y: number, r: number, a: number, b: number): void; fill(): void; stroke(): void; closePath(): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  roundRect?(x: number, y: number, w: number, h: number, r: number): void;
  /** P0-1 图像层：9 参子矩形贴图（图集帧）；3/5 参整图形式亦可用 */
  drawImage(img: unknown, a: number, b: number, c?: number, d?: number, e?: number, f?: number, g?: number, h2?: number): void;
  save(): void; restore(): void;
};

export class UI {
  ctx: Draw;
  w: number;
  h: number;
  hits: Array<Rect & { onTap: () => void; id: string }> = [];
  scrollOffsets: Record<string, number> = {};
  private dragY: number | null = null;
  private lastTapAt = 0;

  constructor(ctx: Draw, w: number, h: number) {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
  }

  beginFrame(): void { this.hits = []; }

  // ---------- 基础绘制 ----------
  panel(r: Rect, color = THEME.panel): void {
    const c = this.ctx;
    c.fillStyle = color;
    if (c.roundRect) { c.beginPath(); c.roundRect(r.x, r.y, r.w, r.h, THEME.radius); c.fill(); }
    else c.fillRect(r.x, r.y, r.w, r.h);
  }

  text(t: string, x: number, y: number, opts: { size?: number; color?: string; bold?: boolean; align?: 'left' | 'center' | 'right'; maxWidth?: number } = {}): void {
    const c = this.ctx;
    c.font = `${opts.bold ? 'bold ' : ''}${opts.size ?? 13}px sans-serif`;
    c.fillStyle = opts.color ?? THEME.text;
    if (opts.align === 'center') {
      const width = opts.maxWidth ?? this.w;
      // 简单居中：canvas textAlign 不可用时手动测量不可行，按 wx 实现支持 measureText 缺省
      c.fillText(t, x, y);
    } else c.fillText(t, x, y);
  }

  /** 手动居中（大多数 canvas 实现无 textAlign；用估算字宽） */
  textCenter(t: string, cx: number, y: number, opts: { size?: number; color?: string; bold?: boolean } = {}): void {
    const size = opts.size ?? 13;
    const width = this.measure(t, size, opts.bold);
    this.text(t, cx - width / 2, y, { size, color: opts.color, bold: opts.bold });
  }

  measure(t: string, size = 13, bold = false): number {
    const anyCtx = this.ctx as any;
    if (anyCtx.measureText) {
      this.ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
      return anyCtx.measureText(t).width;
    }
    return t.length * size * (bold ? 1.05 : 0.92);
  }

  progress(x: number, y: number, w: number, h: number, ratio: number, color = THEME.accent2): void {
    const c = this.ctx;
    c.fillStyle = THEME.panel2;
    c.fillRect(x, y, w, h);
    c.fillStyle = color;
    c.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * w, h);
  }

  /** 图像帧绘制（P0-1）：优先 9 参子矩形；img 为 ImageLike/Canvas。alpha 0-1 */
  image(img: unknown, dx: number, dy: number, dw: number, dh: number, opts: { sx?: number; sy?: number; sw?: number; sh?: number; alpha?: number } = {}): void {
    const c = this.ctx as any;
    if (!img) return;
    c.save();
    if (opts.alpha != null) c.globalAlpha = opts.alpha;
    if (opts.sx != null) c.drawImage(img, opts.sx, opts.sy, opts.sw ?? dw, opts.sh ?? dh, dx, dy, dw, dh);
    else c.drawImage(img, dx, dy, dw, dh);
    c.restore();
  }

  button(r: Rect, label: string, onTap: () => void, opts: { color?: string; textColor?: string; size?: number; disabled?: boolean; id?: string } = {}): void {
    const c = this.ctx;
    const color = opts.disabled ? THEME.disabled : opts.color ?? THEME.panel2;
    this.panel(r, color);
    const size = opts.size ?? 13;
    this.textCenter(label, r.x + r.w / 2, r.y + r.h / 2 + size * 0.36, { size, color: opts.disabled ? THEME.textDim : opts.textColor ?? THEME.text, bold: true });
    if (!opts.disabled) this.hits.push({ ...r, onTap, id: opts.id ?? label });
  }

  // ---------- 触摸分发 ----------
  onTap(x: number, y: number): void {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const hit = this.hits[i];
      if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) {
        const now = Date.now();
        if (now - this.lastTapAt > 250) { this.lastTapAt = now; hit.onTap(); }
        return;
      }
    }
  }

  // ---------- 滚动列表容器 ----------
  scrollArea(id: string, area: Rect, contentHeight: number, drawContent: (y0: number) => void): void {
    const c = this.ctx;
    c.fillStyle = THEME.bg;
    c.fillRect(area.x, area.y, area.w, area.h);
    const offset = this.scrollOffsets[id] ?? 0;
    const maxOffset = Math.max(0, contentHeight - area.h);
    const clamped = Math.max(0, Math.min(maxOffset, offset));
    this.scrollOffsets[id] = clamped;
    c.fillStyle = THEME.panel;
    drawContent(area.y - clamped);
  }

  handleDrag(id: string, startY: number, endY: number): void {
    const cur = this.scrollOffsets[id] ?? 0;
    this.scrollOffsets[id] = cur - (endY - startY);
  }

  // ---------- 弹窗 / Toast（由 App 管理） ----------
  modal(title: string, lines: string[], onClose: () => void, actions: { label: string; onTap: () => void; color?: string }[] = []): void {
    this.hits = [];
    const c = this.ctx;
    c.fillStyle = 'rgba(0,0,0,0.62)';
    c.fillRect(0, 0, this.w, this.h);
    const mw = this.w - 48;
    const mh = 96 + lines.length * 20 + (actions.length ? 62 : 0);
    const r = { x: 24, y: (this.h - mh) / 2, w: mw, h: mh };
    this.panel(r, THEME.panel);
    this.textCenter(title, this.w / 2, r.y + 30, { size: 17, bold: true, color: THEME.gold });
    lines.forEach((l, i) => this.text(l, r.x + 16, r.y + 60 + i * 20, { size: 13, color: THEME.text }));
    if (!actions.length) {
      this.button({ x: r.x + 16, y: r.y + r.h - 46, w: r.w - 32, h: 34 }, '知道了', onClose, { color: THEME.accent2 });
    } else {
      const bw = (r.w - 32 - 8 * (actions.length - 1)) / actions.length;
      actions.forEach((a, i) => this.button({ x: r.x + 16 + i * (bw + 8), y: r.y + r.h - 46, w: bw, h: 34 }, a.label, a.onTap, { color: a.color ?? THEME.accent2 }));
    }
  }
}

export function shortNum(v: number | undefined): string { return fmtNum(v ?? 0); }
