# IMPLEMENTATION_STATUS

> 状态枚举：NOT_STARTED / IN_PROGRESS / PLAYABLE / PARITY_PARTIAL / PARITY_HIGH / DONE / BLOCKED_EXTERNAL / RELEASE_DISABLED
> "PLAYABLE" 定义（Section 63）：入口可开、UI 完成、资源可载、交互真实、状态机完成、服务端契约完成、异常处理、返回导航、测试覆盖、FULL/RELEASE 行为明确。

## 玩法与系统（服务端+客户端双端）

| 模块 | 原始证据 | 状态 | 可玩 | 测试 | FULL 行为 | RELEASE 行为 |
|---|---|---|---|---|---|---|
| 大逃杀 | BattleRoyal/NewBattleRoyal + blockBattleRoyal 资源 + 公开资料 | PARITY_HIGH（房间/修门/换房/杀手轮转/分池/铸匕首/历史/赛季） | ✅ | gameplay_server×4 | 门票=金币 | 门票=金币，无现金语义 |
| 宝石地下城 | Undertown*/ProbDetail*/DailyTopHundred + brickSelf/bricksRupture Lottie | PARITY_HIGH（24 砖/层·大奖砖·保底推进·概率展示·百强） | ✅ | gameplay_server | 奖励宝石/奖券 | 同左 |
| 竞技场 | ApeArenaActivity + arena PAG | PARITY_HIGH（三回合行为克制状态机·战力·连胜·复仇标记） | ✅ | gameplay_server | — | — |
| Boss 挑战 | ChallengeBossActivity + boss PAG | PARITY_HIGH（血量制·冷却·击杀奖励） | ✅ | integration | — | — |
| 斗猿场/猿兔/动物 | MonkeyFighting*/ApeRabbit*/Animals* | PLAYABLE（同三回合引擎+皮肤） | ✅ | 同竞技场 | — | — |
| 匕首/刺杀 | Dagger*/AssassinationHistory + dagger 资源 | PLAYABLE | ✅ | integration | 匕首=战利品道具 | RELEASE_DISABLED（defer，入口关闭） |
| 抢夺 | RobMainActivity/RobberyKiller* | PLAYABLE（PvE 积分制改造） | ✅ | — | 沙盒积分 | RELEASE_DISABLED（defer） |
| 猿矿场 | 私矿/好友矿/矿坑 Activity | PARITY_HIGH（4 坑·生产-收取·好友加速·解锁） | ✅ | gameplay_server | — | — |
| 黄金矿场 | GoldMine*/FineGold* + miner 1591 帧 | PARITY_HIGH（体力·挖矿·精炼·NPC 兑换） | ✅ | integration/release | 沙盒市场引导 | NPC 兑换 |
| 多人矿坑 | MultiplePit/GrandPrizeLog | PLAYABLE（轮次同采·GrandPrize） | ✅ | — | 沙盒大奖 | defer（固定赛季奖励入口关闭） |
| 宇宙探索 | Universe/ExplorePlanet/UpgradeUFO/Temple | PARITY_HIGH（探索·飞船成长·每日契约） | ✅ | integration | — | — |
| 猿石魔兽 | Warcraft* | PLAYABLE（召唤提取；资金链切除） | ✅ | — | — | warcraftFinance cut |
| 虎口逃生 | EscapeTigerMouth + 73 escape_animal PAG | PARITY_HIGH（三车道·障碍·Buff·虎距·放弃结算） | ✅ | integration | — | — |
| 今晚吃鸡 | ChickenActivity/Logs + music/chicken | PARITY_HIGH（喂养·孵化·偷鸡者预警·防守·收获） | ✅ | integration | — | — |
| 弹珠 | MarblesActivity + 48 marbles PAG | PARITY_HIGH（角度力度→射程物理·摆锤命中·达标奖券） | ✅ | integration | — | — |
| 运动会 | SportsMeet* + 6 组动画 | PLAYABLE（发令反应·抢跑无效·服务端校验） | ✅ | integration | — | — |
| 拔河 | TugActivity/Record/Rank + tug 资源 | PLAYABLE（鼓点节奏·绳位·反拽） | ✅ | integration | — | — |
| 炸猴王 | MonkeyKing*/MonkeyPool + bombOne/Ten/Hundred | PLAYABLE（三档投弹·贡献榜·赛季积分池） | ✅ | — | 沙盒池 | 赛季积分池 |
| 卡牌/闪卡/星球卡 | SynthesisCard*/ApeComposeCard*/FlashCard* | PARITY_HIGH（18 模板·3合1·拆分·粉尘兑换·图鉴） | ✅ | gameplay_server | — | — |
| 扭蛋兔 | normal/medal/rock_egg + dress_* + strengthen | PLAYABLE（三蛋·六部位·穿戴/自动分解·战力入竞技场） | ✅ | — | — | — |
| 盲盒/福袋 | OpenBox*/LuckyBag* | PLAYABLE（免费钥匙链路） | ✅ | integration | 沙盒开箱 | defer（付费随机永久关） |
| 每日/签到/任务 | 通用 | DONE（签到幂等·连签·任务领取） | ✅ | gameplay_server | — | — |

