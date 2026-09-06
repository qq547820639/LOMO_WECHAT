/**
 * LOMO 参考服务端 —— 服务器权威架构参考实现（Node.js + TypeScript，零运行时依赖）。
 * 模块：Auth / Player / Economy(Ledger) / Inventory / GameSession / Rank / RemoteConfig /
 *       Mail / Social / Market(沙盒) / Mall(mock) / Compliance / Telemetry / Settlement(沙盒桥)。
 *
 * 启动: APP_PROFILE=wechat-release node dist/server/index.js
 * 测试: createApp() 内存模式 + http 监听随机端口。
 */
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';
import { BRAND } from '../../shared/src/brand';
import type { RouteDef, HttpCtx } from './http';
import { hmac, randomId, safeEqual } from './util';
import { attachCommerceRoutes } from './commerce';
import { Store } from './store';
import { EconomyOps } from './economy';
import { FEATURES_GAMES } from './games';
import { ReadCtx } from './games/types';
import { Rng } from '../../shared/src/rng';
import { BuildProfile, CASH_SENSITIVE_FEATURES, FeaturePolicy, RELEASE_LOCKED_FLAGS, RemoteConfig, TuningConfig, featureEnabledInProfile, validateTuningConfig, TuningConfigError } from '../../shared/src/config';
import { AssetId } from '../../shared/src/assets';
import { LedgerError } from '../../shared/src/ledger';
import { AntiAddictionStatus, AuthWechatResponse, ConfigBootstrap, GameActionResponse, InventoryItemDto, PlayerStateDto, RankRow } from '../../shared/src/protocol';

const TUNING_FALLBACK: TuningConfig = {
  progression: { levelXpBase: 100, levelXpStep: 40, levelUpEnergy: 5 },
  energy: { initial: 30, max: 120, regenMinutes: 6, battleCost: 3, mineCost: 2, exploreCost: 4, minigameCost: 1 },
  economy: { initialCoin: 500, initialTicket: 5, mineCoinRange: [3, 8], refineOreCost: 10, refineCoin: 35 },
};

export interface AppOptions {
  profile?: BuildProfile;
  secret?: string;
  persistPath?: string | null;
  cards?: import('../../shared/src/registry').CardTemplate[];
  bootPngSeeds?: boolean;
}

export class GameApp {
  private static readonly TOKEN_TTL_MS = 7 * 86400000;
  private static readonly INVITE_TTL_MS = 7 * 86400000;
  store: Store;
  profile: BuildProfile;
  secret: string;
  tuning: TuningConfig;
  configVersion: string;
  private tokenSecret: string;
  private rateBuckets: Map<string, { windowStart: number; count: number }> = new Map();
  private playerSeedCounter: Map<string, number> = new Map();

  constructor(opts: AppOptions = {}) {
    const profile = opts.profile ?? (process.env.APP_PROFILE as BuildProfile) ?? 'full-clone';
    if (profile !== 'full-clone' && profile !== 'wechat-release') throw new Error(`invalid APP_PROFILE: ${profile}`);
    this.profile = profile;
    this.secret = opts.secret ?? process.env.APP_SECRET ?? 'dev-only-secret-DO-NOT-USE-IN-PROD';
    this.tokenSecret = this.secret + ':token';
    this.tuning = this.loadTuning();
    this.configVersion = `tuning-${this.profile}-1`;
    this.store = new Store(() => randomId(18), opts.persistPath ?? undefined);
    if (opts.cards) this.store.setCards(opts.cards);
    if (opts.bootPngSeeds !== false) this.seedNpcPlayers();
  }

  private loadTuning(): TuningConfig {
    let raw: string;
    try {
      const fs = require('node:fs');
      const p = rootPath('configs/tuning-baseline.json');
      raw = fs.readFileSync(p, 'utf8');
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') return TUNING_FALLBACK;
      throw new TuningConfigError(`config read failed: ${String(error)}`);
    }
    let parsed: unknown;
    try { parsed = JSON.parse(raw!); } catch (error) { throw new TuningConfigError(`JSON parse failed: ${String(error)}`); }
    return validateTuningConfig(parsed);
  }

