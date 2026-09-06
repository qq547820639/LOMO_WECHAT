# SOURCE OF TRUTH

> 输入证据的合并结论（Section 10）。生成工具：tools/src/gen_data.ts（npm run gen:data）。

## 输入验证（Step 2）

| 文件 | SHA-256 | 验证 |
|---|---|---|
| lomo_4.3.7 APK (275,161,212 B) | `8e6ae67463d494e53a94f144fc07843025794036e2b1adee6ee9aa9abd0cb5de` | 与 cleanroom apk-summary.json 记录一致 ✅ |
| lomo_full_clone_delivery.zip | `aa1b2983c843d4e9953f3971c3cd0f4f71b0a8a38d62be30db1a63e59cb05927` | 已解压归档 evidence/full_clone ✅ |
| lomo_wechat_migration_cleanroom.zip | `249a1861f77694d203428fd595d00e35352c62bd59a72d75c833ad55596f8a42` | 已解压归档 evidence/cleanroom ✅ |

## 数据产物（生成于 data/）

- `routes.json` — **680 条**，与原 CSV 逐行对应（tools/route_parity 校验 680/680）。字段见 shared/src/registry.ts `LegacyRoute`。
- `features.json` — 48 功能族（44 cleanroom 族 + 迁移期拆分的 gacha/arena/boss/apeMine）。
- `assets.json` — 14,092 条 APK 资源分类（converted/mapped/third-party/unused…）。
- `economy.json` — 20 种资产定义 + 经济流向表。
- `screens.json` — 模块×功能聚合（33 模块）。
- `shared/src/gen/data.gen.ts` — 客户端/服务端共同引用的编译期数据。

## 680 路由的迁移状态分布（route_parity 实测）

| 状态 | 数量 | 含义 |
|---|---|---|
| implemented | 354 | 服务端玩法/商业路由 + 客户端页面已实装 |
| mapped | 159 | 页面+路由已映射到功能族（族页面存在，玩法由同族引擎承载） |
| sandbox-only | 10 | 提现/现金结算十屏：UI 1:1 + 沙盒桥（UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED） |
| platform-replaced | 113 | 第三方 SDK 页 → 平台适配层（登录/支付/广告/客服/扫描） |
| platform-replaced/其他 | 44 | 商业流 mock 支付适配器（CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER 计入 implemented） |

决策分布与原 CSV 完全一致：CLONE_1_TO_1=513 / COMMERCE_ADAPTER=44 / SETTLEMENT_DISABLED=10 / PLATFORM_ADAPTER=113。

## 证据优先级（Section 7 的执行）

1. APK 静态可证（Manifest/Activity/资源名/音频/PAG/Lottie）→ **MATCHED**
2. 公开玩法资料可交叉验证（大逃杀修门/地下城砖块/扭蛋部位）→ **HIGH_CONFIDENCE_REIMPLEMENTATION**
3. 结构推断（经济关系/成长曲线）→ **OWNED_LAUNCH_DEFAULTS**（自有参数，版本化并可校准）
4. 原服数值（概率/奖池/签名）→ **SERVER_REQUIRED / RUNTIME_REQUIRED**，全部落 RemoteConfig

APK 加固事实：`com.stub.StubApp` + `assets/libjiagu*.so`；`classes.dex` 仅 4 个壳类。因此本工程**不声称恢复任何原服数值**。
