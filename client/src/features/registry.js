"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCREEN_ROUTES = void 0;
exports.registerRoute = registerRoute;
exports.openFeature = openFeature;
exports.titleOf = titleOf;
exports.featuresForTab = featuresForTab;
exports.registerAllScreens = registerAllScreens;
const data_gen_1 = require("../../../shared/src/gen/data.gen");
/** routeId → 屏幕工厂（各 features 文件填充） */
exports.SCREEN_ROUTES = {};
function registerRoute(routeId, factory) {
    exports.SCREEN_ROUTES[routeId] = factory;
}
function openFeature(app, featureId) {
    var _a, _b;
    const policy = (_b = (_a = app.api.bootstrap) === null || _a === void 0 ? void 0 : _a.featurePolicies) === null || _b === void 0 ? void 0 : _b[featureId];
    const profile = app.profile;
    const blockedInRelease = profile === 'wechat-release' && policy && policy !== 'keep' && policy !== 'sandbox' && false;
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
    return data_gen_1.FEATURES.filter((f) => { var _a; return ((_a = f.tab) !== null && _a !== void 0 ? _a : 'mine') === tab; })
        .filter((f) => profile === 'full-clone' || f.release !== 'cut');
}
const screens_all_1 = require("./screens_all");
function registerAllScreens(app) {
    (0, screens_all_1.registerAllScreensImpl)(app);
    const { HomeHub } = require('./hubs');
    for (const tab of ['chaowan', 'ape', 'games', 'trade', 'mine']) {
        app.router.registerTab(tab, new HomeHub(tab));
    }
}
