/**
 * 功能族 → 屏幕路由表 + 五大 Tab 枢纽。
 * FEATURES 来自 data.gen（44+ 族，含 tab 归属）；680 Activity 经 routes.json 映射到 /family。
 */
import { Screen } from '../core/router';
import { FEATURES, FEATURE_TABS } from '../../../shared/src/gen/data.gen';
import { RELEASE_CORE_FEATURES, RELEASE_LAUNCH_NAVIGATION, RELEASE_TRAINING_FEATURES } from '../../../shared/src/registry';

export type ScreenFactory = () => Screen;

/** routeId → 屏幕工厂（各 features 文件填充） */
export const SCREEN_ROUTES: Record<string, ScreenFactory> = {};

export function registerRoute(routeId: string, factory: ScreenFactory): void {
  SCREEN_ROUTES[routeId] = factory;
}

export function openFeature(app: any, featureId: string): void {
  const policy = app.api.bootstrap?.featurePolicies?.[featureId];
  const profile = app.profile;
  const feature = FEATURES.find((item) => item.id === featureId);
  const release = feature?.release;
  if (profile === 'wechat-release' && (policy === 'cut' || policy === 'defer' || policy === 'sandbox' || release === 'cut' || release === 'defer')) {
    app.showModal('功能暂不可用', ['该功能不属于微信正式版能力范围。', '请使用合规替代玩法。']);
    return;
  }
  const factory = SCREEN_ROUTES[featureId];
  if (!factory) {
    app.showModal('功能未实装', [`「${titleOf(featureId)}」暂无独立页面，请从对应 Tab 枢纽进入相关玩法。`, `featureId=${featureId}`]);
    return;
  }
  app.router.push(factory());
}

export function titleOf(featureId: string): string {
  return FEATURES.find((f) => f.id === featureId)?.title ?? featureId;
}

/** FEATURES 按当前 profile 过滤：release 隐藏 cut 族入口（保留 keep/sandbox/defer 提示页） */
export function featuresForTab(tab: string, profile: string): any[] {
  if (profile === 'wechat-release' && !RELEASE_LAUNCH_NAVIGATION.tabs.some((entry) => entry.targetTab === tab)) return [];
  if (profile === 'wechat-release' && tab === 'games') {
    const byId = new Map(FEATURES.map((feature) => [feature.id, feature]));
    return [...RELEASE_CORE_FEATURES, ...RELEASE_TRAINING_FEATURES].map((id) => byId.get(id)).filter((feature): feature is any => !!feature);
  }
  return FEATURES.filter((f) => (f.tab ?? 'mine') === tab)
    .filter((f) => profile !== 'wechat-release' || f.release === 'keep')
    .filter((f) => profile === 'full-clone' || f.release === 'keep');
}

import { registerAllScreensImpl } from './screens_all';
export function registerAllScreens(app: any): void {
  registerAllScreensImpl(app);
  const { HomeHub } = require('./hubs');
  const tabs = app.profile === 'wechat-release'
    ? RELEASE_LAUNCH_NAVIGATION.tabs.map((entry) => entry.targetTab)
    : ['chaowan', 'ape', 'games', 'trade', 'mine'];
  for (const tab of tabs) {
    if (tab === 'home') {
      const { HomeLobbyScreen } = require('./home_lobby');
      app.router.registerTab(tab, new HomeLobbyScreen());
    } else {
      app.router.registerTab(tab, new HomeHub(tab));
    }
  }
}
