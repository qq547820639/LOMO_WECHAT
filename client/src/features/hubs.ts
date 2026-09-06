/**
 * 五大 Tab 枢纽（藏品 / 猿岛 / 游戏 / 交易 / 我的）。
 * 内容按 data.gen FEATURES 生成；每项显示标题 + 发布策略标签；点击进入对应玩法页。
 * 首页(home tab 内容)增加签到/任务/邮件/公告入口与大逃杀等核心入口快捷方式。
 */
import { Screen } from '../core/router';
import { BRAND } from '../../../shared/src/brand';
import { UI } from '../ui/widgets';
import { THEME, fmtNum } from '../core/theme';
import { featuresForTab, openFeature } from './registry';
import { FEATURES } from '../../../shared/src/gen/data.gen';

const HUB_COPY: Record<string, { section: string; title: string; detail: string; list: string; color: string }> = {
  games: { section: '挑战地图', title: '今天，闯哪一关？', detail: '生存、对战或轻松一局，按你的节奏来', list: '选择挑战', color: THEME.accent },
  ape: { section: '岛屿日志', title: '出发，探索猿岛', detail: '采集、养成与探索，开启下一段旅程', list: '探索路线', color: THEME.gold },
  chaowan: { section: '收藏手册', title: '发现下一位伙伴', detail: '收集卡牌与闪卡，整理你的图鉴', list: '打开收藏', color: THEME.accent2 },
  trade: { section: '岛屿集市', title: '交易中心', detail: '查看市场与收藏交易', list: '可用交易', color: THEME.gold },
};

const FEATURE_NAMES: Record<string, string> = {
  home: '主城大厅', nxArena: '竞技挑战', rocksMonkeyKing: '岩石猴王', profile: '账号设置',
  realName: '健康游戏', superLink: '邀请介绍', customerService: '帮助与消息',
};

function fitText(ui: UI, text: string, size: number, width: number, bold = false): string {
  if (ui.measure(text, size, bold) <= width) return text;
  let trimmed = text;
  while (trimmed && ui.measure(trimmed + '…', size, bold) > width) trimmed = trimmed.slice(0, -1);
  return trimmed + '…';
}

function pixelBadge(ui: UI, horizontal: number, vertical: number, size: number, label: string, color: string): void {
  const context = ui.ctx;
  context.fillStyle = THEME.panel;
  context.fillRect(horizontal + 4, vertical, size - 8, size);
  context.fillRect(horizontal, vertical + 4, size, size - 8);
  context.fillStyle = color;
  context.fillRect(horizontal + 4, vertical, size - 8, 2);
  context.fillRect(horizontal, vertical + 4, 2, 8);
  context.fillRect(horizontal + size - 2, vertical + size - 12, 2, 8);
  context.fillRect(horizontal + 4, vertical + size - 2, size - 8, 2);
  ui.textCenter(label, horizontal + size / 2, vertical + size / 2 + 5, { size: size > 44 ? 22 : 13, color, bold: true });
}

const FEATURE_COPY: Record<string, string> = {
  home: '回到大厅，查看常用玩法', ape: '养成伙伴，提升挑战实力',
  goldMine: '挖掘矿石，再精炼为游戏资源', gacha: '收集萌宠，为它们搭配装备',
  universe: '派出飞船，探索星际', undertown: '翻开砖块，向地下深处前进',
  nxArena: '进入竞技场，迎战强敌', monkeyFight: '选择招式，迎接下一场格斗',
  apeRabbit: '选择技能卡，进行回合对战', battleRoyal: '选择藏身位置，努力生存到最后',
  beast: '迎接动物闯关挑战', tug: '把握节奏，为队伍积累力量',
  marbles: '调整角度和力度，瞄准下一次发射', escapeTiger: '观察局势，选择你的逃生路线',
  punchIn: '完成每日打卡，记录坚持的日子', sports: '挑战速度与反应',
  chicken: '喂养小鸡，等待下一次收获', cards: '收集卡牌，合成新的伙伴',
  flashCard: '查看闪卡，整理你的收藏', profile: '查看账号信息，调整声音设置',
  airship: '派遣飞艇，查看探索记录', rocksMonkeyKing: '挑战猴王，积累赛季积分',
  realName: '查看健康游戏与防沉迷信息', arena: '三回合对战，选择克制对手的行动',
  boss: '迎战首领，争取更高伤害', apeMine: '安排矿坑生产，收取游戏资源',
};

