import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { GameApp } from '../server/src/app';

function invoke(app: GameApp, method: string, pattern: string, body: any = {}, headers: Record<string, string> = {}): any {
  const route = app.routes().find((r) => r.method === method && r.pattern === pattern);
  assert.ok(route, `route ${method} ${pattern}`);
  const out: any = {};
  const ctx: any = {
    req: { headers }, res: {}, method, path: pattern, params: {}, query: new URLSearchParams(), body,
    status(code: number) { this.code = code; }, json(data: unknown) { out.data = data; },
  };
  route!.handler(ctx);
  return out.data;
}

export async function run(): Promise<void> {
  const priorAllow = process.env.APP_ALLOW_ADMIN;
  const priorAdmin = process.env.APP_ADMIN_TOKEN;
  process.env.APP_ALLOW_ADMIN = '1';
  process.env.APP_ADMIN_TOKEN = 'hardening-test-token';
  try {
    const app = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, secret: 'hardening-secret' });
    const login = invoke(app, 'POST', '/v1/auth/wechat', { code: 'hardening-user' });
    assert.ok(login.ok);
    assert.equal(app.verifyToken(login.token), login.playerId);
    assert.equal(app.verifyToken(login.token.slice(0, -1) + 'x'), null);
    const expiry = Date.now;
    Date.now = () => expiry() + 8 * 86400000;
    assert.equal(app.verifyToken(login.token), null);
    Date.now = expiry;
    assert.equal(invoke(app, 'POST', '/v1/admin/reset').code, 'ADMIN_AUTH_REQUIRED');
    assert.equal(invoke(app, 'POST', '/v1/telemetry/events', { events: [{ name: 'unauth' }] }).code, 'AUTH_REQUIRED');
    assert.equal(invoke(app, 'POST', '/v1/admin/reset', {}, { 'x-admin-token': 'hardening-test-token' }).ok, true);
    assert.equal(app.verifyToken(login.token), null);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lomo-store-'));
    const snapshot = path.join(dir, 'nested', 'store.json');
    const persisted = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, persistPath: snapshot });
    invoke(persisted, 'POST', '/v1/auth/wechat', { code: 'persisted-user' });
    persisted.store.maybePersist(true);
    assert.ok(fs.existsSync(snapshot));
    const restored = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, persistPath: snapshot });
    assert.equal(Object.keys(restored.store.data.players).length, 1);
    console.log('security-hardening ok: expiring tokens/admin auth/atomic persistence');
  } finally {
    if (priorAllow === undefined) delete process.env.APP_ALLOW_ADMIN; else process.env.APP_ALLOW_ADMIN = priorAllow;
    if (priorAdmin === undefined) delete process.env.APP_ADMIN_TOKEN; else process.env.APP_ADMIN_TOKEN = priorAdmin;
  }
}

if (require.main === module) run().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
