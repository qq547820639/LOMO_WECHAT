/**
 * 数据生成工具 —— Source of Truth 构建（Step 5/Section 10）。
 * 输入: evidence/full_clone/*.csv（680 路由矩阵、14092 资源清单、功能清单、模块统计）
 *       evidence/cleanroom/evidence/*.json（44 功能族注册表、模块映射、APK 摘要）
 * 输出: data/routes.json / features.json / features_flat.json / assets.json / economy.json / screens.json / apk_summary.json
 *       shared/src/gen/data.gen.ts（客户端+服务端共同引用）
 *
 * 不变量: 680 Activity 每一个都必须产出迁移状态（mapped/implemented/…），禁止 UNKNOWN。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';
import { LegacyRoute, MigrationStatus, CloneMode, FeatureDef } from '../../shared/src/registry';
import { FeaturePolicy } from '../../shared/src/config';

const ROOT = rootPath();
const EV = path.join(ROOT, 'evidence');
const DATA = path.join(ROOT, 'data');
const GEN = path.join(ROOT, 'shared', 'src', 'gen');

// ---------- CSV 解析 ----------
function parseCsv(file: string): Record<string, string>[] {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// ---------- 功能标签 → 44 族注册表 id ----------
const FEATURE_KEYWORD_MAP: Record<string, string> = {
  '大逃杀': 'battleRoyal', '匕首/刺杀': 'dagger', '抢夺/抢劫': 'robbery', '宝石地下城': 'undertown', '地下城': 'undertown',
  '竞技场': 'arena', 'Boss挑战': 'boss', '斗猿场': 'monkeyFight', '猿兔战斗': 'apeRabbit', '猿猴格斗': 'monkeyFight',
  '今晚吃鸡': 'chicken', '弹珠': 'marbles', '虎口逃生': 'escapeTiger', '运动会': 'sports', '拔河': 'tug', '炸猴王': 'rocksMonkeyKing',
  '小游戏集合': 'home', '动物玩法': 'beast', '方块兽': 'battleRoyal', '猿石魔兽': 'warcraft',
  '猿宇宙': 'ape', '拼图矿场': 'apeMine', '多人矿坑': 'multiplePit', '黄金矿场': 'goldMine', '宇宙探索': 'universe',
  '宝石': 'ape', '金沙': 'ape', '勋章': 'undertown', '猿石/矿石': 'warcraft', '公共/飞船': 'airship',
  '卡牌/闪卡': 'cards', '盲盒/福袋': 'box', '盲盒': 'box', '抽签/抽奖': 'digitalLottery', '数字潮玩': 'digitalGallery',
  '交易/寄售': 'p2pTrade', '竞拍': 'digitalTrade', '商城/订单': 'mall', '商城/卡牌': 'mall', '月饼/兑换': 'moonEvent',
  'IP/设计师': 'creator', '设计师': 'creator', '百人/IP内容': 'apeHundred', '店长/代理': 'agent',
  '钱包/资产': 'walletCash', '我的/钱包': 'profile', '提现/结算': 'walletCash', '账号/身份': 'profile', '账号/登录': 'profile',
  '系统/客服': 'customerService', '消息/未成年人': 'customerService', '邀请/社交': 'social', '超级链接': 'superLink',
  '主城/潮玩主页': 'home', '微信适配': 'home', '系统入口': 'home', '拼团': 'p2pTrade',
};

/** 一级 Tab（Section 17） */
function tabOf(featureId: string, feature: string): FeatureDef['tab'] {
  if (['p2pTrade', 'digitalTrade', 'market', 'auction'].includes(featureId) || /交易|寄售|竞拍/.test(feature)) return 'trade';
  if (['mall', 'box', 'cards', 'flashCard', 'digitalGallery', 'digitalLottery', 'creator', 'moonEvent', 'luckyBag', 'apeHundred', 'digitalTrade'].includes(featureId) || /商城|盲盒|福袋|卡牌|闪卡|潮玩|抽奖|月饼|设计师|数字/.test(feature)) return 'chaowan';
  if (['ape', 'apeMine', 'goldMine', 'multiplePit', 'universe', 'warcraft', 'undertown', 'gacha', 'airship', 'cards'].includes(featureId) || /猿宇宙|矿|金沙|猿石|勋章|宝石|宇宙|拼图/.test(feature)) return 'ape';
  if (['battleRoyal', 'dagger', 'robbery', 'arena', 'boss', 'monkeyFight', 'apeRabbit', 'undertown', 'escapeTiger', 'chicken', 'marbles', 'sports', 'tug', 'rocksMonkeyKing', 'beast', 'nxArena', 'warcraft'].includes(featureId) || /大逃杀|匕首|抢夺|地下城|竞技场|Boss|斗猿|吃鸡|弹珠|虎口|运动|拔河|炸猴王|动物|方块兽|小游戏/.test(feature)) return 'games';
  return 'mine';
}

