# DEPLOYMENT（微信小游戏构建、资源与服务端部署）

> 本工程使用自有 AppID、云环境、服务端与资源域名。研究归档中的原 App 域名、SDK、账号及素材权利信息不能作为上线配置或授权依据。
> 2026-09-06 的本地修复、隔离云数据库测试与云端正在运行的版本必须分开验收。当前工作区已加入持久化实现；**没有部署该修复包、迁移生产玩家数据或轮换线上密钥**。最新代码回归以 [TEST_REPORT.md](TEST_REPORT.md) 与 [QA_RECHECK_2026-09-06.md](QA_RECHECK_2026-09-06.md) 的时间和覆盖范围为准。

## 1. 当前环境与实测边界

| 项 | 当前配置 |
|---|---|
| 微信 AppID | `wxec103651e807c540` |
| CloudBase 环境 | `lomo-wechat-d0gcakr952f0d90b8`，上海 |
| CloudBase Run 服务 | `lomo-wechat` |
| 公网 API | `https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com` |
| 静态资源前缀 | `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/` |
| 正式客户端产物 | `build/wechat-release/` |
| 离线验收产物 | `build/verify/wechat-full-clone/`、`build/verify/wechat-release/` |
| 服务端部署源 | `build/cloudrun/` |
| 真实持久化测试集合 | `ape_qa_persistence`，管理员专用、合成身份；与生产玩家分离 |
| 生产数据库集合配置 | `APP_DB_COLLECTION`，默认 `ape_game_state`；不代表已创建、迁移或部署 |

当前证据不足以认定微信联网或正式登录通过：

- 公网 `curl` 请求 `/v1/config/bootstrap` 返回过 200；这仅证明相应公网探测可达。
- 微信开发者工具通过 `wx.cloud.callContainer` 请求同一环境、服务的 `/v1/config/bootstrap` 返回错误码 **85088**；客户端启动的 bootstrap 阶段也出现同码。具体原因仍待核验，应保留完整 `errMsg`、请求环境、服务名、时间及云端日志，不根据错误码猜测权限或服务状态。
- 开发者工具中使用 `wx.request` 请求公网 API，被 request 合法域名校验拦截；当时 Console 列出的合法域名只有 `https://tcb-api.tencentcloudapi.com`。需要在目标 AppID 的平台配置中核对所用 API/CDN 域名，再以 `urlCheck=true` 实测。
- 本地 `.env.cloud` 检查未发现 `APP_WX_APPSECRET`。这不证明云端没有该变量；云端运行期配置和真实 `wx.login` → `code2Session` 尚未完成验收。
- 本地修复后的服务端会在正式启动时拒绝缺失或无效的凭据。应完成运行期配置并验证后才部署，否则新实例会启动失败。

## 2. 本地验证与正式客户端构建

使用 Node.js 22。仓库根目录安装依赖后执行：

```bash
npm ci
npm test
npm run verify
```

`npm test` 会先编译；`verify` 使用隔离的 `build/verify/` 目录和离线替身，检查路由、资源、玩法、客户端、认证、服务端打包及包体。离线通过不代表微信云调用、正式登录、后台域名、持久化或平台审核通过，`build/verify/` 产物也不能用于正式分发。

本轮最终回归为 `npm test` 16/16、`verify` 23/23（[TEST_REPORT.md](TEST_REPORT.md) 时间 `2026-09-06T11:45:07.028Z`）、原生 Canvas 6/6；运行依赖 `npm audit` 为 0 个已知漏洞。正式项目模板固定基础库 `3.16.2`；新构建正式授权页 0 个错误、1 条警告，进入后仍触发 85088，因此正式联机验收没有通过。

正式构建必须同时提供以下五项非密钥配置，缺项、无效 AppID 或非 HTTPS URL 会失败：

```bash
APP_WX_APPID=wxec103651e807c540 \
APP_SERVER_URL=https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com \
APP_CLOUD_BASE=https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/ \
APP_CLOUD_ENV=lomo-wechat-d0gcakr952f0d90b8 \
APP_CLOUD_SERVICE=lomo-wechat \
npm run build:release
```

输出 `build/wechat-release/`，正式 `project.config.json` 自动设置真实 AppID 和 `setting.urlCheck=true`。AppSecret、CAM 密钥、签名密钥和管理员令牌均不得注入客户端。不要只提供 AppID 重建，也不要手改生成文件充当配置修复。

