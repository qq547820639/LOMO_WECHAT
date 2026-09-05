# BRAND_AUDIT（脱敏审计）

> 审计日期 2026-09-06 · 全仓 grep 实测（client/server/build 产物/docs/evidence/data）。
> 背景：本工程为逆向研究，部署使用自有品牌与基础设施（DEPLOYMENT.md 红线）。
> 结论口径分两层：**L1 用户可见层**（编译进微信包、到终端玩家眼前——必须脱敏）与
> **L2 研究归档层**（docs/evidence/data，研究记录本体——保留并已加隔离声明）。

## L1 用户可见层 —— ❌ 未脱敏（部署前必须处理）

以下字符串已确认**存在于 build/wechat-* 产物内**，会到终端用户眼前：

| # | 字符串 | 位置 | 性质 | 风险 |
|---|---|---|---|---|
| 1 | `主城 · 潮玩宇宙` | client/src/features/home_lobby.ts:15（产物已验证） | **原版产品名完整复制**（运行时证据确证《潮玩宇宙》为原版产品名） | 高 |
| 2 | `LOMO 小游戏 · 正在启动…` | client/src/app/main.ts:212（产物已验证） | LOMO 为原版品牌名（com.caike.lomo） | 高 |
| 3 | `一起来玩 LOMO 小游戏！` | client/src/features/social_screens.ts:138（分享卡片标题） | 同上，且经分享外显 | 高 |
| 4 | `欢迎来到 LOMO 小游戏` | server/src/app.ts:265（新玩家欢迎邮件） | 同上 | 高 |
| 5 | `无聊猿·初心/街头/金链/赛博/黄金甲/创世` | server/src/games/card_data.ts:19-24（图鉴 6 张卡名） | **双重第三方 IP**：无聊猿=Bored Ape Yacht Club（Yuga Labs），与原版无关也与我们无关 | 高（侵权面比原版品牌更直接） |
| 6 | `扭蛋兔养成` | client/src/features/econ_screens.ts:169（玩法页标题） | 扭蛋兔=原版运营主体公司名（深圳市扭蛋兔网络科技，RUNTIME_EVIDENCE §2 确证） | 中高 |
| 7 | `lomo-wechat` / `lomo-wechat-formal-migration` | wechat/project.config.json projectname、package.json name | 工程元数据（开发者工具/包元数据可见，非玩家界面） | 低 |

**低风险保留候选**（通用品类词，非原版专属）：
- Tab 名「潮玩」（潮玩=designer toys 通用品类词）、「猿宇宙」（通用组合词）——可保留；
  若求稳可一并换（同在 brand.ts 一处）。
- 玩法机制名词（猿卡/星球卡/金沙/矿石/猿石等）——机制层通用词，保留。

**未发现**：原版 slogan「潮玩玩家聚集地」未复制；隐私政策链接文本未复制；
原版任何美术资产未入包（包内为程序化占位 + 自有烘焙图集，ASSET_MIGRATION 口径）。

## L2 研究归档层 —— 保留（研究记录本体，已隔离）

| 位置 | 内容 | 处置 |
|---|---|---|
| docs/RUNTIME_EVIDENCE.md | 《潮玩宇宙》/扭蛋兔主体/云信域名（2 处品牌名） | 保留：出处级研究证据 + 已带部署隔离声明 |
| docs/ 其余 20+ 篇 | LOMO/潮玩宇宙作为研究对象名 | 保留：研究文档标识；DEPLOYMENT.md 红线已声明不复用 |
| evidence/（截图/原包归档/CSV） | 原版 UI 截图、清单 | 保留：证据本体；不入微信包 |
| data/routes.json 等 | 原版模块中文名 | 保留：研究数据 |
| 交付 ZIP | 研究交付物 | 保留：交付对象是研究者本人，非终端用户；正式产品包以脱敏后 brand 构建为准 |

## 脱敏执行记录（✅ 已完成 2026-09-06）

**命名调研（真实检索）**：
- 「猿岛」：检索无同名小游戏（命中仅《猴岛传说》系列、《猿族时代》、日本真实岛屿猿岛 Sarushima）→ 检索区分度高，采用；
- 「潮玩乐园」（备选）：品类拥挤——淘宝"玩新世界"潮玩乐园小程序、潮玩国度、惊喜潮玩、Molly潮玩社等 → 弃用。

**执行内容（brand.ts 单一出处，部署换牌只改 shared/src/brand.ts）**：
1. 新增 shared/src/brand.ts：appName=猿岛 / appNameEn=ApeIsland / loadingText / homeTitle / shareTitle / welcomeMail / announcements / versionFooter；
2. `主城 · 潮玩宇宙` → BRAND.homeTitle（home_lobby.ts）；主城公告栏研究文案 → BRAND.announcements；
3. `LOMO 小游戏 · 正在启动` → BRAND.loadingText（main.ts）；HUD 品牌行 → BRAND.appName；
4. 分享标题 → BRAND.shareTitle（social_screens.ts）；服务端欢迎邮件 → BRAND.welcomeMail*（app.ts）；
5. 卡牌 6 张 `无聊猿·X` → `猿仔·X`（card_data.ts）；资产目录 displayName `无聊猿卡` → `猿仔卡`（assets.ts）；
6. `扭蛋兔养成` → `萌宠扭蛋`（econ_screens.ts + gen_data.ts 数据源， hubs 列表同步）；
7. 类名 LomoClientApp → MiniGameClientApp；projectname lomo-wechat → ape-island；包内 README/game.js 头注释中性化；
8. 「我的」页研究脚注（版本: LOMO 4.3.7 / 证据等级行）→ 中性版本号 + 健康游戏提示。

**复扫结果（build/wechat-* 双包 dist）**：
- `潮玩宇宙` 0 · `无聊猿` 0 · `扭蛋兔` 0（此前 2/4/12）；
- 源码（shared/client/server/tools）三词 0 命中；
- `LOMO` 残留 6 处 = **环境变量工程标识符**（LOMO_PROFILE/LOMO_SECRET/LOMO_ALLOW_ADMIN，DEPLOYMENT.md 文档化契约，仅开发者可见，非 UI 字符串）——保留；
- npm test 6/6 · verify 10/10 全绿（bundle-smoke 全链路渲染照常通过）。

## 脱敏方案（原方案存档）

1. 新建 `client/src/core/brand.ts`：`appName` / `homeTitle` / `shareTitle` / `welcomeMail` 集中定义，
   全部 L1 字符串改引此处；部署时**只改这一个文件**即可完成换牌。
2. 默认值用与原版无关的占位代号（如 `猿岛 ApeIsland`——示例，以用户自有品牌为准）。
3. 卡牌名重命名为自有系列（如 `猿卡·初心` 等，仅去"无聊猿"三字，机制数值不变）。
4. `扭蛋兔养成` → `萌宠扭蛋`（机制不变，标题去主体关联）。
5. project.config.json/package.json 工程名 → 中性代号（如 `mini-game-app`）。
6. 执行后重跑 `npm run verify`（bundle-smoke 会再次全文渲染验证）+ 包内 grep 复扫归零。

> 状态：**审计完成，脱敏未执行**——L1 共 7 项待处理，等确认占位品牌名后一轮改完（改动全部集中在 brand.ts + 4 个文件）。
