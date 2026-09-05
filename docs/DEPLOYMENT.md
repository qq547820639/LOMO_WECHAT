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
| 数值配置 | `configs/tuning-baseline.json` + RemoteConfig | 全部 INFERRED 数值由**自有运营配置**覆盖下发，与原服数值无关 |
| 资源 | 478 张图集 sheet（tools/bake/out/atlas/） | 上传**自有 CDN/OSS**，manifest.base 指向自有域名 |

## 2. 服务端部署（最小步骤）

```bash
# 服务器上（Node ≥ 18）
npm install && npm run build
APP_PROFILE=wechat-release APP_SECRET=<自生成随机密钥> APP_DATA_DIR=/data/lomo PORT=8787 \
  node dist/server/src/index.js
```

- `APP_SECRET`：RemoteConfig 签名与 token HMAC 的根密钥，**必须换成自己的随机值**（默认 dev 密钥仅本地）。
- `APP_DATA_DIR`：JSON 快照持久化目录。生产建议换数据库（Ledger/Store 接口边界清晰，见 ARCHITECTURE.md）。
- `APP_PROFILE=wechat-release`：正式发布档；full-clone 档仅内网研究环境使用。
- 反向代理加 TLS（微信要求 HTTPS/WSS 域名白名单）+ 进程守护（pm2/systemd）。

## 3. 客户端指向自有域名

```bash
APP_SERVER_URL=https://api.your-domain.com npm run build:wechat
# 构建器把 serverUrl 注入 game.js → 客户端 HttpTransport(wx.request) 走自有域名；
# 不设 APP_SERVER_URL 时为进程内单机模式（演示/无头测试用）。
```

微信 mp 后台 → 开发管理 → 服务器域名，将自有域名加入 request/socket 合法域名白名单。

## 4. 资源上自有 CDN

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
