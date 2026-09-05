/**
 * 战斗族屏幕：大逃杀 / 地下城 / 竞技场 / Boss / 斗猿 / 猿兔 / 匕首 / 抢夺。
 * 全部真实交互：房间选择、修门/换房、砖块点选、三回合行为克制、时机输入。
 */
import { ApiScreen } from './base';
import { UI } from '../ui/widgets';
import { THEME, fmtNum, fmtTime } from '../core/theme';
import { registerRoute } from './registry';

// ---------------- 大逃杀 ----------------
export class BattleRoyalScreen extends ApiScreen {
  readonly route = '/battleRoyal';
  private roomId = 2;
  private sessionId: string | null = null;
  private feed: string[] = [];
  private avatarClip: any = null;

  private avatarFor(): any {
    const tone = ((this.app.player?.counters?.['arena.streak'] ?? 0) >= 3) ? 'gold' : 'normal';
    try { return new (require('../ui/frame_clip').FrameClip)(this.app.assets, `pag__battleRoyal__myself_idle_${tone}`, 'launch', { loop: true, fitHeight: 40 }); } catch { return null; }
  }

  constructor() { super('battleRoyal', '大逃杀'); }

  protected async fetchState(): Promise<any> {
    const r = await this.app.api.gameState('battleRoyal');
    if (r.ok && r.state?.active?.sessionId) {
      this.sessionId = r.state.active.sessionId;
    } else if (r.ok && !r.state?.active) {
      this.sessionId = null;
    }
    return r;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;

    if (!this.sessionId) {
      // 大厅：规则 + 房间选择
      ui.panel({ x: 12, y, w: ui.w - 24, h: 74 }, THEME.panel);
      ui.text(`门票 ${st.lobby.entryCostCoin} 金币 · ${st.lobby.roomCount} 个房间 · 门耐久 ${st.lobby.baseDoorHp}`, 24, y + 20, { size: 12 });
      ui.text(`杀手每轮撞击门 · 门破房间淘汰 · 幸存按投入分池(手续费 ${(st.lobby.feeRate * 100).toFixed(0)}%)`, 24, y + 38, { size: 10, color: THEME.textDim });
      ui.text(`败方房间按 ${(st.lobby.daggerLossRatio * 100).toFixed(0)}% 铸造匕首 · 赛季积分结算`, 24, y + 56, { size: 10, color: THEME.textDim });
      y += 82;
      ui.text('选择你的房间（杀手来之前修门或换房）', 16, y + 14, { size: 12, color: THEME.textDim });
      y += 22;
      const bw = (ui.w - 24 - 10) / 3;
      for (let i = 1; i <= st.lobby.roomCount; i++) {
        const bx = 12 + ((i - 1) % 3) * (bw + 5);
        const by = y + Math.floor((i - 1) / 3) * 56;
        const active = this.roomId === i;
        ui.button({ x: bx, y: by, w: bw, h: 48 }, `${i} 号房`, () => { this.roomId = i; }, {
          color: active ? THEME.accent : THEME.panel2, size: 13,
        });
      }
      y += Math.ceil(st.lobby.roomCount / 3) * 56 + 8;
      ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, `进入 ${this.roomId} 号房间（门票 ${st.lobby.entryCostCoin}）`, async () => {
        const s = await this.app.api.post('/v1/game/session/start', { featureId: 'battleRoyal' });
        if (!s.ok) { this.app.showToast(s.message); return; }
        const r = await this.app.api.action('battleRoyal', 'join', { roomId: this.roomId }, s.sessionId, 1);
        if (r.ok) { this.sessionId = s.sessionId; this.feed = [r.message]; }
        else this.app.showToast(r.message);
        await this.onEnter();
      }, { color: THEME.accent });
      y += 56;
    } else {
      if (!this.avatarClip) this.avatarClip = this.avatarFor();
      this.avatarClip?.draw(ui, 30, y + 26, this.app.frameDt);
      // 局内：房间门耐久 + 事件流 + 行动
      const data = st.active?.data;
      const rooms = data?.rooms ?? [];
      ui.panel({ x: 12, y, w: ui.w - 24, h: 30 }, THEME.panel2);
      ui.text(`第 ${data?.round ?? 0} 轮 · 你的房间 ${data?.playerRoom ?? '-'} · 奖池 ${fmtNum(data?.pool ?? 0)}`, 24, y + 20, { size: 12, bold: true, color: THEME.gold });
      y += 38;
      const bw = (ui.w - 24 - 10) / 3;
      const bc = this.app.ui.ctx;
      rooms.forEach((room: any, i: number) => {
        const bx = 12 + (i % 3) * (bw + 5);
        const by = y + Math.floor(i / 3) * 58;
        const mine = room.id === data?.playerRoom;
        ui.panel({ x: bx, y: by, w: bw, h: 52 }, room.alive ? THEME.panel : THEME.bg2);
        const doorW = 14, doorH = 34, dx = bx + 8, dy = by + 9;
        bc.fillStyle = room.alive ? (mine ? '#5a4632' : '#4a3a28') : '#2a2a30';
        bc.fillRect(dx, dy, doorW, doorH);
        bc.strokeStyle = mine ? THEME.gold : THEME.line;
        bc.strokeRect(dx, dy, doorW, doorH);
        if (room.alive) {
          const hpR = Math.max(0, Math.min(1, room.doorHp / (room.maxDoorHp || 100)));
          bc.fillStyle = hpR > 0.5 ? THEME.green : hpR > 0.2 ? THEME.gold : THEME.red;
          bc.fillRect(dx + doorW + 3, dy + doorH * (1 - hpR), 4, doorH * hpR);
          bc.fillStyle = THEME.gold;
          bc.fillRect(dx + doorW - 4, dy + doorH / 2, 2, 2);
        } else {
          ui.text('✝', dx + doorW / 2 - 4, dy + doorH / 2 + 4, { size: 12, color: THEME.red });
        }
        ui.text(`${room.id}号${mine ? '(你)' : ''}`, bx + doorW + 16, by + 18, { size: 11, bold: mine, color: mine ? THEME.gold : room.alive ? THEME.text : THEME.red });
        ui.text(`耐久 ${Math.max(0, room.doorHp)}`, bx + doorW + 16, by + 34, { size: 9, color: THEME.textDim });
        ui.text(`×${(room.players ?? []).length}`, bx + doorW + 16, by + 46, { size: 9, color: THEME.textDim });
      });
      y += Math.ceil(rooms.length / 3) * 58 + 6;
      const bw2 = (ui.w - 24 - 12) / 3;
      ui.button({ x: 12, y, w: bw2, h: 44 }, '修门(-10)', () => this.act('act', { kind: 'repair' }, this.sessionId!), { color: THEME.green });
      ui.button({ x: 12 + bw2 + 6, y, w: bw2, h: 44 }, '换房', () => {
        this.app.showModal('换房', ['输入目标房间（点下方按钮）'], [
          { label: '1', onTap: () => this.act('act', { kind: 'move', target: 1 }, this.sessionId!) },
          { label: '2', onTap: () => this.act('act', { kind: 'move', target: 2 }, this.sessionId!) },
          { label: '3', onTap: () => this.act('act', { kind: 'move', target: 3 }, this.sessionId!) },
        ]);
      }, { color: THEME.accent2 });
      ui.button({ x: 12 + (bw2 + 6) * 2, y, w: bw2, h: 44 }, '躲避', () => this.act('act', { kind: 'hide' }, this.sessionId!), { color: THEME.panel2 });
      y += 54;
      // 事件流
      ui.panel({ x: 12, y, w: ui.w - 24, h: 84 }, THEME.panel);
      const lastMsg = (this.state.lastMsg ?? '') as string;
      this.app.ui.text(lastMsg || '杀手在暗处窥伺……', 20, y + 20, { size: 11, color: THEME.text });
      ui.text('提示: 修门恢复耐久；杀手目标保密，听音辨位', 20, y + 40, { size: 10, color: THEME.textDim });
      ui.text(`历史: ${(st.history?.[0]?.summary ?? '暂无').slice(0, 30)}`, 20, y + 62, { size: 10, color: THEME.textDim });
      y += 92;
    }
    // 赛季榜
    ui.panel({ x: 12, y, w: ui.w - 24, h: Math.min(150, 24 + (st.rank?.length ?? 0) * 18) }, THEME.panel);
    ui.text('赛季积分榜', 24, y + 18, { size: 12, bold: true, color: THEME.purple });
    (st.rank ?? []).slice(0, 6).forEach((r: any, i: number) => {
      ui.text(`${i + 1}. ${r.nick}`, 24, y + 38 + i * 17, { size: 11 });
      ui.text(String(r.score), ui.w - 40, y + 38 + i * 17, { size: 11, color: THEME.gold });
    });
  }

  protected async act(actionId: string, payload?: Record<string, unknown>, sessionId?: string): Promise<any> {
    const r = await this.app.api.action('battleRoyal', actionId, payload, sessionId, Date.now() % 1e6);
    this.app.handleGameResponse(r);
    if (r.ok) this.state = { ...(this.state ?? {}), active: { sessionId, data: r.state }, lastMsg: r.message };
    else await this.onEnter();
    return r;
  }
}

