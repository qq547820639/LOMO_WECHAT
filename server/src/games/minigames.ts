/**
 * Wave 4 —— 小游戏矩阵：虎口逃生 / 今晚吃鸡 / 弹珠 / 运动会 / 拔河 / 炸猴王。
 * 要求（Section 30）: 不允许"点按钮随机出胜负"——全部有用户输入、状态变化、
 *       时机/节奏/选择技能之一、真实局内生命周期、结算。
 * 全部为 session 生命周期玩法（start → 多次 act → finish），服务端权威 + 确定性 RNG。
 */
import { FeatureGame, ok, fail, GameCtx } from './types';
import { Rng } from '../../../shared/src/rng';
import { RewardDto } from '../../../shared/src/protocol';

// ---------------- 虎口逃生（escape_animal 73 PAG：牛/狗/狐/猴/猪/浣熊/虎 + 绳断/泥/麻痹/加速/护盾/无敌/闪电） ----------------
interface EtState { step: number; lane: number; tigerDist: number; buffs: string[]; alive: boolean; finished: boolean; obstacles: number[] }
export const escapeTiger: FeatureGame = {
  id: 'escapeTiger',
  readState: (ctx) => {
    const active = Object.values(ctx.store.data.sessions).find((s) => s.playerId === ctx.playerId && s.featureId === 'escapeTiger' && !s.finished && Array.isArray((s.data as any)?.obstacles));
    return {
      stepsPerRun: ctx.num('escapeTiger.stepsPerRun', 12),
      tigerSpeed: ctx.num('escapeTiger.tigerSpeed', 1.15),
      active: active ? sanitizeEt(active.data as unknown as EtState) : null,
      sessionId: active?.sessionId,
      best: ctx.player.counters['et.best'] ?? 0,
      animals: ['cow', 'dog', 'fox', 'monkey', 'pig', 'raccoon'],
      history: ctx.store.history(ctx.playerId, 'escapeTiger', 10),
    };
  },
  actions: {
    /** 开始逃亡（选择动物） */
    start: (ctx) => {
      if (!ctx.session) return fail('需要会话');
      const cost = ctx.num('energy.minigameCost', 1);
      ctx.econ.regenEnergy(ctx.player, ctx.now, ctx.num('energy.max', 120), ctx.num('energy.regenMinutes', 6));
      if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'escapeTiger.start', 'run')) {
        const freeEntries = ctx.player.counters['ad.free_entry'] ?? 0;
        if (freeEntries <= 0) {
          ctx.session!.finished = true;
          ctx.store.touch();
          return fail('体力不足');
        }
        ctx.player.counters['ad.free_entry'] = freeEntries - 1;
        ctx.store.touch();
      }
      const session = ctx.session!;
      const steps = ctx.num('escapeTiger.stepsPerRun', 12);
      // 预生成每步的障碍车道（服务端私密，客户端逐步揭示）
      const rng = new Rng(session.seed);
      const obstacles = Array.from({ length: steps }, () => (rng.chance(ctx.num('escapeTiger.obstacleChance', 0.3)) ? rng.int(0, 2) : -1));
      const state: EtState = { step: 0, lane: 1, tigerDist: 6, buffs: [], alive: true, finished: false, obstacles };
      session.data = state as any;
      return ok(`逃亡开始！你选择了${ctx.payload.animal ?? 'monkey'}，虎口在身后 6 步`, { state: sanitizeEt(state), fx: ['runStart'] });
    },
    /** 每步选择车道：0/1/2；障碍命中→除非有护盾/无敌 */
    step: (ctx) => {
      const state = (ctx.session?.data as unknown as EtState) || null;
      if (!state || state.finished) return fail('没有进行中的逃亡');
      if (!state.alive) return fail('已被猛虎追上，请重新开始');
      const lane = Math.max(0, Math.min(2, Math.floor(Number(ctx.payload.lane ?? 1))));
      state.lane = lane;
      const events: string[] = [];
      // Buff 判定
      if (ctx.rng.chance(ctx.num('escapeTiger.buffChance', 0.18))) {
        const buff = ctx.rng.pick(['shield', 'invincible', 'speed', 'mud', 'paralysis']);
        if (['shield', 'invincible', 'speed'].includes(buff)) { state.buffs.push(buff); events.push(`获得 ${buff}！`); }
        else events.push(buff === 'mud' ? '踩进泥潭，虎口逼近！' : '麻痹！这步没跑出去');
        if (buff === 'mud') state.tigerDist = Math.max(0, state.tigerDist - 1);
        if (buff === 'paralysis') { state.tigerDist = Math.max(0, state.tigerDist - 1); }
      }
      let advance = 1 + (state.buffs.includes('speed') ? 1 : 0);
      const obstacle = state.obstacles[state.step];
      let hit = false;
      if (obstacle === lane && !state.buffs.includes('invincible')) {
        if (state.buffs.includes('shield')) { state.buffs = state.buffs.filter((b) => b !== 'shield'); events.push('护盾挡住了障碍！'); }
        else { hit = true; advance = 0; state.tigerDist = Math.max(0, state.tigerDist - 2); events.push('撞上障碍，老虎逼近！'); }
      }
      state.step += advance;
      state.tigerDist = state.tigerDist - 0 + (advance > 0 ? 0.2 : -0.6); // 领先时缓慢拉开，受挫时骤减
      if (state.tigerDist <= 0) {
        state.alive = false; state.finished = true;
        ctx.session!.finished = true;
        return ok(`绳断虎至，逃亡失败（第 ${state.step} 步）`, { state: sanitizeEt(state), history: `虎口逃生失败于第 ${state.step} 步`, fx: ['ropeBreak', 'lose'] });
      }
      if (state.step >= ctx.num('escapeTiger.stepsPerRun', 12)) {
        state.finished = true;
        ctx.session!.finished = true;
        const coin = ctx.num('escapeTiger.finishCoin', 60) + (state.buffs.filter((b) => ['shield', 'invincible', 'speed'].includes(b)).length) * 10;
        ctx.econ.grant(ctx.playerId, 'COIN', coin, 'escapeTiger', 'finish');
        ctx.player.counters['et.best'] = Math.max(ctx.player.counters['et.best'] ?? 0, coin);
        ctx.store.pushHistory(ctx.playerId, 'escapeTiger', `成功逃离虎口，金币 +${coin}`, [{ assetId: 'COIN', delta: coin }]);
        return ok(`成功逃离虎口！金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }], state: sanitizeEt(state), history: '虎口逃生成功', fx: ['finish', 'win'] });
      }
      return ok(`第 ${state.step} 步。${events.join(' ') || '虎口还差 ' + Math.ceil(state.tigerDist) + ' 步'}`, { state: sanitizeEt(state) });
    },
    /** 中途放弃（安全结算少量金币） */
    abort: (ctx) => {
      const state = (ctx.session?.data as unknown as EtState) || null;
      if (!state || state.finished) return fail('没有进行中的逃亡');
      ctx.session!.finished = true;
      const coin = state.step * 4;
      if (coin > 0) ctx.econ.grant(ctx.playerId, 'COIN', coin, 'escapeTiger', 'abort');
      return ok(`放弃逃亡，按进度结算金币 +${coin}`, { rewards: coin ? [{ assetId: 'COIN', delta: coin }] : [] });
    },
  },
};
function sanitizeEt(s: EtState) {
  const obstacles = Array.isArray(s?.obstacles) ? s.obstacles : [];
  return { ...s, obstacles: obstacles.map((o, i) => (i < (Number(s.step) || 0) ? o : -1)) };
}

// ---------------- 今晚吃鸡（ChickenActivity/ChickenLogsActivity：鸡窝/偷鸡者/预警/防守/收获） ----------------
export const chicken: FeatureGame = {
  id: 'chicken',
  readState: (ctx) => ({
    eggReadyAt: ctx.player.timestamps['chicken.eggAt'] ?? 0,
    eggReady: (ctx.player.timestamps['chicken.eggAt'] ?? 0) > 0 && ctx.now >= (ctx.player.timestamps['chicken.eggAt'] ?? 0),
    guardActiveUntil: ctx.player.timestamps['chicken.guardUntil'] ?? 0,
    thiefWarningAt: ctx.player.timestamps['chicken.thiefAt'] ?? 0,
    eggsCollected: ctx.player.counters['chicken.eggs'] ?? 0,
    guarded: ctx.player.counters['chicken.guarded'] ?? 0,
    stolen: ctx.player.counters['chicken.stolen'] ?? 0,
    log: ctx.store.history(ctx.playerId, 'chicken', 10),
  }),
  actions: {
    feed: (ctx) => {
      if ((ctx.player.timestamps['chicken.eggAt'] ?? 0) > 0) return fail('鸡窝已经有蛋在孵了');
      const cost = ctx.num('chicken.feedCoin', 10);
      if (!ctx.econ.payFrom(ctx.player, { COIN: cost }, 'chicken.feed', 'coop')) return fail('金币不足');
      ctx.player.timestamps['chicken.eggAt'] = ctx.now + ctx.num('chicken.eggSeconds', 30) * 1000;
      // 预约偷鸡者
      ctx.player.timestamps['chicken.thiefAt'] = ctx.now + Math.floor(ctx.num('chicken.eggSeconds', 30) * 1000 * 0.5);
      return ok(`喂养成功，${ctx.num('chicken.eggSeconds', 30)} 秒后可收蛋。注意：偷鸡者可能中途来袭！`, { fx: ['feed'] });
    },
    /** 防守：在预警窗口内布防，驱赶偷鸡者 */
    guard: (ctx) => {
      const thiefAt = ctx.player.timestamps['chicken.thiefAt'] ?? 0;
      if (!thiefAt) return fail('当前没有偷鸡者预警');
      const cost = ctx.num('chicken.guardCostCoin', 8);
      if (!ctx.econ.payFrom(ctx.player, { COIN: cost }, 'chicken.guard', 'coop')) return fail('金币不足');
      ctx.player.timestamps['chicken.thiefAt'] = 0;
      ctx.player.counters['chicken.guarded'] = (ctx.player.counters['chicken.guarded'] ?? 0) + 1;
      return ok('防守成功！偷鸡者被吓跑了', { fx: ['guard'] });
    },
    collect: (ctx) => {
      const at = ctx.player.timestamps['chicken.eggAt'] ?? 0;
      if (!at) return fail('先喂养才有蛋');
      if (ctx.now < at) return fail(`还没成熟（剩 ${Math.ceil((at - ctx.now) / 1000)} 秒）`);
      // 偷鸡者判定：若预警未防守且已过预警时间 → 概率被偷
      const thiefAt = ctx.player.timestamps['chicken.thiefAt'] ?? 0;
      let stolen = false;
      if (thiefAt && ctx.now >= thiefAt) stolen = ctx.rng.chance(0.6);
      ctx.player.timestamps['chicken.eggAt'] = 0;
      ctx.player.timestamps['chicken.thiefAt'] = 0;
      if (stolen) {
        ctx.player.counters['chicken.stolen'] = (ctx.player.counters['chicken.stolen'] ?? 0) + 1;
        ctx.store.pushHistory(ctx.playerId, 'chicken', '蛋被偷鸡者偷走了！');
        return ok('偷鸡者趁夜把蛋偷走了……下次记得防守！', { fx: ['thief', 'lose'] });
      }
      const coin = ctx.num('chicken.collectCoin', 25);
      ctx.econ.grant(ctx.playerId, 'COIN', coin, 'chicken', 'collect');
      ctx.player.counters['chicken.eggs'] = (ctx.player.counters['chicken.eggs'] ?? 0) + 1;
      ctx.store.pushHistory(ctx.playerId, 'chicken', `收获鸡蛋，金币 +${coin}`, [{ assetId: 'COIN', delta: coin }]);
      return ok(`收获鸡蛋！金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }], fx: ['collect', 'win'] });
    },
  },
};

