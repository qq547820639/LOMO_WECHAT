# LOMO 4.3.7 → 微信小游戏 正式移植工程

> 原始 APK：`lomo_4.3.7`（com.caike.lomo，versionCode 403007，SHA-256 `8e6ae674…d0cb5de`，已验证）
> 本工程包含服务端权威参考后端、小游戏客户端、双运行配置、680 路由映射、资源管线和自动化测试。
>
> **2026-09-06 当前结论：本地 QA 可继续，正式运营未通过验收。** 最终本地 `npm test` **16/16**、`verify` **23/23**、原生 Canvas **6/6**，运行依赖审计发现 **0** 个已知漏洞；报告时间为 `2026-09-06T11:45:07.028Z`，见 [TEST_REPORT.md](docs/TEST_REPORT.md) 与 [递归复查记录](docs/QA_RECHECK_2026-09-06.md)。当前已加入 CloudBase 持久化实现，隔离真实云应用集成 7 组通过；正式云调用仍失败 `85088`，生产持久化迁移/部署、官方登录、真机和完整视觉及发布资质未通过验收。旧 `14/14`、`21/21` 是持久化改动前的历史轮次。操作边界见 [QA 交接手册](docs/QA_HANDOFF.md)。

## 快速开始：本地自动回归

```bash
npm install
npm test
npm run verify
node tests/client_canvas_browser.mjs
```

`npm test` 先编译到 `dist/`，再运行测试；`verify` 输出 [TEST_REPORT.md](docs/TEST_REPORT.md)，只在 `build/verify/` 生成离线验收包。原生 Canvas 脚本需要 Chrome/Chromium，可用 `CHROME_PATH` 指定可执行文件。自动通过不代表微信正式网络或真实手机已经通过。

## 三类客户端产物

| 用途 | 输出目录 | 配置与边界 |
|---|---|---|
| 正式联机客户端 | `build/wechat-release/` | 真实 AppID/云环境、`urlCheck=true`；当前仍被正式网络问题阻断，不能据构建成功认定可运营 |
| 本地交互 QA | `build/wechat-qa/` | 回环服务、固定合成身份、内存进度、`urlCheck=false`；只用于本机模拟器，不上传或分发 |
| 自动验收 | `build/verify/wechat-full-clone/`、`build/verify/wechat-release/` | 离线替身配置及 Node 包冒烟；与正式输出隔离，不能分发 |

### 本地模拟器 QA

```bash
APP_WX_APPID=wxec103651e807c540 \
APP_CLOUD_BASE=https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/ \
QA_PORT=8799 \
npm run qa:local
```

该命令编译并生成 QA 包，随后监听 `http://127.0.0.1:8799`，需保持终端运行；停止服务使用 `Ctrl+C`。服务重启会重置进度，资源仍依赖 CDN。手机上的 `127.0.0.1` 不指向这台 Mac。

在微信开发者工具项目列表通过 **小游戏项目导入** 打开 `build/wechat-qa/`，AppID 使用上面的真实值。当前 Nightly 首次 GUI 导入后，应退出整个工具再重开，使已登记项目同步到 CLI 缓存。不要把 `touristappid` 或临时小程序项目作为本轮有效导入步骤。重建前关闭对应项目，构建成功后再打开。

### 正式客户端构建

```bash
npm run build
APP_WX_APPID=wxec103651e807c540 \
APP_SERVER_URL=https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com \
APP_CLOUD_BASE=https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/ \
APP_CLOUD_ENV=lomo-wechat-d0gcakr952f0d90b8 \
APP_CLOUD_SERVICE=lomo-wechat \
npm run build:release
```

正式构建必须提供这 **5 项**非密钥配置；缺项、无效 AppID 或无效 HTTPS 地址会失败，仅设置 `APP_SERVER_URL` 不够。正式项目及其已有私人配置均强制开启域名校验，其他私人设置保留。客户端禁止注入 AppSecret/CAM 密钥。

正式包同样通过小游戏 GUI 导入，并保持 `urlCheck=true`。模板固定基础库 `3.16.2`；最终正式包为 3,187,979 字节（约 3.0403 MiB），离线验收包为 2,975,233 字节（约 2.8374 MiB）。新构建正式授权页实测 0 个错误、1 条警告，进入游戏后的云调用仍报 `85088`。当前需先解决该错误和合法域名拦截，再验收 `wx.login` → `code2Session`；公网 HTTP 200 只能证明当次公网可达。

### 服务端打包与运行

`npm run package:server` 生成 `build/cloudrun/`，包含锁定的运行依赖，打包不需要或嵌入密钥。正式运行必须从运行环境注入 `APP_WX_APPID`、`APP_WX_APPSECRET`、`APP_SECRET`，并设置 `APP_PERSISTENCE=cloudbase`、`APP_CLOUD_ENV`；缺失或无效时在监听前失败。数据库集合由 `APP_DB_COLLECTION` 指定，默认 `ape_game_state`；地域由 `APP_CLOUD_REGION` 指定，默认 `ap-shanghai`。需预建管理员专用集合、配置索引并验证运行身份的数据库读写权限；应用不自动创建生产集合或导入旧 JSON。