// ---------------- 宝石地下城 ----------------
export class UndertownScreen extends ApiScreen {
  readonly route = '/undertown';
  constructor() { super('undertown', '宝石地下城'); }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, THEME.panel);
    ui.text(`第 ${st.floor} 层 · ${st.openedThisFloor}/${st.bricks} 块已开 · 最佳 ${st.bestFloor} 层`, 24, y + 20, { size: 13, bold: true });
    ui.text(`进场 ${st.entryTicketCost} 券/层 · 开砖 ${st.brickCostCoin} 金币/块 · 持券 ${st.ticket}`, 24, y + 40, { size: 10, color: THEME.textDim });
    y += 60;
    // 砖块网格
    const cols = 6;
    const bw = (ui.w - 24 - (cols - 1) * 5) / cols;
    const openedSet = new Set<number>(st.openedIdx ?? []);
    for (let i = 1; i <= st.bricks; i++) {
      const bx = 12 + ((i - 1) % cols) * (bw + 5);
      const by = y + Math.floor((i - 1) / cols) * 50;
      const idx = i;
      if (openedSet.has(i)) {
        ui.panel({ x: bx, y: by, w: bw, h: 44 }, THEME.bg2);
        ui.textCenter('✓', bx + bw / 2, by + 26, { size: 14, color: THEME.textDim });
      } else {
        ui.button({ x: bx, y: by, w: bw, h: 44 }, `${i}`, () => {
          this.app.audioManager.playSfx('tick');
          void this.act('openBrick', { brickIndex: idx }).then((r: any) => {
            if (r.ok && (r.message.includes('解锁') || r.message.includes('保底'))) this.app.playOverlay('pag__ready_go__ready_go', 1300);
          });
        }, { color: THEME.panel2, size: 13 });
      }
    }
    y += Math.ceil(st.bricks / cols) * 50 + 6;
    const bw2 = (ui.w - 24 - 8) / 2;
    ui.button({ x: 12, y, w: bw2, h: 38 }, '概率详情', () => {
      const prob = st.prob;
      this.app.showModal(`第 ${prob.floor} 层概率（v${prob.version}）`, [
        `大奖砖: ${prob.grandPrizePerBrick}（${prob.grandPrizeRate}）`,
        '大奖: 宝石 2-5 · 普通: 金币小额',
        '证据: ' + prob.evidence.slice(0, 30) + '…',
      ]);
    }, { color: THEME.accent2 });
    ui.button({ x: 12 + bw2 + 8, y, w: bw2, h: 38 }, '每日百强', () => {
      const rows = (st.rank ?? []).map((r: any, i: number) => `${i + 1}. ${r.nick} 深度${r.score}`);
      this.app.showModal('地下城每日百强', rows.length ? rows.slice(0, 8) : ['暂无数据']);
    }, { color: THEME.panel2 });
    y += 46;
    ui.text('记录: ' + (st.history?.[0]?.summary ?? '暂无').slice(0, 36), 16, y + 8, { size: 10, color: THEME.textDim });
  }
}

