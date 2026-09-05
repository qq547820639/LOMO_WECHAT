/**
 * 小游戏屏幕：虎口逃生 / 今晚吃鸡 / 弹珠 / 运动会 / 拔河 / 炸猴王。
 * 全部为真实输入驱动：车道选择 / 时机防守 / 角度力度 / 反应窗口 / 节奏鼓点 / 投弹档位。
 */
import { ApiScreen } from './base';
import { UI } from '../ui/widgets';
import { THEME, fmtNum, fmtTime } from '../core/theme';
import { registerRoute } from './registry';

// ---------------- 虎口逃生（三车道跑酷） ----------------
export class EscapeTigerScreen extends ApiScreen {
  readonly route = '/escapeTiger';
  private sessionId: string | null = null;
  private animal = 'monkey';
  private lastMsg = '';

  constructor() { super('escapeTiger', '虎口逃生'); }

  protected async fetchState(): Promise<any> {
    const r = await this.app.api.gameState('escapeTiger');
    if (r.ok) this.sessionId = r.state?.sessionId ?? null;
    return r;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    if (!this.sessionId) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, THEME.panel);
      ui.text('猛虎在身后！选择一只动物开始逃亡', 24, y + 20, { size: 13, bold: true });
      ui.text(`每局 ${st.stepsPerRun} 步 · 选车道躲障碍 · 护盾/无敌/加速 · 最佳金币 ${st.best}`, 24, y + 40, { size: 10, color: THEME.textDim });
      y += 64;
      const aw = (ui.w - 24 - 5 * 5) / 6;
      (st.animals ?? []).forEach((a: string, i: number) => {
        ui.button({ x: 12 + i * (aw + 5), y, w: aw, h: 40 }, { cow: '牛', dog: '狗', fox: '狐', monkey: '猴', pig: '猪', raccoon: '浣' }[a] ?? a, () => { this.animal = a; }, { color: this.animal === a ? THEME.accent : THEME.panel2, size: 14 });
      });
      y += 50;
      ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '开始逃亡（体力 -1）', async () => {
        const s = await this.app.api.post('/v1/game/session/start', { featureId: 'escapeTiger' });
        if (!s.ok) { this.app.showToast(s.message); return; }
        const r = await this.app.api.action('escapeTiger', 'start', { animal: this.animal }, s.sessionId, 1);
        if (r.ok) { this.sessionId = s.sessionId; this.lastMsg = r.message; }
        else this.app.showToast(r.message);
        await this.onEnter();
      }, { color: THEME.accent });
      y += 56;
    } else {
      const data = st.active ?? {};
      // 进度 + 虎距离
      ui.panel({ x: 12, y, w: ui.w - 24, h: 96 }, THEME.panel);
      ui.text(`第 ${data.step ?? 0} / ${st.stepsPerRun} 步`, 24, y + 20, { size: 13, bold: true });
      ui.progress(24, y + 32, ui.w - 48, 10, (data.step ?? 0) / st.stepsPerRun, THEME.accent2);
      ui.text(`虎口距离 ${Math.max(0, Math.ceil(data.tigerDist ?? 6))} 步`, 24, y + 58, { size: 12, color: (data.tigerDist ?? 6) < 3 ? THEME.red : THEME.green });
      ui.text(`Buff: ${(data.buffs ?? []).join(', ') || '无'}`, 24, y + 78, { size: 10, color: THEME.purple });
      y += 104;
      // 三车道
      ui.text('选择车道（躲开障碍！）', 16, y + 12, { size: 12, color: THEME.textDim });
      y += 18;
      const lw = (ui.w - 24 - 12) / 3;
      ['左', '中', '右'].forEach((lane, i) => {
        ui.button({ x: 12 + i * (lw + 6), y, w: lw, h: 74 }, lane, () => this.act('step', { lane: i }, this.sessionId!), { color: THEME.panel2, size: 20 });
      });
      y += 84;
      ui.text(this.lastMsg || '虎口还差 6 步', 16, y + 8, { size: 11, color: THEME.text });
      y += 22;
      ui.button({ x: 12, y, w: ui.w - 24, h: 36 }, '放弃（按进度结算）', () => this.act('abort', {}, this.sessionId!), { size: 12, color: THEME.bg2 });
      y += 44;
    }
    ui.text(`最佳: ${st.best ?? 0} 金币 · 记录: ${(st.history?.[0]?.summary ?? '暂无').slice(0, 28)}`, 16, y + 8, { size: 10, color: THEME.textDim });
  }

  protected async act(actionId: string, payload?: Record<string, unknown>, sessionId?: string): Promise<any> {
    const r = await this.app.api.action('escapeTiger', actionId, payload, sessionId, Date.now() % 1e6);
    this.app.handleGameResponse(r);
    if (r.ok) {
      this.lastMsg = r.message;
      if (r.ok && (r.message.includes('逃离') || r.message.includes('绳断') || actionId === 'abort')) this.sessionId = null;
    }
    await this.onEnter();
    return r;
  }
}

