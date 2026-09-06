# QA 交接手册：猿岛 ApeIsland 微信小游戏

> 收尾状态（2026-09-07）：Deploy 017 已上线 CloudRun 并承载 100% 流量；公网 health/bootstrap 为 200，伪造 code 返回 502 且无 token。生产集合为空，真实微信环境关联、登录、广告回执和真机回归仍未完成。

> 最新线上版本已推进至 Deploy 017，状态 `normal`、流量 100%；上条 Deploy 016 为历史记录。

> 更新：2026-09-06。本手册以当前工作区修复后的代码为准；Git HEAD 为 `5bf2381`，本轮修复尚未提交。旧交接中的“已就绪、直接登录即可测试”不再作为验收结论。
>
> 当前结论：最终本地测试 18/18、verify 全步骤通过、Canvas 6/6，隔离真实数据库应用集成和广告凭证重启回归通过。服务端修复已部署为 Deploy 017；正式微信环境、官方登录、真实广告回执、生产迁移和完整视觉验收尚未通过，不能据此认定具备正式运营条件。

> 平台动作：2026-09-07 使用微信开发者工具 CLI 将 `build/wechat-release/` 以版本 `1.0.1` 上传成功（CLI 返回 `✔ upload`，总包 3,063,784 字节）。这代表上传请求完成，不代表平台审核、体验版真机验证或正式发布完成。

## 1. 环境与产物

| 项目 | 当前值 |
|---|---|
| 仓库目录 | `/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION` |
| Git 仓库 | `github.com/qq547820639/LOMO_WECHAT`，HEAD `5bf2381` 加工作区修复 |
| 微信 AppID | `wxec103651e807c540` |
| CloudBase 环境 | `lomo-wechat-d0gcakr952f0d90b8`，上海 |
| CloudBase Run 服务 | `lomo-wechat` |
| 公网 API（当前） | `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.ap-shanghai.app.tcloudbase.com`（CBR 根路由 `/`，已启用路径透传） |
| 旧 CloudRun 默认域（历史/备用） | `https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com` |
| CDN 前缀 | `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/` |
| 正式客户端 | `build/wechat-release/`，`urlCheck=true`，本轮 **3,187,979 字节 / 3.0403 MiB**，门禁为 4 MiB |
| 本地交互 QA 包 | `build/wechat-qa/`，回环服务、合成身份、内存进度、`urlCheck=false` |
| 自动验收产物 | `build/verify/wechat-full-clone/`、`build/verify/wechat-release/`，离线替身配置，不能分发 |
| 服务端打包目录 | `build/cloudrun/`；Deploy 017 已部署，状态 `normal`、流量 100% |
| 隔离真实数据库测试 | `ape_qa_persistence`，管理员专用、合成身份，不是生产玩家集合 |
| 生产数据库配置 | `APP_PERSISTENCE=cloudbase`、`APP_CLOUD_ENV`；`APP_DB_COLLECTION` 默认 `ape_game_state`，`APP_CLOUD_REGION` 默认 `ap-shanghai`；不代表生产集合已就绪 |
| 工具环境 | macOS，微信开发者工具 `2.02.2609032 Nightly`，模板固定基础库 `3.16.2`；后续测试记录实际版本 |
| 凭据 | `.env.cloud` 是本地忽略文件，权限 600；历史 CAM 凭据待轮换。不要复制内容进报告、客户端或镜像 |

## 2. 已验证与未验证的边界

