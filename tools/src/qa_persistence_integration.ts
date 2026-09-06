import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import cloudbase = require('@cloudbase/js-sdk');
import { GameApp } from '../../server/src/app';
import { matchRoute } from '../../server/src/http';
import { PersistentApi } from '../../server/src/persistence/api';
import { CloudBaseDocumentDatabase } from '../../server/src/persistence/cloudbase';
import { DocumentDatabase, PersistenceError } from '../../server/src/persistence/database';
import { PersistentRepository } from '../../server/src/persistence/repository';

async function main(): Promise<void> {
  const environment = 'lomo-wechat-d0gcakr952f0d90b8';
  const collectionName = 'ape_qa_persistence';
  const credentialFile = path.resolve('.env.cloud');
  assert.equal(fs.statSync(credentialFile).mode & 0o077, 0);
  const credentials: Record<string, string> = {};
  for (const line of fs.readFileSync(credentialFile, 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) credentials[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  assert.equal(credentials.CLOUDBASE_ENV || credentials.CLOUDBASE_ENV_ID, environment);
  assert(credentials.TENCENTCLOUD_SECRET_ID && credentials.TENCENTCLOUD_SECRET_KEY);
  const config = { env: environment, region: 'ap-shanghai', secretId: credentials.TENCENTCLOUD_SECRET_ID, secretKey: credentials.TENCENTCLOUD_SECRET_KEY, sessionToken: credentials.TENCENTCLOUD_SESSION_TOKEN };
  const rawDatabase: any = cloudbase.init({ ...config, timeout: 5000, endPointMode: 'CLOUD_API' } as any).database();
  const rawCollection = rawDatabase.collection(collectionName);
  const marker = await rawCollection.doc('qa_probe_owner_v1').get();
  assert.equal(marker.data?.[0]?.owner, 'lomo-formal-migration-qa-2026-09-06');
  const cloudDatabase = new CloudBaseDocumentDatabase({ ...config, collection: collectionName });
  const startedAt = Date.now();
  const runId = `integration_${randomUUID().replace(/-/g, '')}`;
  const created = new Set<string>();
  const checks: string[] = [];
  let operations = 0;
  let failAtWrite = 0;
  let loseCommit = false;
  let passed = false;
  let failure = '';
  let suppressedSdkMessages = 0;
  const originalWarn = console.warn;
  console.warn = () => { suppressedSdkMessages++; };
  const charge = (): void => {
    if (++operations > 900 || Date.now() - startedAt > 120000) throw new PersistenceError('PERSISTENCE_LIMIT', 'Integration budget reached');
  };
  const database: DocumentDatabase = {
    ready: async () => { charge(); await cloudDatabase.ready(); },
    get: async (id) => { charge(); return cloudDatabase.get(id); },
    query: async (query) => { charge(); return cloudDatabase.query(query); },
    transaction: async (callback) => {
      let writesReceipt = false;
      const result = await cloudDatabase.transaction(async (transaction) => {
        let writes = 0;
        return callback({
          get: async (id) => { charge(); return transaction.get(id); },
          set: async (document) => {
            charge();
            created.add(document._id);
            if (document.kind === 'receipt') writesReceipt = true;
            if (failAtWrite && ++writes === failAtWrite) throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Injected application write failure');
            await transaction.set(document);
          },
          remove: async (id) => { charge(); await transaction.remove(id); },
        });
      });
      if (loseCommit && writesReceipt) { loseCommit = false; throw new PersistenceError('PERSISTENCE_UNAVAILABLE', 'Injected committed response loss'); }
      return result;
    },
  };
  const repository = new PersistentRepository(database);
  const create = () => new PersistentApi(new GameApp({ profile: 'wechat-release', bootPngSeeds: false, secret: `${runId}:server-secret`, wechatCodeExchange: async (code) => ({ openid: `${runId}:${code}` }) }), repository, 'wx0123456789abcdef').routes();
  const first = create(), second = create();
  const request = async (routes: ReturnType<typeof create>, method: string, requestPath: string, body?: any, token?: string): Promise<{ status: number; body: any }> => {
    const url = new URL(requestPath, 'http://localhost');
    const found = matchRoute(routes, method, url.pathname)!;
    let status = 200;
    let response: any;
    await found.handler({ req: { headers: token ? { authorization: `Bearer ${token}` } : {}, socket: { remoteAddress: 'isolated-qa' } }, res: {}, method, path: url.pathname, params: found.params, query: url.searchParams, body,
      status: (value) => { status = value; }, json: (value) => { response = value; } });
    return { status, body: response };
  };
  try {
    await repository.ready();
    const login = await Promise.all([request(first, 'POST', '/v1/auth/wechat', { code: 'alice' }), request(second, 'POST', '/v1/auth/wechat', { code: 'alice' })]);
    assert(login.every((response) => response.body.ok), `login ${login.map((response) => response.body.code).join(',')}`);
    assert.equal(login[0].body.playerId, login[1].body.playerId);
    assert.equal(login.filter((response) => response.body.isNew).length, 1);
    const alice = login[0].body;
    const bob = (await request(second, 'POST', '/v1/auth/wechat', { code: 'bob' })).body;
    assert(bob.ok);
    checks.push('two-instance concurrent identity and initial grant exactly once');
    const daily = { featureId: 'daily', actionId: 'checkin', idempotencyKey: `${runId}:daily` };
    const duplicate = await Promise.all(Array.from({ length: 4 }, (_unused, index) => request(index % 2 ? first : second, 'POST', '/v1/game/action', daily, alice.token)));
    assert(duplicate.every((response) => response.body.ok));
    assert(duplicate.every((response) => JSON.stringify(response) === JSON.stringify(duplicate[0])));
    assert.equal((await request(first, 'GET', '/v1/player/state', undefined, alice.token)).body.player.balances.COIN, 512);
    checks.push('four concurrent commands replay one committed reward');
    const mail = (await request(first, 'GET', '/v1/mail', undefined, alice.token)).body.mails[0];
    assert((await request(second, 'POST', '/v1/mail/claim', { mailId: mail.mailId, idempotencyKey: `${runId}:mail` }, alice.token)).body.ok);
    const invite = (await request(first, 'POST', '/v1/social/invite/token', { idempotencyKey: `${runId}:invite` }, alice.token)).body;
    const accept = await Promise.all([first, second].map((routes) => request(routes, 'POST', '/v1/social/invite/accept', { token: invite.token, idempotencyKey: `${runId}:accept` }, bob.token)));
    assert(accept.every((response) => response.body.ok));
    assert.equal((await request(first, 'GET', '/v1/player/state', undefined, alice.token)).body.player.balances.COIN, 662);
    assert.equal((await request(first, 'GET', '/v1/player/state', undefined, bob.token)).body.player.balances.COIN, 530);
    checks.push('mail and cross-player invite commit atomically and once');
    const beforeFailure = await repository.auditLedger(bob.playerId);
    assert(beforeFailure.ok);
    failAtWrite = 3;
    assert.equal((await request(first, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: `${runId}:failure` }, bob.token)).status, 503);
    failAtWrite = 0;
    assert.deepEqual(await repository.auditLedger(bob.playerId), beforeFailure);
    checks.push('injected third write failure rolls back wallet and ledger');
    loseCommit = true;
    const lost = await request(first, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: `${runId}:lost` }, bob.token);
    assert.equal(lost.status, 503);
    const restart = create();
    const recovered = await request(restart, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: `${runId}:lost` }, bob.token);
    assert(recovered.body.ok);
    assert.equal((await repository.auditLedger(bob.playerId)).entries, beforeFailure.entries + 1);
    checks.push('committed response lost then new instance replays receipt');
    const sessions = await Promise.all([first, second].map((routes, index) => request(routes, 'POST', '/v1/game/session/start', { featureId: 'battleRoyal', idempotencyKey: `${runId}:session:${index}` }, alice.token)));
    assert(sessions.every((response) => response.body.ok));
    assert.equal(sessions[0].body.sessionId, sessions[1].body.sessionId);
    checks.push('concurrent different session starts share one active slot');
    assert((await repository.auditLedger(alice.playerId)).ok);
    assert((await repository.auditLedger(bob.playerId)).ok);
    const page = await request(first, 'GET', '/v1/economy/ledger?limit=2', undefined, alice.token);
    assert.equal(page.body.entries.length, 2);
    assert(Number.isSafeInteger(page.body.nextCursor));
    checks.push('paginated ledger agrees with both durable wallets');
    passed = true;
  } catch (caught) {
    failure = caught instanceof Error && caught.name === 'AssertionError' ? caught.message.slice(0, 400) : caught instanceof PersistenceError ? caught.code : 'CLOUD_INTEGRATION_FAILED';
    process.exitCode = 1;
  } finally {
    console.warn = originalWarn;
    const cleanupPending: string[] = [];
    for (const id of created) {
      try { await rawCollection.doc(id).remove(); }
      catch { cleanupPending.push(id); }
    }
    if (cleanupPending.length) { passed = false; process.exitCode = 1; }
    const result = { environment, collection: collectionName, runId, startedAt: new Date(startedAt).toISOString(), durationMs: Date.now() - startedAt, operations, passed, checks, failure, cleanupPending, documentsRemoved: created.size - cleanupPending.length, suppressedSdkMessages };
    const output = path.resolve('build/qa-evidence/persistence-cloud-integration.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}

if (require.main === module) main().then(() => process.exit(process.exitCode || 0)).catch(() => { console.error('Cloud persistence integration could not initialize; credentials and values are omitted'); process.exit(1); });