// ---------------- 今晚吃鸡 ----------------
export class ChickenScreen extends ApiScreen {
  readonly route = '/chicken';
  constructor() { super('chicken', '今晚吃鸡'); }

  pollMs(): number { return 3000; }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    // 鸡窝
    ui.panel({ x: 12, y, w: ui.w - 24, h: 96 }, THEME.panel);
    const eggReady = st.eggReady;
    const eggPending = (st.eggReadyAt ?? 0) > 0 && !eggReady;
    ui.textCenter(eggReady ? '🥚 蛋已成熟！' : eggPending ? '🥚 孵化中…' : '🐔 鸡窝空空', ui.w / 2, y + 30, { size: 15, bold: true, color: eggReady ? THEME.gold : THEME.text });
    if (eggPending) {
      const remain = st.eggReadyAt - this.app.lastFrameTime;
      ui.progress(28, y + 46, ui.w - 56, 8, Math.max(0, Math.min(1, 1 - remain / 30000)), THEME.gold);
    }
    const thiefWarn = (st.thiefWarningAt ?? 0) > 0;
    ui.textCenter(thiefWarn ? '⚠ 偷鸡者来袭！赶紧布防！' : `收获 ${st.eggsCollected} · 防守 ${st.guarded} · 被偷 ${st.stolen}`, ui.w / 2, y + 76, { size: 11, color: thiefWarn ? THEME.red : THEME.textDim });
    y += 106;
    const bw = (ui.w - 24 - 12) / 3;
    ui.button({ x: 12, y, w: bw, h: 46 }, `喂养(-${10})`, () => this.act('feed'), { color: THEME.gold, disabled: eggPending || eggReady });
    ui.button({ x: 12 + bw + 6, y, w: bw, h: 46 }, '布防(-8)', () => this.act('guard'), { color: THEME.accent2, disabled: !thiefWarn });
    ui.button({ x: 12 + (bw + 6) * 2, y, w: bw, h: 46 }, '收蛋', () => this.act('collect'), { color: THEME.green, disabled: !eggReady });
    y += 56;
    ui.text('喂养 → 孵化 30s → 收蛋；偷鸡者中途来袭需布防', 16, y + 8, { size: 10, color: THEME.textDim });
    ui.text('记录: ' + (st.log?.[0]?.summary ?? '暂无').slice(0, 32), 16, y + 24, { size: 10, color: THEME.textDim });
  }
}

// ---------------- 弹珠（角度+力度） ----------------
export class MarblesScreen extends ApiScreen {
  readonly route = '/marbles';
  private sessionId: string | null = null;
  private angle = 45;
  private power = 60;
  private launchClip: import('../ui/procedural_clips').LaunchPulse | null = null;
  private launchVisible = false;

  constructor() { super('marbles', '弹珠'); }

