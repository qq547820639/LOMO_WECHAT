import { ApiScreen } from './base';
import { UI, Rect } from '../ui/widgets';
import { THEME } from '../core/theme';
import { registerRoute, openFeature } from './registry';
import { BRAND } from '../../../shared/src/brand';
import { FrameClip } from '../ui/frame_clip';

const ISLAND = {
  sky: '#193b45',
  sea: '#20545a',
  wave: '#317076',
  grass: '#719569',
  shore: '#d7b47b',
  rock: '#49645c',
  ink: '#18343c',
  cream: '#f4dfb3',
};

function polygon(ui: UI, points: Array<[number, number]>, color: string): void {
  ui.ctx.fillStyle = color;
  ui.ctx.beginPath();
  points.forEach(([horizontal, vertical], index) => {
    if (index === 0) ui.ctx.moveTo(horizontal, vertical);
    else ui.ctx.lineTo(horizontal, vertical);
  });
  ui.ctx.closePath();
  ui.ctx.fill();
}

export class HomeLobbyScreen extends ApiScreen {
  readonly route = '/home';
  private minerClip: FrameClip | null = null;

  constructor() { super('home', BRAND.homeTitle); }

  onEnter(): Promise<void> {
    if (!this.minerClip && this.app.assets) {
      this.minerClip = new FrameClip(this.app.assets, 'miner', 'idle', { fitHeight: 88, placeholderColor: ISLAND.grass });
      this.minerClip.play();
    }
    return Promise.resolve();
  }

  onExit(): void { this.minerClip = null; }

  private async watchRewarded(slot: 'energy_refill' | 'bonus_chest'): Promise<void> {
    try {
      const issue = await this.app.api.issueRewardedAd(slot);
      if (!issue.ok) { this.app.showToast(issue.message || '当前暂无激励广告'); return; }
      const started = await this.app.api.startRewardedAd(issue.adId, issue.claimToken);
      if (!started.ok) { this.app.showToast(started.message || '广告准备失败'); return; }
      const adConfig = this.app.api.bootstrap?.rewardedAds?.slots?.[slot];
      const ad = this.app.platform.createRewardedAd(adConfig?.adUnitId || issue.adUnitId);
      try {
        await ad.load();
        const result = await ad.show();
        const claimed = await this.app.api.claimRewardedAd(issue.adId, issue.claimToken, result);
        if (!claimed.ok) { this.app.showToast(claimed.message || '广告未完整观看'); return; }
        this.app.handleGameResponse(claimed);
      } finally { ad.destroy(); }
    } catch (error: any) {
      this.app.showToast(error?.message || '广告暂不可用，请稍后重试');
    }
  }

  private drawIsland(ui: UI, area: Rect): void {
    const context = ui.ctx as any;
    context.save();
    context.beginPath();
    context.rect(area.x, area.y, area.w, area.h);
    context.clip();
    context.fillStyle = ISLAND.sky;
    context.fillRect(area.x, area.y, area.w, area.h);
    const horizon = area.y + area.h * 0.48;
    context.fillStyle = ISLAND.sea;
    context.fillRect(area.x, horizon, area.w, area.h);
    context.fillStyle = '#efd49a';
    context.fillRect(area.x + area.w - 55, area.y + 18, 22, 22);
    context.fillStyle = ISLAND.wave;
    for (let waveIndex = 0; waveIndex < 7; waveIndex++) {
      const waveX = area.x + 16 + (waveIndex * 47) % (area.w - 42);
      context.fillRect(waveX, horizon + 15 + (waveIndex % 3) * 20, 22, 2);
    }
    const islandX = area.x + area.w * 0.70;
    const islandY = area.y + area.h - 82;
    polygon(ui, [[islandX - 78, islandY], [islandX - 8, islandY - 36], [islandX + 74, islandY - 8], [islandX + 42, islandY + 29], [islandX - 35, islandY + 35]], ISLAND.rock);
    polygon(ui, [[islandX - 78, islandY - 8], [islandX - 8, islandY - 44], [islandX + 74, islandY - 16], [islandX + 42, islandY + 15], [islandX - 35, islandY + 22]], ISLAND.shore);
    polygon(ui, [[islandX - 66, islandY - 13], [islandX - 8, islandY - 40], [islandX + 62, islandY - 16], [islandX + 35, islandY + 8], [islandX - 31, islandY + 14]], ISLAND.grass);
    context.fillStyle = '#b8966e';
    context.fillRect(islandX - 7, islandY - 14, 12, 25);
    context.fillRect(islandX - 20, islandY - 3, 25, 10);
    const treeX = islandX + 48;
    context.fillStyle = '#bd9667';
    context.fillRect(treeX, islandY - 43, 5, 26);
    polygon(ui, [[treeX - 20, islandY - 44], [treeX + 2, islandY - 65], [treeX + 26, islandY - 41], [treeX + 2, islandY - 49]], '#8eae74');
    this.minerClip?.draw(ui, islandX - 9, islandY - 40, this.app.frameDt);
    context.restore();
  }