/** 44 族注册表（cleanroom feature-registry.json + 卡牌/扭蛋等新族扩展） */
function buildFeatures(): FeatureDef[] {
  const reg = JSON.parse(fs.readFileSync(path.join(EV, 'cleanroom/evidence/feature-registry.json'), 'utf8')) as FeatureDef[];
  const features = reg.map((f) => ({ ...f, tab: tabOf(f.id, f.title) }));
  // 迁移期新增族：萌宠扭蛋（猿兔战斗的养成侧）与矿场细分
  if (!features.find((f) => f.id === 'gacha')) {
    features.splice(3, 0, {
      id: 'gacha', title: '萌宠扭蛋', family: 'collection', evidence: ['normal_egg/medal_egg/rock_egg', 'assets dress_*', 'strengthen/*'],
      risk: 'safe', release: 'keep', notes: '开蛋→部位装备→战力→挑战/产出循环。', actions: [{ id: 'openEgg', label: '开蛋' }, { id: 'equip', label: '穿戴' }], tab: 'ape',
    });
  }
  if (!features.find((f) => f.id === 'arena')) {
    features.push({ id: 'arena', title: '竞技场', family: 'combat', evidence: ['ApeArenaActivity'], risk: 'safe', release: 'keep', notes: '三回合行为克制对战。', actions: [{ id: 'fight', label: '挑战' }], tab: 'games' });
  }
  if (!features.find((f) => f.id === 'boss')) {
    features.push({ id: 'boss', title: 'Boss挑战', family: 'combat', evidence: ['ChallengeBossActivity'], risk: 'safe', release: 'keep', notes: '血量制 Boss 战。', actions: [{ id: 'attack', label: '攻击' }], tab: 'games' });
  }
  if (!features.find((f) => f.id === 'apeMine')) {
    features.push({ id: 'apeMine', title: '猿岛矿场', family: 'mining', evidence: ['私人矿场/好友矿场/矿坑 Activity'], risk: 'safe', release: 'keep', notes: '矿坑生产-收取循环。', actions: [{ id: 'startPit', label: '开采' }, { id: 'claimPit', label: '收取' }], tab: 'ape' });
  }
  return features;
}

// ---------- 680 路由映射 ----------
const SERVER_IMPLEMENTED = new Set([
  'battleRoyal', 'dagger', 'robbery', 'undertown', 'arena', 'boss', 'monkeyFight', 'apeRabbit',
  'apeMine', 'goldMine', 'multiplePit', 'universe', 'warcraft', 'escapeTiger', 'chicken', 'marbles',
  'sports', 'tug', 'rocksMonkeyKing', 'cards', 'gacha', 'box', 'daily', 'home', 'profile', 'social', 'superLink',
]);
const SCREEN_IMPLEMENTED = new Set(SERVER_IMPLEMENTED); // 客户端 features 覆盖面（与 server games 一致起步，逐版本扩大）

function buildRoutes(features: FeatureDef[]): { routes: LegacyRoute[]; featureRoutes: LegacyRoute[] } {
  const csv = parseCsv(path.join(EV, 'full_clone/03_FULL_ROUTE_MATRIX_680.csv'));
  const policyOf = (fid: string): FeaturePolicy => features.find((f) => f.id === fid)?.release ?? 'keep';
  const routes: LegacyRoute[] = csv.map((row) => {
    const mode = row.clone_decision as CloneMode;
    const fid = FEATURE_KEYWORD_MAP[row.feature] ?? 'home';
    let status: MigrationStatus;
    if (mode === 'PLATFORM_ADAPTER') status = 'platform-replaced';
    else if (mode === 'UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED') status = 'sandbox-only';
    else if (mode === 'CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER') status = 'implemented';
    else if (SERVER_IMPLEMENTED.has(fid)) status = 'implemented';
    else if (SCREEN_IMPLEMENTED.has(fid)) status = 'mapped';
    else status = 'mapped';
    const releasePolicy = mode === 'UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED' ? 'sandbox' : policyOf(fid);
    return {
      legacyActivity: row.activity,
      screenName: row.screen_name,
      module: row.module,
      moduleName: row.module_name,
      feature: row.feature,
      routeId: row.route_id,
      mode,
      targetLayer: row.target_layer as 'game' | 'adapter',
      riskTags: (row.risk_tags || '').split(';').filter(Boolean),
      featureFamily: fid,
      targetRoute: `/${fid}`,
      migrationStatus: status,
      releasePolicy,
      note: mode === 'PLATFORM_ADAPTER' ? '原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描）' :
        mode === 'UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED' ? '提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付' :
        mode === 'CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER' ? '商业流：订单状态机 mock 支付适配器实现' : undefined,
    };
  });
  return { routes, featureRoutes: routes };
}