当前 CloudBase 配置下，客户端初始化 `wx.cloud.init({ env })`，通过 `wx.cloud.callContainer` 请求相对 API 路径，并携带 `X-WX-SERVICE: lomo-wechat`。公网 API 探测、微信云调用和 CDN 下载是不同链路，需分别验收。

开发者工具导入已有项目（需要已登录、真实 AppID 和开启服务端口）：

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project "$PWD/build/wechat-release"
```

如果工具出现历史 `uv_cwd`、`ENOENT` 或 `game.js is not defined`，先关闭该项目，再执行构建并重新打开；同时检查当前构建日志，不能只清 Console 后认定修复。

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli close --project "$PWD/build/wechat-release"
```

预览与真机验收应保持 `urlCheck=true`。不要通过关闭域名校验把联网失败改记为通过。

## 3. 完整资源上传与包体

资源上传源是仓库内完整的 **`game-assets/`**，远端前缀与 `APP_CLOUD_BASE` 一致。正式包的 `build/wechat-release/assets/game/` 只包含 boot pack 和本地音频；上传该子集会造成其余图集的远端 URL 缺文件。

在现有 CloudBase CLI 已认证且具有目标环境部署权限时执行：

```bash
export CLOUDBASE_ENV=lomo-wechat-d0gcakr952f0d90b8
npx -p @cloudbase/cli tcb hosting deploy "./game-assets" "v1/assets/game" -e "$CLOUDBASE_ENV"
```

完整上传保留 `game-assets/` 内相对路径，包含原始动画目录名中的双下划线。构建器仅将**包内**资源路径规范化，远端 URL 保持源目录结构；不要把生成的包内目录或包内 manifest 覆盖到 CDN 的完整源目录。

构建器维护两种 manifest：仓库 `game-assets/manifest.json` 保持本地源路径；包内 manifest 对 boot pack 使用规范化本地路径，对其余资源使用远端绝对 URL。当前客户端读取包内 manifest。

默认图像 boot pack 预算为 1,500,000 字节，优先保留 miner，再按剩余预算选取图集；音频另行保留。最终主包还包括代码、配置和 manifest，因此以构建日志与 `bundle-size-gate` 的实际文件字节总量为准，项目门禁为 4 MiB。`du -sh` 的磁盘块分配大小不能替代该口径。

本轮最终正式包为 3,187,979 字节（约 3.0403 MiB）；隔离离线包为 2,975,233 字节（约 2.8374 MiB）。两者使用的网络配置不同，不能将离线包体或离线冒烟结果混记为正式包运行结果。

上传后至少验证一个 boot pack 以外的图集和代表帧的远端 URL、状态码、媒体内容，并在微信运行时验证下载/渲染。历史 CDN 200 记录不证明完整资源已覆盖。

## 4. 服务端打包与运行期配置

```bash
npm run build
npm run package:server
```

`package:server` 把 Dockerfile、运行期 `package.json` / `package-lock.json`、`dist/server`、`dist/shared` 和 `configs` 组装为 `build/cloudrun/`。镜像通过 `npm ci --omit=dev --ignore-scripts` 安装锁定的 CloudBase 等运行依赖。**构建机不需要运行期凭据**；打包器不读取、生成或修改 `.env.cloud`，不把 `APP_SECRET`、`APP_ADMIN_TOKEN`、`APP_WX_APPSECRET` 写入 Dockerfile 或镜像。不要通过 Docker `ARG`、`ENV` 或源代码补回密钥。

在云托管控制台配置目标服务的运行期环境变量，或使用平台提供的受控密钥注入能力：