| 检查 | 当前结果 | 证明范围 |
|---|---|---|
| `npm test` | **18/18 通过** | 包含广告状态机、失败复活、首页广告入口、持久化重启、幂等和客户端回归；最新细节见 [TEST_REPORT.md](TEST_REPORT.md) |
| `npm run verify` | **全步骤通过** | 覆盖 680/680 路由、14,092 资源、6,004 帧、双包构建与冒烟；最新细节见 [TEST_REPORT.md](TEST_REPORT.md) |
| 真实 Chrome Canvas | **6/6 场景通过** | DPR 1/2/3 × 有/无安全区，字体、路径、圆角、测量和点击对齐；不等于全面视觉验收 |
| 运行依赖 `npm audit --omit=dev` | **5 个传递漏洞（4 high、1 moderate）** | 涉及 CloudBase SDK/axios/lodash；需单独升级验证，当前未强制改动依赖 |
| 正式客户端构建 | 通过，**3,187,979 字节 / 3.0403 MiB** | 非空配置、真实 AppID、HTTPS 校验、`urlCheck=true`、基础库 3.16.2、包体门禁 |
| 新构建正式授权页 | **0 个错误、1 条基础库提示** | 正式包已导入；真实微信联机仍需在目标环境复测 |
| 公网 shell 探测 | 新域名与 CloudRun 域名的 health/bootstrap 均 200；伪造 code 均返回 502 且无 token | 已通过公网 fail-closed 门禁；真实微信登录仍需复测 |
| `wx.cloud.callContainer` bootstrap | **失败：85088** | MCP 已确认服务/网关正常，但环境 `UserInfo.WxAppId` 为空，`touristappid` 无关联环境；需控制台完成真实 AppID 关联/环境共享后复测 |
| `wx.request` 公网 API | **被合法域名校验拦截** | 实测配置未包含该 API 域名，需在目标 AppID 平台配置中修正并复测 |
| `wx.login` → `code2Session` | **未通过验收** | 本地替身登录和公网 200 不能代替该链路 |
| 模拟器交互、截图 | 单独记录 | 见 [QA_RECHECK_2026-09-06.md](QA_RECHECK_2026-09-06.md)，按产物、地址和身份类型判断证据 |
| 隔离真实数据库应用集成 | **7 组通过** | `ape_qa_persistence` 合成身份，575 操作/60.032 秒，60 个文档已清理；SDK 原生重试探针保留失败，应用适配器与集成结果见 [PERSISTENCE.md](PERSISTENCE.md) |
| 真机、生产持久化、发布资质 | **未通过验收** | 数据库实现不代替生产迁移/对账、部署、备份恢复或实际 Cloud Run 多副本验收，仍为剩余风险，见 §5 |

本轮自动报告中的离线包为 2,975,233 字节（约 2.8374 MiB），与使用真实 CDN 配置的正式包不同。包体按实际文件字节总量计算，不能用 `du -sh` 的磁盘块分配结果替代。

## 3. 开始本地交互 QA

本流程在模拟器检查页面、触摸与玩法，资源使用 QA 包内本地副本。它不验证微信官方身份，也不保存跨服务重启的进度。

### 3.1 启动回环服务并构建 QA 包

在仓库根目录执行，并保持终端运行：

```bash
APP_WX_APPID=wxec103651e807c540 \
QA_PORT=8799 \
npm run qa:local
```

命令先编译，生成 `build/wechat-qa/`，再监听 `http://127.0.0.1:8799`。`QA_PORT` 缺省为 8798；示例显式使用 8799，避免与已运行的临时服务冲突。端口占用时改为空闲端口重跑，并重新导入这次生成的 QA 包。

- 服务只绑定本机回环地址，使用固定合成身份和内存 Store；停止/重启服务会重置进度。QA 包将游戏资源全部打包在本地，避免测试环境依赖 CDN（仅 QA 允许超过 4 MiB）。
- QA 包关闭域名校验，只用于本地模拟器；不能上传、预览分发或替代正式包。手机上的 `127.0.0.1` 不指向这台 Mac。
- 停止服务用 `Ctrl+C`。重新构建前先关闭开发者工具中的对应项目。

### 3.2 开发者工具 GUI 导入

