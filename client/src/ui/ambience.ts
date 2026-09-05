/**
 * 氛围窗（COMPLETENESS v6 · 资产利用率处置）——
 * 将 535 自制动画槽位按玩法家族轮播接入每一屏的右下氛围窗，
 * 消灭"入库但永不可见"的死资产维度。加载失败自动跳下一槽。
 */
import { FrameClip } from './frame_clip';
import { THEME } from '../core/theme';

const FAMILY_MAP: Array<[RegExp, string[]]> = [
  [/battleRoyal|killer/i, ['pag__battleRoyal__myself_idle', 'pag__battleRoyal__killer_walk', 'pag__battleRoyal__new_killer']],
  [/boss|challenge/i, ['pag__challenge_boss__boss_circle', 'pag__challenge_boss']],
  [/chicken/i, ['pag__chicken__']],
  [/marbles/i, ['pag__marbles__']],
  [/tug/i, ['tug__']],
  [/sport/i, ['pag__sport__']],
  [/arena|duel/i, ['pag__arena__']],
  [/dress|gacha|strengthen/i, ['pag__dress_medal__', 'pag__strengthen__']],
  [/universe|airship|ship/i, ['pag__airship', 'pag__bg__']],
  [/warcraft/i, ['pag__ape__']],
  [/rob|dagger/i, ['pag__rob__', 'dagger__']],
  [/red|mail/i, ['pag__red_package']],
  [/ape|mine|gold|undertown/i, ['pag__ape__']],
];

const FALLBACK: string[] = ['pag__ape__', 'pag__bg__', 'pag__luckybag', 'marbles__'];

export class AmbienceWindow {
  private clip: FrameClip | null = null;
  private clipSlot = '';
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

  /** 每帧调用：负责轮播调度与绘制（右下角 72×72 窗口） */
  draw(app: any, ui: any, x: number, y: number, size: number, dtMs: number): void {
    if (!app.assets) return;
    const now = Date.now();
    if ((!this.clip || this.clip.state.failed || now >= this.rotateAt) && now >= this.rotateAt) {
      // 轮换到家族内下一个可用槽位
      for (let attempt = 0; attempt < this.prefixes.length + 1; attempt++) {
        const prefix = this.prefixes[this.idx % this.prefixes.length];
        this.idx++;
        const slotId = app.assets.resolveSlotId(prefix);
        if (this.failed.has(slotId)) continue;
        try {
          const clip = new FrameClip(app.assets, slotId, 'launch', { loop: true, fitHeight: size - 10 });
          clip.play();
          this.clip = clip;
          this.clipSlot = slotId;
          this.rotateAt = now + 3200;
          break;
        } catch {
          this.failed.add(slotId);
        }
      }
    }
    if (!this.clip) return;
    // 窗框
    const c = ui.ctx as any;
    c.fillStyle = THEME.bg2;
    c.fillRect(x, y, size, size);
    c.strokeStyle = THEME.line;
    c.strokeRect(x, y, size, size);
    this.clip.draw(ui, x + size / 2, y + size / 2, dtMs);
  }
}