// ---------------- 竞技场 / Boss / 斗猿 / 猿兔（三回合克制对战） ----------------
const moveLabel = (m: string) => (m === 'attack' ? '攻击' : m === 'defend' ? '防御' : '蓄力');

class DuelArenaScreen extends ApiScreen {
  private opponents: any[] = [];
  private selIdx = 0;
  private moveSeq: string[] = [];
  private cine: { startAt: number; me: any; foe: any } | null = null;

  /** v3 对战场景：对峙→三回合突进（每次命中音）→ 结果 overlay */
  private startCinematic(): void {
    if (this.cine) return;
    const me = (() => { try { return new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'pag__battleRoyal__myself_idle_normal', 'launch', { loop: true, fitHeight: 56 }); } catch { return null; } })();
    const foe = (() => { try { return new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'pag__battleRoyal__killer_walk', 'launch', { loop: true, fitHeight: 56 }); } catch { return null; } })();
    this.cine = { startAt: Date.now(), me, foe };
  }

  private renderCinematic(ui: UI, top: number): boolean {
    if (!this.cine) return false;
    const el = Date.now() - this.cine.startAt;
    const c = this.app.ui.ctx;
    c.fillStyle = THEME.bg2; c.fillRect(12, top + 6, ui.w - 24, 120);
    c.strokeStyle = THEME.line; c.strokeRect(12, top + 6, ui.w - 24, 120);
    // 突进：每 400ms 一次互冲（共 3 回合），2s 后收
    const round = Math.min(3, Math.floor(el / 400));
    const lunge = (el % 400) < 200 ? Math.min(1, (el % 400) / 200) : 0;
    const myX = 60 + lunge * 70, foeX = ui.w - 60 - lunge * 70;
    const gy = top + 88;
    this.cine.me?.draw(ui, myX, gy, this.app.frameDt);
    this.cine.foe?.draw(ui, foeX, gy, this.app.frameDt);
    if (lunge > 0.8) {
      this.app.audioManager.playSfx('hit');
      c.fillStyle = THEME.gold;
      c.fillRect(ui.w / 2 - 14, gy - 40, 28, 3);
    }
    // 回合 pip（我方连招）
    for (let i = 0; i < 3; i++) {
      const played = i < round;
      const label = this.moveSeq[i] === 'attack' ? '攻' : this.moveSeq[i] === 'defend' ? '防' : this.moveSeq[i] === 'charge' ? '蓄' : '·';
      c.fillStyle = played ? THEME.gold : THEME.panel2;
      c.fillRect(16 + i * 20, top + 14, 16, 16);
      ui.text(played ? label : '·', 19 + i * 20, top + 26, { size: 11, bold: played, color: played ? THEME.bg2 : THEME.textDim });
    }
    ui.textCenter('VS', ui.w / 2, top + 30, { size: 16, bold: true, color: THEME.accent });
    if (el > 2000) { this.cine = null; }
    return true;
  }

  constructor(featureId: string, title: string) {
    super(featureId, title);
    this.title = title;
  }

  protected async fetchState(): Promise<any> {
    const r = await this.app.api.gameState(this.featureId);
    if (r.ok && Array.isArray(r.state?.opponents)) { this.opponents = r.state.opponents; }
    return r;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    if (this.renderCinematic(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 48 }, THEME.panel);
    ui.text(`我的战力 ${st.power} · 连胜 ${st.winStreak ?? st.wins ?? 0}`, 24, y + 20, { size: 13, bold: true });
    ui.text('三回合 行为克制：攻击>蓄力 / 防御克攻击 / 蓄力强化下一击', 24, y + 38, { size: 10, color: THEME.textDim });
    y += 56;
    // 对手列表
    ui.text('选择对手', 16, y + 12, { size: 12, color: THEME.textDim });
    y += 18;
    this.opponents.slice(0, 4).forEach((o: any, i: number) => {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 34 }, this.selIdx === i ? THEME.panel2 : THEME.panel);
      ui.text(`${o.nick} Lv.${o.level} 战力${o.power}`, 24, y + 21, { size: 12 });
      if (this.selIdx === i) ui.text('✓', ui.w - 34, y + 22, { size: 14, color: THEME.green });
      ui.hits.push({ x: 12, y, w: ui.w - 24, h: 36, onTap: () => { this.selIdx = i; }, id: 'opp' + i });
      y += 38;
    });
    y += 4;
    // 出招序列
    ui.text('连招（按顺序点选 3 招）', 16, y + 12, { size: 12, color: THEME.textDim });
    y += 16;
    const mw = (ui.w - 24 - 16) / 4;
    ['attack', 'defend', 'charge', '清除'].forEach((m, i) => {
      const label = m === 'attack' ? '攻击' : m === 'defend' ? '防御' : m === 'charge' ? '蓄力' : '清空';
      ui.button({ x: 12 + i * (mw + 5), y, w: mw, h: 38 }, label, () => {
        if (m === '清除') this.moveSeq = [];
        else if (this.moveSeq.length < 3) this.moveSeq.push(m);
      }, { size: 12, color: m === 'attack' ? THEME.accent : m === 'defend' ? THEME.accent2 : THEME.purple });
    });
    y += 44;
    ui.text('已选: ' + (this.moveSeq.map(moveLabel).join('→') || '（自动）'), 16, y + 12, { size: 11, color: THEME.gold });
    y += 20;
    ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, `挑战 ${this.opponents[this.selIdx]?.nick ?? '对手'}！`, () => {
      if (this.featureId === 'monkeyFight') this.app.playOverlay('monkeyfighting__monkey_fight_idle', 1200);
      void this.app.api.action('arena', 'fight', { opponentIdx: this.selIdx, moves: this.moveSeq.slice() }).then((r: any) => {
        this.app.playOverlay(r.ok && r.message.includes('胜') ? 'arena__result_success' : 'pag__pag_levelup_fail', 1500);
        this.moveSeq = [];
        this.onEnter();
      });
    }, { color: THEME.accent });
    y += 56;
    ui.text('记录: ' + (st.history?.[0]?.summary ?? '暂无'), 16, y + 8, { size: 10, color: THEME.textDim });
    y += 22;
    if (st.rank?.length) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 24 + st.rank.length * 17 }, THEME.panel);
      ui.text('战力榜', 24, y + 16, { size: 11, bold: true, color: THEME.purple });
      st.rank.slice(0, 5).forEach((r: any, i: number) => {
        ui.text(`${i + 1}. ${r.nick}`, 24, y + 34 + i * 17, { size: 10 });
        ui.text(String(r.score), ui.w - 40, y + 34 + i * 17, { size: 10, color: THEME.gold });
      });
    }
  }
}