1. 回到工具项目列表，选择**小游戏项目导入**，目录 `build/wechat-qa/`，AppID 使用 §1 的真实值。
2. 确认是小游戏模式，当前目录与 `project.config.json` 属于这次 QA 包，再编译。
3. 首屏为健康游戏忠告；按平台要求完成隐私授权，再点“进入游戏”。
4. 首页出现后确认请求指向 `127.0.0.1:8799`，把结果记为本地回环 QA。

当前 Nightly 在同一工具会话中新导入的项目可能未同步到 CLI 缓存。先通过 GUI 正式导入，再退出整个开发者工具并重开；本轮已验证冷启动后的 CLI 窗口具备 projectid、无 isTemp。首次导入仍使用 GUI，已登记项目可通过 GUI 项目列表或 CLI 打开。关闭项目可用 GUI 或现有 CLI：

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli close --project "$PWD/build/wechat-qa"
```

若出现 `uv_cwd`、`ENOENT` 或 `game.js is not defined`，先保留日志，关闭项目，确认构建成功后再通过 GUI 导入。只清 Console 不等于修复。构建器已保留输出根目录 inode，自动验收使用隔离目录；仍应避免同时重建正在运行的同一产物。

### 3.3 正式联机 QA

使用 `build/wechat-release/`，按小游戏 GUI 导入，保持 `urlCheck=true`。当前先处理并复测 85088 与合法域名拦截，再继续官方登录和业务链路。不要通过关闭校验把失败改记为通过。

分别验证 CloudBase 环境/服务访问、API 合法域名、CDN 下载、真实登录和玩家状态。运行期凭据及平台配置见 [DEPLOYMENT.md](DEPLOYMENT.md)；当前 Nightly 的项目打开方式以本手册的 GUI 步骤为准。

## 4. 测试清单

每项记录“通过 / 失败 / 未测”，标明**本地回环**、**隔离云数据库合成测试**或**正式微信/Cloud Run 环境**。除 §2 明确的自动结果外，下列手工项均需独立记录，不能默认勾选。

### P0 核心链路

- [ ] 合规门完整显示；阅读/授权页停留超过 20 秒不会触发启动失败。
- [ ] 隐私查询失败可重试，未完成所需授权无法进入，弹窗外点击不触发底层按钮。
- [ ] 登录、bootstrap、玩家状态完成；正式环境必须使用真实 `wx.login` code。
- [ ] 首页六个核心入口可见可点；五 Tab 可切换，长列表末项可滚动到达。
- [ ] 大逃杀：开始、加入、连续动作、出现胜负结果。
- [ ] 地下城：开砖、结算/领取；每日签到和奖励正常，重复领取被拒绝。
- [ ] 卡牌免费获取/合成显示结果；钱包/记录页余额与账本流水一致。

### P1 稳定性与恢复

- [ ] 后台切前台刷新状态，旧 token 失效时走可恢复的重新登录流程。
- [ ] 断网启动/登录超时显示通用错误和重试入口；恢复网络后可重试，玩家画面不显示 SDK 内部错误。
- [ ] 20 秒计时只覆盖活跃登录；成功/失败清理计时器，快速连点不重复发起登录。
- [ ] 旧登录或玩家请求晚到，不覆盖新的 token、身份或玩家状态。
- [ ] 快速连点游戏动作、签到和领奖，无重复结算、重复扣除或未处理异常。
- [ ] 回环服务重启的数据重置与数据库持久化分开记录；隔离测试中的新实例恢复、并发事务及幂等验收不能代替实际 Cloud Run 重启/多副本留存。
- [ ] 生产数据库迁移前后逐玩家钱包、账本、库存、会话一致；备份恢复及切流/回退路径独立验收，目前未完成。

### P2 画面、适配与资源

- [ ] 刘海、胶囊、底部手势区不遮挡内容；参考实测设备 390×844、DPR 3，有效胶囊顶部预留 84 CSS px，首帧空值回退 87 CSS px，底部 34 CSS px。
- [ ] 字体、面板、圆角、路径、图像与触摸一致；短屏合规按钮和核心入口可见可点。
- [ ] 返回/标题/等级与第二行余额不重叠；Tab 列表滚动不覆盖说明区或底部导航。
- [ ] 覆盖一个非 boot pack 图集、奖励动效和切页音效，分别检查包内与 CDN 资源。
- [ ] 15 个音频已补齐并打包；`audio/sfx/nav.mp3` 缺失不再是可忽略现象，复现时按新缺陷记录。
- [ ] 帧循环优先全局 `requestAnimationFrame`，故障后才降级；不再因查找 `wx.requestAnimationFrame` 固定降级。

本轮修复 Canvas 缩放、安全区、公共导航、首页层级和五 Tab 列表，**不代表全部玩法页面完成专业视觉重设计**。继续记录字号、密度、对比度、长文案溢出和布局问题；资源校验也不代替美术与音频权利链验收。

## 5. 已知问题与发布风险

| 编号 | 状态 | 处置与剩余要求 |
|---|---|---|
| K1 玩家持久化 | **实现及隔离集成通过，生产验收未完成，运营阻断** | 线上未部署；旧 JSON 随机 playerId 与新确定性身份不兼容，必须先补既有 identity 兼容或全引用 ID 重写，再做迁移对账。生产集合/运行身份、备份恢复及实际 Cloud Run 重启/多副本仍需验收 |
| K2 正式网络 | **部分收敛，仍阻断正式登录** | 公网 bootstrap 已 200；`callContainer` 仍 85088，需平台完成 AppID 关联/环境共享、合法域名配置，并在 `urlCheck=true` 下复测，不能以 shell 200 关闭 |
| K3 音频缺失 | **代码/产物修复，继续运行时回归** | 15 个音频已补齐并留在包内，nav 缺失不再是接受条件 |
| K4 错误 RAF 降级 | **已修复** | 全局 RAF、兼容分支与单次故障降级；原“wx.RAF 缺失属预期”说明废止 |
| K5 域名校验 | **正式构建门禁已修复** | 正式包自动 `urlCheck=true`；仅本地 QA 包明确关闭。K2 的平台配置仍未解决 |
| K6 历史凭据暴露 | **未解决，轮换未执行** | 需轮换历史 CAM 凭据并核对运行期依赖、历史镜像/缓存；忽略文件与权限 600 不会使旧凭据失效 |
| 服务端部署 | **本轮未部署** | 本地官方 code2Session、配置校验与凭据隔离修复不能假定在线上生效，需配置、部署和重新验收 |
| 官方身份与真机 | **未通过验收** | 需运行期 AppSecret、真实 code、预览/真机网络、前后台及弱网验证 |
| 发布资质与内容 | **未通过验收** | 出版/运营资质、素材权利链、隐私、实名/防沉迷、内容安全与平台审核需独立确认 |
| 广告、支付、完整视觉 | **广告协议已交付，生产广告/支付和视觉未完成验收** | 不能从当前 QA 成功推导真实广告回执、资质、内购或所有页面已完成设计验收 |

已有问题应关联编号并附新证据；“已知”不等于可忽略。发布边界同时参考 [EXTERNAL_BLOCKERS.md](EXTERNAL_BLOCKERS.md) 和 [COMPLIANCE_CURRENT.md](COMPLIANCE_CURRENT.md)。

## 6. 操作速查

均在仓库根目录运行；不要并发执行会写同一目录的构建命令。

### 自动回归

```bash
npm test
npm run verify
node tests/client_canvas_browser.mjs
```

原生 Canvas 回归需要 Chrome/Chromium；脚本检查常见安装路径，也可用 `CHROME_PATH` 指定。`verify` 使用离线配置，其报告是代码验收证据。

### 正式客户端

```bash
npm run build
APP_WX_APPID=wxec103651e807c540 \
APP_SERVER_URL=https://lomo-wechat-d0gcakr952f0d90b8-1301149345.ap-shanghai.app.tcloudbase.com \
APP_CLOUD_BASE=https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/ \
APP_CLOUD_ENV=lomo-wechat-d0gcakr952f0d90b8 \
APP_CLOUD_SERVICE=lomo-wechat \
npm run build:release
```

五项都是客户端非密钥标识；缺项、无效 AppID、非 HTTPS 配置会失败。不要注入 AppSecret/CAM 密钥，也不要手改产物绕过门禁。

### 服务端与 CDN

```bash
npm run package:server
```

打包**不需要构建机密钥**，不把密钥写进 Dockerfile/镜像。正式启动时注入 `APP_WX_APPID`、`APP_WX_APPSECRET`、`APP_SECRET`，设置 `APP_PERSISTENCE=cloudbase`、`APP_CLOUD_ENV` 并提供目标数据库运行身份；缺失、无效或集合初始查询失败会在监听前失败。`APP_DB_COLLECTION` 默认 `ape_game_state`，`APP_CLOUD_REGION` 默认 `ap-shanghai`；需预建集合、禁止客户端直接读写并配置索引。`APP_DATA_DIR` 只适用于非正式本地 JSON 路径，不是正式运行的替代方案。确需管理员接口时另配管理员凭据。

运行期配置、部署命令和迁移要求见 [DEPLOYMENT.md](DEPLOYMENT.md) 与 [PERSISTENCE.md](PERSISTENCE.md)。隔离数据库验证命令为 `node dist/tools/src/qa_persistence_integration.js`，会对固定测试集合做有限合成数据写入；先阅读其安全边界和当前报告，不将它并入每次离线回归。SDK 原生事务探针 `qa_persistence_cloud.js` 保留已知自动重试失败，不能用其退出码替代应用层验收。本轮未部署、未轮换，“打包成功”或“隔离数据库通过”不能写成“线上已修复”。

完整 CDN 上传源是仓库的 `game-assets/`：

```bash
npx -p @cloudbase/cli tcb hosting deploy ./game-assets v1/assets/game \
  -e lomo-wechat-d0gcakr952f0d90b8
