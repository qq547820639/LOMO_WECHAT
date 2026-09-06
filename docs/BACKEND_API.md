# BACKEND_API

> 参考服务端路由与安全边界（实现：`server/src/app.ts`、`server/src/persistence/`、`server/src/commerce.ts`；HTTP 入口：`server/src/index.ts`）。下述行为以当前工作区代码为准；已执行离线回归和隔离云事务测试，本轮未部署修复后的服务端，不能据此认定线上具备相同行为或真实微信登录已通过。

## 认证与配置

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /v1/auth/wechat `{code}` | 服务端通过微信 `code2Session` 取得 `openid`，建立 playerId+token；返回 antiAddiction、isNew，新玩家初始化资产并获得欢迎邮件。校验与失败状态见下文。 |
| GET | /v1/config/bootstrap | tuning + featurePolicies + release 配置 + configVersion；无需玩家 token。 |
| GET | /v1/compliance/status | 实名/未成年/可玩时段/剩余时长 |

### 正式运行期配置

`npm run package:server` 只组装代码、Dockerfile 与配置，不需要构建机提供密钥，不读取或生成 `.env.cloud`，不把密钥写入 Dockerfile 或镜像。运行期通过云托管环境配置注入：

- `APP_SECRET`：至少 32 个字符的安全随机签名密钥；开发默认值不能用于正式服务。
- `APP_WX_APPID`：与小游戏一致的真实 AppID，格式为 `wx` 后接 16 位十六进制字符。
- `APP_WX_APPSECRET`：该 AppID 的官方微信凭据，启动检查要求至少 32 个字符；不等同于 CAM SecretKey。
- `APP_ADMIN_TOKEN`：仅在 `APP_ALLOW_ADMIN=1` 时必填，至少 32 个字符。
- `APP_PERSISTENCE=cloudbase`、`APP_CLOUD_ENV`：正式入口必须使用外部数据库；集合默认 `ape_game_state`，地域默认 `ap-shanghai`。运行身份、集合权限和索引见 [PERSISTENCE.md](PERSISTENCE.md)。

`APP_PROFILE=wechat-release` 或 `NODE_ENV=production` 的服务入口在监听端口前校验这些配置，缺失或无效会退出。生产环境禁止 synthetic auth；显式离线适配器只用于测试。完整构建、CDN 上传和运行配置见 `DEPLOYMENT.md`。

### 微信登录合同

请求体的 `code` 必须是无首尾空白的非空字符串，最大 256 个字符，不会把数值或对象自动转成字符串。服务端向 `https://api.weixin.qq.com/sns/jscode2session` 发送 `appid`、`secret`、`js_code` 和 `grant_type=authorization_code`，总交换等待上限为 5 秒，并在超时时中止请求。

只有 `errcode` 缺省或为数值 `0`，且 `openid` 为无首尾空白的非空字符串、长度不超过 128，才会创建或读取玩家身份。返回的应用 token 使用 HMAC 验证，有效期 7 天；其余玩家接口使用 `Authorization: Bearer <token>`。

| HTTP 状态 | 错误码 | 含义 |
|---|---|---|
| 400 | `BAD_REQUEST` | `code` 类型、空白或长度不符合要求；不会调用微信交换。 |
| 429 | `RATE_LIMITED` | 登录前限流，包含非法输入尝试；稍后重试。 |
| 502 | `WECHAT_AUTH_FAILED` | 交换超时、HTTP 失败、回包无效或交换不可用；统一文案为「微信登录暂不可用，请稍后重试」，不向客户端暴露微信内部错误、凭据或请求 URL。 |

正式入口通常会先拦截缺失凭据；502 也覆盖应用适配器直接调用等绕过入口校验的失败情况。通用服务端异常返回 500 `SERVER_ERROR` 和固定提示，不把内部异常消息返回给玩家。code、token、AppSecret 不应写进公开 QA 报告。

### 微信网络验收状态（2026-09-06）

- 当前客户端 CloudBase 配置使用 `wx.cloud.callContainer`：环境 `lomo-wechat-d0gcakr952f0d90b8`、`X-WX-SERVICE: lomo-wechat`、相对 API 路径。实测 `/v1/config/bootstrap` 出现 **85088**，具体原因待平台配置与完整错误日志核验。
- 直接 `wx.request` 请求公网 API 被 request 合法域名校验拦截，当时开发者工具列出的合法域名只有 `https://tcb-api.tencentcloudapi.com`；需补齐并以 `urlCheck=true` 验证实际网络链路。
- 公网 `curl` bootstrap 返回过 200，不代表微信云调用成功；本地 `.env.cloud` 未发现 `APP_WX_APPSECRET`，不代表云端绝无配置。真实 `wx.login` → `code2Session`、一次性 code 行为及真实玩家身份尚待验收。

## 玩家 / 经济

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /v1/player/state | PlayerStateDto（余额/背包/等级/计数器） |
| GET | /v1/economy/ledger?limit&assetType&cursor | 倒序流水与 nextCursor；持久化 API 的 invariants.scope=page、ok=null，完整一致性由服务端 auditLedger 分页重算 |
| GET | /v1/history?featureId&limit&cursor | 记录中心与 nextCursor |

