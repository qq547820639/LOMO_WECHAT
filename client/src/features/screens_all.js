"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllScreensImpl = registerAllScreensImpl;
/**
 * 屏幕总注册 —— features 全部路由 + 微信小游戏入口适配。
 */
const combat_screens_1 = require("./combat_screens");
const minigame_screens_1 = require("./minigame_screens");
const econ_screens_1 = require("./econ_screens");
const trade_screens_1 = require("./trade_screens");
const social_screens_1 = require("./social_screens");
const registry_1 = require("./registry");
const home_lobby_1 = require("./home_lobby");
function registerAllScreensImpl(app) {
    (0, combat_screens_1.registerCombatScreens)();
    (0, minigame_screens_1.registerMinigameScreens)();
    (0, econ_screens_1.registerEconScreens)();
    (0, trade_screens_1.registerTradeScreens)();
    (0, social_screens_1.registerSocialScreens)();
    (0, registry_1.registerRoute)('home', () => new home_lobby_1.HomeLobbyScreen());
}
