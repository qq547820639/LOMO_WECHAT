# ROUTE_PARITY_680

> 自动生成于 tools/src/route_parity.ts · 运行 npm run parity 重建。

- 原 CSV 行数: 680
- routes.json 条目: 680
- 状态分布: {"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113}
- 决策分布: {"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113}
- 验收: PASS ✅

| 原 Activity | 模块 | 功能 | 决策 | 迁移状态 | 目标路由 | 发布策略 | 说明 |
|---|---|---|---|---|---|---|---|
| com.caike.lomo.wxapi.WXEntryActivity | 微信适配 | 微信适配 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.ticket.modules.friend.ui.InviteLogsActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.ChannelActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.ProfitLogsActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.ChannelInviteActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.FriendCashRewardActivity | 邀请裂变 | 提现/结算 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /walletCash | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.ticket.modules.friend.ui.FriendLotteryRewardActivity | 邀请裂变 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.ticket.modules.friend.ui.FriendPropRewardActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.FriendActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.FriendTideRewardActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.friend.ui.FriendTideCashRewardActivity | 邀请裂变 | 提现/结算 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /walletCash | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.ticket.modules.friend.ui.FriendTideBlankRewardActivity | 邀请裂变 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.mine.ui.BalanceActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.SettingActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.InviterActivity | 我的/钱包 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.mine.ui.AboutUsActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.PrivateActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.SocialInformationActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.BindPhoneActivity | 我的/钱包 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.CertificationActivity | 我的/钱包 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.BalanceLogsActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.InviteCodeActivity | 我的/钱包 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.mine.ui.EmptyActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.OnlineServiceActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.CashResultActivity | 我的/钱包 | 提现/结算 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /walletCash | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.ticket.modules.mine.ui.ElectricityActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.CoinQuestionActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.QuestionAnswerActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.CoinActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.CoinLogsActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.CoinCashActivity | 我的/钱包 | 钱包/资产 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /walletCash | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.ticket.modules.mine.ui.CoinSendActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.WalletActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.GiftSuccessActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.AvatarActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.NicknameActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.CoinAppActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.MoreAppActivity | 我的/钱包 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.ticket.modules.mine.ui.NewCoinActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.WithdrawalMainActivity | 我的/钱包 | 抽签/抽奖 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /digitalLottery | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.ticket.modules.mine.ui.UnbindPhoneActivity | 我的/钱包 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.CardActivity | 我的/钱包 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.ticket.modules.mine.ui.CoinCashLogsActivity | 我的/钱包 | 钱包/资产 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /walletCash | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.ticket.modules.mine.ui.TideInviteCodeActivity | 我的/钱包 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.mine.ui.TideInviterActivity | 我的/钱包 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.ticket.modules.mine.ui.TideSettingActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.LomoAccountSecurityActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.LomoAccountSecurityPayLogActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.LomoDeviceDetailActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.MyEmptyModelActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.WhiteModelTradeMarketActivity | 我的/钱包 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.ticket.modules.mine.ui.WhiteModelGiftActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.MyEmptyModelRecordActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.WhiteModelTradeRecordActivity | 我的/钱包 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.ticket.modules.mine.ui.ServiceProviderActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.ServiceRecordActivity | 我的/钱包 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.ticket.modules.mine.ui.BusinessOrderActivity | 我的/钱包 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.ticket.modules.mine.ui.LomoMyCoinsActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.mine.ui.MyAuctionActivity | 我的/钱包 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.ticket.modules.mine.ui.AuctionRecordActivity | 我的/钱包 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.ticket.modules.mine.ui.AuctionBusinessActivity | 我的/钱包 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.ticket.modules.mine.ui.AuctionSuccessActivity | 我的/钱包 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.ticket.modules.mine.ui.LogisticsActivity | 我的/钱包 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.ticket.modules.mine.ui.NdtuExchangeCenterActivity | 我的/钱包 | 我的/钱包 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.mine.ui.TradedOrderCoinActivity | 我的/钱包 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.ticket.modules.mine.ui.MyIntegralActivity | 我的/钱包 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.ticket.modules.main.ui.SplashActivity | 账号/登录 | 账号/登录 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.login.LoginActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.login.AccountLoginActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.WebActivity | 账号/登录 | 账号/登录 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.AuthActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.RouterActivity | 账号/登录 | 账号/登录 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.BrowserRouterActivity | 账号/登录 | 账号/登录 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.LocalWebActivity | 账号/登录 | 账号/登录 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.UpdateActivity | 账号/登录 | 账号/登录 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.CertVerifyActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.FaceVerifyActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.LomoAccountSecurityCertVerifyActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.LomoAccountSecurityFaceVerifyActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.login.AccountLoginActivityLomo | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.ticket.modules.main.ui.CertVerifyResultActivity | 账号/登录 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.lomo.modules.mall.ui.FlashGoodsDetailsActivity | 商城/卡牌 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.FlashOrderDetailsActivity | 商城/卡牌 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.mall.ui.FlashBagDetailsActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.ExchangePrizeLogActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.ExchangePrizeSuccessActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.CashPrizeActivity | 商城/卡牌 | 提现/结算 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.lomo.modules.mall.ui.GoldCardActivity | 商城/卡牌 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.mall.ui.CollectCardSeriesActivity | 商城/卡牌 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.mall.ui.CollectCardActivity | 商城/卡牌 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.mall.ui.DetachBoxDetailsActivity | 商城/卡牌 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.mall.ui.DetachRecordActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.MyCardLibraryActivity | 商城/卡牌 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.mall.ui.DetachBagResultActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.DetachBagActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.WithdrawalRecordActivity | 商城/卡牌 | 抽签/抽奖 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /digitalLottery | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.lomo.modules.mall.ui.TransReleaseActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.CopyrightSaleActivity | 商城/卡牌 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.mall.ui.CopyrightProfitDetailActivity | 商城/卡牌 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.mall.ui.CopyrightIncomeDetailActivity | 商城/卡牌 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.mall.ui.ConfirmCopyrightOrderActivity | 商城/卡牌 | IP/设计师 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /creator | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.mall.ui.CopyrightPaySuccessActivity | 商城/卡牌 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.mall.ui.MyCopyrightActivity | 商城/卡牌 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.mall.ui.CopyrightOrderDetailActivity | 商城/卡牌 | IP/设计师 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /creator | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.mall.ui.IpJointlyActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.CopyrightProductionActivity | 商城/卡牌 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.mall.ui.TransactionDetailsActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mall.ui.DetachDemoBagResultActivity | 商城/卡牌 | 商城/卡牌 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.ape.ui.ApeStoneLogsActivity | 猿宇宙 | 猿石/矿石 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.mall.ui.GoldRabbitDeliveryActivity | 商城/卡牌 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.home.ui.BattleRoyalActivity | 主城/潮玩主页 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.home.ui.BettingHistoryActivity | 主城/潮玩主页 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.home.ui.DepositOrderActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.DepositExtendActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.DepositToysActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MainActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.LomoOrderActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.ShoppingCartActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /home | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.ConfirmOrderActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.GoodsDetailsActivity | 主城/潮玩主页 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.home.ui.OrderDetailsActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.ReadyPayActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /home | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.PayActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /home | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.LomoAddressActivity | 主城/潮玩主页 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.home.ui.LomoEditAddressActivity | 主城/潮玩主页 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.home.ui.SearchActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.PaymentStatusActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /home | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.SolidPrintDetailsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.SellPrintsActivity | 主城/潮玩主页 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.home.ui.MyPrintsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MyPrintsDetailsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MakingPrintsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.PrintsHistoryActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MyPrintsIOperationActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.DestroyPrintsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.GivePrintActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MyWalletActivity | 主城/潮玩主页 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.lomo.modules.home.ui.WithdrawalActivity | 主城/潮玩主页 | 抽签/抽奖 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /digitalLottery | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.lomo.modules.home.ui.MyWalletHistoryActivity | 主城/潮玩主页 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.lomo.modules.home.ui.LottieAnimationActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.HotBonusActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MailHomeActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.IPostedActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.ISoldActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.WinningListActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MasterRabbitActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.ConfirmDrawOrderActivity | 主城/潮玩主页 | 抽签/抽奖 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /digitalLottery | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.PayDrawResultActivity | 主城/潮玩主页 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.home.ui.AcceptGiftsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.TideShareActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.BuySellDetailsActivity | 主城/潮玩主页 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.home.ui.GlobalTrendPlayActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.ConfirmMakeActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.SaleByDrawActivity | 主城/潮玩主页 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.home.ui.SaleByDrawResultActivity | 主城/潮玩主页 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashCardActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.SellGiftBagActivity | 主城/潮玩主页 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashCardLogsActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.MasterPointsDetailsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.MasterDetailsActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.SendFlashcardActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.CommonConfirmOrderActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardOrderDetailsActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /cards | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.LuckyBagActivity | 主城/潮玩主页 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.home.ui.LuckyBagLogsActivity | 主城/潮玩主页 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.home.ui.LuckyBagRankingActivity | 主城/潮玩主页 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.home.ui.LuckyBagOrderDetailsActivity | 主城/潮玩主页 | 盲盒/福袋 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /box | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.LogisticsActivity | 主城/潮玩主页 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.home.ui.ConfirmDepositOrderActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.DepositOrderDetailsActivity | 主城/潮玩主页 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.home.ui.flashcard.FlashCardByScanActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardTradeActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardTradeOperateActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardTradeLogsActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardOrderTradeActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardSaleActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.WalletIntegralActivity | 主城/潮玩主页 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.lomo.modules.home.ui.MyIntegralActivity | 主城/潮玩主页 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.lomo.modules.home.ui.MyIntegralHistoryActivity | 主城/潮玩主页 | 钱包/资产 | CLONE_1_TO_1 | mapped | /walletCash | cut |  |
| com.caike.lomo.modules.home.ui.SynthesisCardActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashCardSynthesisSuccessActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.MySynthesisActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.FlashcardExchangeActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.RareCardTradeActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.GoldCardTradeActivity | 主城/潮玩主页 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.CardServiceProviderActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.CardRecordActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.SellGoldCardActivity | 主城/潮玩主页 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.home.ui.flashcard.CardSellSuccessActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.SellGoldRabbitActivity | 主城/潮玩主页 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.home.ui.CardCabinetActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.CabinetPickUpActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.CardPickupSuccActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.CardStorageLogActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.home.ui.WithdrawResultActivity | 主城/潮玩主页 | 抽签/抽奖 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /digitalLottery | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.lomo.modules.home.ui.MonkeyFightingSiteActivity | 主城/潮玩主页 | 斗猿场 | CLONE_1_TO_1 | implemented | /monkeyFight | keep |  |
| com.caike.lomo.modules.home.ui.MonkeyFightingHistoryActivity | 主城/潮玩主页 | 斗猿场 | CLONE_1_TO_1 | implemented | /monkeyFight | keep |  |
| com.caike.lomo.modules.home.ui.MyNXRedPackageHistoryActivity | 主城/潮玩主页 | 主城/潮玩主页 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.home.ui.NewBattleRoyalActivity | 主城/潮玩主页 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.home.ui.NewBettingHistoryActivity | 主城/潮玩主页 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.home.ui.CardCabinetListActivity | 主城/潮玩主页 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.digtal.ui.DigitalPaintingDetailsActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.PrintAuctionActivity | 数字潮玩 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.PrintBiddingActivity | 数字潮玩 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.BiddingDetailsActivity | 数字潮玩 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.AuctionDetailsActivity | 数字潮玩 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.DrawDetailsActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.ChoicePledgeActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.DrawCodeActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.ExchangeDetailsActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.OfferingCalendarActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.GlobalTideActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.ExchangeActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.AuctionRecordsActivity | 数字潮玩 | 竞拍 | CLONE_1_TO_1 | mapped | /digitalTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.PrintsConfirmOrderActivity | 数字潮玩 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.digtal.ui.PrintsPayActivity | 数字潮玩 | 数字潮玩 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /digitalGallery | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.digtal.ui.ScanCodeActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.DigitalLuckyDrawActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.DigitalLuckDrawWinnerActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.DealInfoActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.PrintDrawActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.TideDetailsActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.SaleReleaseTideActivity | 数字潮玩 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.GlobalTideDetailsActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.LuckyDraw100Win400Activity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.MostPopularRankActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.ApplyCooperationActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.TideTradeDetailsActivity | 数字潮玩 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.digtal.ui.DetailSoldActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.MostPopularRecordActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.LuckDraw100Win400ListActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.LomoLotteryActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.LotteryDetailsActivity | 数字潮玩 | 抽签/抽奖 | CLONE_1_TO_1 | mapped | /digitalLottery | cut |  |
| com.caike.lomo.modules.digtal.ui.SearchTideActivity | 数字潮玩 | 数字潮玩 | CLONE_1_TO_1 | mapped | /digitalGallery | defer |  |
| com.caike.lomo.modules.digtal.ui.DigitalCardDetailActivity | 数字潮玩 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.digtal.ui.DigitalcardIndexActivity | 数字潮玩 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.design.ui.BecomeDesignerActivity | 设计师 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.UploadWorkActivity | 设计师 | 设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.FillInfoActivity | 设计师 | 设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.DesignerAwardActivity | 设计师 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.MyWorkActivity | 设计师 | 设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.IndividualDesignerActivity | 设计师 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.IpCooperationActivity | 设计师 | 设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.design.ui.TideCreationActivity | 设计师 | 设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.undertown.ui.LevelRewardActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.ProbDetailActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.UndertownLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.LevelRewardLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.TicketAllocationLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.ModelAllotActivity | 地下城 | 地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.DailyTopHundredActivity | 地下城 | 地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.UndertownLogsDetailActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.UndertownActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.TideUndertownLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.ApeUndertownActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.MedalAllotActivity | 地下城 | 勋章 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.NewLevelRewardActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.NewTicketAllocationLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.NewProbDetailActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.ApeLadderLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.NewLevelRewardLogsActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.NewDailyTopHundredActivity | 地下城 | 地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.undertown.ui.dungeons.ApeLadderLogsDetailActivity | 地下城 | 宝石地下城 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.universe.ui.HeroListActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardDeedActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.DarkPlanetActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.HeroActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.UpgradeUFOActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.ExploreRecordActivity | 宇宙探索 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.universe.ui.AddWarehouseActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.HeroDetailRecordActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.InviteAccelerateRecordActivity | 宇宙探索 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.universe.ui.InviteHelpActivity | 宇宙探索 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.universe.ui.HeroStoreActivity | 宇宙探索 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.universe.ui.AirshipLogsActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardStarActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardContractDetailsActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardContractDetailsRabbitsActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardContractActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardDepositTakeRecordActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.WizardNDTUPondActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.ExploreWarehouseActivity | 宇宙探索 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.universe.ui.ExplorePlanetActivity | 宇宙探索 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.universe.ui.ExploreLogsActivity | 宇宙探索 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.universe.ui.TempleActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.universe.ui.UniverseActivity | 宇宙探索 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.gold.ui.activity.GoldMineActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.FineGoldActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.MyMineralActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.MineralRecordActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.MineralDataActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.FineRecordActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.StarPageActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.GoldPageActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.TakeGoldActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.TakeOrderInfoActivity | 黄金矿场 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.gold.ui.activity.OreTradingActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.BecomeGoldServiceActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.GoldServiceProviderActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.ServiceProviderRecordActivity | 黄金矿场 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.lomo.modules.gold.ui.activity.GoldExchangeActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.MonkeyContractActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.gold.ui.activity.ShipRecordActivity | 黄金矿场 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.ticket.modules.moon.ui.activity.MoonCakeMainActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.AddAddressActivity | 月饼/兑换 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.ticket.modules.moon.ui.activity.AddressActivity | 月饼/兑换 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.ticket.modules.moon.ui.activity.PaySuccessActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.order.MyMoonCakeVolumeOrderActivity | 月饼/兑换 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.ticket.modules.moon.ui.activity.order.MoonCakeVolumeOrderDetailsActivity | 月饼/兑换 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.ticket.modules.moon.ui.activity.order.MoonCakeOrderDetailsActivity | 月饼/兑换 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.ticket.modules.moon.ui.activity.order.ConfirmMoonOrderActivity | 月饼/兑换 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.ticket.modules.moon.ui.activity.MoonCakeDetailsActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.order.MyMoonCakeOrderActivity | 月饼/兑换 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.huawei.hms.hmsscankit.ScanKitActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.caike.ticket.modules.moon.ui.activity.ScanActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.order.LogisticsActivity | 月饼/兑换 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.ticket.modules.moon.ui.activity.ActivityExchangeMoonCake | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.order.TakeDeliveryAddressActivity | 月饼/兑换 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.ticket.modules.moon.ui.activity.order.TakeSuccessActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.TakeDeliveryActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.MoonCakeVolumeDetailsActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.TakeDeliverySuccessActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.DigitalTrendyPlayActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.CodeErrorActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.MaxImageActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.NewMoonCakeVolumeDetailsActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.MoonCakeMaxImageActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.ticket.modules.moon.ui.activity.NewTakeDeliverySuccessActivity | 月饼/兑换 | 月饼/兑换 | CLONE_1_TO_1 | mapped | /moonEvent | cut |  |
| com.caike.lomo.modules.box.ui.RecoveryConfirmActivity | 盲盒 | 盲盒 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.ExtractGoodsActivity | 盲盒 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.box.ui.OpenBoxResultActivity | 盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.OpenBoxActivity | 盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.TidalBoxSeriesActivity | 盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.BoxOpenRecordActivity | 盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.TidalboxOrderActivity | 盲盒 | 盲盒/福袋 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /box | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.box.ui.BoxOrderDetailsActivity | 盲盒 | 盲盒/福袋 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /box | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.box.ui.BoxLogisticsActivity | 盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.BusinessInfoActivity | 盲盒 | 盲盒 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.MyCardPackageActivity | 盲盒 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.box.ui.CardMaterialBenefitsActivity | 盲盒 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.box.ui.CardMaterialDetailsActivity | 盲盒 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.box.ui.PrizeOrderDetailsActivity | 盲盒 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.box.ui.PrizeRecoveryConfirmActivity | 盲盒 | 盲盒 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.box.ui.PrizeExtractGoodsActivity | 盲盒 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.treasure.ui.TreasureBoxActivity | 宝藏盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.treasure.ui.OpenBoxActivity | 宝藏盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.treasure.ui.OpenBoxResultActivity | 宝藏盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.treasure.ui.TidalBoxSeriesActivity | 宝藏盲盒 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.treasure.ui.TreasureBoxOrderActivity | 宝藏盲盒 | 盲盒/福袋 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /box | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.treasure.ui.TreasureBoxOrderDetailActivity | 宝藏盲盒 | 盲盒/福袋 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /box | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.treasure.ui.TreasureExtractGoodsActivity | 宝藏盲盒 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.treasure.ui.TreasureLogisticsActivity | 宝藏盲盒 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.treasure.ui.TreasureProductDetailActivity | 宝藏盲盒 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.mine.ui.NoticeCenterActivity | 消息/未成年人 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.lomo.modules.mine.ui.NoticeListActivity | 消息/未成年人 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.lomo.modules.mine.ui.NoticeDetailActivity | 消息/未成年人 | 系统/客服 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.lomo.modules.mine.ui.NonageAppealActivity | 消息/未成年人 | 消息/未成年人 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.lomo.modules.mine.ui.NonageAppealResultActivity | 消息/未成年人 | 消息/未成年人 | CLONE_1_TO_1 | mapped | /customerService | defer |  |
| com.caike.lomo.modules.ape.ui.AddPitActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMyGemstoneActivity | 猿宇宙 | 宝石 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeStoneRankActivity | 猿宇宙 | 猿石/矿石 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.ape.ui.ApeGemstoneGiftActivity | 猿宇宙 | 宝石 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeBadgeBankMainActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeBadgeLogActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.RockDiscussionActivity | 猿宇宙 | 猿石/矿石 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.ape.ui.MonkeyPoolActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.PlanetCardSetActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.BuyMonkeyTicketSuccessActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.BuyMonkeyTicketActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.MillionMonkeyTicketActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeCollectionActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApePlanActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.BuysNumberActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeDetailActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeGlodExchangeActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeExchangeRecordActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMySandsActivity | 猿宇宙 | 金沙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMyMedalActivity | 猿宇宙 | 勋章 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.ape.ui.ApeTradeCenterActivity | 猿宇宙 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.ApeTradedOrderActivity | 猿宇宙 | 交易/寄售 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /p2pTrade | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.ApePaymentStatusActivity | 猿宇宙 | 猿宇宙 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /ape | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.ApeMyCardsActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeSandsRecordActivity | 猿宇宙 | 金沙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApePickUpGoodsActivity | 猿宇宙 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.ape.ui.ApeTakeOrderInfoActivity | 猿宇宙 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.ape.ui.ApeMedalRecordActivity | 猿宇宙 | 勋章 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.ape.ui.ApeConfirmOrderActivity | 猿宇宙 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.ApePayActivity | 猿宇宙 | 猿宇宙 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /ape | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.ApeCardsRecordActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMakeToysActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeInviteActivity | 猿宇宙 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.ape.ui.ApeFriendActivity | 猿宇宙 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.ape.ui.ApeArenaActivity | 猿宇宙 | 竞技场 | CLONE_1_TO_1 | implemented | /arena | keep |  |
| com.caike.lomo.modules.ape.ui.ApeProfitRankActivity | 猿宇宙 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.ape.ui.ApeBattleLogsActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMyHeadActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeSandsGiftActivity | 猿宇宙 | 金沙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeCardSelectionActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeSelectionCardsActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeUniverseCardActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMedalExchangeActivity | 猿宇宙 | 勋章 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.ape.ui.ApeGoldRetrieveActivity | 猿宇宙 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.ape.ui.ApeGoldRetrieveResultActivity | 猿宇宙 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMakeToysSuccActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMyPlanetCardActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeComposeCardActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.ApeSplitCardActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.UniversePlanetCardActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.MillionMonkeyMyLogActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.MillionMonkeyHistoryLogActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.HistoryMonkeyTicketActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.MonkeyTicketDetailActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMedalGoldRecordActivity | 猿宇宙 | 勋章 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.ape.ui.MonkeyKingActivity | 猿宇宙 | 炸猴王 | CLONE_1_TO_1 | implemented | /rocksMonkeyKing | keep |  |
| com.caike.lomo.modules.ape.ui.ApeCoinsTradedOrderActivity | 猿宇宙 | 交易/寄售 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /p2pTrade | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.ApeApplicationActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeTradeCenterBadgeActivity | 猿宇宙 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.ApeTradedOrderBadgeActivity | 猿宇宙 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.ApeFriendExamineActivity | 猿宇宙 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.ape.ui.ApeSafeBoxActivity | 猿宇宙 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.ape.ui.ApeSafeBoxOpActivity | 猿宇宙 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.ape.ui.CardStorageActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.MedalStorageActivity | 猿宇宙 | 勋章 | CLONE_1_TO_1 | implemented | /undertown | keep |  |
| com.caike.lomo.modules.ape.ui.ApePrivateMinesFriendActivity | 猿宇宙 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.ape.ui.ApeSafeBoxSeriesSelectActivity | 猿宇宙 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.ape.ui.GroupPurchaseConfirmActivity | 猿宇宙 | 拼团 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.GroupPurchasePayStatusActivity | 猿宇宙 | 拼团 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.ApeGroupPurchaseNewActivity | 猿宇宙 | 拼团 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.GroupPurchaseOrderActivity | 猿宇宙 | 拼团 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /p2pTrade | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.GroupBuyOrderDetailAcitivity | 猿宇宙 | 拼团 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /p2pTrade | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.GroupPurchaseHistoryActivity | 猿宇宙 | 拼团 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.ape.ui.ProductUniverseCardListActivity | 猿宇宙 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.ape.ui.MonkeyKingRankActivity | 猿宇宙 | 炸猴王 | CLONE_1_TO_1 | implemented | /rocksMonkeyKing | keep |  |
| com.caike.lomo.modules.ape.ui.ApeMyMiningFriendActivity | 猿宇宙 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.ape.ui.ApeSearchActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeFriendGemstoneActivity | 猿宇宙 | 宝石 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeRanksDetailsActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeProductSpecialActivity | 猿宇宙 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.ape.ui.PuzzleIndexActivity | 猿宇宙 | 拼图矿场 | CLONE_1_TO_1 | implemented | /apeMine | keep |  |
| com.caike.lomo.modules.ape.ui.PuzzleDetailActivity | 猿宇宙 | 拼图矿场 | CLONE_1_TO_1 | implemented | /apeMine | keep |  |
| com.caike.lomo.modules.ape.ui.PuzzleMineAddActivity | 猿宇宙 | 拼图矿场 | CLONE_1_TO_1 | implemented | /apeMine | keep |  |
| com.caike.lomo.modules.ape.ui.PuzzleOrderDetailActivity | 猿宇宙 | 拼图矿场 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /apeMine | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.ape.ui.PuzzleRecordActivity | 猿宇宙 | 拼图矿场 | CLONE_1_TO_1 | implemented | /apeMine | keep |  |
| com.caike.lomo.modules.ape.ui.GemstoneLeasingActivity | 猿宇宙 | 宝石 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.GemstoneLeasingDetailsActivity | 猿宇宙 | 宝石 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ShopManagerActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.ApeHeadActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.GemStatisticsActivity | 猿宇宙 | 猿宇宙 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.ape.ui.GiveRocksInfoActivity | 猿宇宙 | 猿石/矿石 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.ape.ui.ApeHeadCopyrightActivity | 猿宇宙 | IP/设计师 | CLONE_1_TO_1 | mapped | /creator | defer |  |
| com.caike.lomo.modules.warcraft.ui.WarcraftWithdrawLogActivity | 猿石魔兽 | 猿石魔兽 | UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED | sandbox-only | /warcraft | sandbox | 提现/现金结算屏：UI+状态机 1:1，绑定沙盒桥，无真实兑付 |
| com.caike.lomo.modules.warcraft.ui.WarcraftExchangeLogActivity | 猿石魔兽 | 猿石魔兽 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.battle.ui.ApeRabbitMainActivity | 猿兔战斗 | 猿兔战斗 | CLONE_1_TO_1 | implemented | /apeRabbit | keep |  |
| com.caike.lomo.modules.battle.ui.ApeRabbitLogActivity | 猿兔战斗 | 猿兔战斗 | CLONE_1_TO_1 | implemented | /apeRabbit | keep |  |
| com.caike.lomo.modules.battle.ui.ApeRabbitResultActivity | 猿兔战斗 | 猿兔战斗 | CLONE_1_TO_1 | implemented | /apeRabbit | keep |  |
| com.caike.lomo.modules.battle.ui.MiningLogActivity | 猿兔战斗 | 猿兔战斗 | CLONE_1_TO_1 | implemented | /apeRabbit | keep |  |
| com.caike.lomo.modules.applet.ui.MarblesActivity | 小游戏集合 | 弹珠 | CLONE_1_TO_1 | implemented | /marbles | keep |  |
| com.caike.lomo.modules.applet.ui.EscapeTigerMouthRecordActivity | 小游戏集合 | 虎口逃生 | CLONE_1_TO_1 | implemented | /escapeTiger | keep |  |
| com.caike.lomo.modules.applet.ui.EscapeTigerMouthActivity | 小游戏集合 | 虎口逃生 | CLONE_1_TO_1 | implemented | /escapeTiger | keep |  |
| com.caike.lomo.modules.applet.ui.PunchInRecordActivity | 小游戏集合 | 小游戏集合 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.applet.ui.PunchInRankActivity | 小游戏集合 | 小游戏集合 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.applet.ui.PunchInActivity | 小游戏集合 | 小游戏集合 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.applet.ui.SportsMeetActivity | 小游戏集合 | 运动会 | CLONE_1_TO_1 | implemented | /sports | keep |  |
| com.caike.lomo.modules.applet.ui.SportLogsActivity | 小游戏集合 | 运动会 | CLONE_1_TO_1 | implemented | /sports | keep |  |
| com.caike.lomo.modules.applet.ui.ChickenActivity | 小游戏集合 | 今晚吃鸡 | CLONE_1_TO_1 | implemented | /chicken | keep |  |
| com.caike.lomo.modules.applet.ui.ChickenLogsActivity | 小游戏集合 | 今晚吃鸡 | CLONE_1_TO_1 | implemented | /chicken | keep |  |
| com.caike.lomo.modules.applet.ui.BattleRoyalRankActivity | 小游戏集合 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.nx.ui.RedPackageInfoActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.RedPackageGoodsActivity | NX竞技 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.nx.ui.BattleRockActivity | NX竞技 | 猿石/矿石 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.nx.ui.ChallengeBossActivity | NX竞技 | Boss挑战 | CLONE_1_TO_1 | implemented | /boss | keep |  |
| com.caike.lomo.modules.nx.ui.NxFriendExamineActivity | NX竞技 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.nx.ui.NxRanksDetailsActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.MyNxFriendActivity | NX竞技 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.nx.ui.NxSearchActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.NxFriendWorkActivity | NX竞技 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.nx.ui.NxFriendGemstoneActivity | NX竞技 | 宝石 | CLONE_1_TO_1 | mapped | /ape | keep |  |
| com.caike.lomo.modules.nx.ui.MoreActActivity | NX竞技 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.nx.ui.MyActActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.ActDetailActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.RewardLogsActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.MyPrizeActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.OrderDetailsActivity | NX竞技 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.nx.ui.BuyPrizeActivity | NX竞技 | NX竞技 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.nx.ui.ArenaHomeActivity | NX竞技 | 竞技场 | CLONE_1_TO_1 | implemented | /arena | keep |  |
| com.caike.lomo.modules.nx.ui.ArenaRankActivity | NX竞技 | 竞技场 | CLONE_1_TO_1 | implemented | /arena | keep |  |
| com.caike.lomo.modules.nx.ui.ArenaLogsActivity | NX竞技 | 竞技场 | CLONE_1_TO_1 | implemented | /arena | keep |  |
| com.caike.lomo.modules.nx.ui.ArenaPoolActivity | NX竞技 | 竞技场 | CLONE_1_TO_1 | implemented | /arena | keep |  |
| com.caike.lomo.modules.agent.ui.MyStoreManagerOrderActivity | 店长/代理 | 黄金矿场 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /goldMine | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.agent.ui.GiveCardActivity | 店长/代理 | 卡牌/闪卡 | CLONE_1_TO_1 | implemented | /cards | keep |  |
| com.caike.lomo.modules.agent.ui.AgentLogActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentStockDetailsActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentListActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentThirdLevelListActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AddAgentActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentCardOrderActivity | 店长/代理 | 卡牌/闪卡 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /cards | keep | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.agent.ui.AgentPaymentActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.PaymentToExamineActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentMainActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentInfoActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentStockActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentMarginActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.lomo.modules.agent.ui.AgentConfirmOrderActivity | 店长/代理 | 店长/代理 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /agent | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.agent.ui.StoreDataActivity | 店长/代理 | 黄金矿场 | CLONE_1_TO_1 | implemented | /goldMine | keep |  |
| com.caike.lomo.modules.agent.ui.AgentOrderDetailActivity | 店长/代理 | 店长/代理 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /agent | cut | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.agent.ui.PickConfirmOrderActivity | 店长/代理 | 商城/订单 | CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER | implemented | /mall | defer | 商业流：订单状态机 mock 支付适配器实现 |
| com.caike.lomo.modules.agent.ui.PickStatusActivity | 店长/代理 | 店长/代理 | CLONE_1_TO_1 | mapped | /agent | cut |  |
| com.caike.ticket.modules.rocks.beast.ui.AnimalsMainActivity | 方块兽/动物玩法 | 方块兽/动物玩法 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.ticket.modules.rocks.beast.ui.activity.BeastPrizesActivity | 方块兽/动物玩法 | 方块兽/动物玩法 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.ticket.modules.rocks.beast.ui.activity.ResultsActivity | 方块兽/动物玩法 | 方块兽/动物玩法 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.ticket.modules.rocks.beast.ui.activity.RankActivity | 方块兽/动物玩法 | 方块兽/动物玩法 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.ticket.modules.rocks.beast.ui.activity.HistoryRecordActivity | 方块兽/动物玩法 | 方块兽/动物玩法 | CLONE_1_TO_1 | implemented | /home | keep |  |
| com.caike.lomo.modules.hundred.ui.ApeWebActivity | 百人/IP内容 | 百人/IP内容 | CLONE_1_TO_1 | mapped | /apeHundred | defer |  |
| com.caike.lomo.modules.hundred.ui.HundredImageViewerActivity | 百人/IP内容 | 百人/IP内容 | CLONE_1_TO_1 | mapped | /apeHundred | defer |  |
| com.caike.lomo.modules.hundred.ui.ApeProductActivity | 百人/IP内容 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.hundred.ui.ApeTrendsActivity | 百人/IP内容 | 百人/IP内容 | CLONE_1_TO_1 | mapped | /apeHundred | defer |  |
| com.caike.lomo.modules.hundred.ui.ApeBrandActivity | 百人/IP内容 | 百人/IP内容 | CLONE_1_TO_1 | mapped | /apeHundred | defer |  |
| com.caike.lomo.modules.hundred.ui.ApeBrandDetailActivity | 百人/IP内容 | 百人/IP内容 | CLONE_1_TO_1 | mapped | /apeHundred | defer |  |
| com.caike.lomo.modules.reboom.ui.RocksMonkeyKingActivity | 炸猴王 | 炸猴王 | CLONE_1_TO_1 | implemented | /rocksMonkeyKing | keep |  |
| com.caike.lomo.modules.reboom.ui.RocksMonkeyKingRankActivity | 炸猴王 | 炸猴王 | CLONE_1_TO_1 | implemented | /rocksMonkeyKing | keep |  |
| com.caike.lomo.modules.reboom.ui.RocksMonkeyPoolActivity | 炸猴王 | 猿石/矿石 | CLONE_1_TO_1 | implemented | /warcraft | keep |  |
| com.caike.lomo.modules.superlink.ui.SuperBoxLinkActivity | 超级链接 | 盲盒/福袋 | CLONE_1_TO_1 | implemented | /box | defer |  |
| com.caike.lomo.modules.superlink.ui.BuyRecordsActivity | 超级链接 | 超级链接 | CLONE_1_TO_1 | implemented | /superLink | defer |  |
| com.caike.lomo.modules.superlink.ui.FriendsDetailActivity | 超级链接 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.superlink.ui.SuperLinkBindInviterActivity | 超级链接 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.superlink.ui.SuperLinkInviteCodeActivity | 超级链接 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.superlink.ui.LinkInviteLogsActivity | 超级链接 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.rob.ui.RobMainActivity | 抢夺 | 抢夺/抢劫 | CLONE_1_TO_1 | implemented | /robbery | defer |  |
| com.caike.lomo.modules.rob.ui.RobRankActivity | 抢夺 | 抢夺/抢劫 | CLONE_1_TO_1 | implemented | /robbery | defer |  |
| com.caike.lomo.modules.rob.ui.RobLogActivity | 抢夺 | 抢夺/抢劫 | CLONE_1_TO_1 | implemented | /robbery | defer |  |
| com.caike.lomo.modules.blocks.mall.ui.BlocksDetailActivity | 方块兽 | 方块兽 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.mall.ui.BlockGoodsActivity | 方块兽 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.blocks.mall.ui.BlocksDeliveryGoodsActivity | 方块兽 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.modules.blocks.mall.ui.BlocksDeviceAdapterActivity | 方块兽 | 方块兽 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.multiple.ui.MultiplePitActivity | 多人矿坑 | 多人矿坑 | CLONE_1_TO_1 | implemented | /multiplePit | defer |  |
| com.caike.lomo.modules.multiple.ui.GrandPrizeLogActivity | 多人矿坑 | 多人矿坑 | CLONE_1_TO_1 | implemented | /multiplePit | defer |  |
| com.caike.lomo.modules.multiple.ui.ParticipateInLogActivity | 多人矿坑 | 多人矿坑 | CLONE_1_TO_1 | implemented | /multiplePit | defer |  |
| com.caike.ticket.modules.rocksTug.ui.activity.TugActivity | 拔河 | 拔河 | CLONE_1_TO_1 | implemented | /tug | keep |  |
| com.caike.ticket.modules.rocksTug.ui.activity.TugRecordActivity | 拔河 | 拔河 | CLONE_1_TO_1 | implemented | /tug | keep |  |
| com.caike.ticket.modules.rocksTug.ui.activity.TugRankActivity | 拔河 | 拔河 | CLONE_1_TO_1 | implemented | /tug | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.DaggerActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.DaggerNewActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.DaggerRecordActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.NailActivity | 方块兽 | 方块兽 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.DaggerTradeActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.TradeRecordActivity | 方块兽 | 交易/寄售 | CLONE_1_TO_1 | mapped | /p2pTrade | cut |  |
| com.caike.lomo.modules.blocks.battle.ui.DaggerReleaseActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.ShareActivity | 方块兽 | 方块兽 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.ShareFriendActivity | 方块兽 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.ShareInputActivity | 方块兽 | 方块兽 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.RobberyLogActivity | 方块兽 | 抢夺/抢劫 | CLONE_1_TO_1 | implemented | /robbery | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.RobberyRankActivity | 方块兽 | 抢夺/抢劫 | CLONE_1_TO_1 | implemented | /robbery | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.MyInviterActivity | 方块兽 | 邀请/社交 | CLONE_1_TO_1 | implemented | /social | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.BattleRoyalActivity | 方块兽 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.BettingHistoryActivity | 方块兽 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.RobberyKillerActivity | 方块兽 | 抢夺/抢劫 | CLONE_1_TO_1 | implemented | /robbery | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.BattleRoyalRankActivity | 方块兽 | 大逃杀 | CLONE_1_TO_1 | implemented | /battleRoyal | keep |  |
| com.caike.lomo.modules.blocks.battle.ui.AssassinationHistoryActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.caike.lomo.modules.blocks.battle.ui.MyDaggerActivity | 方块兽 | 匕首/刺杀 | CLONE_1_TO_1 | implemented | /dagger | defer |  |
| com.qq.e.ads.ADActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qq.e.ads.PortraitADActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qq.e.ads.LandscapeADActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.caike.lomo.modules.common.ui.CollectShipActivity | 公共/飞船 | 公共/飞船 | CLONE_1_TO_1 | mapped | /airship | keep |  |
| com.caike.lomo.modules.common.ui.LomoLoginActivity | 公共/飞船 | 账号/身份 | CLONE_1_TO_1 | implemented | /profile | keep |  |
| com.caike.lomo.modules.common.ui.ShipLogActivity | 公共/飞船 | 公共/飞船 | CLONE_1_TO_1 | mapped | /airship | keep |  |
| com.caike.lomo.modules.common.ui.AirshipListActivity | 公共/飞船 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.common.ui.AirshipActivity | 公共/飞船 | 宇宙探索 | CLONE_1_TO_1 | implemented | /universe | keep |  |
| com.caike.lomo.modules.common.ui.SystemMaintenanceActivity | 公共/飞船 | 公共/飞船 | CLONE_1_TO_1 | mapped | /airship | keep |  |
| com.caike.lomo.modules.common.ui.GoodsPreviewActivity | 公共/飞船 | 商城/订单 | CLONE_1_TO_1 | mapped | /mall | defer |  |
| com.caike.lomo.slapi.SLEntryActivity | 系统入口 | 系统入口 | CLONE_1_TO_1 | implemented | /home | keep |  |
| ezy.arch.router.RouterActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.alipay.sdk.app.AlipayResultActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.album.app.album.AlbumActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.album.app.album.GalleryActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.album.app.album.NullActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.album.app.gallery.GalleryActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.album.app.gallery.GalleryAlbumActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.album.app.camera.CameraActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.zhihu.matisse.ui.MatisseActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.zhihu.matisse.internal.ui.AlbumPreviewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.zhihu.matisse.internal.ui.SelectedPreviewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.durban.DurbanActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.draggable.library.extension.ImagesViewerActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| ezy.sdk3rd.social.platforms.weixin.WXCallbackActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yanzhenjie.permission.bridge.BridgeActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.ServiceMessageActivity | 第三方SDK | 系统/客服 | PLATFORM_ADAPTER | platform-replaced | /customerService | defer | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.session.activity.WatchMessagePictureActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.session.activity.PickImageActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.common.media.picker.activity.PickerAlbumActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.common.media.picker.activity.PickerAlbumPreviewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.common.media.picker.activity.PreviewImageFromCameraActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.FileDownloadActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.UrlImagePreviewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.CardPopupActivity | 第三方SDK | 卡牌/闪卡 | PLATFORM_ADAPTER | platform-replaced | /cards | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.session.activity.CaptureVideoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.uikit.session.activity.WatchVideoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.LeaveMessageActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.WatchPictureActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.LeaveMsgCustomFieldMenuActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.mediaselect.internal.ui.activity.AlbumPreviewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.mediaselect.internal.ui.activity.SelectedPreviewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.mediaselect.internal.ui.activity.MatisseActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.fileselect.ui.activity.FilePickerActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.UserWorkSheetListActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qiyukf.unicorn.ui.activity.WorkSheetDetailActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.alipay.sdk.app.H5PayActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.alipay.sdk.app.H5AuthActivity | 第三方SDK | 账号/身份 | PLATFORM_ADAPTER | platform-replaced | /profile | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.alipay.sdk.app.PayResultActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.alipay.sdk.app.H5OpenAuthActivity | 第三方SDK | 账号/身份 | PLATFORM_ADAPTER | platform-replaced | /profile | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.alipay.sdk.app.APayEntranceActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.tencent.bugly.beta.ui.BetaActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| cn.jpush.android.ui.PopWinActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| cn.jpush.android.ui.PushActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| cn.jpush.android.service.DActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| cn.jpush.android.service.JNotifyActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.xuexiang.xupdate.widget.UpdateDialogActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.dtf.face.ui.PortFaceLoadingActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.dtf.face.ui.LandFaceLoadingActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.dtf.face.ui.ToygerLandActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.dtf.face.ui.ToygerPortActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.yiqun.superlink.open.SLEntryActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.labcv.bytedcertsdk.activities.FaceLiveSDKActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.labcv.bytedcertsdk.activities.FaceLivePreActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.labcv.bytedcertsdk.activities.SDKWebActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.labcv.bytedcertsdk.activities.OCRTakePhotoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.applog.migrate.MigrateDetectorActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Activity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Portrait_Activity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Activity_T | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Landscape_Activity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_Activity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_SingleTask_Activity_T | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.bytedance.sdk.openadsdk.stub.activity.Stub_SingleTask_Activity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.ss.android.downloadlib.addownload.compliance.AppPrivacyPolicyActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.ss.android.downloadlib.addownload.compliance.AppDetailInfoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.ss.android.downloadlib.activity.TTDelegateActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.ss.android.downloadlib.activity.JumpKllkActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.ss.android.socialbase.appdownloader.view.DownloadTaskDeleteActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.ss.android.socialbase.appdownloader.view.JumpUnknownSourceActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.AdWebViewActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.KsFullScreenVideoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.KsFullScreenLandScapeVideoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.KsRewardVideoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.KSRewardLandScapeVideoActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.FeedDownloadActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$KsTrendsActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$ProfileHomeActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$ProfileVideoDetailActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$TubeProfileActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$ChannelDetailActivity | 第三方SDK | 邀请/社交 | PLATFORM_ADAPTER | platform-replaced | /social | defer | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$TubeDetailActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$EpisodeDetailActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$RequestInstallPermissionActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity1 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$GoodsPlayBackActivity | 第三方SDK | 商城/订单 | PLATFORM_ADAPTER | platform-replaced | /mall | defer | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity2 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity3 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity4 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity5 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity6 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity7 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity8 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity9 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity10 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleTop1 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleTop2 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleInstance1 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleInstance2 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$DeveloperConfigActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTop1 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTop2 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTask1 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTask2 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleInstance1 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleInstance2 | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qq.e.ads.RewardvideoPortraitADActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qq.e.ads.RewardvideoLandscapeADActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |
| com.qq.e.ads.DialogActivity | 第三方SDK | 第三方SDK | PLATFORM_ADAPTER | platform-replaced | /home | keep | 原 Android SDK 页面由平台适配层替代（登录/支付/广告/客服/扫描） |