export class HomeHub extends Screen {
  readonly route: string;
  readonly title: string;
  private tab: string;

  constructor(tab: string) {
    super();
    this.tab = tab;
    this.route = '/' + tab;
    this.title = { chaowan: '藏品', ape: '猿岛', games: '游戏', trade: '交易', mine: '我的' }[tab] ?? tab;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    const bottom = this.app.ui.h - 54;
    const feats = featuresForTab(this.tab, this.app.profile);
    const context = ui.ctx as any;
    let y = top + 18;
    const heading = HUB_COPY[this.tab];
    const accent = heading?.color ?? THEME.accent2;
    const entries: Array<[string, string, () => void]> = this.tab === 'mine' ? [
      ['每日签到', 'daily', () => openFeature(this.app, 'daily')],
      ['记录中心', 'records', () => openFeature(this.app, 'records')],
      ['排行榜', 'rank', () => openFeature(this.app, 'rank')],
      ['邮件', 'mail', () => openFeature(this.app, 'mail')],
      ['好友邀请', 'social', () => openFeature(this.app, 'social')],
      ['声音设置', 'profile', () => openFeature(this.app, 'profile')],
    ] : [];

    if (this.tab === 'mine') {
      const player = this.app.player;
      ui.text('冒险者档案', 20, y, { size: 12, bold: true, color: accent });
      ui.text(fitText(ui, player?.nick || '冒险者', 23, ui.w - 120, true), 20, y + 31, { size: 23, bold: true });
      ui.text(player ? `等级 ${player.level} · ${fmtNum(player.xp)} / ${fmtNum(player.xpToNext)} 经验` : '正在读取玩家信息', 20, y + 52, { size: 12, color: THEME.textDim });
      pixelBadge(ui, ui.w - 72, y + 2, 52, '猿', THEME.gold);
      ui.progress(20, y + 64, ui.w - 40, 3, player ? player.xp / Math.max(1, player.xpToNext) : 0, THEME.gold);
      const balances: Array<[string, string]> = [['COIN', '金币'], ['ENERGY', '体力'], ['TICKET', '奖券']];
      const columnWidth = (ui.w - 40) / balances.length;
      balances.forEach(([assetId, label], index) => {
        const horizontal = 20 + index * columnWidth;
        ui.text(player ? fmtNum(player.balances?.[assetId]) : '—', horizontal, y + 91, { size: 18, bold: true, color: THEME.gold });
        ui.text(label, horizontal, y + 110, { size: 12, color: THEME.textDim });
      });
      y += 136;
    }

    if (heading) {
      ui.text(heading.section, 20, y, { size: 12, bold: true, color: accent });
      ui.text(heading.title, 20, y + 35, { size: 23, bold: true });
      const detail = this.tab === 'trade' && this.app.profile === 'wechat-release' ? '当前版本暂未开放玩家交易' : heading.detail;
      ui.text(fitText(ui, detail, 14, ui.w - 40), 20, y + 61, { size: 14, color: THEME.textDim });
      context.fillStyle = accent;
      context.fillRect(20, y + 80, 36, 3);
      context.fillRect(60, y + 80, 8, 3);
      context.fillStyle = THEME.line;
      context.fillRect(74, y + 81, ui.w - 94, 1);
      y += 105;
    }
    if (!feats.length) {
      pixelBadge(ui, ui.w / 2 - 26, y + 12, 52, '↔', accent);
      ui.textCenter('这里还没有可用的交易', ui.w / 2, y + 94, { size: 16, bold: true });
      ui.textCenter('先去岛上探索，或开始一场挑战', ui.w / 2, y + 119, { size: 13, color: THEME.textDim });
      ui.button({ x: 68, y: y + 143, w: ui.w - 136, h: 46 }, '前往游戏', () => this.app.router.switchTab('games'), { color: THEME.accent, textColor: THEME.bg, size: 15, id: 'browse-games' });
      return;
    }

    ui.text(this.tab === 'mine' ? '常用工具' : heading?.list ?? '更多入口', 20, y, { size: 14, bold: true });
    if (this.tab !== 'mine') ui.text(`${feats.length} 项`, ui.w - 54, y, { size: 12, color: THEME.textDim });
    const rowH = 78;
    const listTop = y + 16;
    const listBottom = bottom - 8;
    const toolsHeight = entries.length ? 130 : 0;
    const contentHeight = toolsHeight + feats.length * rowH + (this.tab === 'mine' ? 36 : 0);
    const listHeight = Math.max(0, listBottom - listTop);
    const scrollId = 'hub-' + this.tab;
    const maxOffset = Math.max(0, contentHeight - listHeight);
    const offset = Math.max(0, Math.min(maxOffset, this.app.ui.scrollOffsets[scrollId] ?? 0));
    this.app.ui.scrollOffsets[scrollId] = offset;
    const addHit = (horizontal: number, vertical: number, width: number, height: number, id: string, onTap: () => void): void => {
      const hitTop = Math.max(listTop, vertical);
      const hitBottom = Math.min(listBottom, vertical + height);
      if (hitBottom > hitTop) ui.hits.push({ x: horizontal, y: hitTop, w: width, h: hitBottom - hitTop, onTap, id });
    };
    context.save();
    try {
      context.beginPath();
      context.rect(0, listTop, ui.w, listHeight);
      context.clip();
      const toolWidth = (ui.w - 48) / 3;
      entries.forEach(([label, id, onTap], index) => {
        const horizontal = 20 + (index % 3) * (toolWidth + 4);
        const vertical = listTop + Math.floor(index / 3) * 50 - offset;
        if (vertical + 44 <= listTop || vertical >= listBottom) return;
        context.fillStyle = THEME.bg2;
        context.fillRect(horizontal, vertical, toolWidth, 44);
        context.fillStyle = THEME.line;
        context.fillRect(horizontal + 12, vertical + 42, toolWidth - 24, 2);
        ui.textCenter(label, horizontal + toolWidth / 2, vertical + 28, { size: 14, bold: true });
        addHit(horizontal, vertical, toolWidth, 44, 'tool-' + id, onTap);
      });
      if (entries.length) ui.text('更多设置与服务', 20, listTop + 120 - offset, { size: 14, bold: true });
      for (const [index, feature] of feats.entries()) {
        const rowY = listTop + toolsHeight + index * rowH - offset;
        if (rowY + rowH <= listTop || rowY >= listBottom) continue;
        if (feature.release === 'cut' && this.app.profile === 'wechat-release') continue;
        context.fillStyle = THEME.line;
        context.fillRect(39, rowY, 2, rowH);
        pixelBadge(ui, 20, rowY + 13, 40, String(index + 1).padStart(2, '0'), feature.release === 'defer' ? THEME.textDim : accent);
        const label = FEATURE_NAMES[feature.id] || String(feature.title).split('/')[0];
        ui.text(fitText(ui, label, 17, ui.w - 118, true), 76, rowY + 28, { size: 17, bold: true });
        const description = feature.release === 'defer' ? '查看功能介绍与开放状态' : FEATURE_COPY[feature.id] || '查看详情与可用操作';
        ui.text(fitText(ui, description, 14, ui.w - 100), 76, rowY + 51, { size: 14, color: THEME.textDim });
        ui.text('›', ui.w - 32, rowY + 31, { size: 22, color: accent });
        context.fillStyle = THEME.line;
        context.fillRect(76, rowY + rowH - 7, ui.w - 96, 1);
        addHit(12, rowY, ui.w - 24, rowH - 6, 'f-' + feature.id, () => { this.app.telemetry('feature_enter', { feature: feature.id }); openFeature(this.app, feature.id); });
      }

      if (this.tab === 'mine') {
        const footerY = listTop + toolsHeight + feats.length * rowH - offset + 10;
        if (footerY - 11 >= listTop && footerY <= listBottom) {
          ui.text(BRAND.appName + ' · 健康游戏，适度娱乐', 16, footerY, { size: 11, color: THEME.textDim });
        }
      }
    } finally {
      context.restore();
    }
  }
}

/** 供 registry 使用：FEATURES 列表 */
export { FEATURES };