export class BossScreen extends ApiScreen {
  readonly route = '/boss';
  private bossClip: any = null;
  constructor() { super('boss', 'Boss 挑战'); }

  onEnter(): Promise<void> {
    if (!this.bossClip && this.app.assets) {
      try { this.bossClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'challenge_boss__boss_circle_blue', 'launch', { loop: true, fitHeight: 84 }); this.bossClip.play(); } catch { this.bossClip = null; }
    }
    return super.onEnter();
  }
  onExit(): void { this.bossClip = null; }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 10;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 108 }, THEME.panel);
    if (this.bossClip && !st.dead) this.bossClip.draw(ui, ui.w / 2, y + 46, this.app.frameDt);
    ui.textCenter(st.dead ? 'Boss 已被击败（等待刷新）' : '远古猿王 Boss', ui.w / 2, y + 24, { size: 15, bold: true, color: THEME.red });
    ui.progress(28, y + 40, ui.w - 56, 14, st.maxHp ? st.hp / st.maxHp : 0, st.hp / st.maxHp > 0.5 ? THEME.green : THEME.red);
    ui.textCenter(`${st.hp} / ${st.maxHp}`, ui.w / 2, y + 72, { size: 12, bold: true });
    const cd = st.cooldownLeft ?? 0;
    ui.textCenter(cd > 0 ? `冷却 ${fmtTime(cd)}` : `我的战力 ${st.power} · 可攻击`, ui.w / 2, y + 92, { size: 11, color: cd > 0 ? THEME.textDim : THEME.green });
    y += 118;
    ui.button({ x: 12, y, w: ui.w - 24, h: 48 }, cd > 0 ? `冷却中 ${fmtTime(cd)}` : '全力一击！', () => this.act('attack'), { disabled: cd > 0 || st.dead, color: THEME.accent });
    y += 58;
    ui.text(`累计击杀 ${this.app.player?.counters?.['boss.kills'] ?? 0} · 记录: ${(st.history?.[0]?.summary ?? '暂无')}`, 16, y + 8, { size: 10, color: THEME.textDim });
  }
}

