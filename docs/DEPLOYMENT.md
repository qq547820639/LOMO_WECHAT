# DEPLOYMENT（自有域名与服务器部署指南）

> 定位声明：本工程是对用户提供的 APK 的**逆向研究**产物（clean-room 重写，未复制原版代码/美术/品牌）。
> 后续部署使用**自己的域名与服务器**，不接触、不复用原 App 的任何基础设施
> （已确证的原版基础设施——网易云信 IM/七鱼客服域名等——仅作研究证据记录，见 RUNTIME_EVIDENCE.md §3）。

## 1. 架构对应关系

| 层 | 本工程交付物 | 部署动作 |
|---|---|---|
| 小游戏客户端 | `build/wechat-release/`（或 full-clone） | 导入微信开发者工具，替换 `project.config.json` 的 appid 为**自有 AppID** |
| 参考服务端 | `server/`（node:http，零运行时依赖） | 部署到自有服务器，客户端经 `APP_SERVER_URL` 指向自有域名 |
| 通信协议 | `docs/BACKEND_API.md`（全部 /v1/* 路由） | 协议即文档；自有实现只需兼容同一路由 |
| 数值配置 | `configs/tuning-baseline.json` + RemoteConfig | `OWNED_LAUNCH_DEFAULTS` 已校验并版本化；运营通过签名配置灰度调优，与原服数值无关 |
| 资源 | 478 张图集 sheet（tools/bake/out/atlas/） | 上传**自有 CDN/OSS**，manifest.base 指向自有域名 |

## 2. 服务端部署（最小步骤）

```bash
# 服务器上（Node ≥ 18）
npm install && npm run build
APP_PROFILE=wechat-release APP_SECRET=<自生成随机密钥> APP_DATA_DIR=/data/lomo PORT=8787 \
  node dist/server/src/index.js
```

- `APP_SECRET`：RemoteConfig 签名与 token HMAC 的根密钥，**必须换成自己的随机值**（默认 dev 密钥仅本地）。令牌有效期为 7 天。
- `APP_ALLOW_ADMIN=1` 仅开启管理接口路由；执行 `/v1/admin/reset` 还必须设置 `APP_ADMIN_TOKEN`，并通过 `x-admin-token` 请求头传入，避免仅凭环境开关即可清空数据。
- `APP_DATA_DIR`：JSON 快照持久化目录。生产建议换数据库（Ledger/Store 接口边界清晰，见 ARCHITECTURE.md）。
- `APP_PROFILE=wechat-release`：正式发布档；full-clone 档仅内网研究环境使用。
- 反向代理加 TLS（微信要求 HTTPS/WSS 域名白名单）+ 进程守护（pm2/systemd）。

## 3. 客户端指向自有域名

```bash
APP_SERVER_URL=https://api.your-domain.com npm run build:wechat
# 构建器把 serverUrl 注入 game.js → 客户端 HttpTransport(wx.request) 走自有域名；
# 微信产物未注入 APP_SERVER_URL 会在启动页明确报错；进程内模式仅供 Node/验收 mock。
```

微信 mp 后台 → 开发管理 → 服务器域名，将自有域名加入 request/socket 合法域名白名单。

## 4. 资源策略（全部自有，已入库）

包内美术全部为**自制资产**（`game-assets/`：矿工 8 帧 + fx_launch 6 帧 + 209 槽位动画 1672 帧，均由 `tools/src/gen_placeholder_art.ts` 与 `gen_slot_animations.ts` 生成，已提交仓库）。重建：`npm run gen:art && npm run build:wechat`。
如单包超微信主包限制，将 `assets/game/` 按组上自有 CDN（manifest.base 切换）；209 槽位动画为自制内容，上 CDN 无权利障碍。

## 5. 资源上自有 CDN

```bash
# 478 张 sheet（tools/bake/out/atlas/<group>/sheet_NNN.webp + *.meta.partNN.json）
# 按内容哈希上传自有 CDN/OSS，保持 <group>/ 目录结构
# 然后二选一：
#  A. 包内 assets/game/manifest.json 的 base 改为 https://cdn.your-domain.com/atlas/
#  B. AssetManager.loadManifest('https://cdn.your-domain.com/atlas/manifest.json') 走远端 manifest
```

209 个超大件（视频桶）需 ffmpeg 转 mp4 后同路径上 CDN（RUNTIME_REQUIRED，见 EXTERNAL_BLOCKERS）。

## 5. 隔离与合规红线（部署必读）

1. **品牌隔离（已执行，2026-09-06 脱敏审计 BRAND_AUDIT.md）**：包内原版品牌字符串已全部替换为自有占位品牌
   **《猿岛 ApeIsland》**（检索确认无同名小游戏）；**正式部署换牌只改 `shared/src/brand.ts` 一个文件**
   （appName/标题/分享/邮件/公告集中于此），改后 `npm run build:wechat` 重出双包。原版品牌信息仅存于
   研究归档层（RUNTIME_EVIDENCE.md 等，带隔离声明），不进任何产物。
2. **基础设施隔离**：网易云信 IM/七鱼客服等域名与 SDK 不复用（微信小游戏侧本就不可用）；
   IM/客服用微信官方能力替代（WECHAT_ADAPTATION.md）。
3. **资产版权**：APK 提取素材仅存映射与样本（evidence/）；正式包内当前为程序化占位与自有烘焙图集，
   上线前需确认美术资产的合法权利链（COMPLIANCE_CURRENT.md 规范 1.3 抄袭/侵权红线）。
4. **现金合规**：wechat-release 档已四层关闭现金类能力（tests/release_safety.ts 断言）；
   如后续自有业务需要虚拟支付，按 COMPLIANCE_CURRENT.md 的支付规则流程另行评估。
5. **数据合规**：自有服务器收集的数据按 PRIVACY_DATA_MAP.md 最小必要口径执行。

## 云开发（CloudBase）资源分载 —— 2026-09-06 已实测打通

**背景**：主包曾达 25MB（其中 23MB 为自制动画帧），远超微信小游戏 **主包 ≤4MB** 红线，上传必被拒。
现已改为「包内 boot pack + 云开发静态托管 CDN」的资源分载形态。

### 环境

| 项 | 值 |
|---|---|
| 环境 ID | `lomo-wechat-d0gcakr952f0d90b8`（个人版 / ap-shanghai） |
| 静态托管（资源 CDN）域 | `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com` |
| 云托管（服务端容器）域 | `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.ap-shanghai.app.tcloudbase.com` |
| 资源路径前缀 | `v1/assets/game/`（版本号前缀，便于整版回滚） |

### 上传命令（凭据放本地 `.env.cloud`，绝不入库）

```bash
set -a; . ./.env.cloud; set +a
npx -p @cloudbase/cli tcb login --apiKeyId "$TENCENTCLOUD_SECRET_ID" --apiKey "$TENCENTCLOUD_SECRET_KEY"
npx -p @cloudbase/cli tcb hosting deploy "build/wechat-release/assets/game" "v1/assets/game" -e "$CLOUDBASE_ENV"
```

### 构建接入

```bash
APP_CLOUD_BASE="https://<静态托管域>/v1/assets/game/" \
APP_CLOUD_ENV="lomo-wechat-d0gcakr952f0d90b8" \
node dist/tools/src/build_wechat.js --profile wechat-release
```

- 主包保留 **boot pack**（默认 miner + 按 id 序填充至 1.5MB 预算，可用 `bootBudget` 调整），首屏即时可见；
- 其余图集帧 `file` 改写为远端绝对 URL（`AssetManager.url()` 对 http(s) 直连，不拼本地 base）；
- 仓库内 `game-assets/manifest.json` 始终写**本地形态**，Node 验收不依赖网络；
- `verify` 新增 **`bundle-size-gate`** 步骤：主包 >4MB 直接判失败（防回归）。验收时未配置 `APP_CLOUD_BASE` 则用占位域名，同样按云形态构建。

### MP 后台白名单（上线前必填）

开发管理 → 开发设置 → 服务器域名，三处都加：

```
https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com
```

（后续若接入云托管服务端，同样把 `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.ap-shanghai.app.tcloudbase.com` 加入。）

### 成本提示

静态托管**不占用**对象存储的 5GB/3GB 免费额度，按 `容量 0.0043 元/(GB·天)` + `流量 0.21 元/GB` 计费：24MB 存储约 ¥0.0001/天，单用户全量下载 24MB 约 ¥0.005。小规模可忽略，放量后按实际流量评估。

### 客户端云初始化

```js
wx.cloud.init({ env: 'lomo-wechat-d0gcakr952f0d90b8' });
```

已由 `client/src/app/wx_entry.ts` 的 `initCloud()` 在**微信运行时**调用（env 由构建期 `APP_CLOUD_ENV` 注入，仅环境标识、无密钥）；Node 验收/mock 环境自动跳过。

## 云托管服务端（CloudBase Run）—— 2026-09-06 已上线

| 项 | 值 |
|---|---|
| 服务名 | `lomo-wechat`（容器服务，ap-shanghai） |
| 公网域名 | `https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com` |
| 容器端口 | 8080（`APP_PROFILE=wechat-release`、`APP_ALLOW_ADMIN=0`） |
| 镜像来源 | `build/cloudrun/`（Dockerfile 云端构建，源 304KB） |

### 部署流程（可复现）

```bash
npm run build                 # 编译 dist（服务端 + 共享）
npm run package:server        # 组装 build/cloudrun（Dockerfile + dist + configs，注入密钥）
set -a; . ./.env.cloud; set +a
printf '\n' | npx -p @cloudbase/cli tcb cloudrun deploy -s lomo-wechat --port 8080 \
  --source build/cloudrun --wait --force -e "$CLOUDBASE_ENV"
```

注意两点（踩过的坑）：

1. **云托管需先在控制台开通资源**，否则 CLI 报 `云托管资源未开通`（与套餐是否含该能力无关）；
2. `cloudrun deploy` 会交互式询问「是否启用灰度部署」——非交互环境用 `printf '\n' | ...` 选默认 No（发布成功后自动切流）。

### 环境变量与密钥

CLI 的 `cloudrun deploy` **不支持注入环境变量**，当前通过 Dockerfile `ENV` 提供：

- 非密钥：`NODE_ENV / PORT=8080 / APP_PROFILE=wechat-release / APP_DATA_DIR=/app/data / APP_ALLOW_ADMIN=0`
- 密钥：`APP_SECRET`、`APP_ADMIN_TOKEN` 由 `package:server` 生成并写入本地 `.env.cloud` 后复用（**复用很关键**：每次换密钥会作废所有已登录用户的 token），产物 Dockerfile 中注入；
- 生产建议：在云托管控制台用环境变量覆盖（控制台值优先于镜像 ENV），镜像内密钥视为可泄露处理并定期轮换。

### 上线自检（已实测）

| 接口 | 期望 | 实测 |
|---|---|---|
| `GET /v1/config/bootstrap` | 200，profile=wechat-release | ✅ `OWNED_LAUNCH_DEFAULTS`（自有默认值，非原服数据） |
| `POST /v1/auth/wechat` | 200，返回 token/playerId/防沉迷 | ✅ |
| `POST /v1/admin/reset` | 403 FEATURE_DISABLED | ✅（管理端已关闭） |

### MP 后台白名单（两套域名都要加）

```
https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com        （资源 CDN）
https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com             （服务端 API）
```

request / uploadFile / downloadFile 三处均需填写；真机（非调试模式）不填会被拦截。

### 体积口径说明

`verify` 的 `bundle-size-gate` 与构建日志按**文件实际字节**统计（当前主包 **2.48MB / 1535 文件**，红线 4MB）。
`du -sh` 显示 7MB 是磁盘块分配（大量小帧文件每文件占 4KB），**不是**微信代码包计量口径，勿据此判断超限。

### 已知限制（收费前必须解决）

容器文件系统为临时存储：实例重启/重新部署会丢失 `store.json` 与内存中的玩家进度。
要承载真实付费用户，必须改为外部持久化（云数据库 / 云托管 MySQL / Redis），否则会出现付费后丢档。