  /** NPC/机器人玩家：让排行榜/矿场好友可交互可测试 */
  private seedNpcPlayers(): void {
    const names = ['猿大圣', '矿工老王', '收藏酱', '宇宙飞侠', '地下城主', '吃鸡达人', '弹珠高手', '拔河队长'];
    names.forEach((n, i) => {
      const { player } = this.store.ensurePlayer(`npc-${i}`, n, Date.now() - i * 86400000);
      player.level = 3 + ((i * 7) % 20);
      this.store.rankAdd('seasonScore', player.playerId, 120 + ((i * 53) % 400));
      this.store.rankAdd('undertownDepth', player.playerId, 3 + ((i * 5) % 18));
      this.store.rankAdd('arenaPower', player.playerId, 30 + ((i * 17) % 90));
    });
  }

  // ---------- config ----------
  remoteConfig(): RemoteConfig {
    const policies: Record<string, FeaturePolicy> = { ...CASH_SENSITIVE_FEATURES };
    // 数据层（data.gen FEATURES）覆盖默认策略
    try {
      const { FEATURES } = require(rootPath('dist/shared/src/gen/data.gen.js'));
      for (const f of FEATURES) {
        if (f.release === 'cut') policies[f.id] = policies[f.id] === 'sandbox' ? 'sandbox' : 'cut';
        else if (!policies[f.id]) policies[f.id] = f.release === 'keep' ? 'keep' : f.release;
      }
    } catch { /* data.gen 未生成时使用默认策略 */ }
    const cfg: RemoteConfig = {
      version: this.configVersion,
      signedAt: Date.now(),
      signature: null,
      profile: this.profile,
      tuning: this.tuning,
      routesEnabled: {},
      featurePolicies: policies,
      numeric: {},
      json: {},
    };
    cfg.signature = hmac(this.secret, JSON.stringify({ v: cfg.version, t: cfg.tuning, p: policies }));
    return cfg;
  }

  bootstrap(): ConfigBootstrap {
    const cfg = this.remoteConfig();
    let release: any;
    try {
      const fs = require('node:fs');
      release = JSON.parse(fs.readFileSync(rootPath('configs', this.profile === 'full-clone' ? 'full-clone.json' : 'wechat-release.json'), 'utf8'));
    } catch {
      release = this.profile === 'full-clone' ? { profile: 'full-clone', sandboxOnly: true } : { profile: 'wechat-release', allowCashWallet: false, allowWithdrawal: false, allowBetting: false, allowPaidRandomLoot: false, allowP2PTrade: false, allowDigitalAuction: false, allowAgentDistribution: false, allowCashRedPacket: false };
    }
    return {
      configVersion: cfg.version,
      profile: this.profile,
      serverTime: Date.now(),
      tuning: cfg.tuning,
      featurePolicies: cfg.featurePolicies,
      routesEnabled: cfg.routesEnabled,
      release,
      assetManifestVersion: 'asset-manifest-1',
    };
  }

  // ---------- auth ----------
  issueToken(playerId: string): string {
    const expiresAt = Date.now() + GameApp.TOKEN_TTL_MS;
    const payload = `${playerId}.${expiresAt}`;
    return `t1.${payload}.${hmac(this.tokenSecret, payload)}`;
  }

