"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI = void 0;
exports.shortNum = shortNum;
/**
 * 立即模式 UI 组件库 —— 每帧绘制并注册命中区域，touch 按坐标分发。
 * 支持：按钮 / 面板 / 文本 / 进度条 / 列表滚动 / 弹窗 / Toast / 输入选择。
 */
const theme_1 = require("../core/theme");
class UI {
    constructor(ctx, w, h) {
        this.hits = [];
        this.scrollOffsets = {};
        this.dragY = null;
        this.lastTapAt = 0;
        this.ctx = ctx;
        this.w = w;
        this.h = h;
    }
    beginFrame() { this.hits = []; }
    // ---------- 基础绘制 ----------
    panel(r, color = theme_1.THEME.panel) {
        const c = this.ctx;
        c.fillStyle = color;
        if (c.roundRect) {
            c.beginPath();
            c.roundRect(r.x, r.y, r.w, r.h, theme_1.THEME.radius);
            c.fill();
        }
        else
            c.fillRect(r.x, r.y, r.w, r.h);
    }
    text(t, x, y, opts = {}) {
        var _a, _b, _c;
        const c = this.ctx;
        c.font = `${opts.bold ? 'bold ' : ''}${(_a = opts.size) !== null && _a !== void 0 ? _a : 13}px sans-serif`;
        c.fillStyle = (_b = opts.color) !== null && _b !== void 0 ? _b : theme_1.THEME.text;
        if (opts.align === 'center') {
            const width = (_c = opts.maxWidth) !== null && _c !== void 0 ? _c : this.w;
            // 简单居中：canvas textAlign 不可用时手动测量不可行，按 wx 实现支持 measureText 缺省
            c.fillText(t, x, y);
        }
        else
            c.fillText(t, x, y);
    }
    /** 手动居中（大多数 canvas 实现无 textAlign；用估算字宽） */
    textCenter(t, cx, y, opts = {}) {
        var _a;
        const size = (_a = opts.size) !== null && _a !== void 0 ? _a : 13;
        const width = this.measure(t, size, opts.bold);
        this.text(t, cx - width / 2, y, { size, color: opts.color, bold: opts.bold });
    }
    measure(t, size = 13, bold = false) {
        const anyCtx = this.ctx;
        if (anyCtx.measureText) {
            this.ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
            return anyCtx.measureText(t).width;
        }
        return t.length * size * (bold ? 1.05 : 0.92);
    }
    progress(x, y, w, h, ratio, color = theme_1.THEME.accent2) {
        const c = this.ctx;
        c.fillStyle = theme_1.THEME.panel2;
        c.fillRect(x, y, w, h);
        c.fillStyle = color;
        c.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * w, h);
    }
    /** 图像帧绘制（P0-1）：优先 9 参子矩形；img 为 ImageLike/Canvas。alpha 0-1 */
    image(img, dx, dy, dw, dh, opts = {}) {
        var _a, _b;
        const c = this.ctx;
        if (!img)
            return;
        c.save();
        if (opts.alpha != null)
            c.globalAlpha = opts.alpha;
        if (opts.sx != null)
            c.drawImage(img, opts.sx, opts.sy, (_a = opts.sw) !== null && _a !== void 0 ? _a : dw, (_b = opts.sh) !== null && _b !== void 0 ? _b : dh, dx, dy, dw, dh);
        else
            c.drawImage(img, dx, dy, dw, dh);
        c.restore();
    }
    button(r, label, onTap, opts = {}) {
        var _a, _b, _c, _d;
        const c = this.ctx;
        const color = opts.disabled ? theme_1.THEME.disabled : (_a = opts.color) !== null && _a !== void 0 ? _a : theme_1.THEME.panel2;
        this.panel(r, color);
        c.strokeStyle = opts.disabled ? theme_1.THEME.line : color === theme_1.THEME.panel2 ? theme_1.THEME.line : color;
        c.strokeRect(r.x, r.y, r.w, r.h);
        const size = (_b = opts.size) !== null && _b !== void 0 ? _b : 13;
        this.textCenter(label, r.x + r.w / 2, r.y + r.h / 2 + size * 0.36, { size, color: opts.disabled ? theme_1.THEME.textDim : (_c = opts.textColor) !== null && _c !== void 0 ? _c : theme_1.THEME.text, bold: true });
        if (!opts.disabled)
            this.hits.push({ ...r, onTap, id: (_d = opts.id) !== null && _d !== void 0 ? _d : label });
    }
    // ---------- 触摸分发 ----------
    onTap(x, y) {
        for (let i = this.hits.length - 1; i >= 0; i--) {
            const hit = this.hits[i];
            if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) {
                const now = Date.now();
                if (now - this.lastTapAt > 250) {
                    this.lastTapAt = now;
                    hit.onTap();
                }
                return;
            }
        }
    }
    // ---------- 滚动列表容器 ----------
    scrollArea(id, area, contentHeight, drawContent) {
        var _a;
        const c = this.ctx;
        c.fillStyle = theme_1.THEME.bg;
        c.fillRect(area.x, area.y, area.w, area.h);
        const offset = (_a = this.scrollOffsets[id]) !== null && _a !== void 0 ? _a : 0;
        const maxOffset = Math.max(0, contentHeight - area.h);
        const clamped = Math.max(0, Math.min(maxOffset, offset));
        this.scrollOffsets[id] = clamped;
        c.fillStyle = theme_1.THEME.panel;
        drawContent(area.y - clamped);
    }
    handleDrag(id, startY, endY) {
        var _a;
        const cur = (_a = this.scrollOffsets[id]) !== null && _a !== void 0 ? _a : 0;
        this.scrollOffsets[id] = cur - (endY - startY);
    }
    // ---------- 弹窗 / Toast（由 App 管理） ----------
    modal(title, lines, onClose, actions = []) {
        const c = this.ctx;
        c.fillStyle = 'rgba(0,0,0,0.62)';
        c.fillRect(0, 0, this.w, this.h);
        const mw = this.w - 48;
        const mh = 96 + lines.length * 20 + (actions.length ? 62 : 0);
        const r = { x: 24, y: (this.h - mh) / 2, w: mw, h: mh };
        this.panel(r, theme_1.THEME.panel);
        this.textCenter(title, this.w / 2, r.y + 30, { size: 17, bold: true, color: theme_1.THEME.gold });
        lines.forEach((l, i) => this.text(l, r.x + 16, r.y + 60 + i * 20, { size: 13, color: theme_1.THEME.text }));
        if (!actions.length) {
            this.button({ x: r.x + 16, y: r.y + r.h - 46, w: r.w - 32, h: 34 }, '知道了', onClose, { color: theme_1.THEME.accent2 });
        }
        else {
            const bw = (r.w - 32 - 8 * (actions.length - 1)) / actions.length;
            actions.forEach((a, i) => { var _a; return this.button({ x: r.x + 16 + i * (bw + 8), y: r.y + r.h - 46, w: bw, h: 34 }, a.label, a.onTap, { color: (_a = a.color) !== null && _a !== void 0 ? _a : theme_1.THEME.accent2 }); });
        }
    }
}
exports.UI = UI;
function shortNum(v) { return (0, theme_1.fmtNum)(v !== null && v !== void 0 ? v : 0); }
