/**
 * 单元测试：Ledger 幂等/连续性/原子批、RNG 确定性、资产目录完整性、配置锁定。
 */
import * as assert from 'node:assert';
import { Ledger, LedgerError } from '../shared/src/ledger';
import { Rng } from '../shared/src/rng';
import { ASSET_CATALOG, ALL_ASSET_IDS } from '../shared/src/assets';
import { CASH_SENSITIVE_FEATURES, RELEASE_LOCKED_FLAGS, featureEnabledInProfile, validateTuningConfig, TuningConfigError } from '../shared/src/config';

export function run(): void {
  // Ledger
  let seq = 0;
  const ledger = new Ledger(() => 'txn-' + ++seq);
  ledger.apply({ playerId: 'p1', assetType: 'COIN', delta: 100, sourceType: 'test', sourceId: 'a' });
  ledger.apply({ playerId: 'p1', assetType: 'COIN', delta: -30, sourceType: 'test', sourceId: 'b' });
  assert.equal(ledger.balanceOf('p1', 'COIN'), 70);
  assert.throws(() => ledger.apply({ playerId: 'p1', assetType: 'COIN', delta: -1000, sourceType: 'x', sourceId: 'c' }), LedgerError);
  const e1 = ledger.apply({ playerId: 'p1', assetType: 'GEMSTONE', delta: 5, sourceType: 't', sourceId: 'd', idempotencyKey: 'k1' });
  const e2 = ledger.apply({ playerId: 'p1', assetType: 'GEMSTONE', delta: 5, sourceType: 't', sourceId: 'd', idempotencyKey: 'k1' });
  assert.equal(e1.txnId, e2.txnId, 'idempotency replay returns same entry');
  assert.equal(ledger.balanceOf('p1', 'GEMSTONE'), 5, 'no double grant');
  assert.throws(() => ledger.applyBatch('p1', [
    { assetType: 'COIN', delta: 10, sourceType: 'b', sourceId: '1' },
    { assetType: 'GEMSTONE', delta: -999, sourceType: 'b', sourceId: '2' },
  ]), LedgerError);
  assert.equal(ledger.balanceOf('p1', 'COIN'), 70, 'batch atomic: nothing applied');
  const inv = ledger.validateInvariants('p1');
  assert.ok(inv.ok, 'ledger invariants: ' + inv.errors.join(';'));

  // Ledger dump/restore
  const dump = ledger.dump();
  const ledger2 = new Ledger(() => 'x');
  ledger2.restore(dump);
  assert.equal(ledger2.balanceOf('p1', 'COIN'), 70);

  // RNG determinism
  const a = new Rng('seed-A');
  const b = new Rng('seed-A');
  const seqA = [a.next(), a.int(1, 100), a.pick([1, 2, 3]), a.weighted([{ value: 'x', weight: 1 }, { value: 'y', weight: 3 }])];
  const seqB = [b.next(), b.int(1, 100), b.pick([1, 2, 3]), b.weighted([{ value: 'x', weight: 1 }, { value: 'y', weight: 3 }])];
  assert.deepEqual(seqA, seqB, 'same seed → same sequence');
  assert.notDeepEqual([new Rng('s1').next()], [new Rng('s2').next()]);
  for (let i = 0; i < 500; i++) {
    const v = new Rng(i).next();
    assert.ok(v >= 0 && v < 1, 'rng in range');
  }
  const f1 = new Rng('base').fork('nonce1');
  const g1 = new Rng('base').fork('nonce1');
  assert.equal(f1.next(), g1.next(), 'fork deterministic from same seed+nonce');
  const parent = new Rng('base');
  const before = parent.next();
  parent.fork('x');
  assert.equal(parent.next(), new Rng('base').fork('q') && (() => { const p2 = new Rng('base'); p2.next(); return p2.next(); })(), 'fork does not consume parent state');

  // Asset catalog
  const required: Array<[string, string[]]> = [
    ['GEMSTONE', ['gemstone']], ['MEDAL', ['medal']], ['STARDUST', ['stardust']], ['WORLD_COIN', ['coin']],
    ['APE_STONE', ['stone']], ['SAND', ['sand']], ['GOLD', ['gold']], ['DAGGER', ['dagger']],
    ['APE_CARD', ['card']], ['PLANET_CARD', ['planet']], ['FLASH_CARD', ['flash']], ['TICKET', ['ticket']],
    ['RED_PACKET_PROGRESS', ['red']], ['TEST_CREDIT', ['sandbox']], ['SEASON_SCORE', ['season']],
  ];
  for (const [id] of required) assert.ok(ASSET_CATALOG[id as keyof typeof ASSET_CATALOG], `asset ${id} defined`);
  assert.equal(ALL_ASSET_IDS.length, Object.keys(ASSET_CATALOG).length);
  for (const id of ALL_ASSET_IDS) {
    const def = ASSET_CATALOG[id];
    assert.ok(def.displayName && Array.isArray(def.source) && Array.isArray(def.sink), `${id} complete`);
    assert.equal(def.withdrawable, false, `${id} never withdrawable`);
  }

  // Config locking
  assert.equal(featureEnabledInProfile('cut', 'wechat-release'), false);
  assert.equal(featureEnabledInProfile('defer', 'wechat-release'), false);
  assert.equal(featureEnabledInProfile('sandbox', 'wechat-release'), false);
  assert.equal(featureEnabledInProfile('keep', 'wechat-release'), true);
  assert.ok(Object.keys(CASH_SENSITIVE_FEATURES).length >= 15);
  assert.ok(RELEASE_LOCKED_FLAGS.includes('allowWithdrawal'));

  const ownedTuning = validateTuningConfig({
    schemaVersion: '1.0.0', status: 'OWNED_LAUNCH_DEFAULTS', provenance: 'CLEAN_ROOM_PRODUCT_DEFAULTS', effectiveFrom: '2026-09-06T00:00:00Z', owner: 'test',
    progression: { levelXpBase: 100, levelXpStep: 40, levelUpEnergy: 5 },
    energy: { initial: 30, max: 120, regenMinutes: 6, battleCost: 3, mineCost: 2, exploreCost: 4, minigameCost: 1 },
    economy: { initialCoin: 500, initialTicket: 5, mineCoinRange: [3, 8], refineOreCost: 10, refineCoin: 35 },
  });
  assert.equal(ownedTuning.status, 'OWNED_LAUNCH_DEFAULTS');
  assert.throws(() => validateTuningConfig({ ...ownedTuning, economy: { ...ownedTuning.economy, mineCoinRange: [8, 3] } }), TuningConfigError);
  assert.throws(() => validateTuningConfig({ ...ownedTuning, status: 'LEGACY_UNVERIFIED' }), TuningConfigError);
  assert.throws(() => validateTuningConfig({ ...ownedTuning, energy: { ...ownedTuning.energy, max: 10 } }), TuningConfigError);

  console.log('unit-core ok: ledger/rng/assets/config');
}

if (require.main === module) run();