  verifyToken(token: string | undefined | null): string | null {
    if (!token || !token.startsWith('t1.')) return null;
    const parts = token.split('.');
    if (parts.length !== 4) return null;
    const playerId = parts[1];
    const expiresAt = Number(parts[2]);
    if (!playerId || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return null;
    const payload = `${playerId}.${expiresAt}`;
    if (!safeEqual(hmac(this.tokenSecret, payload), parts[3])) return null;
    if (!this.store.player(playerId)) return null;
    return playerId;
  }

  antiAddiction(playerId: string): AntiAddictionStatus {
    // 平台实名/防沉迷服务状态（参考实现：默认已实名成年；接入国家体系后由 ComplianceService 返回）
    const minor = false;
    const hour = new Date().getHours();
    const curfew = hour >= 22 || hour < 8;
    return {
      realNameVerified: true,
      isMinor: minor,
      playableNow: !minor || !curfew,
      remainingMinutesToday: minor ? 40 : null,
      message: minor && curfew ? '未成年人于 22:00-8:00 无法进入游戏' : '',
    };
  }

  // ---------- gating ----------
  policyOf(featureId: string): FeaturePolicy {
    return this.remoteConfig().featurePolicies[featureId] ?? 'keep';
  }

  featureAllowed(featureId: string): boolean {
    return featureEnabledInProfile(this.policyOf(featureId), this.profile);
  }

  private rateLimited(playerId: string): boolean {
    const now = Date.now();
    const b = this.rateBuckets.get(playerId);
    if (!b || now - b.windowStart > 1000) {
      this.rateBuckets.set(playerId, { windowStart: now, count: 1 });
      return false;
    }
    b.count++;
    return b.count > 120;
  }

  private tuningNum(pathStr: string, fallback: number): number {
    let node: any = this.tuning;
    for (const seg of pathStr.split('.')) {
      if (node == null || typeof node !== 'object') return fallback;
      node = node[seg];
    }
    return typeof node === 'number' ? node : fallback;
  }

  private tuningRange(pathStr: string, rng: Rng, fallback: [number, number]): number {
    let node: any = this.tuning;
    for (const seg of pathStr.split('.')) {
      if (node == null || typeof node !== 'object') return rng.int(fallback[0], fallback[1]);
      node = node[seg];
    }
    if (Array.isArray(node) && node.length >= 2) return rng.int(node[0], node[1]);
    return rng.int(fallback[0], fallback[1]);
  }

  // ---------- player dto ----------
  playerDto(playerId: string): PlayerStateDto {
    const p = this.store.player(playerId)!;
    const inventory: InventoryItemDto[] = Object.entries(p.inventory).map(([templateId, e]) => ({
      itemId: templateId, templateId, qty: e.qty, lockedQty: e.lockedQty, attrs: e.attrs,
    }));
    return {
      playerId: p.playerId, nick: p.nick, level: p.level, xp: p.xp,
      xpToNext: this.tuningNum('progression.levelXpBase', 100) + Math.max(0, p.level - 1) * this.tuningNum('progression.levelXpStep', 40),
      balances: this.store.ledger.balancesOf(playerId),
      inventory,
      counters: p.counters,
      timestamps: p.timestamps,
      createdAt: p.createdAt,
    };
  }

  grantXp(playerId: string, amount: number): string[] {
    const p = this.store.player(playerId)!;
    const events: string[] = [];
    p.xp += Math.max(0, Math.floor(amount));
    const base = this.tuningNum('progression.levelXpBase', 100);
    const step = this.tuningNum('progression.levelXpStep', 40);
    let need = base + (p.level - 1) * step;
    while (p.xp >= need) {
      p.xp -= need;
      p.level++;
      this.store.ledger.apply({ playerId, assetType: 'ENERGY', delta: this.tuningNum('progression.levelUpEnergy', 5), sourceType: 'levelUp', sourceId: `lv${p.level}` });
      events.push(`升级到 Lv.${p.level}`);
      need = base + (p.level - 1) * step;
    }
    this.store.touch();
    return events;
  }

  /** 新玩家初始化资产 */
  initPlayerAssets(playerId: string): void {
    if (this.store.ledger.balanceOf(playerId, 'COIN') > 0) return;
    this.store.ledger.applyBatch(playerId, [
      { assetType: 'COIN', delta: this.tuningNum('economy.initialCoin', 500), sourceType: 'bootstrap', sourceId: 'initial' },
      { assetType: 'ENERGY', delta: this.tuningNum('energy.initial', 30), sourceType: 'bootstrap', sourceId: 'initial' },
      { assetType: 'TICKET', delta: this.tuningNum('economy.initialTicket', 5), sourceType: 'bootstrap', sourceId: 'initial' },
      ...(this.profile === 'full-clone' ? [{ assetType: 'TEST_CREDIT' as AssetId, delta: 1000, sourceType: 'bootstrap', sourceId: 'sandbox-faucet' }] : []),
    ]);
    this.store.player(playerId)!.inventory['starter_card'] = { qty: 1, lockedQty: 0 };
    this.store.player(playerId)!.inventory['free_box_key'] = { qty: 3, lockedQty: 0 };
  }

  routes(): RouteDef[] {
    const app = this;
    const authed = (ctx: HttpCtx): string | null => app.verifyToken(String(ctx.req.headers['authorization'] || '').replace(/^Bearer\s+/i, '') || (typeof ctx.body?.token === 'string' ? ctx.body.token : undefined));
    const guard = (ctx: HttpCtx): string | null => {
      const playerId = authed(ctx);
      if (!playerId) { ctx.status(401); ctx.json({ ok: false, code: 'AUTH_REQUIRED', message: '缺少有效 token' }); return null; }
      if (app.rateLimited(playerId)) { ctx.status(429); ctx.json({ ok: false, code: 'RATE_LIMITED', message: '请求过于频繁' }); return null; }
      return playerId;
    };

    const routes: RouteDef[] = [
      // ---- auth ----
      {
        method: 'POST', pattern: '/v1/auth/wechat', handler: (ctx) => {
          const code = String(ctx.body?.code || '');
          if (!code) { ctx.status(400); ctx.json({ ok: false, code: 'BAD_REQUEST', message: 'code required' }); return; }
          // 正式环境: wx.login code → 微信接口换 openid。参考实现按 code 派生稳定 openId。
          const openId = 'wx_' + hmac(this.secret, code).slice(0, 16);
          const nick = '玩家' + openId.slice(3, 7);
          const { player, isNew } = this.store.ensurePlayer(openId, nick, Date.now());
          if (isNew) {
            this.initPlayerAssets(player.playerId);
            this.store.sendMail({ playerId: player.playerId, title: BRAND.welcomeMailTitle, body: BRAND.welcomeMailBody, rewards: [{ assetId: 'COIN', delta: 100 }] });
          }
          this.store.telemetry('login', { playerId: player.playerId, isNew });
          const resp: AuthWechatResponse = {
            token: this.issueToken(player.playerId),
            playerId: player.playerId,
            profile: this.profile,
            configVersion: this.configVersion,
            antiAddiction: this.antiAddiction(player.playerId),
            isNew,
          };
          ctx.json({ ok: true, ...resp });
        },
      },
      // ---- config ----
      {
        method: 'GET', pattern: '/v1/config/bootstrap', handler: (ctx) => {
          ctx.json({ ok: true, ...this.bootstrap() });
        },
      },
      // ---- player ----
      {
        method: 'GET', pattern: '/v1/player/state', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          ctx.json({ ok: true, player: this.playerDto(playerId), antiAddiction: this.antiAddiction(playerId) });
        },
      },
      // ---- compliance ----
      {
        method: 'GET', pattern: '/v1/compliance/status', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          ctx.json({ ok: true, antiAddiction: this.antiAddiction(playerId), privacyConsentRequired: this.profile === 'wechat-release' });
        },
      },
      {
        method: 'POST', pattern: '/v1/compliance/privacy-consent', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const agree = !!ctx.body?.agree;
          const contract = String(ctx.body?.contract || '');
          // 审计留痕（合规可回溯；不记录任何设备信息）
          this.store.audit(playerId, 'privacy.consent', { agree, contract });
          this.store.telemetry(agree ? 'privacy_consent' : 'privacy_refuse', { playerId, contract: contract.slice(0, 40) });
          if (!agree) {
            // 拒绝：仅记录，不做任何资产/玩法操作（用户将退出小游戏）
            ctx.json({ ok: true, recorded: true, action: 'exit' });
            return;
          }
          ctx.json({ ok: true, recorded: true, action: 'proceed' });
        },
      },
      // ---- game session ----
      {
        method: 'POST', pattern: '/v1/game/session/start', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const { featureId, mechanicId } = ctx.body || {};
          if (!featureId || !FEATURES_GAMES[featureId]) { ctx.status(404); ctx.json({ ok: false, code: 'NOT_FOUND', message: `unknown feature ${featureId}` }); return; }
          if (!this.featureAllowed(featureId)) { ctx.status(403); ctx.json({ ok: false, code: 'FEATURE_DISABLED', message: `${featureId} 在 ${this.profile} 配置下不可用`, detail: { policy: this.policyOf(featureId) } }); return; }
          const seed = `${playerId}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
          const s = this.store.createSession(playerId, featureId, seed, mechanicId);
          const game = FEATURES_GAMES[featureId];
          let state: unknown = undefined;
          if (game.readState) {
            try { state = game.readState(this.readCtx(playerId)); } catch { /* 状态读取失败不阻塞会话创建 */ }
          }
          ctx.json({ ok: true, sessionId: s.sessionId, seed, serverTime: Date.now(), state });
        },
      },
      // ---- game action（统一玩法入口） ----
      {
        method: 'POST', pattern: '/v1/game/action', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const { featureId, actionId, sessionId, clientSeq, payload, idempotencyKey } = ctx.body || {};
          if (typeof featureId !== 'string' || typeof actionId !== 'string' ||
            (clientSeq !== undefined && (!Number.isSafeInteger(clientSeq) || clientSeq < 0)) ||
            (payload !== undefined && (payload === null || typeof payload !== 'object' || Array.isArray(payload)))) {
            ctx.status(400); ctx.json({ ok: false, code: 'BAD_REQUEST', message: 'featureId/actionId/clientSeq/payload 格式无效' }); return;
          }
          const game = FEATURES_GAMES[featureId];
          if (!game || typeof game.actions[actionId] !== 'function') { ctx.status(404); ctx.json({ ok: false, code: 'NOT_FOUND', message: `unknown action ${featureId}.${actionId}` }); return; }
          if (!this.featureAllowed(featureId)) { ctx.status(403); ctx.json({ ok: false, code: 'FEATURE_DISABLED', message: `${featureId} 在 ${this.profile} 配置下不可用`, detail: { policy: this.policyOf(featureId) } }); return; }
          const compliance = this.antiAddiction(playerId);
          if (!compliance.playableNow) { ctx.status(403); ctx.json({ ok: false, code: 'COMPLIANCE_BLOCKED', message: compliance.message || '防沉迷限制' }); return; }
          let session = undefined as import('./store').SessionRecord | undefined;
          if (sessionId) {
            session = this.store.session(sessionId);
            if (!session || session.playerId !== playerId || session.featureId !== featureId) { ctx.status(400); ctx.json({ ok: false, code: 'SESSION_STALE', message: '会话无效' }); return; }
            if (session.finished) { ctx.status(400); ctx.json({ ok: false, code: 'SESSION_STALE', message: '会话已结束' }); return; }
            if (typeof clientSeq === 'number') {
              if (clientSeq <= session.clientSeq && (session.data as any).__lastResult?.clientSeq === clientSeq) {
                ctx.json((session.data as any).__lastResult.response);
                return;
              }
              if (clientSeq <= session.clientSeq) { ctx.status(409); ctx.json({ ok: false, code: 'SESSION_STALE', message: `clientSeq ${clientSeq} 已处理（serverSeq=${session.serverSeq}）` }); return; }
              session.clientSeq = clientSeq;
            }
          }
          const player = this.store.player(playerId)!;
          const now = Date.now();
          const nonce = session ? `${session.seed}#${session.serverSeq + 1}` : `${playerId}:${this.playerSeedCounter.get(playerId) ?? 0}`;
          if (!session) this.playerSeedCounter.set(playerId, (this.playerSeedCounter.get(playerId) ?? 0) + 1);
          const rng = session ? new Rng(session.seed).fork(session.serverSeq + 1) : new Rng(nonce);
          const econ = new EconomyOps(this.store, this.profile);
          const gctx = {
            playerId, player, payload: payload || {}, now, tuning: this.tuning, profile: this.profile,
            rng, session, econ, store: this.store,
            num: (p: string, f: number) => this.tuningNum(p, f),
            numRange: (p: string, r: Rng, f: [number, number]) => this.tuningRange(p, r, f),
          };
          try {
            const result = game.actions[actionId](gctx as any);
            if (!result.ok) {
              // 玩法层失败（资源不足/状态错误）→ 统一错误响应
              this.store.telemetry('game_reject', { playerId, featureId, actionId, message: result.message });
              ctx.json({ ok: false, code: 'BAD_REQUEST', message: result.message });
              return;
            }
            const rewards = econ.drainCollected();
            if (result.rank) this.store.rankAdd(result.rank.board, playerId, result.rank.score);
            if (result.history) this.store.pushHistory(playerId, featureId, result.history, rewards);
            const serverSeq = session ? ++session.serverSeq : 0;
            if (session) {
              session.updatedAt = now;
              // 注意：result.state 是面向客户端的脱敏视图；权威状态由 handler 直接写在 session.data，
              // 这里绝不回写，避免客户端视图污染服务端状态。
            }
            if (result.rewards) { /* handler 自定义奖励展示，覆盖自动收集 */ }
            const resp: GameActionResponse = {
              ok: true, message: result.message, serverSeq,
              rewards: (result.rewards as any) ?? rewards,
              items: result.items, state: result.state, counters: result.counters, replayToken: result.replayToken ?? (session ? hmac(this.secret, `${sessionId}:${serverSeq}`).slice(0, 12) : undefined),
            };
            if (session) (session.data as any).__lastResult = { clientSeq: session.clientSeq, response: resp };
            // XP：非失败动作默认给少量经验（玩法可在 result 里自行给）
            if (result.ok) {
              const xp = this.xpForAction(featureId, actionId);
              if (xp > 0) this.grantXp(playerId, xp);
            }
            this.store.telemetry('game_finish', { playerId, featureId, actionId, ok: result.ok });
            ctx.json(resp);
          } catch (err: any) {
            if (err instanceof LedgerError) {
              ctx.status(409);
              ctx.json({ ok: false, code: err.code === 'INSUFFICIENT_BALANCE' ? 'INSUFFICIENT' : 'BAD_REQUEST', message: err.message });
              return;
            }
            throw err;
          }
        },
      },
      // ---- game state read ----
      {
        method: 'GET', pattern: '/v1/game/state', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const featureId = String(ctx.query.get('featureId') || '');
          const game = FEATURES_GAMES[featureId];
          if (!game?.readState) { ctx.status(404); ctx.json({ ok: false, code: 'NOT_FOUND', message: `feature ${featureId} 无状态读取` }); return; }
          if (!this.featureAllowed(featureId)) { ctx.status(403); ctx.json({ ok: false, code: 'FEATURE_DISABLED', message: `${featureId} 不可用` }); return; }
          ctx.json({ ok: true, state: game.readState(this.readCtx(playerId)), serverTime: Date.now() });
        },
      },
      // ---- session finish ----
      {
        method: 'POST', pattern: '/v1/game/session/finish', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const { sessionId } = ctx.body || {};
          const session = this.store.session(String(sessionId || ''));
          if (!session || session.playerId !== playerId) { ctx.status(404); ctx.json({ ok: false, code: 'NOT_FOUND', message: 'session not found' }); return; }
          session.finished = true;
          const replayToken = hmac(this.secret, `${sessionId}:finish:${session.serverSeq}`).slice(0, 16);
          ctx.json({ ok: true, settled: true, serverSeq: session.serverSeq, replayToken });
        },
      },
      // ---- economy ledger ----
      {
        method: 'GET', pattern: '/v1/economy/ledger', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const limit = Math.min(200, Number(ctx.query.get('limit') || 50));
          const assetType = (ctx.query.get('assetType') || undefined) as AssetId | undefined;
          ctx.json({ ok: true, entries: this.store.ledger.entriesOf(playerId, limit, assetType), invariants: this.store.ledger.validateInvariants(playerId) });
        },
      },
      // ---- history / rank ----
      {
        method: 'GET', pattern: '/v1/history', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          ctx.json({ ok: true, rows: this.store.history(playerId, ctx.query.get('featureId') || undefined) });
        },
      },
      {
        method: 'GET', pattern: '/v1/rank/:board', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const board = ctx.params.board;
          const top = this.store.rankTop(board, 50).map((r, i): RankRow => ({
            rank: i + 1, playerId: r.playerId, nick: this.store.player(r.playerId)?.nick ?? r.playerId, score: r.score, isSelf: r.playerId === playerId,
          }));
          const mine = top.find((r) => r.isSelf);
          ctx.json({ ok: true, board, rows: top, self: mine ?? null });
        },
      },
      // ---- mail ----
      {
        method: 'GET', pattern: '/v1/mail', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          ctx.json({ ok: true, mails: this.store.mails(playerId) });
        },
      },
      {
        method: 'POST', pattern: '/v1/mail/claim', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const mail = this.store.mails(playerId).find((m) => m.mailId === ctx.body?.mailId);
          if (!mail) { ctx.status(404); ctx.json({ ok: false, code: 'NOT_FOUND', message: 'mail not found' }); return; }
          if (mail.claimed) { ctx.status(409); ctx.json({ ok: false, code: 'BAD_REQUEST', message: '已领取' }); return; }
          mail.claimed = true;
          const econ = new EconomyOps(this.store, this.profile);
          for (const r of mail.rewards) econ.grant(playerId, r.assetId, r.delta, 'mail', mail.mailId, `mail:${mail.mailId}:${r.assetId}`);
          for (const it of mail.items ?? []) econ.addItems(playerId, it.templateId, it.qty);
          ctx.json({ ok: true, rewards: econ.drainCollected() });
        },
      },
      // ---- social ----
      {
        method: 'POST', pattern: '/v1/social/invite/token', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const token = randomId(10);
          this.store.data.inviteTokens[token] = { inviterId: playerId, createdAt: Date.now() };
          ctx.json({ ok: true, token, shareQuery: `invite=${token}` });
        },
      },
      {
        method: 'POST', pattern: '/v1/social/invite/accept', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const token = String(ctx.body?.token || '');
          const rec = Object.prototype.hasOwnProperty.call(this.store.data.inviteTokens, token) ? this.store.data.inviteTokens[token] : undefined;
          if (!rec) { ctx.status(404); ctx.json({ ok: false, code: 'NOT_FOUND', message: '邀请码无效' }); return; }
          if (Date.now() - rec.createdAt > GameApp.INVITE_TTL_MS) { delete this.store.data.inviteTokens[token]; ctx.status(410); ctx.json({ ok: false, code: 'INVITE_EXPIRED', message: '邀请码已过期' }); return; }
          if (rec.usedBy) { ctx.status(409); ctx.json({ ok: false, code: 'BAD_REQUEST', message: '邀请码已被使用' }); return; }
          if (rec.inviterId === playerId) { ctx.status(400); ctx.json({ ok: false, code: 'BAD_REQUEST', message: '不能接受自己的邀请' }); return; }
          rec.usedBy = playerId;
          const econ = new EconomyOps(this.store, this.profile);
          econ.grant(rec.inviterId, 'COIN', this.tuningNum('tasks.inviteTaskCoin', 50), 'invite', token, `invite:${token}`);
          econ.grant(playerId, 'COIN', 30, 'invite', token, `invite-accept:${token}`);
          ctx.json({ ok: true, message: '邀请成功', rewards: econ.drainCollected() });
        },
      },
      {
        method: 'GET', pattern: '/v1/social/friends', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const friends = Object.values(this.store.data.players)
            .filter((p) => p.playerId !== playerId)
            .slice(0, 30)
            .map((p) => ({ playerId: p.playerId, nick: p.nick, level: p.level, lastActiveAt: p.timestamps.lastActive ?? p.createdAt }));
          ctx.json({ ok: true, friends });
        },
      },
      // ---- telemetry ----
      {
        method: 'POST', pattern: '/v1/telemetry/events', handler: (ctx) => {
          const playerId = guard(ctx);
          if (!playerId) return;
          const events = Array.isArray(ctx.body?.events) ? ctx.body.events : [];
          for (const e of events.slice(0, 100)) this.store.telemetry(String(e.name || 'unknown'), { playerId, ...e.props });
          ctx.json({ ok: true, accepted: Math.min(events.length, 100) });
        },
      },
      // ---- admin（开发用） ----
      {
        method: 'POST', pattern: '/v1/admin/reset', handler: (ctx) => {
          if (process.env.APP_ALLOW_ADMIN !== '1') { ctx.status(403); ctx.json({ ok: false, code: 'FEATURE_DISABLED', message: 'admin disabled' }); return; }
          const configured = process.env.APP_ADMIN_TOKEN;
          const supplied = String(ctx.req.headers['x-admin-token'] || ctx.body?.adminToken || '');
          if (!configured || !safeEqual(supplied, configured)) { ctx.status(401); ctx.json({ ok: false, code: 'ADMIN_AUTH_REQUIRED', message: 'admin token required' }); return; }
          this.store.data = { players: {}, openIdIndex: {}, sessions: {}, mails: [], listings: {}, ranks: {}, history: {}, telemetry: [], inviteTokens: {}, audit: [] };
          this.seedNpcPlayers();
          ctx.json({ ok: true });
        },
      },
    ];

    // 玩法/商业扩展路由由各模块挂载（market/mall/settlement/agent 等）
    attachCommerceRoutes(this, routes);
    return routes;
  }

  private xpForAction(featureId: string, actionId: string): number {
    const table: Record<string, number> = {
      'mine.dig': 6, 'goldMine.dig': 6, 'universe.explore': 10, 'arena.fight': 12,
      'battleRoyal.join': 4, 'undertown.openBrick': 5, 'chicken.feed': 3, 'chicken.collect': 5,
      'marbles.shot': 4, 'sports.round': 5, 'tug.pull': 6, 'escapeTiger.step': 3,
      'monkeyKing.bomb': 4, 'daily.checkin': 2, 'cards.synth': 8, 'gacha.openEgg': 5,
    };
    return table[`${featureId}.${actionId}`] ?? 2;
  }

  readCtx(playerId: string): ReadCtx {
    return {
      playerId, player: this.store.player(playerId)!, now: Date.now(), tuning: this.tuning, profile: this.profile,
      store: this.store, econ: new EconomyOps(this.store, this.profile),
      num: (p, f) => this.tuningNum(p, f),
    };
  }
}