服务端配置变量是 `APP_PROFILE`，端口默认 `8787`；启用管理员接口另需管理员配置。本地 `qa:local` 仍明确使用内存替身。真实数据库验证限定在 `ape_qa_persistence` 合成测试集合，不能代替 Cloud Run 部署、真实玩家迁移或官方登录。实现、隔离测试及迁移要求见 [PERSISTENCE.md](docs/PERSISTENCE.md)，运行期配置与部署步骤见 [DEPLOYMENT.md](docs/DEPLOYMENT.md)；本轮未部署、未轮换历史凭据。

迁移还存在身份兼容缺口：新登录使用确定性 playerId，旧 JSON 使用随机 playerId，当前不会接受映射到不同 ID 的既有 identity。生产切换前须实现并验证既有 identity 兼容或全引用 ID 重写；仅把 JSON 拆成文档不能保留旧账号数据。

## 三大输入与证据

| 输入 | 位置 | 说明 |
|---|---|---|
| 原 APK | 仓库外（SHA-256 已记录于 docs/SOURCE_OF_TRUTH.md） | 360 加固（StubApp+libjiagu），业务 DEX 运行时解密 |
| 全量复刻包 | `evidence/full_clone/` | 680 路由 CSV、14,092 资源清单 CSV、玩法目录、公开证据 |
| clean-room 基线 | `evidence/cleanroom/` | 44 功能族注册表、兼容表、后端契约、launch 决策 |

## 目录结构

```
shared/src/       资产目录/账本/确定性RNG/RemoteConfig/协议/注册表类型（双端共用）
server/src/       参考服务端：app.ts（可移植核心，供 HTTP 与 Node standalone 验收）+ index.ts（HTTP 入口）
  server/src/games/   22 个玩法的服务端权威实现（大逃杀/地下城/竞技场/矿场/宇宙/小游戏矩阵/卡牌…）
client/src/       小游戏客户端：引擎壳/路由/立即模式UI/平台适配/网络/音频
  client/src/features/ 48 功能族页面（与 data.gen FEATURES 一一对应）
tools/src/        数据与资源管线 / build_wechat / qa_local / package_server / verify
data/             routes.json(680) assets.json(14092) features.json economy.json screens.json…
configs/          full-clone.json / wechat-release.json / tuning-baseline.json（OWNED_LAUNCH_DEFAULTS，版本化自有参数）
tests/            核心/玩法/安全/平台/生命周期/布局/战斗/资源/打包回归与原生 Canvas 检查
docs/             交接与审计文档（含 ROUTE_PARITY_680 / TEST_REPORT 自动生成）
evidence/         full_clone + cleanroom 原包归档 + apk_assets_sample（管线真实提取样本）
build/            正式客户端 / 隔离 QA 包 / verify 离线验收包 / cloudrun 服务端包
```

## 双运行配置（核心架构原则）

同一代码库，两层配置：

- **FULL CLONE**（`configs/full-clone.json`）：用于内部研究与功能对照，保留完整功能配置和经济模型；涉及真钱类语义的界面绑定沙盒桥（TEST_CREDIT，永不兑付）。680 路由映射与自动测试不证明原产品逐屏 1:1 复刻，研究配置禁止对外分发或提审。
- **WECHAT RELEASE**（`configs/wechat-release.json`）：现金钱包/提现/下注/付费随机/竞拍/P2P 交易/代理/现金红包在 **客户端 Feature Flag + 服务端 API 拦截 + 配置锁定** 三层关闭；下注房间→门票房间、现金奖池→赛季积分、矿石交易→NPC 兑换。tests/release_safety.ts 自动断言。

数值治理：无法从加固 APK 静态证明的原服数值不再作为运行时缺口；项目使用已校验、版本化的 `OWNED_LAUNCH_DEFAULTS` 自有运营参数，并通过签名 RemoteConfig 灰度调优。原服不可验证性和证据边界记录于 `docs/KNOWN_DIFFERENCES.md`。

`npm run build:wechat` 是双配置构建工具，包含正式发布配置校验，不能在只提供服务器地址时使用，也不等同于本地交互 QA。路由与数据维护可分别运行 `npm run parity`、`npm run gen:data` 和 `npm run gen:assets`。历史研究或资源迁移记录不替代当前素材权利链、正式网络、完整视觉设计与真机验收。

## 文档索引

当前操作与验收优先查看 [QA_HANDOFF.md](docs/QA_HANDOFF.md)、[QA_RECHECK_2026-09-06.md](docs/QA_RECHECK_2026-09-06.md)、[TEST_REPORT.md](docs/TEST_REPORT.md)、[PERSISTENCE.md](docs/PERSISTENCE.md)、[DEPLOYMENT.md](docs/DEPLOYMENT.md) 和 [EXTERNAL_BLOCKERS.md](docs/EXTERNAL_BLOCKERS.md)。

历史与架构材料：SOURCE_OF_TRUTH / ARCHITECTURE / IMPLEMENTATION_STATUS / ROUTE_PARITY_680 / FEATURE_PARITY / ASSET_MIGRATION / ECONOMY_MODEL / BACKEND_API / GAMEPLAY_RULES / WECHAT_ADAPTATION / PERFORMANCE_REPORT / COMPLIANCE_CURRENT / FINAL_LAUNCH_DECISION / KNOWN_DIFFERENCES / TECH_STACK_DECISION / PRIVACY_DATA_MAP（均在 `docs/`）。较早的“完成”或“通过”表述须按当前交接记录核对证明范围。