## 平台与基础设施

| 模块 | 状态 | 说明 |
|---|---|---|
| 五大 Tab 主循环（Section 17/80） | DONE | 潮玩/猿宇宙/游戏/交易/我的 + 主城大厅 |
| Auth/登录 | DONE | wx.login→服务端 openId→token；session_key 不落客户端 |
| Economy Ledger | DONE | 幂等/原子批/连续性校验（unit_core） |
| RemoteConfig | DONE | 签名 bootstrap + tuning 注入 |
| 排行/历史/邮件/邀请 | DONE | NPC 同服玩家使榜单/好友真实可交互 |
| 商业生态（market/consignment/auction/mall/agent） | PARITY_PARTIAL | 状态机+mock 支付合同全链路；正式支付回调=BLOCKED_EXTERNAL |
| 结算沙盒桥 | DONE | 十屏 UI 绑定，永不兑付（测试断言） |
| 资源管线 | DONE | 14,092 分类 + 3,524 全量提取验证 + 440 样本归档 |
| 微信双产物 | DONE | build/wechat-full-clone & wechat-release（verify 产物冒烟通过） |
| PAG→图集批量烘焙 | PARITY_HIGH（P0-1/P0-2/P0-3/P1 完成 2026-09-06） | 图像层 + bake 全量 535 文件 0 失败（BAKE_REPORT）+ 图集全量 326 打包/209 视频桶/478 张 2048² WebP/65MB、maxDiff 1.03%、1 次崩溃自愈（ATLAS_REPORT）；mp4 已完成（209/209 共 42MB，2026-09-06）；仅剩 CDN 接入（EXTERNAL_BLOCKERS #5） |
| 音频 | DONE（2026-09-06） | chiptune BGM×3+SFX×12 入包，事件全接线 |
| 真机性能采集 | BLOCKED_EXTERNAL | 需微信开发者工具 CLI/真机（EXTERNAL_BLOCKERS） |
| 启动合规页（健康忠告+出版信息） | DONE | 规范 2.6：client/src/features/compliance_gate.ts，bundle 冒烟点击通过实测 |
| 隐私授权交互层 | DONE | getPrivacySetting/requirePrivacyAuthorize + errCode -12034 前置防护（platform.ts），服务端 /v1/compliance/privacy-consent 留痕（server/src/app.ts:302），拒绝→exitMiniProgram |

## 数据口径

- implemented 屏 354 = 玩法屏 + 商业 mock 屏 + 系统/社交屏（服务端路由 29 条 + 22 玩法动作 + 客户端 30+ 屏幕类）。
- 功能验收按 FeatureFamily 而非"有首页即完成"：22 个可玩族均有独立服务端动作与客户端交互。
