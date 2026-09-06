import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import cloudbase from '@cloudbase/js-sdk';

type CloudResult = { data?: unknown; code?: string | number; updated?: number };
type Document = {
  get(): Promise<CloudResult>;
  create(body: Record<string, unknown>): Promise<CloudResult>;
  set(body: Record<string, unknown>): Promise<CloudResult>;
  update(body: Record<string, unknown>): Promise<CloudResult>;
  remove(): Promise<CloudResult>;
};
type Transaction = {
  collection(name: string): { doc(id: string): Document };
  commit(): Promise<unknown>;
  rollback(reason?: unknown): Promise<unknown>;
};
type Database = {
  collection(name: string): { doc(id: string): Document };
  startTransaction(): Promise<Transaction>;
  runTransaction<T>(callback: (transaction: Transaction) => Promise<T>, retries: number): Promise<T>;
};

const targetEnvironment = 'lomo-wechat-d0gcakr952f0d90b8';
const collectionName = 'ape_qa_persistence';
const markerId = 'qa_probe_owner_v1';
const owner = 'lomo-formal-migration-qa-2026-09-06';
const startedAt = Date.now();
const probeId = `probe_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
const createdIds = new Set<string>();
const pendingTransactions = new Set<Transaction>();
const checks: Record<string, unknown>[] = [];
let operations = 0;
let suppressedSdkMessages = 0;
let completed = false;
let failureCode: string | undefined;
let failureMessage: string | undefined;
const secretValues: string[] = [];

function safeCode(error: unknown): string {
  let code = (error as { code?: unknown })?.code;
  const message = (error as { message?: unknown })?.message;
  if (!code && typeof message === 'string') {
    try { code = JSON.parse(message).code; } catch {}
  }
  if (typeof code === 'number' && Number.isFinite(code)) return String(code);
  return typeof code === 'string' && /^[A-Z0-9_.-]{1,100}$/i.test(code) ? code : 'PROBE_CHECK_FAILED';
}

function safeMessage(error: unknown): string | undefined {
  const value = (error as { message?: unknown })?.message;
  if (typeof value !== 'string') return undefined;
  let message = value.slice(0, 500);
  for (const secret of secretValues) message = message.split(secret).join('[redacted]');
  return message;
}

function output(): void {
  const result = {
    environment: targetEnvironment, collection: collectionName, probeId,
    startedAt: new Date(startedAt).toISOString(), durationMs: Date.now() - startedAt,
    completed, passed: completed && checks.every(check => check.passed !== false),
    failureCode, failureMessage, operations, limits: { operations: 100, durationMs: 30000 },
    checks, cleanupPending: [...createdIds], pendingTransactions: pendingTransactions.size,
    suppressedSdkMessages,
  };
  const outputPath = path.resolve('build/qa-evidence/persistence-cloud-probe.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function charge(cost = 1, cleanup = false): void {
  if (operations + cost > 100 || Date.now() - startedAt > (cleanup ? 29500 : 25000)) {
    throw Object.assign(new Error('Probe budget reached'), { code: 'PROBE_BUDGET' });
  }
  operations += cost;
}

async function call<T>(operation: () => Promise<T>, cleanup = false): Promise<T> {
  charge(1, cleanup);
  const result = await operation();
  if ((result as CloudResult | undefined)?.code) throw result;
  return result;
}

function body(value: number, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: 'qa_probe', owner, probeId, value, ...extra };
}

function documentData(result: CloudResult): Record<string, unknown> | null {
  const value = Array.isArray(result.data) ? result.data[0] : result.data;
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

async function main(): Promise<void> {
  const credentials: Record<string, string> = {};
  const credentialPath = path.resolve('.env.cloud');
  assert.equal(fs.statSync(credentialPath).mode & 0o077, 0, '.env.cloud must not be group/world readable');
  for (const line of fs.readFileSync(credentialPath, 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) credentials[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  assert.equal(credentials.CLOUDBASE_ENV || credentials.CLOUDBASE_ENV_ID, targetEnvironment);
  assert.ok(credentials.TENCENTCLOUD_SECRET_ID && credentials.TENCENTCLOUD_SECRET_KEY);
  secretValues.push(...Object.values(credentials).filter(value => value.length >= 8));
  const config = {
    env: targetEnvironment, region: 'ap-shanghai', timeout: 3000, endPointMode: 'CLOUD_API' as const,
    secretId: credentials.TENCENTCLOUD_SECRET_ID,
    secretKey: credentials.TENCENTCLOUD_SECRET_KEY,
    sessionToken: credentials.TENCENTCLOUD_SESSION_TOKEN,
  };
  const database = cloudbase.init(config).database() as unknown as Database;
  const collection = database.collection(collectionName);
  const marker = documentData(await call(() => collection.doc(markerId).get()));
  assert.equal(marker?.owner, owner, 'Collection ownership marker mismatch');
  assert.equal(marker?.kind, 'qa_probe_owner');
  assert.equal(marker?.schema, 1);
  checks.push({ check: 'ownedCollection', passed: true });

  const missingId = `${probeId}_missing`;
  const primaryId = `${probeId}_primary`;
  const replaceId = `${probeId}_replace`;
  const rollbackId = `${probeId}_rollback`;
  try {
    const missing = await call(() => collection.doc(missingId).get());
    assert.ok(Array.isArray(missing.data) && missing.data.length === 0);
    checks.push({ check: 'nontransactionMissingGet', passed: true, shape: 'data: []' });

    const initialTransaction = await call(() => database.startTransaction());
    pendingTransactions.add(initialTransaction);
    const missingInside = await call(() => initialTransaction.collection(collectionName).doc(missingId).get());
    assert.equal(missingInside.data, null);
    createdIds.add(primaryId);
    await call(() => initialTransaction.collection(collectionName).doc(primaryId).create(body(1)));
    await call(() => initialTransaction.commit());
    pendingTransactions.delete(initialTransaction);
    const primary = documentData(await call(() => collection.doc(primaryId).get()));
    assert.equal(primary?.value, 1);
    checks.push({ check: 'transactionCreateAndMissingGet', passed: true, shape: 'data: null' });

    charge(2);
    const returned = await database.runTransaction(async transaction => {
      const reference = transaction.collection(collectionName).doc(primaryId);
      const existing = await call(() => reference.get());
      assert.ok(!Array.isArray(existing.data));
      assert.equal(documentData(existing)?.value, 1);
      await call(() => reference.update({ value: 2 }));
      return 'callback-result';
    }, 0);
    assert.equal(returned, 'callback-result');
    assert.equal(documentData(await call(() => collection.doc(primaryId).get()))?.value, 2);
    checks.push({ check: 'transactionUpdateAndReturn', passed: true, shape: 'data: document', returned });

    createdIds.add(replaceId);
    charge(2);
    await database.runTransaction(async transaction => {
      await call(() => transaction.collection(collectionName).doc(replaceId).set(body(3, { obsolete: true })));
    }, 0);
    charge(2);
    await database.runTransaction(async transaction => {
      await call(() => transaction.collection(collectionName).doc(replaceId).set(body(4)));
    }, 0);
    const replacement = documentData(await call(() => collection.doc(replaceId).get()));
    assert.equal(replacement?.value, 4);
    assert.equal(replacement?.obsolete, undefined);
    checks.push({ check: 'transactionSetUpsertsAndReplaces', passed: true });

    createdIds.add(rollbackId);
    const rollbackTransaction = await call(() => database.startTransaction());
    pendingTransactions.add(rollbackTransaction);
    await call(() => rollbackTransaction.collection(collectionName).doc(rollbackId).create(body(5)));
    await call(() => rollbackTransaction.collection(collectionName).doc(primaryId).update({ value: 99 }));
    await call(() => rollbackTransaction.rollback('intentional QA rollback'));
    pendingTransactions.delete(rollbackTransaction);
    assert.equal(documentData(await call(() => collection.doc(rollbackId).get())), null);
    assert.equal(documentData(await call(() => collection.doc(primaryId).get()))?.value, 2);
    createdIds.delete(rollbackId);
    checks.push({ check: 'transactionRollbackCreateAndUpdate', passed: true });

    let duplicateCode = '';
    let duplicateMessage = '';
    charge(3);
    try {
      await database.runTransaction(async transaction => {
        await call(() => transaction.collection(collectionName).doc(primaryId).create(body(999)));
      }, 0);
    } catch (error) {
      duplicateCode = safeCode(error);
      duplicateMessage = safeMessage(error) || '';
      checks.push({ check: 'duplicateErrorShape', type: typeof error, message: safeMessage(error) });
    }
    checks.push({ check: 'duplicateObservation', errorCode: duplicateCode, value: documentData(await call(() => collection.doc(primaryId).get()))?.value });
    assert.ok(duplicateMessage.includes('E11000'));
    assert.equal(documentData(await call(() => collection.doc(primaryId).get()))?.value, 2);
    checks.push({ check: 'transactionCreateRejectsDuplicate', passed: true, errorCode: duplicateCode });

    const first = await call(() => database.startTransaction());
    pendingTransactions.add(first);
    const second = await call(() => database.startTransaction());
    pendingTransactions.add(second);
    await call(() => first.collection(collectionName).doc(primaryId).get());
    await call(() => second.collection(collectionName).doc(primaryId).get());
    await call(() => first.collection(collectionName).doc(primaryId).update({ value: 10 }));
    await call(() => first.commit());
    pendingTransactions.delete(first);
    let conflictCode = '';
    let conflictMessage = '';
    try {
      await call(() => second.collection(collectionName).doc(primaryId).update({ value: 20 }));
      await call(() => second.commit());
      pendingTransactions.delete(second);
    } catch (error) {
      conflictCode = safeCode(error);
      conflictMessage = safeMessage(error) || '';
      checks.push({ check: 'conflictErrorShape', errorCode: conflictCode, message: safeMessage(error) });
    }
    assert.ok(conflictMessage.includes('DATABASE_TRANSACTION_CONFLICT'));
    assert.equal(documentData(await call(() => collection.doc(primaryId).get()))?.value, 10);
    checks.push({ check: 'transactionConflictPreventsLostUpdate', passed: true, errorCode: conflictCode });

    const counterId = `${probeId}_counter`;
    createdIds.add(counterId);
    await call(() => collection.doc(counterId).create(body(0)));
    let readers = 0;
    let releaseReaders: () => void = () => {};
    const bothRead = new Promise<void>(resolve => { releaseReaders = resolve; });
    const callbackAttempts = [0, 0];
    const increment = async (index: number): Promise<void> => {
      charge(3);
      await database.runTransaction(async transaction => {
        callbackAttempts[index]++;
        if (callbackAttempts[index] > 1) charge(3);
        const reference = transaction.collection(collectionName).doc(counterId);
        const previous = documentData(await call(() => reference.get()));
        if (callbackAttempts[index] === 1) {
          readers++;
          if (readers === 2) releaseReaders();
          await bothRead;
        }
        await call(() => reference.update({ value: Number(previous?.value) + 1 }));
      }, 3);
    };
    const increments = await Promise.allSettled([increment(0), increment(1)]);
    const finalValue = documentData(await call(() => collection.doc(counterId).get()))?.value;
    const retryWorks = increments.every(result => result.status === 'fulfilled') && finalValue === 2;
    checks.push({
      check: 'sdkAutomaticConflictRetry', passed: retryWorks, callbackAttempts, finalValue,
      outcomes: increments.map(result => result.status === 'fulfilled' ? { status: result.status }
        : { status: result.status, errorCode: safeCode(result.reason), message: safeMessage(result.reason) }),
    });
    completed = true;
  } finally {
    for (const transaction of pendingTransactions) {
      try { await call(() => transaction.rollback(), true); pendingTransactions.delete(transaction); }
      catch (error) {
        const message = safeMessage(error) || '';
        if (message.includes('ResourceUnavailable.TransactionNotExist')) {
          pendingTransactions.delete(transaction);
          checks.push({ check: 'cleanupTransaction', passed: true, alreadyTerminated: true });
        } else checks.push({ check: 'cleanupTransaction', passed: false, errorCode: safeCode(error), message });
      }
    }
    for (const documentId of createdIds) {
      const existing = documentData(await call(() => collection.doc(documentId).get(), true));
      if (existing) {
        assert.equal(existing.owner, owner);
        assert.equal(existing.probeId, probeId);
        await call(() => collection.doc(documentId).remove(), true);
        assert.equal(documentData(await call(() => collection.doc(documentId).get(), true)), null);
      }
      createdIds.delete(documentId);
    }
    checks.push({ check: 'cleanupDocuments', passed: createdIds.size === 0 });
    if (pendingTransactions.size) completed = false;
  }
}

if (require.main === module) {
  for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    console[method] = () => { suppressedSdkMessages++; };
  }
  const deadline = setTimeout(() => {
    completed = false;
    failureCode = 'PROBE_DEADLINE';
    output();
    process.exit(1);
  }, 30000);
  main().catch(error => {
    completed = false;
    failureCode = safeCode(error);
    failureMessage = safeMessage(error);
  }).finally(() => {
    clearTimeout(deadline);
    output();
    process.exit(completed && createdIds.size === 0 && pendingTransactions.size === 0 && checks.every(check => check.passed !== false) ? 0 : 1);
  });
}
