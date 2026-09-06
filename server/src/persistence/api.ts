import { createHash, createHmac, randomBytes } from 'node:crypto';
import { BRAND } from '../../../shared/src/brand';
import { GameApp } from '../app';
import { HttpCtx, RouteDef } from '../http';
import { clone, PersistedDocument, PersistenceError } from './database';
import { CommandResponse, identity, PlayerCore, RANK_BOARDS } from './models';
import { PersistentRepository } from './repository';

const FEATURE_BOARDS: Record<string, string[]> = { battleRoyal: ['seasonScore'], undertown: ['undertownDepth'], arena: ['arenaPower'], robbery: ['robberyScore'], monkeyKing: ['monkeyKingContribution'], multiplePit: ['seasonScore'] };

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
}

function error(status: number, code: string, message: string): CommandResponse { return { status, body: { ok: false, code, message } }; }

export class PersistentApi {
  constructor(private app: GameApp, readonly repository: PersistentRepository, private appId: string) {
    if (app.profile !== 'wechat-release') throw new Error('External persistence supports wechat-release only; full-clone commerce requires separate transactions');
    if (!/^wx[a-f0-9]{16}$/.test(appId)) throw new Error('External persistence requires APP_WX_APPID');
  }

  routes(): RouteDef[] {
    return this.app.routes().map((route) => ({ ...route, handler: async (ctx) => {
      let response: CommandResponse;
      try { response = await this.dispatch(route, ctx); }
      catch (caught) {
        response = error(503, caught instanceof PersistenceError ? caught.code : 'PERSISTENCE_UNAVAILABLE', '进度暂时无法保存，请稍后重试');
      }
      ctx.status(response.status);
      ctx.json(response.body);
    } }));
  }

  private async capture(route: RouteDef, ctx: HttpCtx): Promise<CommandResponse> {
    let response: CommandResponse = { status: 200, body: { ok: true } };
    await route.handler({ ...ctx, res: {}, status: (status) => { response.status = status; }, json: (body) => { response.body = clone(body); } });
    return response;
  }

