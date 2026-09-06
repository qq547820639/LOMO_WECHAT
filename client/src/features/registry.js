"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCREEN_ROUTES = void 0;
exports.registerRoute = registerRoute;
exports.openFeature = openFeature;
exports.titleOf = titleOf;
exports.featuresForTab = featuresForTab;
exports.registerAllScreens = registerAllScreens;
const data_gen_1 = require("../../../shared/src/gen/data.gen");
const registry_1 = require("../../../shared/src/registry");
/** routeId → 屏幕工厂（各 features 文件填充） */
exports.SCREEN_ROUTES = {};
function registerRoute(routeId, factory) {
    exports.SCREEN_ROUTES[routeId] = factory;
}
function openFeature(app, featureId) {
    var _a, _b;
    const policy = (_b = (_a = app.api.bootstrap) === null || _a === void 0 ? void 0 : _a.featurePolicies) === null || _b === void 0 ? void 0 : _b[featureId];
    const profile = app.profile;
    const feature = data_gen_1.FEATURES.find((item) => item.id === featureId);
    const release = feature === null || feature === void 0 ? void 0 : feature.release;
    if (profile === 'wechat-release' && (policy === 'cut' || policy === 'defer' || policy === 'sandbox' || release === 'cut' || release === 'defer')) {
        app.showModal('功能暂不可用', ['该功能不属于微信正式版能力范围。', '请使用合规替代玩法。']);
        return;
    }
    const factory = exports.SCREEN_ROUTES[featureId];
    if (!factory) {
        app.showModal('功能未实装', [`「${titleOf(featureId)}」暂无独立页面，请从对应 Tab 枢纽进入相关玩法。`, `featureId=${featureId}`]);
        return;
    }
    app.router.push(factory());
}
function titleOf(featureId) {
    var _a, _b;
    return (_b = (_a = data_gen_1.FEATURES.find((f) => f.id === featureId)) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : featureId;
}
/** FEATURES 按当前 profile 过滤：release 隐藏 cut 族入口（保留 keep/sandbox/defer 提示页） */
function featuresForTab(tab, profile) {
    if (profile === 'wechat-release' && !registry_1.RELEASE_LAUNCH_NAVIGATION.tabs.some((entry) => entry.targetTab === tab))
        return [];
    if (profile === 'wechat-release' && tab === 'games') {
        const byId = new Map(data_gen_1.FEATURES.map((feature) => [feature.id, feature]));
        return [...registry_1.RELEASE_CORE_FEATURES, ...registry_1.RELEASE_TRAINING_FEATURES].map((id) => byId.get(id)).filter((feature) => !!feature);
    }
    return data_gen_1.FEATURES.filter((f) => { var _a; return ((_a = f.tab) !== null && _a !== void 0 ? _a : 'mine') === tab; })
        .filter((f) => profile !== 'wechat-release' || f.release === 'keep')
        .filter((f) => profile === 'full-clone' || f.release === 'keep');
}
const screens_all_1 = require("./screens_all");
function registerAllScreens(app) {
    (0, screens_all_1.registerAllScreensImpl)(app);
    const { HomeHub } = require('./hubs');
    const tabs = app.profile === 'wechat-release'
        ? registry_1.RELEASE_LAUNCH_NAVIGATION.tabs.map((entry) => entry.targetTab)
        : ['chaowan', 'ape', 'games', 'trade', 'mine'];
    for (const tab of tabs) {
        if (tab === 'home') {
            const { HomeLobbyScreen } = require('./home_lobby');
            app.router.registerTab(tab, new HomeLobbyScreen());
        }
        else {
            app.router.registerTab(tab, new HomeHub(tab));
        }
    }
}