  onEnter(): Promise<void> {
    // P0-3 demo：launch_click 图集（形态 A，烘焙自 APK marbles/launch_click.pag）
    if (!this.launchClip && this.app.assets) {
      // 待机静帧展示首帧；点击「发射」时从头播放一遍（loop: false）
      this.launchClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'marbles', 'launch_click', { loop: false, fitHeight: 56 });
    }
    return super.onEnter();
  }

  onExit(): void { this.launchClip = null; this.launchVisible = false; }

  protected async fetchState(): Promise<any> {
    const r = await this.app.api.gameState('marbles');
    if (r.ok) this.sessionId = r.state?.sessionId ?? null;
    return r;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    const active = st.active;
    if (!this.sessionId || !active) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, THEME.panel);
      ui.text('物理弹珠：调整角度与力度击打摆锤得分', 24, y + 20, { size: 13, bold: true });
      ui.text(`每局 ${st.shotsPerRun ?? st.shotsPerRound} 发 · 目标 ${st.targetScore} 分达标得奖券 · 最佳 ${st.best}`, 24, y + 40, { size: 10, color: THEME.textDim });
      y += 64;
      ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '开新一局（体力 -1）', async () => {
        const s = await this.app.api.post('/v1/game/session/start', { featureId: 'marbles' });
        if (!s.ok) { this.app.showToast(s.message); return; }
        const r = await this.app.api.action('marbles', 'start', {}, s.sessionId, 1);
        if (r.ok) this.sessionId = s.sessionId;
        this.app.showToast(r.message);
        await this.onEnter();
      }, { color: THEME.accent });
      y += 56;
    } else {
      const d = active;
      // 场地渲染
      ui.panel({ x: 12, y, w: ui.w - 24, h: 170 }, THEME.panel);
      // 发射点
      const ox = 30, oy = y + 140;
      this.app.ui.ctx.fillStyle = THEME.gold;
      this.app.ui.ctx.fillRect(ox - 4, oy - 4, 8, 8);
      // 摆锤（服务端下发）
      for (const peg of d.pegs ?? []) {
        this.app.ui.ctx.fillStyle = THEME.purple;
        this.app.ui.ctx.fillRect(ox + (peg.x ?? 0) * 0.85 - (peg.r ?? 10) / 2, oy - (peg.y ?? 0) * 0.3 - (peg.r ?? 10) / 2, (peg.r ?? 10), (peg.r ?? 10));
      }
      // 发射特效（程序化自制）：待机静帧，发射时播放一遍
      if (this.launchClip) {
        this.launchClip.draw(ui, ox + 60, oy - 30, this.launchVisible ? this.app.frameDt : 0);
        if (this.launchClip.state.finished) this.launchVisible = false;
      }
      // 射程预览线
      const range = (this.power * Math.sin((2 * this.angle * Math.PI) / 180)) / 2.2;
      this.app.ui.ctx.strokeStyle = THEME.accent2;
      this.app.ui.ctx.beginPath();
      this.app.ui.ctx.moveTo(ox, oy);
      this.app.ui.ctx.lineTo(ox + range * 0.85, oy - 40);
      this.app.ui.ctx.stroke();
      ui.text(`射程≈${Math.floor(range)} · 得分 ${d.score ?? 0}`, 20, y + 158, { size: 10, color: THEME.textDim });
      y += 178;
      // 角度/力度
      ui.text(`角度 ${this.angle}°`, 16, y + 12, { size: 11 });
      this.hSlider(ui, 90, y, 180, this.angle, 10, 85, (v) => { this.angle = v; });
      ui.text(`${this.angle}°`, ui.w - 50, y + 12, { size: 11, color: THEME.accent2 });
      y += 30;
      ui.text(`力度 ${this.power}`, 16, y + 12, { size: 11 });
      this.hSlider(ui, 90, y, 180, this.power, 30, 100, (v) => { this.power = v; });
      ui.text(`${this.power}`, ui.w - 50, y + 12, { size: 11, color: THEME.gold });
      y += 32;
      const bw = (ui.w - 24 - 8) / 2;
      ui.button({ x: 12, y, w: bw, h: 44 }, `发射（剩 ${st.shotsPerRound - (d.shot ?? 0)}）`, () => {
        if (this.launchClip) { this.launchClip.reset(); this.launchClip.play(); this.launchVisible = true; }
        void this.act('shot', { angle: this.angle, power: this.power }, this.sessionId!);
      }, { color: THEME.accent });
      ui.button({ x: 12 + bw + 8, y, w: bw, h: 44 }, '结束本局', () => { this.sessionId = null; this.onEnter(); }, { color: THEME.bg2, size: 12 });
      y += 54;
    }
    ui.text(`最佳 ${st.best ?? 0} · 记录: ${(st.history?.[0]?.summary ?? '暂无').slice(0, 26)}`, 16, y + 8, { size: 10, color: THEME.textDim });
  }

  private hSlider(ui: UI, x: number, y: number, w: number, value: number, min: number, max: number, onChange: (v: number) => void): void {
    ui.progress(x, y + 6, w, 6, (value - min) / (max - min), THEME.accent2);
    const steps = 8;
    const sw = w / steps;
    for (let i = 0; i <= steps; i++) {
      const v = Math.round(min + ((max - min) * i) / steps);
      ui.hits.push({ x: x + i * sw - sw / 2, y, w: sw, h: 20, onTap: () => onChange(v), id: 'sl' + x + i });
    }
  }

  protected async act(actionId: string, payload?: Record<string, unknown>, sessionId?: string): Promise<any> {
    const r = await this.app.api.action('marbles', actionId, payload, sessionId, Date.now() % 1e6);
    this.app.handleGameResponse(r);
    if (r.ok && r.state) { /* 保留会话状态 */ }
    await this.onEnter();
    return r;
  }
}

