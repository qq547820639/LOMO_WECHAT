# 潮玩宇宙 APK → 微信小游戏：全量体验复刻包

本包是对上一版“合规裁剪 MVP”的反向修订：**优先保留原 APK 的完整产品体验与经济/玩法结构，不再为了上线审核提前删玩法。**

## 已确认的静态证据
- APK: `com.caike.lomo`, 4.3.7 / versionCode 403007。
- 680 个 Activity，其中 567 个为业务页面，113 个第三方 SDK 页面。
- APK 共 14,092 个条目；assets 3,524 个。
- 资源中明确存在 Battle Royale、Dagger、Robbery、Arena、Challenge Boss、Chicken、Escape Animal、Marbles、Monkey Fighting、Undertown、Universe、Mining 等完整动画/音频组。
- APK 使用 360 加固（StubApp/libjiagu），因此静态分析无法可靠还原被壳保护的业务源码、线上 API 参数签名与服务器概率配置。

## 本轮范围
1. **680 页面全量映射**：业务页面默认 `CLONE_1_TO_1`；Android/广告/客服等第三方 SDK 替换为小游戏适配层。
2. **完整生态保留**：商城、盲盒、卡牌、猿宇宙、矿场、地下城、竞技、抢夺、交易、竞拍、邀请、资产页等都进入复刻范围。
3. **原始游戏经济关系保留为产品模型**：宝石、勋章、NDTU、世界币、猿石、金沙、匕首、卡牌、徽章、积分等资产全部建模。
4. **安全边界**：涉及真钱下注、可提现赌注/随机输赢结算的部分，本包只提供 UI、状态机、虚拟测试资产和接口占位，不提供真钱赌博或实际提现通道实现。
5. **素材**：提供完整 APK 资源清单和一键提取工具；未在 ZIP 内重复打包 200MB+ 原始素材。

## 最重要的文件
- `docs/00_FULL_CLONE_DECISION.md`：本轮最终裁决。
- `docs/01_PRODUCT_ECOSYSTEM.md`：完整产品大循环。
- `docs/02_GAMEPLAY_CATALOG.md`：各小游戏/养成玩法复刻说明。
- `03_FULL_ROUTE_MATRIX_680.csv`：680 个 Activity 逐页映射。
- `04_APK_RESOURCE_MANIFEST_14092.csv`：14,092 个 APK 文件全量清单。
- `src/core/routeRegistry.ts`：680 路由的代码注册表。
- `src/domain/assets.ts`：原资产体系建模。
- `src/features/battle_royale/rules.ts`：大逃杀虚拟资产状态机。
- `tools/extract_apk_assets.py`：从用户自己的 APK 一键提取素材。

## 结论
前一版的“90 秒抢方块”不是原应用最核心的黏性来源。原产品真正的核心是**多资产循环 + 生产/挖矿 + 多种概率游戏 + 交易/社交 + 大逃杀等高刺激玩法**互相导流。本轮已经改成按这一整体生态复刻。
