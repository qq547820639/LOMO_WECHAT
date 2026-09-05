/**
 * 屏幕总注册 —— features 全部路由 + 微信小游戏入口适配。
 */
import { registerCombatScreens } from './combat_screens';
import { registerMinigameScreens } from './minigame_screens';
import { registerEconScreens } from './econ_screens';
import { registerTradeScreens } from './trade_screens';
import { registerSocialScreens } from './social_screens';
import { Screen } from '../core/router';
import { UI } from '../ui/widgets';
import { THEME } from '../core/theme';
import { registerRoute } from './registry';
import { HomeLobbyScreen } from './home_lobby';

export function registerAllScreensImpl(app: any): void {
  registerCombatScreens();
  registerMinigameScreens();
  registerEconScreens();
  registerTradeScreens();
  registerSocialScreens();
  registerRoute('home', () => new HomeLobbyScreen());
}
