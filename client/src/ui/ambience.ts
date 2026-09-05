/**
 * 氛围窗 v2（COMPLETENESS v7）——
 * 独立加载通道（AssetManager.loadStandalone，绕过 LRU）+ 自有 3 槽缓存，
 * 轮换不驱逐屏内正在使用的图集；draw 以指定透明度绘制（由调用方置于屏幕层之上）。
 */
import { THEME } from '../core/theme';

const FAMILY_MAP: Array<[RegExp, string[]]> = [
  [/battleRoyal|killer/i, ['pag__battleRoyal__myself_idle', 'pag__battleRoyal__killer_walk', 'pag__battleRoyal__new_killer']],
  [/boss|challenge/i, ['pag__challenge_boss__boss_circle']],
  [/chicken/i, ['chicken__']],
  [/marbles/i, ['pag__marbles__']],
  [/tug/i, ['tug__']],
  [/sport/i, ['pag__sport__']],
  [/arena|duel/i, ['pag__arena__']],
  [/dress|gacha|strengthen/i, ['pag__dress_medal__', 'pag__strengthen__']],
  [/universe|airship|ship/i, ['pag__airship', 'pag__bg__']],
  [/rob|dagger/i, ['pag__rob__', 'dagger__']],
  [/red|mail/i, ['red_package']],
  [/ape|mine|gold|undertown/i, ['pag__ape__']],
];
const FALLBACK: string[] = ['pag__ape__', 'pag__luckybag', 'marbles__'];

interface Standalone { frames: Array<{ name: string; w: number; h: number }>; frameImages: Map<string, any> }

export class AmbienceWindow {
  private cache = new Map<string, Standalone>();
  private order: string[] = [];
  private current: { id: string; frames: Standalone; idx: number } | null = null;
  private rotateAt = 0;
  private failed = new Set<string>();
  private prefixes: string[] = FALLBACK;
  private idx = 0;

  setFamily(route: string): void {
    for (const [re, prefixes] of FAMILY_MAP) {
      if (re.test(route)) { this.prefixes = prefixes; return; }
    }
    this.prefixes = FALLBACK;
  }

  private async loadStandalone(app: any, slotId: string): Promise<Standalone | null> {
    const hit = this.cache.get(slotId);
    if (hit) return hit;
    try {
      const loaded = await app.assets.loadStandalone(slotId);
      if (!loaded) return null;
      this.cache.set(slotId, loaded);
      this.order.push(slotId);
      while (this.order.length > 3) {
        const old = this.order.shift()!;
        if (old !== slotId) {
          const e = this.cache.get(old);
          if (e) for (const img of e.frameImages.values()) img.destroy?.();
          this.cache.delete(old);
        }
      }
      return loaded;
    } catch { return null; }
  }

  private nextSlotId(app: any): string | null {
    for (let attempt = 0; attempt < this.prefixes.length; attempt++) {
      const prefix = this.prefixes[this.idx % this.prefixes.length];
      this.idx++;
      const slotId = app.assets.resolveSlotId(prefix);
      if (slotId && !this.failed.has(slotId)) return slotId;
      this.failed.add(slotId);
    }
    return null;
  }

  /** 每帧调用：调度 + 绘制。调用方负责层级与透明度 */
  draw(app: any, ui: any, x: number, y: number, size: number, dtMs: number, alpha = 0.9): void {
    if (!app.assets) return;
    const now = Date.now();
    if (now >= this.rotateAt) {
      const slotId = this.nextSlotId(app);
      if (slotId) {
        void this.loadStandalone(app, slotId).then((loaded) => {
          if (!loaded) { this.failed.add(slotId); return; }
          this.current = { id: slotId, frames: loaded, idx: 0 };
          this.rotateAt = now + 3200;
        });
      } else {
        this.rotateAt = now + 1500;
      }
    }
    const cur = this.current;
    if (!cur) return;
    const frames = cur.frames.frames;
    const frame = frames[Math.min(frames.length - 1, cur.idx)] ?? frames[0];
    const img = cur.frames.frameImages.get(frame.name);
    const c = ui.ctx as any;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = THEME.bg2;
    c.fillRect(x, y, size, size);
    c.strokeStyle = THEME.line;
    c.strokeRect(x, y, size, size);
    if (img) {
      const w2 = (size - 8) * (frame.w ?? 64) / Math.max(1, frame.h ?? 64);
      c.imageSmoothingEnabled = false;
      try { c.drawImage(img, x + (size - Math.min(size - 8, w2)) / 2, y + 4, Math.min(size - 8, w2), size - 8); } catch { /* 帧异常忽略 */ }
    }
    c.restore();
    cur.idx = (cur.idx + Math.max(1, Math.round(dtMs / 83))) % frames.length;
  }
}