  private async dispatch(route: RouteDef, ctx: HttpCtx): Promise<CommandResponse> {
    if (route.pattern === '/health') { return this.capture(route, ctx); }
    if (route.pattern === '/v1/config/bootstrap') { await this.repository.ready(); return this.capture(route, ctx); }
    if (route.pattern === '/v1/admin/reset') return error(403, 'FEATURE_DISABLED', '持久化服务禁止在线重置玩家数据');
    if (/^\/v1\/(market|mall|settlement|agent)\//.test(route.pattern)) return error(403, 'FEATURE_DISABLED', '正式版本未开放该功能');
    if (route.pattern === '/v1/auth/wechat') return this.login(ctx);
    const token = String(ctx.req.headers['authorization'] || '').replace(/^Bearer\s+/i, '') || (typeof ctx.body?.token === 'string' ? ctx.body.token : undefined);
    const actor = this.app.verifyTokenSignature(token);
    if (!actor) return error(401, 'AUTH_REQUIRED', '缺少有效 token');
    if (!this.app.playerRequestAllowed(actor)) return error(429, 'RATE_LIMITED', '请求过于频繁');
    const mutating = route.method !== 'GET';
    const body = ctx.body || {};
    if (Buffer.byteLength(canonical(body), 'utf8') > 16 * 1024) return error(413, 'BAD_REQUEST', '单次操作内容过大');
    if (route.pattern === '/v1/telemetry/events' && Array.isArray(body.events) && body.events.length > 20) return error(413, 'BAD_REQUEST', '一次最多上报 20 条事件');
    let commandKey = body.idempotencyKey;
    if (!commandKey && route.pattern === '/v1/game/action' && typeof body.sessionId === 'string' && Number.isSafeInteger(body.clientSeq)) commandKey = `${body.sessionId}:${body.clientSeq}`;
    if (mutating && (typeof commandKey !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(commandKey))) return error(400, 'IDEMPOTENCY_REQUIRED', '操作必须携带有效请求标识');
    const commandId = mutating ? `${route.pattern}:${commandKey}` : undefined;
    const fingerprint = createHash('sha256').update(canonical({ method: ctx.method, route: route.pattern, body })).digest('hex');
    const now = this.app.now();
    const featureId = typeof body.featureId === 'string' ? body.featureId : ctx.query.get('featureId') || undefined;
    if (!mutating && ['/v1/economy/ledger', '/v1/history', '/v1/mail', '/v1/rank/:board', '/v1/social/friends'].includes(route.pattern)) return this.readPage(route, ctx, actor);
    const views: PersistedDocument[] = [];
    let candidates: PersistedDocument[] | undefined;
    if (route.pattern === '/v1/game/state' || route.pattern === '/v1/game/session/start') {
      views.push(...await this.repository.database.query({ kind: 'history', owner: actor, board: featureId, order: 'seq', direction: 'desc', limit: 50 }));
      for (const board of FEATURE_BOARDS[featureId || ''] || []) views.push(...await this.repository.database.query({ kind: 'rank', board, order: 'score', direction: 'desc', limit: 10 }));
    }
    if (featureId === 'arena') candidates = await this.repository.database.query({ kind: 'player', order: 'createdAt', direction: 'asc', limit: 9 });
    const entropy = createHmac('sha256', this.app.secret).update(`${actor}:${commandId || randomBytes(16).toString('hex')}`).digest('hex');
    return this.repository.execute({ actor, now, entropy, commandId, fingerprint, mutating, featureId,
      rewardedAds: route.pattern.startsWith('/v1/ads/rewarded/'),
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
      mailId: route.pattern === '/v1/mail/claim' && typeof body.mailId === 'string' ? body.mailId : undefined,
      inviteToken: route.pattern === '/v1/social/invite/accept' && typeof body.token === 'string' ? body.token : undefined,
      candidates, views,
    }, async (store) => {
      store.setCards(this.app.store.cards);
      const scoped = this.app.withStore(store, store.commandTime, () => store.newId('id'));
      const handler = scoped.routes().find((candidate) => candidate.method === route.method && candidate.pattern === route.pattern)!;
      return this.capture(handler, ctx);
    });
  }

  private async login(ctx: HttpCtx): Promise<CommandResponse> {
    if (!this.app.loginAllowed(ctx)) return error(429, 'RATE_LIMITED', '登录请求过于频繁，请稍后重试');
    const code = ctx.body?.code;
    if (typeof code !== 'string' || !code.trim() || code !== code.trim() || code.length > 256) return error(400, 'BAD_REQUEST', '无效的微信登录凭证');
    let openId: string;
    try { openId = await this.app.authenticateWechatCode(code); }
    catch { return error(502, 'WECHAT_AUTH_FAILED', '微信登录暂不可用，请稍后重试'); }
    const identityKey = `${this.appId}:${openId}`;
    const actor = `p_${createHash('sha256').update(identityKey).digest('hex').slice(0, 24)}`;
    const now = this.app.now();
    const entropy = randomBytes(32).toString('hex');
    return this.repository.execute({ actor, openId, identityKey, now, entropy, fingerprint: '', mutating: true }, async (store) => {
      const scoped = this.app.withStore(store, now, () => store.newId('id'));
      const { player, isNew } = store.ensurePlayer(openId, '玩家' + openId.slice(3, 7), now);
      if (isNew) {
        scoped.initPlayerAssets(player.playerId);
        store.sendMail({ playerId: player.playerId, title: BRAND.welcomeMailTitle, body: BRAND.welcomeMailBody, rewards: [{ assetId: 'COIN', delta: 100 }] });
      }
      store.telemetry('login', { playerId: player.playerId, isNew });
      return { status: 200, body: { ok: true, token: scoped.issueToken(player.playerId), playerId: player.playerId, profile: scoped.profile, configVersion: scoped.configVersion, antiAddiction: scoped.antiAddiction(player.playerId), isNew } };
    });
  }

  private async readPage(route: RouteDef, ctx: HttpCtx, actor: string): Promise<CommandResponse> {
    const core = await this.repository.database.get(identity('player', actor));
    if (!core) return error(401, 'AUTH_REQUIRED', '账号不存在，请重新登录');
    const limit = Number(ctx.query.get('limit') || 50);
    const rawCursor = ctx.query.get('cursor');
    const cursor = rawCursor === null ? undefined : Number(rawCursor);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200 || (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 0))) return error(400, 'BAD_REQUEST', '分页参数无效');
    if (route.pattern === '/v1/social/friends') {
      const rows = await this.repository.database.query({ kind: 'player', order: 'createdAt', direction: 'asc', limit: 31 });
      return { status: 200, body: { ok: true, friends: rows.filter((row) => row.owner !== actor).slice(0, 30).map((row) => { const player = row.payload as PlayerCore; return { playerId: player.playerId, nick: player.nick, level: player.level, lastActiveAt: player.createdAt }; }) } };
    }
    if (route.pattern === '/v1/rank/:board') {
      const board = ctx.params.board;
      if (!RANK_BOARDS.includes(board)) return error(404, 'NOT_FOUND', '排行榜不存在');
      const documents = await this.repository.database.query({ kind: 'rank', board, order: 'score', direction: 'desc', limit: Math.min(limit, 50) });
      const rows = documents.map((row, index) => ({ rank: index + 1, playerId: row.owner, nick: (row.payload as { nick: string }).nick, score: row.score, isSelf: row.owner === actor }));
      return { status: 200, body: { ok: true, board, rows, self: rows.find((row) => row.isSelf) || null } };
    }
    const kind = route.pattern === '/v1/economy/ledger' ? 'ledger' : route.pattern === '/v1/history' ? 'history' : 'mail';
    const board = kind === 'ledger' ? ctx.query.get('assetType') || undefined : kind === 'history' ? ctx.query.get('featureId') || undefined : undefined;
    const rows = await this.repository.database.query({ kind, owner: actor, board, before: cursor, order: 'seq', direction: 'desc', limit });
    const nextCursor = rows.length === limit ? rows[rows.length - 1].seq : null;
    const payloads = rows.map((row) => ({ ...(row.payload as object), ...(kind === 'ledger' ? { seq: row.seq } : {}) }));
    if (kind === 'ledger') {
      const assetType = ctx.query.get('assetType');
      return { status: 200, body: { ok: true, entries: assetType ? payloads.filter((entry: any) => entry.assetType === assetType) : payloads, nextCursor, invariants: { ok: null, scope: 'page', message: '完整账本校验由服务端分页审计执行' } } };
    }
    if (kind === 'history') {
      const featureId = ctx.query.get('featureId');
      return { status: 200, body: { ok: true, rows: featureId ? payloads.filter((entry: any) => entry.featureId === featureId) : payloads, nextCursor } };
    }
    return { status: 200, body: { ok: true, mails: payloads, nextCursor } };
  }
}