// ---------------- 匕首 ----------------
export class DaggerScreen extends ApiScreen {
  readonly route = '/dagger';
  constructor() { super('dagger', '匕首 / 刺杀'); }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 74 }, THEME.panel);
    ui.text(`匕首 ×${st.daggers} · 等级 Lv.${st.level} · 钉 ${st.nail}`, 24, y + 22, { size: 13, bold: true, color: THEME.gold });
    ui.text('大逃杀被淘汰获得匕首 → 升级/刺杀消耗（RELEASE 该玩法延后）', 24, y + 44, { size: 10, color: THEME.textDim });
    ui.text(`最近: ${(st.history?.[0]?.summary ?? '暂无')}`, 24, y + 62, { size: 10, color: THEME.textDim });
    y += 84;
    ui.button({ x: 12, y, w: (ui.w - 30) / 2, h: 46 }, `升级（${5} 把）`, () => this.act('upgrade'), { color: THEME.accent2, disabled: st.daggers < 5 });
    ui.button({ x: 12 + (ui.w - 30) / 2 + 6, y, w: (ui.w - 30) / 2, h: 46 }, '刺杀（1 把+体力）', () => this.act('assassinate'), { color: THEME.accent, disabled: st.daggers < 1 });
    y += 56;
    (st.history ?? []).slice(0, 6).forEach((h: any, i: number) => {
      ui.text(`· ${h.summary}`.slice(0, 40), 16, y + i * 17, { size: 10, color: THEME.textDim });
    });
  }
}

