/**
 * 卡牌模板数据（图鉴）。命名与 APK 语义对齐：猿卡/星球卡/闪卡。
 * 数值采用 OWNED_LAUNCH_DEFAULTS（原正式服卡牌表不可静态恢复，运营可版本化调整）。
 */
import { CardTemplate } from '../../../shared/src/registry';

// 卡牌系列名「猿仔」：自有命名（BRAND_AUDIT 脱敏项 #5），无第三方 IP 关联
const mk = (prefix: string, type: CardTemplate['cardType'], names: [string, CardTemplate['rarity'], number][]): CardTemplate[] =>
  names.map(([name, rarity, power], i) => ({
    templateId: `card_${prefix}_${i + 1}`,
    name: `${name}`,
    cardType: type,
    rarity,
    power,
    production: type === 'APE_CARD' ? Math.ceil(power / 4) : undefined,
  }));

export const CARD_TEMPLATES: CardTemplate[] = [
  ...mk('ape', 'APE_CARD', [
    ['猿仔·初心', 'N', 8], ['猿仔·街头', 'N', 10], ['猿仔·金链', 'R', 18],
    ['猿仔·赛博', 'R', 20], ['猿仔·黄金甲', 'SR', 35], ['猿仔·创世', 'SSR', 60],
  ]),
  ...mk('planet', 'PLANET_CARD', [
    ['绯红之星', 'N', 6], ['环带气态星', 'N', 9], ['猿眼卫星', 'R', 16],
    ['金沙小行星', 'R', 19], ['远古遗迹星', 'SR', 32], ['宇宙中心', 'SSR', 55],
  ]),
  ...mk('flash', 'FLASH_CARD', [
    ['闪卡·晨曦', 'N', 7], ['闪卡·流光', 'N', 10], ['闪卡·雷鸣', 'R', 17],
    ['闪卡·极光', 'R', 21], ['闪卡·星涡', 'SR', 38], ['闪卡·万象', 'SSR', 65],
  ]),
];