// ---------- 资产清单分类 ----------
function buildAssets(): { rows: Record<string, string>[]; summary: Record<string, number> } {
  const csv = parseCsv(path.join(EV, 'full_clone/04_APK_RESOURCE_MANIFEST_14092.csv'));
  let converted = 0, mapped = 0, thirdParty = 0, ignored = 0, unused = 0;
  const rows = csv.map((r) => {
    const top = r.top_group || r.group || '';
    let classification = 'unused';
    let strategy = '';
    if (top === 'native_sdk' || top === 'android' || top.startsWith('AndroidManifest') || top === 'android_res' && /\/(sdk|third|ads|push|pay)/i.test(r.path)) {
      classification = 'third-party'; thirdParty++; strategy = '不移植：由微信平台能力替代';
    } else if (top === 'pag_animation') { classification = 'converted'; converted++; strategy = 'PAG→帧序列/图集（tools/asset_pipeline）或远端视频'; }
    else if (top === 'lottie_animation') { classification = 'converted'; converted++; strategy = '小 Lottie 运行时 / 大 Lottie 烘焙图集'; }
    else if (top === 'audio') { classification = 'converted'; converted++; strategy = '转码 mp3 → InnerAudioContext'; }
    else if (top === 'png_sequence') { classification = 'mapped'; mapped++; strategy = '帧序列打包图集'; }
    else if (top === 'battle_royale_assets' || top === 'dagger_assets' || top === 'robbery_assets') { classification = 'mapped'; mapped++; strategy = '玩法资源映射（同名保留）'; }
    else if (top === 'android_res') { classification = /layout|drawable|anim/.test(r.ext) ? 'ignored-intentionally' : 'unused'; ignored += classification === 'ignored-intentionally' ? 1 : 0; unused += classification === 'unused' ? 1 : 0; strategy = classification === 'ignored-intentionally' ? 'Android 原生布局/动画，由小游戏 UI 重写' : '未引用（保留索引）'; }
    else if (top === 'android') { classification = 'ignored-intentionally'; ignored++; strategy = 'Android 资源（icons/strings），由平台替代'; if (unused > 0) unused--; }
    else { unused++; strategy = '未分类（保留索引待审）'; }
    return { path: r.path, sizeBytes: r.size_bytes, ext: r.ext, group: r.group, topGroup: r.top_group, classification, strategy };
  });
  return { rows, summary: { total: rows.length, converted, mapped, thirdParty, ignoredIntentionally: ignored, unused } };
}