## 玩法会话（统一入口）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /v1/game/session/start `{featureId,idempotencyKey}` | 颁发 sessionId+seed（确定性 RNG 源）；持久化路径每玩家每玩法仅一个活动 slot |
| POST | /v1/game/action `{featureId,actionId,sessionId?,clientSeq?,payload,idempotencyKey?}` | 服务端权威结算；失败返回 `{ok:false,code:'BAD_REQUEST',message}`；重复 clientSeq 幂等重放 |
| POST | /v1/game/session/finish `{sessionId}` | 结束+replayToken（HMAC） |
| GET | /v1/game/state?featureId= | 玩法状态读取（大厅/对局/概率表等） |

### 持久化写请求合同

正式持久化 API 除微信登录外的 POST 请求必须携带 `idempotencyKey`，格式为 1–128 位字母、数字、`_ . : -`。会话动作可以用有效 `sessionId` 与整数 `clientSeq` 代替显式键；当前客户端自动生成并在自动/手动重试时复用原键、payload 和 clientSeq。调用方不能在丢响应后随意生成新键。

收据按玩家、路由和命令键隔离；相同键但指纹不同返回 `409 IDEMPOTENCY_CONFLICT`，缺少有效键返回 `400 IDEMPOTENCY_REQUIRED`。已提交的收据与钱包、账本和玩法变更同一事务持久化，响应只在提交后发出；进程重启或提交后丢响应时可重放原响应。未完成命令的时间与随机上下文由持久化意图固定。

| HTTP 状态 | 错误码 | 处理 |
|---|---|---|
| 401 | `AUTH_REQUIRED` | token 无效或数据库中玩家不存在，重新登录 |
| 409 | `COMMAND_EXPIRED` / `COMMAND_SUPERSEDED` | 未完成旧命令已过期或进度已推进，刷新状态后重新操作；响应 retryable=false |
| 503 | `PERSISTENCE_UNAVAILABLE` | 未确认提交状态，保留原命令键重试 |
| 503 | `PERSISTENCE_LIMIT` / `PERSISTENCE_CORRUPT` | 容量或存储结构异常，停止连续重试并排查服务端；不回退为内存写入 |

共享错误码类型位于 `shared/src/protocol.ts`。收据保留、意图过期、备份和生产迁移限制见 [PERSISTENCE.md](PERSISTENCE.md)。

动作清单（22 玩法 × 动作）：
battleRoyal.join/act/peek · undertown.openBrick/probDetail · arena.fight · boss.attack · monkeyFight.fight · dagger.upgrade/assassinate · robbery.raid · apeMine.startPit/claimPit/unlockPit · goldMine.dig/refine/tradeOre · multiplePit.join/settle · universe.explore/upgradeShip/contract · warcraft.extract · escapeTiger.start/step/abort · chicken.feed/guard/collect · marbles.start/shot · sports.start/react · tug.start/pull · monkeyKing.bomb · cards.freeDraw/synth/split/dustSynth · gacha.openEgg/equip · box.openFree/earnKey · daily.checkin/claimTask

## 社交 / 商业 / 合规

| 方法 | 路径 | RELEASE 行为 |
|---|---|---|
| GET/POST | /v1/mail · /v1/mail/claim | 可用 |
| POST | /v1/social/invite/token · /v1/social/invite/accept | defer（可用但入口收敛） |
| GET | /v1/social/friends · /v1/rank/:board | 可用 |
| POST | /v1/telemetry/events | 可用（白名单事件） |
| GET/POST | /v1/market/listings·list·buy·bid·settle-auction | **FEATURE_DISABLED** |
| GET/POST | /v1/mall/goods·order·orders | **FEATURE_DISABLED** |
| GET | /v1/agent/summary | **FEATURE_DISABLED** |
| GET/POST | /v1/settlement/balance·withdrawal-preview | **FEATURE_DISABLED** |

## 服务端权威边界（Section 45 落点）

- 奖励/扣费：Ledger 唯一入口；玩法失败统一 `{ok:false}`（不静默成功）。
- 随机：session seed + fork(serverSeq)；高价值掉落全在服务端。
- 排名：rankAdd 在服务端结算时写入。
- 支付：mock 合同=服务端创建订单→状态机→幂等发货；正式版必须替换为平台回调验证（EXTERNAL_BLOCKERS）。
- 防沉迷：action 网关按服务端 antiAddiction 状态拦截（COMPLIANCE_BLOCKED）；当前状态函数为参考实现，默认已实名成年，未实证接入正式实名/防沉迷体系。

## 限流与防重放

- 登录前固定窗口限制：每进程 300 次/分钟、每 socket peer 30 次/分钟，超限返回 429 `RATE_LIMITED`；不信任任意 `X-Forwarded-For`，过期 peer bucket 会清理。反向代理用户共享 peer bucket，多副本不共享计数，需要可信网关的全局限流与流量验收。
- 已登录请求固定窗口限制：120 次/秒/玩家（RATE_LIMITED），同样为进程内计数。
- clientSeq 单调校验：过期回 409 SESSION_STALE；重复提交返回上次响应（幂等）。
- 非持久化开发模式的 `/v1/admin/reset` 需 `APP_ALLOW_ADMIN=1` 和匹配的 `x-admin-token`；正式持久化 API 始终拒绝该在线重置接口。
- 本地 QA 仍可使用内存 Store；正式进程入口强制 CloudBase，不允许退回本地 JSON。Deploy 017 已运行 CloudBase 版本，但生产数据迁移与恢复演练仍未完成。
