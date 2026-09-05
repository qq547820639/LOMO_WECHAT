# 小游戏服务端契约建议

## 1. 登录

`POST /v1/auth/wechat`

Request: `{ code, clientVersion }`

Response: `{ token, playerId, profile, configVersion }`

服务端使用微信 code 换取平台身份后映射内部账号。客户端不持久化 session_key。

## 2. 拉取配置

`GET /v1/config/bootstrap?version=...`

返回：玩法开关、数值版本、资产 manifest、活动版本、支付能力策略。配置需要服务端签名与灰度版本。

## 3. 动作结算

`POST /v1/game/action`

Request: `{ sessionId, mechanicId, actionId, clientSeq, payload }`

Response: `{ serverSeq, statePatch, rewards, replayToken }`

所有资产增减由服务端写 Economy Ledger。客户端只做预测 UI。

## 4. 战斗

`POST /v1/battle/start` → `{ sessionId, seed, opponentSnapshot }`

`POST /v1/battle/finish` → 上传输入摘要/回放 hash，由服务端重放或校验后结算。

实时战斗使用 WSS：`wss://game.example.com/v1/match`。

## 5. Economy Ledger

每条账变字段：

`txnId, playerId, assetType, delta, balanceAfter, sourceType, sourceId, idempotencyKey, createdAt`

要求：

- `idempotencyKey` 唯一。
- 客户端无法直接写余额。
- 支付、广告奖励、邮件补偿都走同一账本。
- 高风险 release 配置中不存在 cash/withdrawable asset type。

## 6. 支付

支付必须：

1. 客户端先做 `wx.checkIsSupportMidasPayment`/当期平台能力判断。
2. 服务端创建订单并返回支付参数。
3. 客户端调用平台支付。
4. **只以服务端支付通知/查单为发货依据**，不以客户端 success 回调直接加资产。
5. 发货写幂等账本。

## 7. 防沉迷

登录后在服务端完成实名状态、未成年状态和可游戏时段判定；客户端只展示结果。任何离线 fallback 都不能绕过限制。

