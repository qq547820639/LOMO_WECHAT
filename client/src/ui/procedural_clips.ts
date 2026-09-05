/**
 * 程序化特效动画（SANITIZATION_ASSESSMENT P0-2 处置）——
 * 原版 PAG 烘焙图集的**自制替代**：纯 Canvas 矢量绘制，零贴图、零派生内容。
 * 接口与 FrameClip 对齐（draw/play/reset/state），调用方无感切换。
 */
import { UI } from './widgets';
import { THEME } from '../core/theme';

export class LaunchPulse {
  private playhead = 0;
  private total = 420; // ms
  playing = false;
  finished = false;

  play(): void {
    if (this.finished) this.reset();
    this.playing = true;
  }
  reset(): void {
    this.playhead = 0;
    this.finished = false;
  }
  stop(): void { this.playing = false; }

  update(dtMs: number): void {
    if (!this.playing || this.finished) return;
    this.playhead += dtMs;
    if (this.playhead >= this.total) {
      this.playhead = this.total;
      this.finished = true;
      this.playing = false;
    }
  }

  /** 发射脉冲：三层扩散圆环 + 加速线（中线为起点，向右上方射出） */
  draw(ui: UI, cx: number, cy: number, dtMs = 16.7): void {
    this.update(dtMs);
    const c = ui.ctx;
    const t = Math.min(1, this.playhead / this.total); // 0→1
    const ease = 1 - (1 - t) * (1 - t);
    c.save();
    // 三层环
    for (let i = 0; i < 3; i++) {
      const rt = Math.max(0, Math.min(1, t * 1.4 - i * 0.18));
      const r = 4 + rt * (26 + i * 9);
      c.globalAlpha = Math.max(0, 1 - rt) * (0.85 - i * 0.22);
      c.strokeStyle = i === 0 ? THEME.gold : i === 1 ? THEME.accent : THEME.accent2;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
    }
    // 射出弹丸（菱形，沿 45° 方向飞出）
    const fly = ease * 46;
    c.globalAlpha = 1 - t * 0.4;
    c.fillStyle = THEME.gold;
    const px2 = cx + fly, py2 = cy - fly;
    c.beginPath();
    c.moveTo(px2, py2 - 5); c.lineTo(px2 + 5, py2); c.lineTo(px2, py2 + 5); c.lineTo(px2 - 5, py2);
    c.closePath(); c.fill();
    // 拖尾
    c.globalAlpha = (1 - t) * 0.5;
    for (let k = 1; k <= 3; k++) {
      const tk = Math.max(0, fly - k * 9);
      c.fillStyle = k % 2 ? THEME.accent : THEME.accent2;
      c.fillRect(cx + tk - 2, cy - tk - 2, 4, 4);
    }
    c.restore();
  }

  get state(): { playing: boolean; finished: boolean } {
    return { playing: this.playing, finished: this.finished };
  }
}
