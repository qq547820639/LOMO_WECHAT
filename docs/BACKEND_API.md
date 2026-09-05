# BACKEND_API

> 参考服务端全部路由（实现：server/src/app.ts + commerce.ts；HTTP 装配：server/src/index.ts）。全部路由已在测试/冒烟中实际调用。

## 认证与配置

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /v1/auth/wechat `{code}` | code→服务端派生 openId→playerId+token；返回 antiAddiction、isNew；新玩家初始化资产+欢迎邮件 |
| GET | /v1/config/bootstrap | tuning + featurePolicies + release 配置 + 签名(configVersion) |
| GET | /v1/compliance/status | 实名/未成年/可玩时段/剩余时长 |

## 玩家 / 经济

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /v1/player/state | PlayerStateDto（余额/背包/等级/计数器） |
| GET | /v1/economy/ledger?limit&assetType | 账本流水 + invariants 校验结果 |
| GET | /v1/history?featureId | 记录中心 |

## 玩法会话（统一入口）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /v1/game/session/start `{featureId}` | 颁发 sessionId+seed（确定性 RNG 源） |
| POST | /v1/game/action `{featureId,actionId,sessionId?,clientSeq?,payload,idempotencyKey?}` | 服务端权威结算；失败返回 `{ok:false,code:'BAD_REQUEST',message}`；重复 clientSeq 幂等重放 |
| POST | /v1/game/session/finish `{sessionId}` | 结束+replayToken（HMAC） |
| GET | /v1/game/state?featureId= | 玩法状态读取（大厅/对局/概率表等） |

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
- 防沉迷：antiAddiction 时段/未成年判定在服务端，action 网关直接拦截（COMPLIANCE_BLOCKED）。

## 限流与防重放

- 令牌桶 120 req/s/玩家（RATE_LIMITED）。
- clientSeq 单调校验：过期回 409 SESSION_STALE；重复提交返回上次响应（幂等）。
- 管理接口 /v1/admin/reset 需 APP_ALLOW_ADMIN=1。