| 变量 | 要求 |
|---|---|
| `APP_SECRET` | 签名根密钥，至少 32 个字符，使用安全随机值；签发的 token 有效期为 7 天。轮换会使已有 token 失效，应制定迁移与回滚安排。 |
| `APP_WX_APPID` | 与小游戏一致的真实 AppID，格式为 `wx` 后接 16 位十六进制字符。 |
| `APP_WX_APPSECRET` | 从该 AppID 的微信后台取得，启动检查要求至少 32 个字符；不得用 CAM SecretKey 替代。 |
| `APP_ALLOW_ADMIN` | 默认 `0`。只有确需管理接口时设为 `1`。 |
| `APP_ADMIN_TOKEN` | `APP_ALLOW_ADMIN=1` 时必填，至少 32 个字符；调用管理接口通过 `x-admin-token` 传入。 |
| `NODE_ENV` / `APP_PROFILE` | 正式服务为 `production` / `wechat-release`。 |
| `PORT` | 云托管容器使用 `8080`，与服务暴露端口一致。 |
| `APP_PERSISTENCE` | 正式入口强制为 `cloudbase`；镜像默认该值。不能在正式服务中回退为内存或 JSON。 |
| `APP_CLOUD_ENV` | 目标数据库环境，本项目为 `lomo-wechat-d0gcakr952f0d90b8`；正式启动必填。 |
| `APP_DB_COLLECTION` | 目标 NoSQL 集合，默认 `ape_game_state`；需预建、禁止客户端直接读写并配置查询索引。不要把 `ape_qa_persistence` 测试集合当生产集合。 |
| `APP_CLOUD_REGION` | 数据库地域，默认 `ap-shanghai`；必须与目标环境一致。 |
| 数据库运行身份 | 使用 Cloud Run 运行身份或 SDK 支持的运行期临时凭据，并在目标集合实际验证读写。Node SDK 使用 `TENCENTCLOUD_SECRETID` / `TENCENTCLOUD_SECRETKEY` / `TENCENTCLOUD_SESSIONTOKEN`；本地管理文件的带下划线别名不会被服务端入口自动加载。不要在客户端注入这些变量。 |
| `APP_DATA_DIR` | 仅非正式、本地开发路径的可选 JSON 快照目录。CloudBase 持久化路径不读取该目录，也不自动迁移其中的数据；当前镜像不再默认设置它。 |

正式入口在 `APP_PROFILE=wechat-release` 或 `NODE_ENV=production` 时校验配置，缺失或无效即在监听端口前退出；日志仅列配置项名称。持久化初始化还执行集合查询，可达性失败会阻止监听；该查询不替代权限、索引、写入或备份恢复验收。正式生产环境禁止 synthetic auth。测试专用适配器和离线进程内登录不能用于正式部署。

自有服务器部署也使用上述运行期凭据，先通过服务管理器安全注入，再启动：

```bash
NODE_ENV=production APP_PROFILE=wechat-release APP_PERSISTENCE=cloudbase \
APP_CLOUD_ENV=lomo-wechat-d0gcakr952f0d90b8 APP_DB_COLLECTION=ape_game_state \
APP_CLOUD_REGION=ap-shanghai PORT=8787 \
node dist/server/src/index.js
```

自托管需配置 TLS、数据库运行身份、进程守护和访问控制。仅挂载 JSON 目录不能满足当前正式持久化配置。当前正式客户端构建以 CloudBase 为目标，改用其他网络后端需要配套修改客户端传输配置并重新验证。

### 4.1 数据库准备与迁移

持久化层使用管理员专用 NoSQL 集合，按玩家核心、钱包、功能分片、账本、会话及幂等回执等文档组织数据。事务成功提交后才返回成功；数据库不可用时不降级成内存成功。SDK 显式选择 `CLOUD_API`，并由应用层处理已实证的事务冲突错误包装及有限重试。字段、索引、事务预算和测试覆盖以 [PERSISTENCE.md](PERSISTENCE.md) 为准。

隔离 SDK 探针见 [PERSISTENCE_CLOUD_PROBE_2026-09-06.md](PERSISTENCE_CLOUD_PROBE_2026-09-06.md)；应用集成验证输出 `build/qa-evidence/persistence-cloud-integration.json`。它们使用 `ape_qa_persistence` 合成数据，证明范围须按输出中的检查项目判断。SDK 原生自动重试探针保留已知失败，不可误记为应用适配器自动失败或全部持久化通过。

最终应用隔离云集成 7 组通过，575 个逻辑文档操作，60.032 秒；60 个自建测试文档已清理，待清理列表为空。隔离集合的 `ADMINONLY` 及 5 个查询索引已设置并回读；这些状态不自动适用于生产集合和 Cloud Run 运行身份。

生产切换前须预建目标集合并禁止客户端直接读写、配置所需索引、验证运行身份、备份旧数据，并完成旧 `store.json` 到新文档模型的迁移和逐玩家账本对账。当前没有完成生产迁移，也没有自动导入旧 JSON 的路径；直接切换到空集合会使旧玩家数据不可见。应安排停止旧写入、验证迁移、恢复演练及切流后的回退方案，不能删除旧数据后再验证。

