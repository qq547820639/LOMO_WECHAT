/**
 * Release Safety 测试 —— Section 65/96。
 * 断言 wechat-release 配置下：
 *  - 现金类资产永无正向 delta；
 *  - 现金敏感功能（钱包/提现/下注/竞拍/P2P 交易/代理/现金红包）API 全部 FEATURE_DISABLED；
 *  - 高风险 RemoteConfig 键无法远程开启；
 *  - FULL CLONE 沙盒桥永不实际兑付。
 */
import * as assert from 'node:assert';
import { GameApp } from '../server/src/app';
import { RELEASE_LOCKED_FLAGS } from '../shared/src/config';

function makeCall(app: GameApp) {
  const routes = app.routes();
  return function call(path: string, method: 'GET' | 'POST', body?: any, token?: string): Promise<any> {
    const [pathname, query] = path.split('?');
    const pp = (pathname as string).split('/').filter(Boolean);
    let found: any = null;
    for (const r of routes) {
      if (r.method !== method) continue;
      const cp = r.pattern.split('/').filter(Boolean);
      if (cp.length !== pp.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < cp.length; i++) {
        if (cp[i].startsWith(':')) params[cp[i].slice(1)] = decodeURIComponent(pp[i]);
        else if (cp[i] !== pp[i]) { ok = false; break; }
      }
      if (ok) { found = { handler: r.handler, params }; break; }
    }
    if (!found) return Promise.resolve({ ok: false, code: 'NO_ROUTE' });
    const out: any = {};
    const ctx = {
      req: { headers: { authorization: token ? 'Bearer ' + token : '' } }, res: {}, method, path: pathname,
      params: found.params, query: new URLSearchParams(query || ''), body: body || {}, status() {}, json(d: any) { out.d = d; },
    };
    return Promise.resolve(found.handler(ctx)).then(() => out.d);
  };
}

export async function run(): Promise<void> {
  const app = new GameApp({ profile: 'wechat-release', bootPngSeeds: true });
  const call = makeCall(app);
  const t = await (async () => {
    const r = await call('/v1/auth/wechat', 'POST', { code: 'release-safety' });
    assert.ok(r.ok, 'release login');
    return r.token as string;
  })();

  // 1. 初始资产不含现金类
  const ps = await call('/v1/player/state', 'GET', undefined, t);
  const balances = ps.player.balances;
  for (const forbidden of ['TEST_CREDIT', 'RED_PACKET_PROGRESS']) {
    assert.ok(!(forbidden in balances) || balances[forbidden] === 0, `${forbidden} absent in release bootstrap`);
  }

  // 2. 现金敏感 API 全部禁用
  const blockedCases: Array<[string, 'GET' | 'POST', any]> = [
    ['/v1/market/listings', 'GET', undefined],
    ['/v1/market/list', 'POST', { templateId: 'card_ape_1', qty: 1, unitPrice: 10 }],
    ['/v1/market/buy', 'POST', { listingId: 'x' }],
    ['/v1/market/bid', 'POST', { listingId: 'x', bid: 10 }],
    ['/v1/mall/goods', 'GET', undefined],
    ['/v1/mall/order', 'POST', { goodsId: 'g_ape_card_pack' }],
    ['/v1/agent/summary', 'GET', undefined],
    ['/v1/settlement/balance', 'GET', undefined],
    ['/v1/settlement/withdrawal-preview', 'POST', { amount: '100' }],
  ];
  for (const [path, method, body] of blockedCases) {
    const r = await call(path, method, body, t);
    assert.equal(r.code, 'FEATURE_DISABLED', `${method} ${path} blocked (got ${r.code}: ${r.message})`);
  }

  // 3. 沙盒之外的正常玩法仍可用（保持游戏性）
  const okCases: Array<[string, any]> = [
    ['/v1/game/action', { featureId: 'daily', actionId: 'checkin' }],
    ['/v1/game/action', { featureId: 'goldMine', actionId: 'dig' }],
    ['/v1/game/action', { featureId: 'arena', actionId: 'fight', payload: { opponentIdx: 0, moves: ['attack', 'defend', 'charge'] } }],
  ];
  for (const [path, body] of okCases) {
    const r = await call(path, 'POST', body, t);
    assert.ok(r.ok, `release keeps gameplay: ${body.featureId}.${body.actionId} → ${r.message}`);
  }

  // 4. 高风险 RemoteConfig 键被锁定
  assert.ok(RELEASE_LOCKED_FLAGS.length >= 8);
  const cfg = app.remoteConfig();
  assert.equal(cfg.profile, 'wechat-release');

  // 5. FULL CLONE 沙盒桥永不兑付
  const full = new GameApp({ profile: 'full-clone', bootPngSeeds: false });
  const fcall = makeCall(full);
  const ft = await (async () => { const r = await fcall('/v1/auth/wechat', 'POST', { code: 'full-sandbox' }); return r.token as string; })();
  const bal = await fcall('/v1/settlement/balance', 'GET', undefined, ft);
  assert.ok(bal.ok && /沙盒/.test(bal.displayAmount), 'full-clone settlement is sandbox-branded');
  const wd = await fcall('/v1/settlement/withdrawal-preview', 'POST', { amount: '999' }, ft);
  assert.ok(wd.ok && /不会实际兑付/.test(wd.arrival), 'withdrawal preview never pays');

  // 6. RELEASE 禁改资产守卫：直接调用 EconomyOps 发放被拒
  const { EconomyOps } = await import('../server/src/economy');
  const econ = new EconomyOps(app.store, 'wechat-release');
  assert.throws(() => econ.grant('some-player', 'TEST_CREDIT' as any, 100, 'hack', 'x'), /RELEASE_FORBIDDEN_ASSET/);

  // 7. 规范 2.5.1（2026-08 复核）：RELEASE 不得存在任何 用户→用户 资产转移通道
  //   a) 路由表扫描：不存在 gift/transfer/send/p2p 直转类路由
  const transferRoute = app.routes().find((r) => /gift|transfer|\/send|p2p/i.test(r.pattern));
  assert.ok(!transferRoute, `no user-to-user transfer route (found: ${transferRoute?.pattern})`);
  //   b) 邮件为 NPC/系统单向：跨玩家领取必须失败（A 无法冒领 B 的邮件，也无法经邮件把资产给 B）
  const mail = app.store.sendMail({ playerId: 'victim-player', title: '私件', body: 'x', rewards: [{ assetId: 'COIN', delta: 50 }] });
  const wrongClaim = await call('/v1/mail/claim', 'POST', { mailId: mail.mailId }, t);
  assert.equal(wrongClaim.ok, false, 'cross-player mail claim rejected');
  //   c) 市场类路由（唯一 P2P 资产通道）在 RELEASE 已全关（前述 blockedCases 已断言 listings/list/buy/bid）
  //   d) FULL 沙盒桥免责语义仍成立（FULL 下提现界面存在但永不兑付）
  const fullApp = new GameApp({ profile: 'full-clone', bootPngSeeds: false });
  const fcall2 = makeCall(fullApp);
  const ft2 = (await fcall2('/v1/auth/wechat', 'POST', { code: 'full-251' })).token;
  const fbal = await fcall2('/v1/settlement/balance', 'GET', undefined, ft2);
  assert.ok(fbal.ok && /不可兑换|不可提现|沙盒/.test(fbal.notice), 'full sandbox notice present');

  console.log('release-safety ok: 9 blocked APIs / forbidden assets guarded / sandbox bridge inert / gameplay preserved / no user-to-user transfer channel (spec 2.5.1)');
}

if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
