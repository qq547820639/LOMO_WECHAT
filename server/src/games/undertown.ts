/**
 * Wave 2 —— 宝石地下城（Undertown）。
 * 证据: UndertownActivity 系 / ProbDetailActivity / LevelRewardActivity / TicketAllocationActivity / DailyTopHundredActivity +
 *       Lottie brickSelf/brickOther/bricksRupture/goNextFloor + 公开玩法资料（搜狐：每层砖块，一块藏大奖）。
 * 机制: 每层 N 块砖 → 消耗奖券进场+金币买砖 → 开砖（自砖/他人砖/碎裂动画标记）→
 *       大奖砖 → 宝石大奖并解锁下一层；普通砖给小额奖励；概率展示接口（ProbDetail）。
 */
import { FeatureGame, ok, fail } from './types';
import { RewardDto } from '../../../shared/src/protocol';

export const undertown: FeatureGame = {
  id: 'undertown',
  readState: (ctx) => {
    const floor = ctx.player.counters['ut.floor'] ?? 1;
    const bricks = ctx.num('undertown.bricksPerFloor', 24);
    const opened = Object.keys(ctx.player.counters).filter((k) => k.startsWith(`ut.opened.${floor}.`)).length;
    return {
      floor, bricks, openedThisFloor: opened,
      openedIdx: Array.from({ length: bricks }, (_, i) => i + 1).filter((i) => ctx.player.counters[`ut.opened.${floor}.${i}`]),
      ticket: ctx.store.ledger.balanceOf(ctx.playerId, 'TICKET'),
      entryTicketCost: ctx.num('undertown.entryTicketCost', 1),
      brickCostCoin: ctx.num('undertown.brickCostCoin', 20),
      bestFloor: ctx.player.counters['ut.bestFloor'] ?? 0,
      prob: probTable(ctx, floor),
      rank: ctx.store.rankTop('undertownDepth', 10).map((r, i) => ({ rank: i + 1, nick: ctx.store.player(r.playerId)?.nick ?? r.playerId, score: r.score })),
      history: ctx.store.history(ctx.playerId, 'undertown', 20),
    };
  },
  actions: {
    /** 开一块砖：本层未开完时逐块开；开出大奖砖则进入下一层 */
    openBrick: (ctx) => {
      const floor = ctx.player.counters['ut.floor'] ?? 1;
      const bricks = ctx.num('undertown.bricksPerFloor', 24);
      const openedKey = (i: number) => `ut.opened.${floor}.${i}`;
      const openedCount = Array.from({ length: bricks }, (_, i) => i).filter((i) => ctx.player.counters[openedKey(i)]).length;
      if (openedCount >= bricks) return fail('本层砖块已开完，请前往下一层');
      const ticketCost = ctx.num('undertown.entryTicketCost', 1);
      if (openedCount === 0) {
        if (ctx.store.ledger.balanceOf(ctx.playerId, 'TICKET') < ticketCost) return fail(`奖券不足（进场需 ${ticketCost}）`);
      }
      const brickCost = ctx.num('undertown.brickCostCoin', 20);
      if (!ctx.econ.payFrom(ctx.player, { COIN: brickCost }, 'undertown.brick', `floor${floor}`)) return fail(`金币不足（开砖需 ${brickCost}）`);
      if (openedCount === 0) ctx.econ.spend(ctx.playerId, 'TICKET', ticketCost, 'undertown.entry', `floor${floor}`);
      // 大奖砖位置：每层第一次开砖时确定性生成并缓存
      const grandKey = `ut.grand.${floor}`;
      if (!ctx.player.counters[grandKey]) {
        ctx.player.counters[grandKey] = ctx.rng.int(1, bricks);
      }
      const grandAt = ctx.player.counters[grandKey];
      let idx = Math.floor(Number(ctx.payload.brickIndex));
      if (!(idx >= 1 && idx <= bricks) || ctx.player.counters[openedKey(idx)]) {
        // 无效/重复选择 → 开未开的第一块（保持服务端权威、防重放）
        idx = Array.from({ length: bricks }, (_, i) => i + 1).find((i) => !ctx.player.counters[openedKey(i)])!;
      }
      ctx.player.counters[openedKey(idx)] = 1;
      const isGrand = idx === grandAt;
      if (isGrand) {
        const gem = ctx.numRange('undertown.grandPrizeGem', ctx.rng, [2, 5]);
        ctx.econ.grant(ctx.playerId, 'GEMSTONE', gem, 'undertown', `grand-floor${floor}`);
        ctx.player.counters['ut.floor'] = floor + 1;
        ctx.player.counters['ut.bestFloor'] = Math.max(ctx.player.counters['ut.bestFloor'] ?? 0, floor);
        ctx.store.rankAdd('undertownDepth', ctx.playerId, 1);
        ctx.store.pushHistory(ctx.playerId, 'undertown', `第 ${floor} 层开中大奖砖！宝石 +${gem}，解锁第 ${floor + 1} 层`, [{ assetId: 'GEMSTONE', delta: gem }]);
        return ok(`第 ${floor} 层 · ${idx} 号砖是大奖砖！bricksRupture！宝石 +${gem}，已解锁第 ${floor + 1} 层`, {
          rewards: [{ assetId: 'GEMSTONE', delta: gem }], state: { floor: floor + 1, opened: idx, kind: 'grand' },
          rank: { board: 'undertownDepth', score: 1 }, history: `地下城第 ${floor} 层大奖`, fx: ['bricksRupture', 'goNextFloor'],
        });
      }
      // 普通砖：小额金币，小概率奖券
      const coin = ctx.numRange('undertown.floorPrizeCoin', ctx.rng, [30, 120]);
      ctx.econ.grant(ctx.playerId, 'COIN', Math.floor(coin / 4), 'undertown', `brick-floor${floor}`);
      const rewards: RewardDto[] = [{ assetId: 'COIN', delta: Math.floor(coin / 4) }];
      let extra = '';
      if (ctx.rng.chance(0.15)) { ctx.econ.grant(ctx.playerId, 'TICKET', 1, 'undertown', 'brick-ticket'); rewards.push({ assetId: 'TICKET' as const, delta: 1 }); extra = '，奖券 +1'; }
      if (openedCount + 1 >= bricks) {
        // 全开完仍未中大奖 → 保底进入下一层
        ctx.player.counters['ut.floor'] = floor + 1;
        ctx.store.rankAdd('undertownDepth', ctx.playerId, 1);
        return ok(`本层全部砖块已开完，保底进入第 ${floor + 1} 层${extra}`, { rewards, state: { floor: floor + 1, opened: idx, kind: 'normal' }, fx: ['goNextFloor'] });
      }
      return ok(`第 ${floor} 层 · ${idx} 号砖是你的砖，金币 +${Math.floor(coin / 4)}${extra}`, { rewards, state: { floor, opened: idx, kind: ctx.rng.chance(0.5) ? 'self' : 'other' }, fx: [ctx.rng.chance(0.5) ? 'brickSelf' : 'brickOther'] });
    },
    /** 概率详情（ProbDetail 对应页） */
    probDetail: (ctx) => {
      const floor = ctx.player.counters['ut.floor'] ?? 1;
      return ok(`第 ${floor} 层概率详情`, { state: probTable(ctx, floor) });
    },
  },
};

function probTable(ctx: Parameters<NonNullable<FeatureGame['readState']>>[0], floor: number) {
  const bricks = ctx.num('undertown.bricksPerFloor', 24);
  const grandWeight = ctx.num('undertown.grandPrizeBrickWeightNum', 1);
  return {
    floor,
    version: ctx.num('undertown.probDisplayVersion', 1),
    evidence: 'OWNED_LAUNCH_DEFAULTS —— 原正式服概率不可从加固 APK 静态恢复；当前采用已校验自有参数，以签名 RemoteConfig 下发为准',
    bricksPerFloor: bricks,
    grandPrizePerBrick: `${grandWeight}/${bricks}`,
    grandPrizeRate: `${((grandWeight / bricks) * 100).toFixed(2)}%`,
    brickPrizeCoin: ctx.num('undertown.brickCostCoin', 20) * 0 + `[${ctx.num('undertown.floorPrizeCoin', 0) || 30},${120}]`,
    entryTicketCost: ctx.num('undertown.entryTicketCost', 1),
  };
}