// ---------------- 运动会（反应时机） ----------------
export class SportsScreen extends ApiScreen {
  readonly route = '/sports';
  private sessionId: string | null = null;
  private roundStartAt = 0;

  constructor() { super('sports', '运动会'); }

  protected async fetchState(): Promise<any> {
    const r = await this.app.api.gameState('sports');
    if (r.ok) this.sessionId = r.state?.sessionId ?? null;
    return r;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    if (!this.sessionId) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, THEME.panel);
      ui.text('反应挑战：发令枪响越快按，分越高（抢跑无效）', 24, y + 20, { size: 13, bold: true });
      ui.text(`${st.rounds} 轮 · 有效窗口 ${st.tapWindowMs}ms · 最佳 ${st.best}`, 24, y + 40, { size: 10, color: THEME.textDim });
      y += 64;
      ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '入场（体力 -1）', async () => {
        const s = await this.app.api.post('/v1/game/session/start', { featureId: 'sports' });
        if (!s.ok) { this.app.showToast(s.message); return; }
        const r = await this.app.api.action('sports', 'start', {}, s.sessionId, 1);
        if (r.ok) { this.sessionId = s.sessionId; this.roundStartAt = Date.now(); }
        this.app.showToast(r.message);
        await this.onEnter();
      }, { color: THEME.accent });
      y += 56;
    } else {
      const d = st.active ?? {};
      const gunTimes = d.gunTimes ?? [];
      const round = d.round ?? 0;
      ui.panel({ x: 12, y, w: ui.w - 24, h: 110 }, THEME.panel);
      ui.textCenter(`第 ${Math.min(round + 1, gunTimes.length)} / ${gunTimes.length} 轮`, ui.w / 2, y + 26, { size: 15, bold: true });
      ui.textCenter('看到 GO 就点！（按你看到的时机点击）', ui.w / 2, y + 50, { size: 11, color: THEME.textDim });
      ui.text(`当前得分 ${d.score ?? 0}`, 24, y + 76, { size: 12, color: THEME.gold });
      const nextGun = gunTimes[round];
      if (nextGun != null) ui.text(`发令: +${(nextGun / 1000).toFixed(1)}s`, ui.w - 90, y + 76, { size: 11, color: THEME.textDim });
      y += 120;
      ui.button({ x: 12, y, w: ui.w - 24, h: 70 }, 'GO！（点击反应）', () => {
        const reaction = Date.now() - this.roundStartAt - (gunTimes[round] ?? 0);
        this.act('react', { reactionMs: Math.max(80, reaction) }, this.sessionId!).then(() => { this.roundStartAt = Date.now(); });
      }, { color: THEME.accent2, size: 20 });
      y += 80;
      ui.button({ x: 12, y, w: ui.w - 24, h: 34 }, '放弃本场', () => { this.sessionId = null; this.onEnter(); }, { size: 12, color: THEME.bg2 });
      y += 42;
    }
    ui.text(`最佳 ${st.best ?? 0} · 记录: ${(st.history?.[0]?.summary ?? '暂无')}`, 16, y + 8, { size: 10, color: THEME.textDim });
  }
}

// ---------------- 拔河（节奏） ----------------
export class TugScreen extends ApiScreen {
  readonly route = '/tug';
  private sessionId: string | null = null;
  private beatStart = 0;

  constructor() { super('tug', '拔河'); }

