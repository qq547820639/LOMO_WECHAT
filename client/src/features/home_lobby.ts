/**
 * 主城大厅（home）—— 原产品一级循环入口：公告 / 签到 / 核心玩法宫格 / 全部功能索引。
 */
import { ApiScreen } from './base';
import { UI } from '../ui/widgets';
import { THEME, fmtNum } from '../core/theme';
import { registerRoute } from './registry';
import { openFeature } from './registry';
import { FEATURES } from '../../../shared/src/gen/data.gen';
import { BRAND } from '../../../shared/src/brand';

export class HomeLobbyScreen extends ApiScreen {
  readonly route = '/home';
  private minerClip: import('../ui/frame_clip').FrameClip | null = null;

  constructor() { super('home', BRAND.homeTitle); }

  onEnter(): Promise<void> {
    // P0-1 图像层常驻展示位：真实 APK 矿工帧序列（缺图时自动占位）
    if (!this.minerClip && this.app.assets) {
      const clip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'miner', 'idle', { fitHeight: 40, placeholderColor: THEME.gold });
      clip.play();
      this.minerClip = clip;
    }
    return super.onEnter();
  }

  onExit(): void { this.minerClip = null; }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    let y = top + 6;
    // 公告
    ui.panel({ x: 12, y, w: ui.w - 24, h: 46 }, THEME.panel2);
    ui.text('📢 ' + BRAND.announcements[0], 24, y + 19, { size: 10, color: THEME.gold });
    ui.text(BRAND.announcements[1], 24, y + 34, { size: 9, color: THEME.textDim });
    this.minerClip?.draw(ui, ui.w - 44, y + 23, this.app.frameDt);
    y += 54;
    // 核心宫格（两行）
    const core: Array<[string, string, string]> = [
      ['battleRoyal', '大逃杀', THEME.accent],
      ['undertown', '地下城', THEME.purple],
      ['arena', '竞技场', THEME.accent2],
      ['apeMine', '矿场', THEME.gold],
      ['cards', '卡牌', THEME.green],
      ['daily', '签到', THEME.accent],
    ];
    const cw = (ui.w - 24 - 2 * 8) / 3;
    core.forEach(([id, label, color], i) => {
      const cx = 12 + (i % 3) * (cw + 8);
      const cy = y + Math.floor(i / 3) * 62;
      ui.panel({ x: cx, y: cy, w: cw, h: 56 }, THEME.panel);
      ui.textCenter(label, cx + cw / 2, cy + 26, { size: 14, bold: true, color });
      ui.textCenter('进入 ›', cx + cw / 2, cy + 44, { size: 9, color: THEME.textDim });
      ui.hits.push({ x: cx, y: cy, w: cw, h: 56, onTap: () => openFeature(this.app, id), id: 'core-' + id });
    });
    y += 62 * 2 + 8;
    // 生态入口（全部 keep/defer 族）
    ui.text('全部功能', 16, y + 12, { size: 13, bold: true });
    y += 18;
    const list = FEATURES.filter((f) => this.app.profile === 'full-clone' || f.release !== 'cut');
    const rw = (ui.w - 24 - 3 * 6) / 4;
    list.forEach((f, i) => {
      const rx = 12 + (i % 4) * (rw + 6);
      const ry = y + Math.floor(i / 4) * 44;
      ui.button({ x: rx, y: ry, w: rw, h: 38 }, f.title.slice(0, 4), () => openFeature(this.app, f.id), { size: 10, color: f.release === 'keep' ? THEME.panel2 : THEME.bg2 });
    });
    y += Math.ceil(list.length / 4) * 44 + 8;
    const p = this.app.player;
    if (p) {
      ui.text(`今日循环: 金币 ${fmtNum(p.balances?.COIN)} · 体力 ${fmtNum(p.balances?.ENERGY)} · 奖券 ${fmtNum(p.balances?.TICKET)}`, 16, y, { size: 10, color: THEME.textDim });
    }
  }
}

registerRoute('home', () => new HomeLobbyScreen());
