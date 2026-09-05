/**
 * 玩法注册表 —— 全部 FeatureGame 聚合。服务端按 id 查找。
 * 客户端 features 目录与此一一对应。
 */
import { FeatureGame } from './types';
import { battleRoyale } from './battle_royale';
import { arena, boss, monkeyFight, dagger, robbery } from './combat';
import { undertown } from './undertown';
import { apeMine, goldMine, multiplePit } from './mining';
import { universe, warcraft } from './universe';
import { escapeTiger, chicken, marbles, sports, tug, monkeyKing } from './minigames';
import { cards, gacha, box, daily } from './collection';

export const FEATURES_GAMES: Record<string, FeatureGame> = Object.fromEntries(
  [
    battleRoyale, arena, boss, monkeyFight, dagger, robbery,
    undertown, apeMine, goldMine, multiplePit, universe, warcraft,
    escapeTiger, chicken, marbles, sports, tug, monkeyKing,
    cards, gacha, box, daily,
  ].map((g) => [g.id, g]),
);

export const FEATURE_IDS = Object.keys(FEATURES_GAMES);