  protected async fetchState(): Promise<any> {
    const r = await this.app.api.gameState('tug');
    if (r.ok) this.sessionId = r.state?.sessionId ?? null;
    return r;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    if (!this.sessionId) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, THEME.panel);
      ui.text('跟着鼓点节奏拉绳：窗口内完美，乱拉被反拽', 24, y + 20, { size: 13, bold: true });
      ui.text(`体力 -${st.pullEnergy} · 完美窗口 ${st.rhythmWindowMs}ms · 胜场 ${st.wins}`, 24, y + 40, { size: 10, color: THEME.textDim });
      y += 64;
      ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '开始比赛', async () => {
        const s = await this.app.api.post('/v1/game/session/start', { featureId: 'tug' });
        if (!s.ok) { this.app.showToast(s.message); return; }
        const r = await this.app.api.action('tug', 'start', {}, s.sessionId, 1);
        if (r.ok) { this.sessionId = s.sessionId; this.beatStart = Date.now(); }
        this.app.showToast(r.message);
        await this.onEnter();
      }, { color: THEME.accent });
      y += 56;
    } else {
      const d = st.active ?? {};
      const rope = d.rope ?? 0;
      ui.panel({ x: 12, y, w: ui.w - 24, h: 90 }, THEME.panel);
      ui.textCenter(rope >= 20 ? '占优！' : rope <= -20 ? '吃紧！' : '胶着', ui.w / 2, y + 22, { size: 14, bold: true, color: rope >= 20 ? THEME.green : rope <= -20 ? THEME.red : THEME.text });
      // 绳子
      const mid = ui.w / 2;
      const pos = mid + Math.max(-130, Math.min(130, rope * 2));
      this.app.ui.ctx.fillStyle = THEME.gold;
      this.app.ui.ctx.fillRect(20, y + 40, ui.w - 40, 5);
      this.app.ui.ctx.fillStyle = THEME.accent;
      this.app.ui.ctx.fillRect(pos - 6, y + 32, 12, 20);
      ui.text(`节拍 ${d.beatIdx ?? 0}/10`, 24, y + 76, { size: 11, color: THEME.textDim });
      y += 100;
      ui.button({ x: 12, y, w: ui.w - 24, h: 70 }, '拉！！', () => {
        const offset = Math.abs(Date.now() - this.beatStart - (d.beats?.[d.beatIdx ?? 0] ?? 0));
        this.act('pull', { offsetMs: offset }, this.sessionId!).then(() => { this.beatStart = Date.now(); });
      }, { color: THEME.accent, size: 22 });
      y += 80;
      ui.button({ x: 12, y, w: ui.w - 24, h: 34 }, '认输', () => { this.sessionId = null; this.onEnter(); }, { size: 12, color: THEME.bg2 });
      y += 42;
    }
  }
}

// ---------------- 炸猴王 ----------------
export class MonkeyKingScreen extends ApiScreen {
  readonly route = '/monkeyKing';
  constructor() { super('rocksMonkeyKing', '炸猴王'); }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 68 }, THEME.panel);
    ui.text(`我的贡献 ${st.myContribution} · 赛季积分/弹 ${st.seasonScorePerBomb}`, 24, y + 20, { size: 12, bold: true });
    ui.text('现金奖池已改赛季积分池（不与充值/提现挂钩）', 24, y + 40, { size: 10, color: THEME.gold });
    ui.text(`炸弹单价: 1发 ${st.bombCost?.one} · 10发 ${st.bombCost?.ten} · 100发 ${st.bombCost?.hundred} 金币`, 24, y + 56, { size: 10, color: THEME.textDim });
    y += 78;
    const tiers: Array<[string, string, string]> = [['one', '投 1 发', 'bombOne'], ['ten', '连投 10 发', 'bombTen'], ['hundred', '狂轰 100 发', 'bombHundred']];
    const bw = (ui.w - 24 - 12) / 3;
    tiers.forEach(([tier, label], i) => {
      ui.button({ x: 12 + i * (bw + 6), y, w: bw, h: 60 }, label, () => this.act('bomb', { tier }), { color: i === 2 ? THEME.accent : i === 1 ? THEME.purple : THEME.accent2, size: 12 });
    });
    y += 70;
    if (st.rank?.length) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 24 + st.rank.length * 17 }, THEME.panel);
      ui.text('贡献榜', 24, y + 16, { size: 11, bold: true, color: THEME.purple });
      st.rank.slice(0, 6).forEach((r: any, i: number) => {
        ui.text(`${i + 1}. ${r.nick}`, 24, y + 34 + i * 17, { size: 10 });
        ui.text(String(r.score), ui.w - 40, y + 34 + i * 17, { size: 10, color: THEME.gold });
      });
      y += 30 + st.rank.length * 17;
    }
    ui.text('记录: ' + (st.history?.[0]?.summary ?? '暂无'), 16, y + 8, { size: 10, color: THEME.textDim });
  }
}

export function registerMinigameScreens(): void {
  registerRoute('escapeTiger', () => new EscapeTigerScreen());
  registerRoute('chicken', () => new ChickenScreen());
  registerRoute('marbles', () => new MarblesScreen());
  registerRoute('sports', () => new SportsScreen());
  registerRoute('tug', () => new TugScreen());
  registerRoute('monkeyKing', () => new MonkeyKingScreen());
}