  render(): void {
    const ui = this.app.ui as UI;
    const release = this.app.profile === 'wechat-release';
    const compact = ui.h < 590;
    const heroHeight = Math.max(166, Math.min(264, ui.h - 314));
    const hero = { x: 16, y: 76, w: ui.w - 32, h: heroHeight };
    this.drawIsland(ui, hero);
    ui.text('今天，去岛上冒险', 30, hero.y + 31, { size: 22, bold: true, color: ISLAND.cream });
    ui.text('翻开砖块，寻找地下的宝藏', 30, hero.y + 54, { size: 13, color: '#d2e5d9' });
    ui.button({ x: 28, y: hero.y + hero.h - 56, w: ui.w - 56, h: 44 }, release ? '开始虎口逃生  →' : '进入地下城  →', () => openFeature(this.app, release ? 'escapeTiger' : 'undertown'), { color: ISLAND.cream, textColor: ISLAND.ink, size: 16, id: release ? 'core-escapeTiger' : 'core-undertown' });

    const headingY = hero.y + hero.h + 29;
    ui.text('热门玩法', 18, headingY, { size: 18, bold: true });
    ui.text('换一种冒险', ui.w - 101, headingY, { size: 12, color: THEME.textDim });
    const cardTop = headingY + 13;
    const cardHeight = compact ? 62 : 78;
    const cardWidth = (ui.w - 48) / 3;
    const games: Array<{ id: string; title: string; detail: string; mark: string; color: string }> = release ? [
      { id: 'escapeTiger', title: '虎口逃生', detail: '路线 · 生存', mark: '01', color: THEME.accent },
      { id: 'marbles', title: '弹珠', detail: '角度 · 力度', mark: '02', color: THEME.accent2 },
      { id: 'undertown', title: '地下城', detail: '探索 · 奖励', mark: '03', color: THEME.gold },
    ] : [
      { id: 'battleRoyal', title: '大逃杀', detail: '选房 · 生存', mark: '01', color: THEME.accent },
      { id: 'arena', title: '竞技场', detail: '策略 · 对决', mark: '02', color: THEME.accent2 },
      { id: 'apeMine', title: '矿场', detail: '开采 · 养成', mark: '03', color: THEME.gold },
    ];
    games.forEach((game, index) => {
      const cardX = 16 + index * (cardWidth + 8);
      const context = ui.ctx;
      context.fillStyle = THEME.bg2;
      context.fillRect(cardX, cardTop, cardWidth, cardHeight);
      context.fillStyle = game.color;
      context.fillRect(cardX, cardTop, 3, cardHeight);
      ui.text(game.title, cardX + 13, cardTop + 27, { size: 16, bold: true });
      ui.text(game.detail, cardX + 13, cardTop + 48, { size: 11, color: THEME.textDim });
      if (!compact) ui.text(game.mark, cardX + cardWidth - 26, cardTop + 69, { size: 10, color: game.color });
      ui.hits.push({ x: cardX, y: cardTop, w: cardWidth, h: cardHeight, id: 'core-' + game.id, onTap: () => openFeature(this.app, game.id) });
    });

    const routineTop = cardTop + cardHeight + 14;
    const routineWidth = (ui.w - 40) / 2;
    ui.button({ x: 16, y: routineTop, w: routineWidth, h: 46 }, '每日签到  +', () => openFeature(this.app, 'daily'), { color: '#29433d', textColor: '#d9e8bd', size: 14, id: 'core-daily' });
    ui.button({ x: 24 + routineWidth, y: routineTop, w: routineWidth, h: 46 }, '我的卡牌  ›', () => openFeature(this.app, 'cards'), { color: THEME.panel, size: 14, id: 'core-cards' });
    const adTop = routineTop + 56;
    const adWidth = (ui.w - 40) / 2;
    if (adTop + 44 < ui.h - 62) {
      ui.button({ x: 16, y: adTop, w: adWidth, h: 44 }, '看广告 +5体力', () => { void this.watchRewarded('energy_refill'); }, { color: THEME.panel2, textColor: THEME.accent2, size: 12, id: 'ad-energy-refill' });
      ui.button({ x: 24 + adWidth, y: adTop, w: adWidth, h: 44 }, '看广告 +30金币', () => { void this.watchRewarded('bonus_chest'); }, { color: THEME.panel2, textColor: THEME.gold, size: 12, id: 'ad-bonus-chest' });
    }
    const browseTop = adTop + 54;
    if (browseTop + 44 < ui.h - 62) {
      ui.button({ x: 16, y: browseTop, w: ui.w - 32, h: 44 }, '查看全部玩法  →', () => this.app.router.switchTab('games'), { color: THEME.bg, size: 14, textColor: THEME.textDim, id: 'browse-games' });
    }
  }
}

registerRoute('home', () => new HomeLobbyScreen());
