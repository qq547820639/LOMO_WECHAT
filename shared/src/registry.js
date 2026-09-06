"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASE_TRAINING_FEATURES = exports.RELEASE_CORE_FEATURES = exports.RELEASE_LAUNCH_NAVIGATION = void 0;
exports.RELEASE_LAUNCH_NAVIGATION = {
    tabs: [
        { id: 'home', label: '主城', targetTab: 'home' },
        { id: 'games', label: '游戏', targetTab: 'games' },
        { id: 'chaowan', label: '收藏', targetTab: 'chaowan' },
        { id: 'mine', label: '我的', targetTab: 'mine' },
    ],
    defaultTab: 'home',
};
exports.RELEASE_CORE_FEATURES = ['escapeTiger', 'marbles', 'undertown'];
exports.RELEASE_TRAINING_FEATURES = ['battleRoyal'];
