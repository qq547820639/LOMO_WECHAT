"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_IDS = exports.FEATURES_GAMES = void 0;
const battle_royale_1 = require("./battle_royale");
const combat_1 = require("./combat");
const undertown_1 = require("./undertown");
const mining_1 = require("./mining");
const universe_1 = require("./universe");
const minigames_1 = require("./minigames");
const collection_1 = require("./collection");
exports.FEATURES_GAMES = Object.fromEntries([
    battle_royale_1.battleRoyale, combat_1.arena, combat_1.boss, combat_1.monkeyFight, combat_1.dagger, combat_1.robbery,
    undertown_1.undertown, mining_1.apeMine, mining_1.goldMine, mining_1.multiplePit, universe_1.universe, universe_1.warcraft,
    minigames_1.escapeTiger, minigames_1.chicken, minigames_1.marbles, minigames_1.sports, minigames_1.tug, minigames_1.monkeyKing,
    collection_1.cards, collection_1.gacha, collection_1.box, collection_1.daily,
].map((g) => [g.id, g]));
exports.FEATURE_IDS = Object.keys(exports.FEATURES_GAMES);
