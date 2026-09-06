# CloudBase 持久化与生产切换

状态：服务端外部持久化实现及隔离云集成已落地；**生产服务尚未部署此版本，现有 JSON 数据尚未迁移，K1 的生产关闭条件尚未满足**。本文件说明真实数据边界、已执行验证和切换前置条件。

## 支持范围

外部持久化仅支持 `wechat-release`。`full-clone` 的交易、竞拍、提现预览与代理保持内存研究模式，没有对这些沙盒业务作跨玩家事务承诺。正式路由继续拒绝商业功能与在线全库重置。

客户端继续使用原来的 HTTP 游戏协议；所有修改状态的 POST 必须携带 `idempotencyKey`，现有 `ApiClient.post` 已统一生成并在自动/手动重试中复用。游戏动作兼容 `sessionId + clientSeq` 作为命令标识。微信 code2Session 在事务外执行一次；登录身份映射、新玩家资产和欢迎邮件在同一事务内创建。

## 数据模型

一个 NoSQL 集合承载多个类型的独立文档，默认生产集合名为 `ape_game_state`。单集合不等于单文档；没有全库 JSON，也没有每请求全库读取或回写。每条记录包含 `kind / owner / seq / createdAt / board / score / payload`，文档 ID 由类型和业务主键的 SHA-256 摘要确定。

| kind | 文档边界 | 主要内容 |
|---|---|---|
| identity | 每个 AppID + openId 一条 | 稳定 playerId 映射 |
| player | 每玩家一条 | 昵称、等级、XP、schema、revision、非会话 nonce、邮件/历史序号 |
| wallet | 每玩家一条 | 有限资产余额、最新账本序号；不含历史分录 |
| features | 每玩家固定 4 个分片 | counters/timestamps；按键散列，过期每日任务标记保留最近 8 日 |
| inventory | 每玩家固定 4 个分片 | 物品数量、锁定数量、属性 |
| slot | 每玩家每玩法一条 | 当前活动 sessionId，阻止并发重复入场 |
| session | 每局一条 | seed、权威状态、seq、finished、末次响应 |
| intent | 每玩家每路由每命令一条 | 请求指纹、固定命令时间、固定随机熵、有限对手 ID；只表示已接收，不表示业务成功 |
| receipt | 每玩家每路由每命令一条 | 第一次已提交的业务响应与指纹 |
| ledger | 每笔资产变动一条 | 余额前后、来源、txnId、每玩家单调 seq |
| mail / invite | 每封邮件 / 邀请码一条 | 领取/使用标记与奖励关联 |
| history | 每条玩法历史一条 | 每玩家单调 seq、玩法、摘要和奖励 |
| rank | 每榜每玩家一条 | 分数与展示昵称；训练 NPC 不写入真实排行榜 |
| audit / telemetry | 每个事件一条 | 独立审计和运行事件 |

单文档上限为 **128 KiB**。每玩家最多 1,024 个不同背包条目、2,048 个当前计数键、512 个时间键，超限直接失败并回滚；不会静默丢弃资产。分片只对键排序归档，不影响业务物品 ID。带 `.`、`$`、`%` 的字段采用可逆编码，避免 NoSQL 字段路径语义改变游戏键名。

账本、收据、会话历史、邮件不塞进 player 文档。累计记录需要独立留存与归档策略；目前不会过期删除成功收据，因此旧请求不会因为一个 24 小时缓存窗口失效而重新发奖。待执行 intent 超过 5 分钟或跨 UTC 日界线直接拒绝，已有成功收据仍可重放；intent 的绑定记录保留，不能删除后让同一标识重新获得执行机会。

当前没有定时删除 intent/receipt 的任务。上线前必须配置存储容量与费用告警，并确定归档协议：可以把旧响应移到冷存储或保留摘要，但必须持久保留已执行/已拒绝的命令标识及请求指纹；需要读取旧响应而归档不可用时应返回明确失败，不能重新执行业务。这是上线容量前置项，不能以简单 TTL 删收据替代。

## 命令事务