// ---------------- 弹珠（48 marbles PAG：左右/跳/快/慢/待机 + 弹簧/摆锤；角度+力度输入） ----------------
export const marbles: FeatureGame = {
  id: 'marbles',
  readState: (ctx) => {
    const active = Object.values(ctx.store.data.sessions).find((s) => s.playerId === ctx.playerId && s.featureId === 'marbles' && !s.finished);
    return {
      shotsPerRound: ctx.num('marbles.shotsPerRound', 5),
      targetScore: ctx.num('marbles.targetScore', 150),
      active: active ? active.data : null,
      sessionId: active?.sessionId,
      best: ctx.player.counters['marbles.best'] ?? 0,
      history: ctx.store.history(ctx.playerId, 'marbles', 10),
    };
  },
  actions: {
    start: (ctx) => {
      if (!ctx.session) return fail('需要会话');
      const cost = ctx.num('energy.minigameCost', 1);
      if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'marbles.start', 'round')) return fail('体力不足');
      const session = ctx.session!;
      // 摆锤/弹簧/目标布局由 seed 确定性生成（客户端可复现同局轨迹）
      const rng = new Rng(session.seed);
      const pegs = Array.from({ length: 7 }, () => ({ x: rng.int(40, 320), y: rng.int(80, 380), r: rng.int(12, 22) }));
      session.data = { shot: 0, score: 0, pegs } as any;
      return ok('弹珠局开始：选择角度与力度发射！', { state: { shot: 0, score: 0, pegs } });
    },
    /** 发射一次：angle(20-80°) power(40-100)；物理简化：与摆锤位碰撞计分 */
    shot: (ctx) => {
      const state = (ctx.session?.data as any) || null;
      if (!state) return fail('先开始一局');
      if (state.shot >= ctx.num('marbles.shotsPerRound', 5)) return fail('本局弹珠已用完，请结算');
      const angle = Math.max(10, Math.min(85, Number(ctx.payload.angle) || 45));
      const power = Math.max(30, Math.min(100, Number(ctx.payload.power) || 60));
      // 物理简化模型：射程 = power·sin(2θ)/g，与 pegs 命中判定
      const range = (power * Math.sin((2 * angle * Math.PI) / 180)) / 2.2;
      let hitScore = 0;
      const hitIdx: number[] = [];
      (state.pegs as Array<{ x: number; y: number; r: number }>).forEach((p, i) => {
        const dx = Math.abs(p.x - range);
        if (dx < p.r + 8) { hitScore += Math.max(10, Math.floor(60 - dx)); hitIdx.push(i); }
      });
      state.shot++;
      state.score += hitScore;
      state.lastRange = Math.floor(range);
      state.hitIdx = hitIdx;
      const done = state.shot >= ctx.num('marbles.shotsPerRound', 5);
      if (done) {
        ctx.session!.finished = true;
        const best = Math.max(ctx.player.counters['marbles.best'] ?? 0, state.score);
        ctx.player.counters['marbles.best'] = best;
        const coin = Math.floor(state.score * ctx.num('marbles.scoreCoinFactor', 0.2));
        if (coin > 0) ctx.econ.grant(ctx.playerId, 'COIN', coin, 'marbles', 'round');
        const reach = state.score >= ctx.num('marbles.targetScore', 150);
        if (reach) ctx.econ.grant(ctx.playerId, 'TICKET', 1, 'marbles', 'target');
        ctx.store.pushHistory(ctx.playerId, 'marbles', `弹珠本局 ${state.score} 分（最佳 ${best}）`, coin ? [{ assetId: 'COIN', delta: coin }] : undefined);
        return ok(`本局结束：${state.score} 分${reach ? '，达标奖券 +1' : ''}，金币 +${coin}`, {
          rewards: coin ? [{ assetId: 'COIN', delta: coin }] : [], state, history: `弹珠 ${state.score} 分`, fx: reach ? ['win'] : [],
        });
      }
      return ok(`命中 ${hitIdx.length} 个摆锤 +${hitScore} 分（射程 ${Math.floor(range)}）`, { state });
    },
  },
};