// ---------------- 抢夺（PvE 积分争夺） ----------------
export class RobberyScreen extends ApiScreen {
  readonly route = '/robbery';
  constructor() { super('robbery', '资源争夺'); }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 68 }, THEME.panel);
    ui.text(`我的争夺积分 ${st.score} · 模式: ${st.mode === 'pve-async-score' ? 'PvE 异步积分' : '完整 PvE'}`, 24, y + 20, { size: 12, bold: true });
    ui.text(`体力消耗 ${st.energyCost} · 基础成功率 ${(st.successBase * 100).toFixed(0)}%（战力加成）`, 24, y + 40, { size: 10, color: THEME.textDim });
    ui.text('原玩家间资产抢夺已改为 PvE 积分制（RELEASE 合规改造）', 24, y + 56, { size: 9, color: THEME.gold });
    y += 78;
    ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '发起争夺', () => { void this.act('raid').then(() => this.app.playOverlay('rob__rob_effect', 1100)); }, { color: THEME.accent });
    y += 56;
    if (st.rank?.length) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 24 + st.rank.length * 17 }, THEME.panel);
      ui.text('争夺榜', 24, y + 16, { size: 11, bold: true, color: THEME.purple });
      st.rank.slice(0, 6).forEach((r: any, i: number) => {
        ui.text(`${i + 1}. ${r.nick}`, 24, y + 34 + i * 17, { size: 10 });
        ui.text(String(r.score), ui.w - 40, y + 34 + i * 17, { size: 10, color: THEME.gold });
      });
    }
  }
}

export function registerCombatScreens(): void {
  registerRoute('battleRoyal', () => new BattleRoyalScreen());
  registerRoute('undertown', () => new UndertownScreen());
  registerRoute('arena', () => new DuelArenaScreen('arena', '竞技场'));
  registerRoute('nxArena', () => new DuelArenaScreen('arena', 'NX 竞技'));
  registerRoute('monkeyFight', () => new DuelArenaScreen('monkeyFight', '斗猿场'));
  registerRoute('apeRabbit', () => new DuelArenaScreen('monkeyFight', '猿兔对战'));
  registerRoute('beast', () => new DuelArenaScreen('arena', '动物挑战'));
  registerRoute('boss', () => new BossScreen());
  registerRoute('rocksMonkeyKing', () => new DuelArenaScreen('monkeyFight', '岩石猴王'));
  registerRoute('dagger', () => new DaggerScreen());
  registerRoute('robbery', () => new RobberyScreen());
}
