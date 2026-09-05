/**
 * 功能族 → 屏幕路由表 + 五大 Tab 枢纽。
 * FEATURES 来自 data.gen（44+ 族，含 tab 归属）；680 Activity 经 routes.json 映射到 /family。
 */
import { Screen } from '../core/router';
import { FEATURES, FEATURE_TABS } from '../../../shared/src/gen/data.gen';

export type ScreenFactory = () => Screen;

/** routeId → 屏幕工厂（各 features 文件填充） */
export const SCREEN_ROUTES: Record<string, ScreenFactory> = {};

export function registerRoute(routeId: string, factory: ScreenFactory): void {
  SCREEN_ROUTES[routeId] = factory;
}

export function openFeature(app: any, featureId: string): void {
  const policy = app.api.bootstrap?.featurePolicies?.[featureId];
  const profile = app.profile;
  const blockedInRelease = profile === 'wechat-release' && policy && policy !== 'keep' && policy !== 'sandbox' && false;
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
  return FEATURES.filter((f) => (f.tab ?? 'mine') === tab)
    .filter((f) => profile === 'full-clone' || f.release !== 'cut');
}

import { registerAllScreensImpl } from './screens_all';
export function registerAllScreens(app: any): void {
  registerAllScreensImpl(app);
  const { HomeHub } = require('./hubs');
  for (const tab of ['chaowan', 'ape', 'games', 'trade', 'mine']) {
    app.router.registerTab(tab, new HomeHub(tab));
  }
}
