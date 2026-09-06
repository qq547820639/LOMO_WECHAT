import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { GameApp } from '../server/src/app';

async function invoke(app: GameApp, method: string, pattern: string, body: any = {}, headers: Record<string, string> = {}, address = '127.0.0.1'): Promise<any> {
  const route = app.routes().find((candidate) => candidate.method === method && candidate.pattern === pattern);
  assert.ok(route, `route ${method} ${pattern}`);
  const out: any = { status: 200 };
  const ctx: any = {
    req: { headers, socket: { remoteAddress: address } }, res: {}, method, path: pattern, params: {}, query: new URLSearchParams(), body,
    status(code: number) { out.status = code; }, json(data: unknown) { out.data = data; },
  };
  await route!.handler(ctx);
  return { ...out.data, httpStatus: out.status };
}

export async function run(): Promise<void> {
  const names = ['APP_ALLOW_ADMIN', 'APP_ADMIN_TOKEN', 'APP_WX_APPID', 'APP_WX_APPSECRET', 'APP_SECRET', 'NODE_ENV'] as const;
  const prior = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const originalNow = Date.now;
  const originalFetch = globalThis.fetch;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lomo-store-'));
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error('Unexpected network access in security test'); };
  for (const name of names) delete process.env[name];
  process.env.NODE_ENV = 'test';
  process.env.APP_ALLOW_ADMIN = '1';
  process.env.APP_ADMIN_TOKEN = 'hardening-test-token';
  try {
    const app = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, secret: 'hardening-secret', allowSyntheticWechatAuth: true });
    const login = await invoke(app, 'POST', '/v1/auth/wechat', { code: 'hardening-user' });
    assert.ok(login.ok);
    assert.equal(app.verifyToken(login.token), login.playerId);
    assert.equal(app.verifyToken(login.token.slice(0, -1) + 'x'), null);
    try {
      Date.now = () => originalNow() + 8 * 86400000;
      assert.equal(app.verifyToken(login.token), null);
    } finally {
      Date.now = originalNow;
    }

    const productionAuth = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, allowSyntheticWechatAuth: false });
    const missingCredentials = await invoke(productionAuth, 'POST', '/v1/auth/wechat', { code: 'arbitrary-code' });
    assert.equal(missingCredentials.code, 'WECHAT_AUTH_FAILED');
    assert.equal(missingCredentials.httpStatus, 502);
    assert.equal(missingCredentials.message, '微信登录暂不可用，请稍后重试');

    let exchangedCodes = 0;
    const exchanged = new GameApp({
      profile: 'wechat-release', bootPngSeeds: false, allowSyntheticWechatAuth: false,
      wechatCodeExchange: async (code) => { exchangedCodes++; return { openid: `real-openid:${code}`, errcode: 0 }; },
    });
    assert.equal((await invoke(exchanged, 'POST', '/v1/auth/wechat', { code: 'one-time-code' })).ok, true);
    for (const code of [undefined, null, 42, {}, [], '', ' ', ' code ', 'code\n', 'a'.repeat(257)]) {
      const invalid = await invoke(exchanged, 'POST', '/v1/auth/wechat', { code });
      assert.equal(invalid.code, 'BAD_REQUEST');
      assert.equal(invalid.httpStatus, 400);
    }
    assert.equal(exchangedCodes, 1, 'invalid codes never reach the exchange');

    for (const response of [null, {}, { openid: '' }, { openid: ' ' }, { openid: 12 }, { openid: ' valid ' }, { openid: 'a'.repeat(129) }, { openid: 'valid', errcode: 40029 }, { openid: 'valid', errcode: '0' }]) {
      const invalidExchange = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, wechatCodeExchange: async () => response as any });
      const rejected = await invoke(invalidExchange, 'POST', '/v1/auth/wechat', { code: 'invalid-session' });
      assert.equal(rejected.code, 'WECHAT_AUTH_FAILED');
      assert.equal(Object.keys(invalidExchange.store.data.players).length, 0);
    }

    const failingExchange = new GameApp({
      profile: 'wechat-release', bootPngSeeds: false,
      wechatCodeExchange: async () => { throw new Error('secret=https://internal/?secret=do-not-leak'); },
    });
    const failure = await invoke(failingExchange, 'POST', '/v1/auth/wechat', { code: 'throwing-exchange' });
    assert.equal(failure.message, missingCredentials.message);
    assert.equal(JSON.stringify(failure).includes('do-not-leak'), false);

    const limited = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, allowSyntheticWechatAuth: true });
    const windowStart = originalNow();
    try {
      Date.now = () => windowStart;
      for (let attempt = 0; attempt < 30; attempt++) {
        assert.equal((await invoke(limited, 'POST', '/v1/auth/wechat', {}, { 'x-forwarded-for': `203.0.113.${attempt}` })).httpStatus, 400);
      }
      assert.equal((await invoke(limited, 'POST', '/v1/auth/wechat', { code: 'limited' }, { 'x-forwarded-for': '198.51.100.1' })).httpStatus, 429);
      assert.equal((await invoke(limited, 'POST', '/v1/auth/wechat', { code: 'another-peer' }, {}, '127.0.0.2')).ok, true);
      Date.now = () => windowStart + 60000;
      assert.equal((await invoke(limited, 'POST', '/v1/auth/wechat', { code: 'after-window' })).ok, true);
      const aggregate = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, allowSyntheticWechatAuth: true });
      for (let attempt = 0; attempt < 300; attempt++) {
        assert.equal((await invoke(aggregate, 'POST', '/v1/auth/wechat', {}, {}, `peer-${attempt}`)).httpStatus, 400);
      }
      assert.equal((await invoke(aggregate, 'POST', '/v1/auth/wechat', { code: 'aggregate-limited' }, {}, 'peer-new')).httpStatus, 429);
    } finally {
      Date.now = originalNow;
    }

    assert.equal((await invoke(app, 'POST', '/v1/admin/reset')).code, 'ADMIN_AUTH_REQUIRED');
    assert.equal((await invoke(app, 'POST', '/v1/telemetry/events', { events: [{ name: 'unauth' }] })).code, 'AUTH_REQUIRED');
    assert.equal((await invoke(app, 'POST', '/v1/admin/reset', {}, { 'x-admin-token': 'hardening-test-token' })).ok, true);
    assert.equal(app.verifyToken(login.token), null);
    const snapshot = path.join(directory, 'nested', 'store.json');
    const persisted = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, persistPath: snapshot, allowSyntheticWechatAuth: true });
    await invoke(persisted, 'POST', '/v1/auth/wechat', { code: 'persisted-user' });
    persisted.store.maybePersist(true);
    assert.ok(fs.existsSync(snapshot));
    const restored = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, persistPath: snapshot, allowSyntheticWechatAuth: true });
    assert.equal(Object.keys(restored.store.data.players).length, 1);
    assert.equal(networkCalls, 0, 'offline auth tests never access the network');

    process.env.APP_WX_APPID = 'wx1111111111111111';
    process.env.APP_WX_APPSECRET = 'unit-test-secret'.repeat(3);
    globalThis.fetch = async (input, init) => {
      networkCalls++;
      const endpoint = new URL(String(input));
      assert.equal(endpoint.origin, 'https://api.weixin.qq.com');
      assert.equal(endpoint.pathname, '/sns/jscode2session');
      assert.equal(endpoint.searchParams.get('appid'), process.env.APP_WX_APPID);
      assert.equal(endpoint.searchParams.get('secret'), process.env.APP_WX_APPSECRET);
      assert.equal(endpoint.searchParams.get('js_code'), 'mocked-official-code');
      assert.equal(endpoint.searchParams.get('grant_type'), 'authorization_code');
      assert.ok(init?.signal);
      return { ok: true, json: async () => ({ openid: 'official-test-openid' }) } as Response;
    };
    assert.equal((await invoke(productionAuth, 'POST', '/v1/auth/wechat', { code: 'mocked-official-code' })).ok, true);
    assert.equal(networkCalls, 1);
    assert.equal((await invoke(persisted, 'POST', '/v1/auth/wechat', { code: 'still-offline' })).ok, true);
    assert.equal(networkCalls, 1, 'explicit synthetic auth stays offline when credential variables exist');

    globalThis.fetch = async () => ({ ok: false, status: 503 }) as Response;
    assert.equal((await invoke(productionAuth, 'POST', '/v1/auth/wechat', { code: 'http-failure' })).message, missingCredentials.message);
    globalThis.fetch = async () => ({ ok: true, json: async () => { throw new Error('invalid-json-secret'); } }) as unknown as Response;
    assert.equal((await invoke(productionAuth, 'POST', '/v1/auth/wechat', { code: 'json-failure' })).message, missingCredentials.message);

    let timeoutSignal: AbortSignal | null = null;
    globalThis.fetch = async (_input, init) => {
      timeoutSignal = init!.signal!;
      return new Promise<Response>(() => {});
    };
    const startedAt = originalNow();
    const timedOut = await invoke(productionAuth, 'POST', '/v1/auth/wechat', { code: 'timeout-code' });
    assert.equal(timedOut.code, 'WECHAT_AUTH_FAILED');
    assert.equal(timedOut.message, missingCredentials.message);
    assert.ok(originalNow() - startedAt < 10000, 'exchange timeout bounds stalled network calls');
    assert.equal((timeoutSignal as AbortSignal | null)?.aborted, true);
    process.env.NODE_ENV = 'production';
    assert.throws(() => new GameApp({ allowSyntheticWechatAuth: true }), /disabled in production/);
    console.log('security-hardening ok: isolated auth exchange/input validation/timeouts/login limits/tokens/admin/persistence');
  } finally {
    Date.now = originalNow;
    globalThis.fetch = originalFetch;
    fs.rmSync(directory, { recursive: true, force: true });
    for (const name of names) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  }
}

if (require.main === module) run().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
