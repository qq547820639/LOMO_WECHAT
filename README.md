# LOMO 4.3.7 → 微信小游戏 正式移植工程

> 原始 APK：`lomo_4.3.7`（com.caike.lomo，versionCode 403007，SHA-256 `8e6ae674…d0cb5de`，已验证）
> 本工程是一次**正式工程化移植**：服务端权威参考后端 + 可玩客户端 + 微信小游戏双发布产物 + 680 路由全验收 + 资源管线 + 全套自动化测试。

## 快速开始（全部命令已实际运行验证）

```bash
npm install          # 安装 typescript/@types/node（devDependencies 仅两个）
npm run build        # tsc 编译 shared/server/client/tools/tests → dist/
npm run gen:data     # 680 路由 + 14,092 资产清单 + 48 功能族 → data/ + shared/src/gen/
npm test             # 编译 + node:test 运行 dist/tests/
npm run verify       # 最终自动验收（8 步）：parity/资产/unit/玩法/发布安全/集成/双产物构建/包冒烟
npm run server       # 启动参考服务端（LOMO_PROFILE=full-clone|wechat-release，默认 8787 端口）
npm run build:wechat # 构建微信小游戏双产物 → build/wechat-full-clone 与 build/wechat-release
npm run parity       # 680 路由验收，重建 docs/ROUTE_PARITY_680.md
npm run gen:assets   # 资源管线（可加 --apk xx.apk --out dir 做真实提取）
```

`npm run verify` 输出 `verify PASS: all steps green` 且 Exit Code 0（见 `docs/TEST_REPORT.md`）。

## 微信开发者工具导入

1. 打开微信开发者工具 → 导入项目 → 选择 `build/wechat-full-clone/`（或 `build/wechat-release/`）。
2. AppID 使用测试号（touristappid，已在 project.config.json 中）。
3. 包内默认使用**进程内权威后端**（与 `server/` 同一套编译代码，wx 真机可运行）。
4. 如需连接真实服务端：`LOMO_SERVER_URL=http://host:8787 node dist/tools/src/build_wechat.js --profile wechat-release` 重新构建。

## 三大输入与证据

| 输入 | 位置 | 说明 |
|---|---|---|
| 原 APK | 仓库外（SHA-256 已记录于 docs/SOURCE_OF_TRUTH.md） | 360 加固（StubApp+libjiagu），业务 DEX 运行时解密 |
| 全量复刻包 | `evidence/full_clone/` | 680 路由 CSV、14,092 资源清单 CSV、玩法目录、公开证据 |
| clean-room 基线 | `evidence/cleanroom/` | 44 功能族注册表、兼容表、后端契约、launch 决策 |

## 目录结构

```
shared/src/       资产目录/账本/确定性RNG/RemoteConfig/协议/注册表类型（双端共用）
server/src/       参考服务端：app.ts（可移植，wx 进程内可跑）+ index.ts（HTTP 入口）
  server/src/games/   22 个玩法的服务端权威实现（大逃杀/地下城/竞技场/矿场/宇宙/小游戏矩阵/卡牌…）
client/src/       小游戏客户端：引擎壳/路由/立即模式UI/平台适配/网络/音频
  client/src/features/ 48 功能族页面（与 data.gen FEATURES 一一对应）
tools/src/        gen_data / route_parity / asset_pipeline / build_wechat / verify
data/             routes.json(680) assets.json(14092) features.json economy.json screens.json…
configs/          full-clone.json / wechat-release.json / tuning-baseline.json(INFERRED 标注)
tests/            unit_core / gameplay_server / release_safety / integration_client
docs/             18 篇交付文档（含 ROUTE_PARITY_680 / TEST_REPORT 自动生成）
evidence/         full_clone + cleanroom 原包归档 + apk_assets_sample（管线真实提取样本）
build/            微信小游戏双产物（verify 生成）
```

## 双发布配置（核心架构原则）

同一代码库，两层配置：

- **FULL CLONE**（`configs/full-clone.json`）：完整复刻 680 页面生态与经济关系；真钱类界面 1:1 复刻但绑定沙盒桥（TEST_CREDIT，永不兑付）。
- **WECHAT RELEASE**（`configs/wechat-release.json`）：现金钱包/提现/下注/付费随机/竞拍/P2P 交易/代理/现金红包在 **客户端 Feature Flag + 服务端 API 拦截 + 配置锁定** 三层关闭；下注房间→门票房间、现金奖池→赛季积分、矿石交易→NPC 兑换。tests/release_safety.ts 自动断言。

诚实声明：所有无法从加固 APK 静态证明的原服数值（概率/奖池/协议签名/掉落表）一律标记 `INFERRED_NOT_ORIGINAL` 并置于 `configs/tuning-baseline.json` + RemoteConfig，可被真实数据一键替换。见 `docs/KNOWN_DIFFERENCES.md`。

## 文档索引

SOURCE_OF_TRUTH / ARCHITECTURE / IMPLEMENTATION_STATUS / ROUTE_PARITY_680 / FEATURE_PARITY / ASSET_MIGRATION / ECONOMY_MODEL / BACKEND_API / GAMEPLAY_RULES / WECHAT_ADAPTATION / PERFORMANCE_REPORT / TEST_REPORT / COMPLIANCE_CURRENT / FINAL_LAUNCH_DECISION / KNOWN_DIFFERENCES / EXTERNAL_BLOCKERS / TECH_STACK_DECISION / PRIVACY_DATA_MAP（均在 `docs/`）。