// ---------- 主流程 ----------
export function generate(): void {
  fs.mkdirSync(DATA, { recursive: true });
  fs.mkdirSync(GEN, { recursive: true });
  const features = buildFeatures();
  const { routes } = buildRoutes(features);
  const { rows: assets, summary: assetSummary } = buildAssets();

  // screens.json：模块×功能聚合
  const agg = new Map<string, number>();
  for (const r of routes) {
    const k = `${r.moduleName}|${r.feature}`;
    agg.set(k, (agg.get(k) ?? 0) + 1);
  }
  const screens = Array.from(agg.entries()).map(([k, count]) => { const [moduleName, feature] = k.split('|'); return { moduleName, feature, screenCount: count }; });

  // economy.json：资产目录 + 主要兑换/产出关系（工程重建，INFERRED）
  const { ASSET_CATALOG } = require('../../shared/src/assets');
  const economy = {
    status: 'INFERRED_STRUCTURES_NOT_ORIGINAL_VALUES',
    assets: ASSET_CATALOG,
    flows: [
      { from: 'apeMine', to: 'GEMSTONE+SAND', note: '矿坑定时产出' },
      { from: 'goldMine', to: 'ORE→GOLD', note: '挖矿→精炼' },
      { from: 'ORE', to: 'APE_STONE', rate: '10:1', note: 'NPC 兑换（release）/沙盒市场（full）' },
      { from: 'battleRoyal(eliminated)', to: 'DAGGER', note: '败方铸造匕首' },
      { from: 'undertown(grand)', to: 'GEMSTONE', note: '大奖砖宝石' },
      { from: 'arena/battleRoyal/monkeyKing/multiplePit', to: 'SEASON_SCORE', note: '赛季积分（替代现金奖池）' },
      { from: 'cards.split', to: 'INTEGRAL', note: '拆分粉尘' },
    ],
  };

  fs.writeFileSync(path.join(DATA, 'routes.json'), JSON.stringify(routes, null, 1));
  fs.writeFileSync(path.join(DATA, 'features.json'), JSON.stringify(features, null, 1));
  fs.writeFileSync(path.join(DATA, 'assets.json'), JSON.stringify({ summary: assetSummary, rows: assets }, null, 1));
  fs.writeFileSync(path.join(DATA, 'economy.json'), JSON.stringify(economy, null, 1));
  fs.writeFileSync(path.join(DATA, 'screens.json'), JSON.stringify(screens, null, 1));

  // apk summary 透传
  const apkSummary = JSON.parse(fs.readFileSync(path.join(EV, 'cleanroom/evidence/apk-summary.json'), 'utf8'));
  fs.writeFileSync(path.join(DATA, 'apk_summary.json'), JSON.stringify(apkSummary, null, 1));

  // data.gen.ts
  // SANITIZATION P1-3：客户端包内 FEATURES 不携带 evidence（原版 Activity 名），仅 data/features.json 归档全文
  const featuresForClient = features.map((f) => ({ ...f, evidence: [] as string[] }));
  const gen = `/** AUTO-GENERATED by tools/src/gen_data.ts —— 请勿手改；运行 npm run gen:data 重建。 */
export const FEATURES: import('../registry').FeatureDef[] = ${JSON.stringify(featuresForClient, null, 1)} as any;
export const ROUTE_COUNT = ${routes.length};
export const ROUTE_STATUS_COUNTS: Record<string, number> = ${JSON.stringify(countBy(routes, (r) => r.migrationStatus))};
export const MODE_COUNTS: Record<string, number> = ${JSON.stringify(countBy(routes, (r) => r.mode))};
export const FEATURE_TABS: Record<string, string> = ${JSON.stringify(Object.fromEntries(features.map((f) => [f.id, f.tab ?? 'mine'])))};
export const SERVER_IMPLEMENTED_FEATURES: string[] = ${JSON.stringify(Array.from(SERVER_IMPLEMENTED))};
`;
  fs.writeFileSync(path.join(GEN, 'data.gen.ts'), gen);
  // 同步产出编译版，服务端运行时无需重新 tsc
  const distGenDir = path.join(ROOT, 'dist', 'shared', 'src', 'gen');
  fs.mkdirSync(distGenDir, { recursive: true });
  fs.writeFileSync(path.join(distGenDir, 'data.gen.js'), `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.FEATURES = ${JSON.stringify(features)};\nexports.ROUTE_COUNT = ${routes.length};\nexports.ROUTE_STATUS_COUNTS = ${JSON.stringify(countBy(routes, (r) => r.migrationStatus))};\nexports.MODE_COUNTS = ${JSON.stringify(countBy(routes, (r) => r.mode))};\nexports.FEATURE_TABS = ${JSON.stringify(Object.fromEntries(features.map((f) => [f.id, f.tab ?? 'mine'])))};\nexports.SERVER_IMPLEMENTED_FEATURES = ${JSON.stringify(Array.from(SERVER_IMPLEMENTED))};\n`);

  console.log(`[gen_data] routes=${routes.length} features=${features.length} assets=${assets.length} (${JSON.stringify(assetSummary)})`);
  console.log(`[gen_data] status counts:`, countBy(routes, (r) => r.migrationStatus));
  console.log(`[gen_data] mode counts:`, countBy(routes, (r) => r.mode));
}

function countBy<T>(arr: T[], f: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of arr) out[f(x)] = (out[f(x)] ?? 0) + 1;
  return out;
}

if (require.main === module) generate();
