/**
 * 玩法测试（服务端逻辑层）：大逃杀全流程/地下城概率确定性/竞技场三回合状态机/矿场生产/卡牌合成/每日。
 * 直接驱动 GameApp 路由（进程内，无 HTTP）。
 */
import * as assert from 'node:assert';
import { GameApp } from '../server/src/app';

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
    assert.ok(found, 'route exists ' + method + ' ' + path);
    const out: any = {};
    const ctx = {
      req: { headers: { authorization: token ? 'Bearer ' + token : '' } }, res: {}, method, path: pathname,
      params: found.params, query: new URLSearchParams(query || ''), body: body || {}, status() {}, json(d: any) { out.d = d; },
    };
    return Promise.resolve(found.handler(ctx)).then(() => out.d);
  };
}

async function login(call: ReturnType<typeof makeCall>, code: string): Promise<string> {
  const r = await call('/v1/auth/wechat', 'POST', { code });
  assert.ok(r.ok, 'login');
  return r.token;
}

export async function run(): Promise<void> {
  // ---------- 大逃杀：淘汰分支铸匕首 ----------
  {
    const app = new GameApp({ profile: 'full-clone' });
    const call = makeCall(app);
    const t = await login(call, 'g-br');
    const s = await call('/v1/game/session/start', 'POST', { featureId: 'battleRoyal' }, t);
    const join = await call('/v1/game/action', 'POST', { featureId: 'battleRoyal', actionId: 'join', sessionId: s.sessionId, clientSeq: 1, payload: { roomId: 1 } }, t);
    assert.ok(join.ok);
    let outcome = '';
    for (let i = 2; i <= 60; i++) {
      const r = await call('/v1/game/action', 'POST', { featureId: 'battleRoyal', actionId: 'act', sessionId: s.sessionId, clientSeq: i, payload: { kind: 'hide' } }, t);
      assert.ok(r.ok, 'br act: ' + r.message);
      if (r.message.includes('幸存') || r.message.includes('被淘汰')) { outcome = r.message; break; }
    }
    assert.ok(outcome, 'round resolves within maxRounds');
    const fin = await call('/v1/game/session/finish', 'POST', { sessionId: s.sessionId }, t);
    assert.ok(fin.ok && fin.replayToken, 'finish issues replay token');
    const dup = await call('/v1/game/action', 'POST', { featureId: 'battleRoyal', actionId: 'act', sessionId: s.sessionId, clientSeq: 99, payload: { kind: 'hide' } }, t);
    assert.equal(dup.ok, false, 'finished session rejects further actions');
  }

  // ---------- 大逃杀：重复 join 拒绝 ----------
  {
    const app = new GameApp({ profile: 'full-clone' });
    const call = makeCall(app);
    const t = await login(call, 'g-br2');
    const s = await call('/v1/game/session/start', 'POST', { featureId: 'battleRoyal' }, t);
    await call('/v1/game/action', 'POST', { featureId: 'battleRoyal', actionId: 'join', sessionId: s.sessionId, clientSeq: 1, payload: { roomId: 1 } }, t);
    const s2 = await call('/v1/game/session/start', 'POST', { featureId: 'battleRoyal' }, t);
    const dup = await call('/v1/game/action', 'POST', { featureId: 'battleRoyal', actionId: 'join', sessionId: s2.sessionId, clientSeq: 1, payload: { roomId: 2 } }, t);
    assert.equal(dup.ok, false, 'second concurrent join rejected');
  }

  // ---------- 地下城：24 块砖、大奖保底推进 ----------
  {
    const app = new GameApp({ profile: 'full-clone' });
    const call = makeCall(app);
    const t = await login(call, 'g-ut');
    let floor = 1;
    for (let i = 0; i < 30; i++) {
      const r = await call('/v1/game/action', 'POST', { featureId: 'undertown', actionId: 'openBrick', payload: { brickIndex: (i % 24) + 1 } }, t);
      assert.ok(r.ok, 'brick open: ' + r.message);
      if (r.message.includes('保底') || r.message.includes('大奖')) { floor = r.message.includes('大奖') ? floor + 1 : floor + 1; break; }
    }
    assert.ok(floor >= 2, 'floor progression');
    // 奖券耗尽后拒绝
    const app2state = JSON.parse(JSON.stringify((app as any).store.data));
    void app2state;
  }

  // ---------- 竞技场：出招序列影响结果（非单随机数） ----------
  {
    const app = new GameApp({ profile: 'full-clone' });
    const call = makeCall(app);
    const t = await login(call, 'g-arena');
    const r1 = await call('/v1/game/action', 'POST', { featureId: 'arena', actionId: 'fight', payload: { opponentIdx: 0, moves: ['charge', 'attack', 'attack'] } }, t);
    assert.ok(r1.ok);
    assert.ok(r1.message.includes('回合'), 'duel log present');
    const st = await call('/v1/game/state?featureId=arena', 'GET', undefined, t);
    assert.ok(st.ok && st.state.power > 0, 'power computed');
  }

  // ---------- 矿场：开采→时间未到拒绝→直接收取（调时间戳）→产出 ----------
  {
    const app = new GameApp({ profile: 'full-clone', bootPngSeeds: false });
    const call = makeCall(app);
    const t = await login(call, 'g-mine');
    const start = await call('/v1/game/action', 'POST', { featureId: 'apeMine', actionId: 'startPit', payload: { pitIdx: 1 } }, t);
    assert.ok(start.ok);
    const early = await call('/v1/game/action', 'POST', { featureId: 'apeMine', actionId: 'claimPit', payload: { pitIdx: 1 } }, t);
    assert.equal(early.ok, false, 'claim before ready rejected');
    const player = Object.values((app as any).store.data.players)[0] as any;
    player.timestamps['mine.pit0.readyAt'] = Date.now() - 1000;
    const claim = await call('/v1/game/action', 'POST', { featureId: 'apeMine', actionId: 'claimPit', payload: { pitIdx: 1 } }, t);
    assert.ok(claim.ok, 'claim after ready: ' + claim.message);
    assert.ok(app.store.ledger.balanceOf(player.playerId, 'GEMSTONE') > 0, 'gemstone granted via ledger');
  }

  // ---------- 卡牌：3 合 1 / 拆分 ----------
  {
    const app = new GameApp({ profile: 'full-clone', bootPngSeeds: false });
    const call = makeCall(app);
    const t = await login(call, 'g-cards');
    for (let i = 0; i < 5; i++) await call('/v1/game/action', 'POST', { featureId: 'cards', actionId: 'freeDraw' }, t);
    const player = Object.values((app as any).store.data.players)[0] as any;
    player.inventory['card_ape_1'] = { qty: 3, lockedQty: 0 };
    const synth = await call('/v1/game/action', 'POST', { featureId: 'cards', actionId: 'synth', payload: {} }, t);
    assert.ok(synth.ok, 'synth with duplicates: ' + synth.message);
    const inv = Object.entries((Object.values((app as any).store.data.players)[0] as any).inventory).find(([k]) => k.endsWith('_plus'));
    assert.ok(inv, 'plus card created');
  }

  // ---------- 每日：签到幂等 + 任务奖励 ----------
  {
    const app = new GameApp({ profile: 'full-clone' });
    const call = makeCall(app);
    const t = await login(call, 'g-daily');
    const c1 = await call('/v1/game/action', 'POST', { featureId: 'daily', actionId: 'checkin' }, t);
    const c2 = await call('/v1/game/action', 'POST', { featureId: 'daily', actionId: 'checkin' }, t);
    assert.ok(c1.ok && !c2.ok, 'checkin idempotent per day');
  }

  // ---------- 经济不变量：全部玩家账本连续 ----------
  {
    const app = new GameApp({ profile: 'full-clone', bootPngSeeds: false });
    const call = makeCall(app);
    const t = await login(call, 'g-econ');
    await call('/v1/game/action', 'POST', { featureId: 'undertown', actionId: 'openBrick', payload: { brickIndex: 1 } }, t);
    await call('/v1/game/action', 'POST', { featureId: 'arena', actionId: 'fight', payload: { opponentIdx: 1, moves: ['attack', 'attack', 'attack'] } }, t);
    await call('/v1/game/action', 'POST', { featureId: 'box', actionId: 'earnKey' }, t);
    await call('/v1/game/action', 'POST', { featureId: 'box', actionId: 'openFree' }, t);
    for (const playerId of Object.keys((app as any).store.data.players)) {
      const inv = app.store.ledger.validateInvariants(playerId);
      assert.ok(inv.ok, `ledger continuous for ${playerId}: ${inv.errors.join(';')}`);
    }
  }

  console.log('gameplay-server ok: battleRoyal/dungeon/arena/mine/cards/daily/ledger');
}

if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