1. 事务外验证 token 签名、请求大小和幂等键，按请求计一次限流；正式微信换码也在事务外。
2. 用短事务写入或重读 intent，绑定请求指纹、时间和随机熵。重用同键但不同请求返回 409。已提交的 receipt 可直接重放。
3. 开始业务事务，只按 docId 加载请求涉及的玩家、钱包、固定分片、slot/session、邮件、邀请与自身榜分。
4. 创建本次事务独有的 `CommandStore` 与 `GameApp.withStore` 副本。没有替换长期应用实例的全局 `store`。冲突重试重新加载数据和创建副本，复用命令时间/随机源。旧命令试图把已发生的正数时间戳写回更早时间时返回 `COMMAND_SUPERSEDED` 并丢弃全部业务变更，防止重放倒退冷却/恢复时间；明确的清零仍允许。
5. 同一玩家所有修改命令都读取并增加 `player.revision`，使并发修改发生写冲突；邀请操作同时读取并写两名玩家的 revision 和钱包。
6. `ok: true` 时，把玩家/背包/钱包/会话/领取标记/新增账本/响应收据一起提交。业务失败丢弃全部业务副本，只记录确定失败收据并更新 revision；500 异常不提交副作用或成功收据。
7. 等到数据库确认 commit 成功才发送 HTTP 成功响应。数据库不可用、权限拒绝、超限和不明确的提交结果返回失败；不会回退内存并返回成功。提交实际成功但响应丢失时，另一个实例按收据返回第一次结果。

限制：平台为每事务 100 操作、30 秒；应用提前限制为 **90 次 doc 操作、25 秒**。本地并发集成实际峰值为 36 次操作。单次遥测最多 20 条，避免一个请求超过事务预算。排行榜展示和历史列表采用有上限的事务外查询；影响竞技场结算的有限对手文档会在事务内重读。没有真实对手时使用 8 名明确标为 NPC 的固定训练对手，不创建假真人账户。

## SDK 实证与错误处理

固定运行依赖：`@cloudbase/js-sdk@3.9.2`、`@cloudbase/signature-nodejs@2.0.0`。SDK 只从 Node 入口和 Node 专用 persistence 模块加载，不能进入小游戏包。

本轮在真实 CloudBase 环境中发现并处理两个 SDK 差异：

- 默认 `GATEWAY` 模式使用本机 CAM 鉴权返回 `INVALID_CREDENTIALS`；明确配置 `endPointMode: 'CLOUD_API'` 后，文档读取与事务成功。
- `runTransaction(callback, 3)` 的内置自动重试在实测冲突中没有执行：两回调各运行一次，最终值为 1，另一请求拒绝。实际错误通过 `Error.message` 内 JSON 的 `msg` 包裹 `[DATABASE_TRANSACTION_CONFLICT]`，SDK 仅判断 `error.code`。

应用因此使用 `startTransaction / commit / rollback`，只对准确识别的 `DATABASE_TRANSACTION_CONFLICT` 有限重试，最多 8 次，带退避；不会把权限错误或所有 `OPERATION_FAIL` 当冲突重试。其他不确定提交错误直接失败，交给稳定请求标识与已提交收据处理。

实际返回形态：非事务 `doc.get()` 的 `data` 为数组，不存在为 `[]`；事务内 `data` 为单个对象，不存在为 `null`。`doc.set(body)` 支持 upsert 与整文档替换，参数没有额外的 `{data: ...}` 包装。详见 `docs/PERSISTENCE_CLOUD_PROBE_2026-09-06.md`。

## 运行配置与依赖

生产 Node 入口必须具备：

```text
APP_PROFILE=wechat-release
APP_PERSISTENCE=cloudbase
APP_CLOUD_ENV=<实际环境 ID>
APP_DB_COLLECTION=ape_game_state
APP_CLOUD_REGION=ap-shanghai
APP_WX_APPID=<实际 AppID>
APP_SECRET=<足够强的会话签名密钥>
APP_WX_APPSECRET=<微信 AppSecret>
```

默认使用云托管运行身份，SDK 自动读取 `TENCENTCLOUD_SECRETID / TENCENTCLOUD_SECRETKEY` 等运行凭据；容器的实际授权仍需独立验证。本机 `.env.cloud` 的字段为带下划线的 `TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY`，隔离探针显式传给 SDK，不能把这两个命名自动等同。源码与 Docker 不嵌入任何密钥。

启动会 await 数据库查询准备检查。它证明集合可访问，不证明生产集合权限、全部索引、容器运行角色写权限或历史数据已迁移；写权限在实际事务中再次验证。正式缺少外部持久化配置时拒绝启动。本地 `createApp` / `qa:local` 仍是显式测试入口，不可用它冒充生产持久化。

```bash
npm run build
npm run package:server
```

部署目录包含运行依赖和锁文件，Docker 执行 `npm ci --omit=dev --ignore-scripts`。本轮已在隔离产物目录实际执行该命令，并成功加载打包后的服务端入口。停止服务先关闭监听并等待请求结束；45 秒仍未结束则退出失败，未确认的客户端命令必须保留原请求标识重试。

## 集合权限与索引

生产集合必须禁止客户端直读直写（`ADMINONLY`），仅通过权威服务端访问。隔离集合 `ape_qa_persistence` 已设置并回读此权限。本机管理工具的权限不等于生产容器角色权限。

以下 5 个普通复合索引已在隔离集合建立并回读，生产集合仍需按相同定义建立：