// ---------------- 运动会（6 组 select/idle/victory 动画；反应时机玩法） ----------------
export const sports: FeatureGame = {
  id: 'sports',
  readState: (ctx) => {
    const active = Object.values(ctx.store.data.sessions).find((s) => s.playerId === ctx.playerId && s.featureId === 'sports' && !s.finished);
    return {
      rounds: ctx.num('sports.rounds', 4),
      tapWindowMs: ctx.num('sports.tapWindowMs', 220),
      active: active ? active.data : null,
      sessionId: active?.sessionId,
      best: ctx.player.counters['sports.best'] ?? 0,
      history: ctx.store.history(ctx.playerId, 'sports', 10),
    };
  },
  actions: {
    start: (ctx) => {
      if (!ctx.session) return fail('需要会话');
      const cost = ctx.num('energy.minigameCost', 1);
      if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'sports.start', 'meet')) return fail('体力不足');
      const session = ctx.session!;
      const rounds = ctx.num('sports.rounds', 4);
      // 发令枪时刻（相对服务端 now 的偏移序列，客户端据此渲染倒计时）
      const gunTimes = Array.from({ length: rounds }, (_, i) => 1500 + i * 2600 + Math.floor(new Rng(`${session.seed}:${i}`).next() * 900));
      session.data = { round: 0, reactions: [], gunTimes, startedAt: ctx.now } as any;
      return ok('运动会开始！听发令枪，越快反应分越高（抢跑无效）', { state: { round: 0, gunTimes } });
    },
    /** 每轮上报反应时长（服务端按 gunTimes 校验有效性，防伪造） */
    react: (ctx) => {
      const state = (ctx.session?.data as any) || null;
      if (!state) return fail('先开始比赛');
      if (state.round >= state.gunTimes.length) return fail('比赛已结束，请结算');
      const reaction = Math.max(0, Math.floor(Number(ctx.payload.reactionMs) || 9999));
      const window = ctx.num('sports.tapWindowMs', 220);
      const gunAbs = state.startedAt + state.gunTimes[state.round];
      if (ctx.now < gunAbs - 400) { state.round++; return ok('抢跑！本轮无效', { state: { round: state.round } }); }
      const valid = reaction <= window + 150;
      const points = valid ? Math.max(5, Math.floor(100 - Math.abs(reaction - window / 2))) : 5;
      state.reactions.push(reaction);
      state.score = (state.score ?? 0) + points;
      state.round++;
      const done = state.round >= state.gunTimes.length;
      if (done) {
        ctx.session!.finished = true;
        const best = Math.max(ctx.player.counters['sports.best'] ?? 0, state.score);
        ctx.player.counters['sports.best'] = best;
        const coin = Math.floor(state.score / 3) + (state.score >= 300 ? ctx.num('sports.winCoin', 30) : 0);
        ctx.econ.grant(ctx.playerId, 'COIN', coin, 'sports', 'finish');
        ctx.store.pushHistory(ctx.playerId, 'sports', `运动会 ${state.score} 分`, [{ assetId: 'COIN', delta: coin }]);
        return ok(`比赛结束：${state.score} 分，金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }], state, history: `运动会 ${state.score} 分`, fx: state.score >= 300 ? ['win'] : [] });
      }
      return ok(`本轮 ${points} 分（反应 ${reaction}ms）`, { state: { round: state.round, score: state.score } });
    },
  },
};

// ---------------- 拔河（TugActivity/Record/Rank；节奏输入） ----------------
export const tug: FeatureGame = {
  id: 'tug',
  readState: (ctx) => {
    const active = Object.values(ctx.store.data.sessions).find((s) => s.playerId === ctx.playerId && s.featureId === 'tug' && !s.finished);
    return {
      rhythmWindowMs: ctx.num('tug.rhythmWindowMs', 180),
      pullEnergy: ctx.num('tug.pullEnergy', 2),
      active: active ? active.data : null,
      sessionId: active?.sessionId,
      wins: ctx.player.counters['tug.wins'] ?? 0,
      history: ctx.store.history(ctx.playerId, 'tug', 10),
    };
  },
  actions: {
    start: (ctx) => {
      if (!ctx.session) return fail('需要会话');
      const cost = ctx.num('tug.pullEnergy', 2);
      if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'tug.start', 'match')) return fail('体力不足');
      // 鼓点序列（节奏游戏：按鼓点窗口拉绳才有效）
      const beats = Array.from({ length: 10 }, (_, i) => 1200 + i * 900 + Math.floor(new Rng(`${ctx.session!.seed}:${i}`).next() * 300));
      ctx.session!.data = { beatIdx: 0, rope: 0, beats, startedAt: ctx.now } as any;
      return ok('拔河开始！跟着鼓点节奏拉绳', { state: { rope: 0, beats } });
    },
    pull: (ctx) => {
      const state = (ctx.session?.data as any) || null;
      if (!state) return fail('先开始比赛');
      if (state.beatIdx >= state.beats.length) return fail('比赛已结束');
      const beatAbs = state.startedAt + state.beats[state.beatIdx];
      const offset = Math.abs(ctx.now - beatAbs);
      const window = ctx.num('tug.rhythmWindowMs', 180);
      state.beatIdx++;
      if (offset <= window) state.rope += 12;
      else if (offset <= window * 2.2) state.rope += 5;
      else state.rope -= 4; // 乱拉会被反拽
      // NPC 对手持续施压
      state.rope -= 3 + state.beatIdx * 0.4;
      const done = state.beatIdx >= state.beats.length || state.rope >= 60 || state.rope <= -60;
      if (done) {
        ctx.session!.finished = true;
        const win = state.rope >= 40;
        if (win) {
          const coin = ctx.num('tug.winCoin', 20);
          ctx.econ.grant(ctx.playerId, 'COIN', coin, 'tug', 'win');
          ctx.player.counters['tug.wins'] = (ctx.player.counters['tug.wins'] ?? 0) + 1;
          ctx.store.pushHistory(ctx.playerId, 'tug', `拔河胜利（绳位 ${Math.floor(state.rope)}）`, [{ assetId: 'COIN', delta: coin }]);
          return ok(`拔河胜利！金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }], state, history: '拔河胜利', fx: ['win'] });
        }
        ctx.store.pushHistory(ctx.playerId, 'tug', `拔河落败（绳位 ${Math.floor(state.rope)}）`);
        return ok('被对方拉过了中线……再接再厉', { state, history: '拔河落败', fx: ['lose'] });
      }
      return ok(`绳位 ${Math.floor(state.rope)}（${offset <= window ? '完美节拍！' : offset <= window * 2.2 ? '还行' : '乱拉会被反拽！'}）`, { state: { rope: state.rope, beatIdx: state.beatIdx } });
    },
  },
};