当前新登录确定性计算 playerId，并拒绝 identity 映射到不同 ID；旧 JSON 的 playerId 为随机生成。因此迁移器仅拆分文档不够：必须先实现“读取并接受已验证既有 identity 映射”的兼容，或执行经过完整对账的全引用 ID 重写，覆盖钱包、库存、会话、邮件、历史及幂等证据。当前这两条生产身份迁移路径均未完成；旧合成身份不能直接绑定成正式 openId。

## 5. 云托管部署与验收

以下是完成运行期配置、目标环境权限检查、数据库准备、迁移和备份恢复验收后使用的操作命令；本轮未执行部署。控制台需先开通云托管资源，并检查目标服务的环境、AppID 关联及访问配置。

```bash
export CLOUDBASE_ENV=lomo-wechat-d0gcakr952f0d90b8
printf '\n' | npx -p @cloudbase/cli tcb cloudrun deploy -s lomo-wechat --port 8080 \
  --source build/cloudrun --wait --force -e "$CLOUDBASE_ENV"
```

该非交互写法采用现有 CLI 的默认灰度选择，成功后可能切换流量；部署前检查所用 CLI 版本与部署计划。上述命令没有传运行密钥，运行期变量须在云托管侧先配置并确认用于新版本。CAM 身份用于管理云资源，微信 AppSecret 用于 `code2Session`，两者不可互换。

公网基础探测：

```bash
curl --fail --silent --show-error --max-time 15 \
  https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com/v1/config/bootstrap
```

微信开发者工具 Console 的云调用探测：

```js
wx.cloud.callContainer({
  config: { env: 'lomo-wechat-d0gcakr952f0d90b8' },
  path: '/v1/config/bootstrap',
  header: { 'X-WX-SERVICE': 'lomo-wechat' },
  method: 'GET',
  success: console.log,
  fail: console.error
});
```

只有云调用成功且返回 `profile=wechat-release` 后，继续使用新取得的 `wx.login` code 验证真实登录、player state、退出再进及业务链路。不要把 code、返回 token 或 AppSecret 复制到公开报告；无效 code 必须无法创建身份。服务端官方交换设有 5 秒超时，失败返回通用 `WECHAT_AUTH_FAILED`，具体接口约束见 `BACKEND_API.md`。

目标 AppID 的开发管理 → 开发设置 → 服务器域名，需要根据实际调用 API 配齐合法域名：公网 HTTP 请求检查 request 域名，资源下载检查 downloadFile 等对应域名；uploadFile/socket 仅在业务实际使用时配置。当前涉及的域名为：

```text
https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com
https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com
```

域名列表齐全不能替代 `callContainer` 的环境/服务访问验证，85088 与公网域名拦截需分别复查。最终保留 `urlCheck=true` 的开发者工具和真机结果。

## 6. 仍需处理的发布风险

- **玩家数据持久化**：当前工作区已实现 CloudBase 事务持久化并增加隔离真实云验收工具；线上旧版本未升级，生产集合配置、旧玩家迁移、备份恢复及实际 Cloud Run 多副本验收未完成。不能根据本地或隔离测试关闭运营/收费阻断。
- **密钥历史暴露**：本轮清除了本地部署产物中的注入方式，不代表历史镜像、缓存或已暴露凭据已失效。运行期迁移和密钥轮换需确认云端配置、依赖与回滚，本轮未执行。
- **登录限流范围**：当前每进程总量 300 次/分钟、每 socket peer 30 次/分钟，不信任 `X-Forwarded-For`。反向代理用户会共享 peer bucket，多副本也不共享计数；需在可信网关配置全局限流，并根据流量验证阈值。
- **正式联网与认证**：85088、合法域名缺项及本地缺 AppSecret 的问题仍需平台配置与真实 code 验收。公网 200、离线全绿和 UI 展示均不能关闭这些风险。
- **内容与合规**：`wechat-release` 的现金能力关闭不替代美术权利链、隐私、实名/防沉迷、内容安全及平台审核。相关边界见 `COMPLIANCE_CURRENT.md`、`PRIVACY_DATA_MAP.md`、`EXTERNAL_BLOCKERS.md`；不要复用研究归档中的原版基础设施。

官方接口资料：<https://developers.weixin.qq.com/minigame/dev/wxcloud/>。