| 索引名 | 字段及顺序 |
|---|---|
| ape_kind_owner_seq | kind ASC、owner ASC、seq DESC |
| ape_kind_owner_board_seq | kind ASC、owner ASC、board ASC、seq DESC |
| ape_kind_board_score | kind ASC、board ASC、score DESC |
| ape_kind_created | kind ASC、createdAt ASC |
| ape_kind_seq | kind ASC、seq ASC |

`GET /v1/economy/ledger`、`/v1/history`、`/v1/mail` 支持 `limit=1..200` 和 `cursor=<上次 nextCursor>`。下一页使用严格小于当前序号，不使用不断增长的 offset。资产/玩法筛选在数据库查询里执行，仍返回正确的下一页游标。排行榜保持 Top 50 查询接口；好友列表最多 30 人。

账本列表不会谎称检查了全部历史，返回 `invariants.ok: null` 与 page 范围提示。完整验证使用 `PersistentRepository.auditLedger(playerId)`：每页最多 200 条，检查序号、余额链、算术与钱包总额；扫描期间钱包变化则返回不稳定，需要重新审计。

## 已执行验证

本地命令：

```bash
npm run build
node dist/tests/persistence.js
node dist/tests/server_packaging.js
```

本地持久化集成已验证：两个独立应用实例；20 路同身份登录只建一名玩家；20 路相同命令只奖励一次；同键异请求拒绝；20 路不同入场命令只保留一个 slot；邮件领取和邀请双方奖励原子；并发真实体力消费不超支；第三次写失败与业务异常无部分提交；业务 commit 后丢响应，新实例重放；账本分页与钱包一致；数据库不可用 fail closed；旧有效 token 引用不存在的持久玩家返回 401；固定训练对手回退及有真人时的候选选择。

隔离真实云命令：

```bash
node dist/tools/src/qa_persistence_cloud.js
node dist/tools/src/qa_persistence_integration.js
```

第一条是 SDK 原始契约探针，会保留已确认的 SDK 内置自动重试失败并退出非零。第二条使用实际应用的 `CloudBaseDocumentDatabase + PersistentRepository + PersistentApi`，应用层重试已绕开该缺陷，不把原始 SDK 探针当作 K1 应用验收替代品。

真实应用最新通过记录：`build/qa-evidence/persistence-cloud-integration.json`（包含 intent 稳定上下文及过期/时间倒退保护的复查运行，575 个逻辑文档操作，约 60.0 秒，进程退出 0）。覆盖两实例并发登录、4 路签到重放、邮件、邀请双方事务、写失败回滚、已提交响应丢失后的新实例恢复、不同幂等键并发入场、完整钱包账本复算。60 个自建文档已删除，清理待办为空；本轮最新 MCP 独立复查 `kind != qa_probe_owner` 为 **0 条**（请求 `fa8f31ee-ab59-47d7-b174-6bc77805c118`）。有限对手 ID 的跨重试绑定另有本地集成断言。

这仍是使用合成身份和本机 CAM 的隔离数据测试；没有访问真实玩家数据，没有证明官方微信登录、容器运行身份或线上数据迁移已经完成。

## 生产切换前的硬前置

1. 取得当前在线实例的权威完整快照与最后写入水位，停止旧 JSON 实例接受资产写请求，备份后验证完整账本；不能因导出缺失就静默创建新档。
2. 实现并审查一次性迁移器及身份兼容：当前登录为新数据确定性计算 playerId，并拒绝 identity 映射到不同 ID；**仅拆分旧 JSON 文档不能保留原来的随机 playerId 直接切换**。迁移前必须先补“登录读取并接受已验证既有 identity 映射”的兼容路径，才能保持原 playerId/openId；或者采用全引用重写的 ID 迁移，核对所有余额、背包、会话、邮件、历史与幂等证据。旧合成身份不能未经验证就绑定为正式 openId。当前没有实现自动导入或该身份兼容，不允许并行运行旧 JSON 写入与新数据库写入，也不能无快照静默重置。
3. 在生产集合建立权限、索引、备份与容量告警；用生产容器运行角色执行隔离读写事务探针，确认权限足够且客户端被拒绝。
4. 用迁移后的同一账号验证重启、跨实例、并发与 commit 后丢响应；分页核对账本和钱包，然后才切换全部写流量。失败回滚必须考虑新库已提交的数据，不能直接让旧快照重新覆盖新进度。
5. 配置数据库成本、文档留存/归档、恢复演练与分布式限流。完成真实微信 code2Session、AppID 云环境关联和合法域名验收。

未完成上述条件前，继续阻断正式运营和收费。广告、支付、身份/防沉迷合规、历史密钥轮换也不因本实现自动变为通过。