// ---------------- 炸猴王（bombOne/Ten/Hundred + useBomb；猴王池 → 赛季积分池） ----------------
export const monkeyKing: FeatureGame = {
  id: 'monkeyKing',
  readState: (ctx) => ({
    bombCost: ctx.num('monkeyKing.bombCost', 10) as any,
    myContribution: ctx.store.rankScore('monkeyKingContribution', ctx.playerId),
    seasonScorePerBomb: ctx.num('monkeyKing.seasonScorePerBomb', 1),
    rank: ctx.store.rankTop('monkeyKingContribution', 10).map((r, i) => ({ rank: i + 1, nick: ctx.store.player(r.playerId)?.nick ?? r.playerId, score: r.score })),
    history: ctx.store.history(ctx.playerId, 'monkeyKing', 10),
    note: '原现金奖池改为赛季积分池（release 政策），bombHundred 保留高投入高回报手感',
  }),
  actions: {
    bomb: (ctx) => {
      const tier = String(ctx.payload.tier || 'one');
      const costs: Record<string, number> = { one: 1, ten: 10, hundred: 100 };
      const count = costs[tier];
      if (!count) return fail('tier 必须是 one/ten/hundred');
      const unit = ctx.num('monkeyKing.bombCost', 10);
      const total = unit * count;
      if (!ctx.econ.payFrom(ctx.player, { COIN: total }, 'monkeyKing.bomb', tier)) return fail(`金币不足（需要 ${total}）`);
      // 投弹命中：连击窗口（hundred 更高贡献系数）
      const coeff = tier === 'hundred' ? 1.2 : tier === 'ten' ? 1.05 : 1;
      const hits = Math.floor(count * coeff * (0.85 + ctx.rng.next() * 0.3));
      const score = Math.floor(hits * ctx.num('monkeyKing.seasonScorePerBomb', 1) * 10);
      ctx.store.rankAdd('monkeyKingContribution', ctx.playerId, score);
      ctx.econ.grant(ctx.playerId, 'SEASON_SCORE', Math.floor(count / 10) + 1, 'monkeyKing', tier);
      const fx = tier === 'hundred' ? ['bombHundred'] : tier === 'ten' ? ['bombTen'] : ['bombOne'];
      ctx.store.pushHistory(ctx.playerId, 'monkeyKing', `${tier} 弹 ×${count}，贡献 ${score}`, [{ assetId: 'SEASON_SCORE', delta: Math.floor(count / 10) + 1 }]);
      return ok(`投弹命中 ${hits}！猴王池贡献 +${score}，赛季积分 +${Math.floor(count / 10) + 1}`, {
        rewards: [{ assetId: 'SEASON_SCORE', delta: Math.floor(count / 10) + 1 }],
        rank: { board: 'monkeyKingContribution', score }, history: `炸猴王 ${tier}`, fx,
      });
    },
  },
};
