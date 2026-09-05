# ECONOMY_MODEL

> 资产目录与账本为工程重建（结构 MATCHED / 数值 INFERRED）。定义源：shared/src/assets.ts；数据投照：data/economy.json。

## 资产目录（20 种，字段完整满足 Section 18）

| assetId | 名称 | 精度 | 产出 (source) | 消耗 (sink) | Full 可交易 | Release 可交易 | 可提现 | 账本类别 |
|---|---|---|---|---|---|---|---|---|
| GEMSTONE | 宝石 | 2 | apeMine/undertown/arena/daily | gacha/exchange/upgrade | ✅沙盒 | ❌ | ❌ | currency |
| MEDAL | 勋章 | 2 | undertown/daily/arena | gacha/exchange | ✅沙盒 | ❌ | ❌ | currency |
| NDTU | NDTU | 4 | universe/contract | ship/exchange | ✅沙盒 | ❌ | ❌ | currency |
| WORLD_COIN | 世界币 | 4 | legacy | exchange | ✅沙盒 | ❌ | ❌ | currency |
| APE_STONE | 猿石 | 2 | warcraft/npcExchange | warcraft/gacha | ✅沙盒 | ❌ | ❌ | material |
| SAND | 金沙 | 2 | apeMine/goldMine | exchange/production | ✅沙盒 | ❌ | ❌ | material |
| GOLD | 黄金 | 4 | goldMine/refine | npcExchange | ✅沙盒 | ❌ | ❌ | material |
| DAGGER | 匕首 | 0 | battleRoyal(败方) | assassinate/upgrade | ✅沙盒 | ❌ | ❌ | item |
| ORE | 矿石 | 0 | goldMine/apeMine | refine/npcExchange | ✅沙盒 | ❌ | ❌ | material |
| APE_CARD/PLANET_CARD/FLASH_CARD | 卡牌 | 0 | gacha/market/synthesis | market/synth/split | ✅沙盒 | ❌ | ❌ | item |
| TICKET | 奖券 | 0 | undertown/arena/marbles/daily | undertown/lottery | ❌ | ✅ | ❌ | currency |
| ENERGY | 体力 | 0 | 时间回复/升级/广告(预留) | 全玩法 | ❌ | ✅ | ❌ | currency |
| COIN | 金币 | 0 | 全玩法产出 | 门票/升级/喂养 | ❌ | ✅ | ❌ | currency |
| INTEGRAL | 积分 | 0 | tasks/decompose/split | mall/dustSynth | ❌ | ✅ | ❌ | progress |
| SEASON_SCORE | 赛季积分 | 0 | battleRoyal/monkeyKing/arena/multiplePit | 赛季奖励 | ❌ | ✅ | ❌ | progress |
| BADGE | 徽章 | 0 | achievement | showcase | ✅沙盒 | ❌ | ❌ | item |
| RED_PACKET_PROGRESS | 红包进度 | 2 | tasks/invite | cashRedPacket | ❌ | ❌(RELEASE 禁发) | ❌ | progress |
| TEST_CREDIT | 沙盒币 | 2 | bootstrap 水龙头 | 结算屏/市场 | 仅结算屏 | ❌(RELEASE 禁发) | ❌ | sandbox |

## 经济大循环（复刻原产品多资产互喂结构，docs/01_MATCHED）

```
每日签到/任务 → COIN/ENERGY
  → 矿场生产(apeMine 4坑/黄金矿场/多人矿坑) → GEMSTONE/SAND/ORE/GOLD
  → 短局玩法(大逃杀/地下城/竞技场/小游戏矩阵) → COIN/TICKET/SEASON_SCORE/DAGGER(败方)
  → 收集成长(卡牌 3合1 / 扭蛋兔六部位 / 宇宙飞船) → 战力 → PVE/PVP 上限
  → 交易生态(FULL: 市场/寄售/竞拍 沙盒币结算 · RELEASE: NPC 兑换) → 回流稀缺资产
  → 赛季(SEASON_SCORE 7天过期) → 回流
```

## 账本硬约束（shared/src/ledger.ts，unit_core 全覆盖）

1. append-only：`txnId/playerId/assetType/delta/balanceBefore/balanceAfter/sourceType/sourceId/idempotencyKey/createdAt`
2. 幂等：同 `playerId+idempotencyKey` 重放返回原记录（测试：双发放只到账一次）
3. 原子批：applyBatch 任一不足即全不落账（测试验证）
4. 连续性：`validateInvariants` 校验链条算术+负余额（integration 每次结算后校验）
5. RELEASE 守卫：EconomyOps 对 TEST_CREDIT/RED_PACKET_PROGRESS 正向 delta 抛 `RELEASE_FORBIDDEN_ASSET`

## 现金类改造对照（原 → FULL → RELEASE）

| 原版 | FULL CLONE | WECHAT RELEASE |
|---|---|---|
| 现金下注房间 | 金币门票+金币奖池（沙盒语义） | 同 FULL（结构不变，无现金 API） |
| 现金奖池/提现 | 沙盒桥 UI（TEST_CREDIT，永不兑付） | SEASON_SCORE 赛季积分，结算十屏入口关闭 |
| 付费随机抽取 | 免费钥匙/粉尘兑换 | 同 FULL，付费链路永不开 |
| 玩家 P2P 资产交易 | 沙盒市场（挂单/购买/竞拍全状态机） | NPC 兑换（10 矿石=1 猿石）+ bind-on-account |
| 代理/分销提现 | 沙盒数据模型展示 | RELEASE_DISABLED |