```

`build/wechat-release/assets/game/` 只有 boot pack 与本地音频，不能作为完整上传源。包内规范化路径与远端源目录使用不同引用，不要拿包内 manifest 覆盖完整 CDN 源目录。执行云资源变更前按部署文档核对目标；本轮测试不代表已执行完整上传。

### 公网基础探测

```bash
curl --fail --silent --show-error --max-time 15 \
  https://lomo-wechat-d0gcakr952f0d90b8-1301149345.ap-shanghai.app.tcloudbase.com/v1/config/bootstrap
curl --fail --silent --show-error --max-time 15 --output /dev/null \
  https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/miner/f00.png
```

该结果仅记录公网可达性。微信联网以真实小游戏模式的云调用、资源请求和官方登录为准。接口资料：<https://developers.weixin.qq.com/minigame/dev/wxcloud/>。

## 7. 缺陷与复查记录

```text
【现象】玩家实际看到的行为
【基线】Git HEAD + 工作区状态 / 构建时间 / 产物绝对路径
【模式】正式微信/Cloud Run、隔离云数据库合成测试 or 本地回环QA；小游戏项目 or 临时模式
【复现】步骤、预期结果、实际结果
【设备】模拟器/真机、机型、微信/工具/基础库版本、屏幕与DPR
【网络】服务地址、方法与路径、状态码/errCode、时间
【日志】相关Console和服务日志；删除code、token、AppSecret、CAM凭据
【画面】截图或录屏，包含问题发生时的页面
【复查】修复项、回归命令/操作、结果、K编号与剩余限制
```

常规登录失败显示通用错误与重试入口，详细诊断保留在 Console/服务日志。阅读或授权不计入登录超时。修复后按同样模式复查通过才能关闭缺陷；自动测试、回环 UI、隔离真实数据库、正式云调用和真机结果分别归档。
