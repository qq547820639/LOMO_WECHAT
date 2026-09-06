/**
 * P0-1 FrameClip —— 帧动画播放器（对应 PAG_BAKE_PLAN.md 执行表 P0-1②）。
 *
 * - 数据源：AssetManager 的 AtlasEntry（packed atlas 子矩形 / 逐帧文件两形态）
 * - 帧事件驱动：onFrame(frameIndex) / onDone()（一次性 clip，如 doorBreak/boxOpen）
 * - 图集未就绪/缺图：程序化占位（脉冲色块 + clip 名），绝不阻塞 UI 帧
 * - 输出仍走每帧绘制，无事件穿透（风险表第 3 条）
 */
import { UI } from './widgets';
import { THEME } from '../core/theme';
import { AssetManager, LoadedAtlas } from '../core/assets';

export interface FrameClipOpts {
  fps?: number;
  loop?: boolean;
  scale?: number;
  /** 按高度自适应缩放（加载后按首帧实际高度换算），优先于 scale */
  fitHeight?: number;
  onFrame?: (index: number) => void;
  onDone?: () => void;
  placeholderColor?: string;
}

export class FrameClip {
  private clip: string;
  private assets: AssetManager;
  private loaded: LoadedAtlas | null = null;
  private loadFailed = false;
  private playheadMs = 0;
  private frameDurations: number[] = [];
  private totalMs = 0;
  playing = false;
  finished = false;
  private opts: FrameClipOpts;

  constructor(assets: AssetManager, atlasId: string, clipName: string, opts: FrameClipOpts = {}) {
    this.assets = assets;
    this.clip = clipName;
    this.opts = { fps: 12, loop: true, scale: 1, ...opts };
    // 异步取图集；期间 draw() 走占位
    assets.getAtlas(atlasId).then((a) => {
      if (a) {
        this.loaded = a;
        this.computeDurations();
        if (this.playing) this.playheadMs = 0;
      } else {
        this.loadFailed = true;
      }
    }).catch(() => { this.loadFailed = true; });
  }

  private entryFrames() { return this.loaded?.entry.frames ?? []; }

  private computeDurations(): void {
    const fps = this.loaded!.entry.fps ?? this.opts.fps ?? 12;
    this.frameDurations = this.entryFrames().map((f) => (f.dur ?? Math.round(1000 / fps)));
    const { start, names } = this.framesForClip();
    this.totalMs = names.reduce((sum, _name, i) => sum + this.frameDurations[start + i], 0);
  }

  /** 只取本 clip 命名的帧子序列（frame name 以 `${clip}:` 前缀约定，或整图集即该 clip） */
  private framesForClip(): { names: string[]; start: number } {
    const frames = this.entryFrames();
    const prefixed = frames.map((f, i) => ({ f, i })).filter(({ f }) => f.name.startsWith(`${this.clip}:`));
    if (prefixed.length) return { names: prefixed.map(({ f }) => f.name), start: prefixed[0].i };
    return { names: frames.map((f) => f.name), start: 0 };
  }

  play(): void {
    if (this.finished && !this.opts.loop) this.reset();
    this.playing = true;
  }

  stop(): void { this.playing = false; }

  reset(): void {
    this.playheadMs = 0;
    this.finished = false;
  }

  /** 每帧推进（dt 毫秒）；loop=false 播完触发 onDone 并停；帧号变化触发 onFrame */
  update(dtMs: number): void {
    if (!this.loaded || !this.playing || this.finished || this.totalMs <= 0) return;
    this.playheadMs += dtMs;
    if (this.playheadMs >= this.totalMs) {
      if (this.opts.loop) {
        this.playheadMs %= this.totalMs;
      } else {
        this.playheadMs = this.totalMs - 1;
        this.finished = true;
        this.playing = false;
        this.opts.onDone?.();
      }
    }
    const idx = this.frameIndex;
    if (idx !== this.lastFrameIndex) {
      this.lastFrameIndex = idx;
      this.opts.onFrame?.(idx);
    }
  }

  private lastFrameIndex = -1;

  get frameIndex(): number {
    if (!this.loaded || this.totalMs <= 0) return 0;
    const { names, start } = this.framesForClip();
    let acc = 0;
    for (let i = 0; i < names.length; i++) {
      acc += this.frameDurations[start + i];
      if (this.playheadMs < acc) return i;
    }
    return Math.max(0, names.length - 1);
  }

  /** 绘制到 UI（逻辑坐标）。x,y 为中心点；缺图时画占位 */
  draw(ui: UI, cx: number, cy: number, dtMs = 16.7): void {
    this.update(dtMs);
    let scale = this.opts.scale ?? 1;
    const first = this.entryFrames()[0];
    if (this.loaded && this.opts.fitHeight && first?.h) scale = this.opts.fitHeight / first.h;
    if (!this.loaded) {
      // 占位：脉冲色块
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
      const size = 28 + 6 * pulse;
      ui.ctx.fillStyle = this.loadFailed ? THEME.disabled : (this.opts.placeholderColor ?? THEME.panel2);
      ui.ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      ui.ctx.strokeStyle = THEME.line;
      ui.ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
      ui.text(this.clip.slice(0, 8), cx - size / 2 + 2, cy + size / 2 + 10, { size: 8, color: THEME.textDim });
      if (this.loadFailed) return;
    }
    const { names, start } = this.framesForClip();
    if (!names.length) return;
    const idx = Math.min(names.length - 1, this.frameIndex);
    const frame = this.entryFrames()[start + idx];
    if (!frame) return;
    const dw = frame.w * scale;
    const dh = frame.h * scale;
    if (this.loaded!.sheet) {
      ui.image(this.loaded!.sheet, cx - dw / 2, cy - dh / 2, dw, dh, { sx: frame.x ?? 0, sy: frame.y ?? 0, sw: frame.w, sh: frame.h });
    } else {
      const img = this.loaded!.frameImages?.get(frame.name);
      if (img) ui.image(img, cx - dw / 2, cy - dh / 2, dw, dh);
    }
  }

  /** 单测/断言用 */
  get state(): { playing: boolean; finished: boolean; frame: number; loaded: boolean; failed: boolean } {
    return { playing: this.playing, finished: this.finished, frame: this.frameIndex, loaded: !!this.loaded, failed: this.loadFailed };
  }
}
