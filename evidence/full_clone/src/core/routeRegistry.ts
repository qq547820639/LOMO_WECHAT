export type CloneMode = 'CLONE_1_TO_1' | 'CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER' | 'UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED' | 'PLATFORM_ADAPTER';
export interface LegacyRoute { legacyActivity: string; routeId: string; module: string; feature: string; mode: CloneMode; }

export const LEGACY_ROUTES: LegacyRoute[] = [
  {
    "legacyActivity": "com.caike.lomo.wxapi.WXEntryActivity",
    "routeId": "w-x-entry",
    "module": "微信适配",
    "feature": "微信适配",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.InviteLogsActivity",
    "routeId": "invite-logs",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.ChannelActivity",
    "routeId": "channel",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.ProfitLogsActivity",
    "routeId": "profit-logs",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.ChannelInviteActivity",
    "routeId": "channel-invite",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendCashRewardActivity",
    "routeId": "friend-cash-reward",
    "module": "邀请裂变",
    "feature": "提现/结算",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendLotteryRewardActivity",
    "routeId": "friend-lottery-reward",
    "module": "邀请裂变",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendPropRewardActivity",
    "routeId": "friend-prop-reward",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendActivity",
    "routeId": "friend",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendTideRewardActivity",
    "routeId": "friend-tide-reward",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendTideCashRewardActivity",
    "routeId": "friend-tide-cash-reward",
    "module": "邀请裂变",
    "feature": "提现/结算",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.friend.ui.FriendTideBlankRewardActivity",
    "routeId": "friend-tide-blank-reward",
    "module": "邀请裂变",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.BalanceActivity",
    "routeId": "balance",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.SettingActivity",
    "routeId": "setting",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.InviterActivity",
    "routeId": "inviter",
    "module": "我的/钱包",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.AboutUsActivity",
    "routeId": "about-us",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.PrivateActivity",
    "routeId": "private",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.SocialInformationActivity",
    "routeId": "social-information",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.BindPhoneActivity",
    "routeId": "bind-phone",
    "module": "我的/钱包",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CertificationActivity",
    "routeId": "certification",
    "module": "我的/钱包",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.BalanceLogsActivity",
    "routeId": "balance-logs",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.InviteCodeActivity",
    "routeId": "invite-code",
    "module": "我的/钱包",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.EmptyActivity",
    "routeId": "empty",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.OnlineServiceActivity",
    "routeId": "online-service",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CashResultActivity",
    "routeId": "cash-result",
    "module": "我的/钱包",
    "feature": "提现/结算",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.ElectricityActivity",
    "routeId": "electricity",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinQuestionActivity",
    "routeId": "coin-question",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.QuestionAnswerActivity",
    "routeId": "question-answer",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinActivity",
    "routeId": "coin",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinLogsActivity",
    "routeId": "coin-logs",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinCashActivity",
    "routeId": "coin-cash",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinSendActivity",
    "routeId": "coin-send",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.WalletActivity",
    "routeId": "wallet",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.GiftSuccessActivity",
    "routeId": "gift-success",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.AvatarActivity",
    "routeId": "avatar",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.NicknameActivity",
    "routeId": "nickname",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinAppActivity",
    "routeId": "coin-app",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.MoreAppActivity",
    "routeId": "more-app",
    "module": "我的/钱包",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.NewCoinActivity",
    "routeId": "new-coin",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.WithdrawalMainActivity",
    "routeId": "withdrawal-main",
    "module": "我的/钱包",
    "feature": "抽签/抽奖",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.UnbindPhoneActivity",
    "routeId": "unbind-phone",
    "module": "我的/钱包",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CardActivity",
    "routeId": "card",
    "module": "我的/钱包",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.CoinCashLogsActivity",
    "routeId": "coin-cash-logs",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.TideInviteCodeActivity",
    "routeId": "tide-invite-code",
    "module": "我的/钱包",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.TideInviterActivity",
    "routeId": "tide-inviter",
    "module": "我的/钱包",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.TideSettingActivity",
    "routeId": "tide-setting",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.LomoAccountSecurityActivity",
    "routeId": "lomo-account-security",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.LomoAccountSecurityPayLogActivity",
    "routeId": "lomo-account-security-pay-log",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.LomoDeviceDetailActivity",
    "routeId": "lomo-device-detail",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.MyEmptyModelActivity",
    "routeId": "my-empty-model",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.WhiteModelTradeMarketActivity",
    "routeId": "white-model-trade-market",
    "module": "我的/钱包",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.WhiteModelGiftActivity",
    "routeId": "white-model-gift",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.MyEmptyModelRecordActivity",
    "routeId": "my-empty-model-record",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.WhiteModelTradeRecordActivity",
    "routeId": "white-model-trade-record",
    "module": "我的/钱包",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.ServiceProviderActivity",
    "routeId": "service-provider",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.ServiceRecordActivity",
    "routeId": "service-record",
    "module": "我的/钱包",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.BusinessOrderActivity",
    "routeId": "business-order",
    "module": "我的/钱包",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.LomoMyCoinsActivity",
    "routeId": "lomo-my-coins",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.MyAuctionActivity",
    "routeId": "my-auction",
    "module": "我的/钱包",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.AuctionRecordActivity",
    "routeId": "auction-record",
    "module": "我的/钱包",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.AuctionBusinessActivity",
    "routeId": "auction-business",
    "module": "我的/钱包",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.AuctionSuccessActivity",
    "routeId": "auction-success",
    "module": "我的/钱包",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.LogisticsActivity",
    "routeId": "logistics",
    "module": "我的/钱包",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.NdtuExchangeCenterActivity",
    "routeId": "ndtu-exchange-center",
    "module": "我的/钱包",
    "feature": "我的/钱包",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.TradedOrderCoinActivity",
    "routeId": "traded-order-coin",
    "module": "我的/钱包",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.mine.ui.MyIntegralActivity",
    "routeId": "my-integral",
    "module": "我的/钱包",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.SplashActivity",
    "routeId": "splash",
    "module": "账号/登录",
    "feature": "账号/登录",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.login.LoginActivity",
    "routeId": "login",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.login.AccountLoginActivity",
    "routeId": "account-login",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.WebActivity",
    "routeId": "web",
    "module": "账号/登录",
    "feature": "账号/登录",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.AuthActivity",
    "routeId": "auth",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.RouterActivity",
    "routeId": "router",
    "module": "账号/登录",
    "feature": "账号/登录",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.BrowserRouterActivity",
    "routeId": "browser-router",
    "module": "账号/登录",
    "feature": "账号/登录",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.LocalWebActivity",
    "routeId": "local-web",
    "module": "账号/登录",
    "feature": "账号/登录",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.UpdateActivity",
    "routeId": "update",
    "module": "账号/登录",
    "feature": "账号/登录",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.CertVerifyActivity",
    "routeId": "cert-verify",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.FaceVerifyActivity",
    "routeId": "face-verify",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.LomoAccountSecurityCertVerifyActivity",
    "routeId": "lomo-account-security-cert-verify",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.LomoAccountSecurityFaceVerifyActivity",
    "routeId": "lomo-account-security-face-verify",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.login.AccountLoginActivityLomo",
    "routeId": "account-login-activity-lomo",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.main.ui.CertVerifyResultActivity",
    "routeId": "cert-verify-result",
    "module": "账号/登录",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.FlashGoodsDetailsActivity",
    "routeId": "flash-goods-details",
    "module": "商城/卡牌",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.FlashOrderDetailsActivity",
    "routeId": "flash-order-details",
    "module": "商城/卡牌",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.FlashBagDetailsActivity",
    "routeId": "flash-bag-details",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.ExchangePrizeLogActivity",
    "routeId": "exchange-prize-log",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.ExchangePrizeSuccessActivity",
    "routeId": "exchange-prize-success",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CashPrizeActivity",
    "routeId": "cash-prize",
    "module": "商城/卡牌",
    "feature": "提现/结算",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.GoldCardActivity",
    "routeId": "gold-card",
    "module": "商城/卡牌",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CollectCardSeriesActivity",
    "routeId": "collect-card-series",
    "module": "商城/卡牌",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CollectCardActivity",
    "routeId": "collect-card",
    "module": "商城/卡牌",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.DetachBoxDetailsActivity",
    "routeId": "detach-box-details",
    "module": "商城/卡牌",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.DetachRecordActivity",
    "routeId": "detach-record",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.MyCardLibraryActivity",
    "routeId": "my-card-library",
    "module": "商城/卡牌",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.DetachBagResultActivity",
    "routeId": "detach-bag-result",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.DetachBagActivity",
    "routeId": "detach-bag",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.WithdrawalRecordActivity",
    "routeId": "withdrawal-record",
    "module": "商城/卡牌",
    "feature": "抽签/抽奖",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.TransReleaseActivity",
    "routeId": "trans-release",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CopyrightSaleActivity",
    "routeId": "copyright-sale",
    "module": "商城/卡牌",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CopyrightProfitDetailActivity",
    "routeId": "copyright-profit-detail",
    "module": "商城/卡牌",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CopyrightIncomeDetailActivity",
    "routeId": "copyright-income-detail",
    "module": "商城/卡牌",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.ConfirmCopyrightOrderActivity",
    "routeId": "confirm-copyright-order",
    "module": "商城/卡牌",
    "feature": "IP/设计师",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CopyrightPaySuccessActivity",
    "routeId": "copyright-pay-success",
    "module": "商城/卡牌",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.MyCopyrightActivity",
    "routeId": "my-copyright",
    "module": "商城/卡牌",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CopyrightOrderDetailActivity",
    "routeId": "copyright-order-detail",
    "module": "商城/卡牌",
    "feature": "IP/设计师",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.IpJointlyActivity",
    "routeId": "ip-jointly",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.CopyrightProductionActivity",
    "routeId": "copyright-production",
    "module": "商城/卡牌",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.TransactionDetailsActivity",
    "routeId": "transaction-details",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.DetachDemoBagResultActivity",
    "routeId": "detach-demo-bag-result",
    "module": "商城/卡牌",
    "feature": "商城/卡牌",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeStoneLogsActivity",
    "routeId": "ape-stone-logs",
    "module": "猿宇宙",
    "feature": "猿石/矿石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mall.ui.GoldRabbitDeliveryActivity",
    "routeId": "gold-rabbit-delivery",
    "module": "商城/卡牌",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.BattleRoyalActivity",
    "routeId": "battle-royal",
    "module": "主城/潮玩主页",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.BettingHistoryActivity",
    "routeId": "betting-history",
    "module": "主城/潮玩主页",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.DepositOrderActivity",
    "routeId": "deposit-order",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.DepositExtendActivity",
    "routeId": "deposit-extend",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.DepositToysActivity",
    "routeId": "deposit-toys",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MainActivity",
    "routeId": "main",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LomoOrderActivity",
    "routeId": "lomo-order",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ShoppingCartActivity",
    "routeId": "shopping-cart",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ConfirmOrderActivity",
    "routeId": "confirm-order",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.GoodsDetailsActivity",
    "routeId": "goods-details",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.OrderDetailsActivity",
    "routeId": "order-details",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ReadyPayActivity",
    "routeId": "ready-pay",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.PayActivity",
    "routeId": "pay",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LomoAddressActivity",
    "routeId": "lomo-address",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LomoEditAddressActivity",
    "routeId": "lomo-edit-address",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SearchActivity",
    "routeId": "search",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.PaymentStatusActivity",
    "routeId": "payment-status",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SolidPrintDetailsActivity",
    "routeId": "solid-print-details",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SellPrintsActivity",
    "routeId": "sell-prints",
    "module": "主城/潮玩主页",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyPrintsActivity",
    "routeId": "my-prints",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyPrintsDetailsActivity",
    "routeId": "my-prints-details",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MakingPrintsActivity",
    "routeId": "making-prints",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.PrintsHistoryActivity",
    "routeId": "prints-history",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyPrintsIOperationActivity",
    "routeId": "my-prints-i-operation",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.DestroyPrintsActivity",
    "routeId": "destroy-prints",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.GivePrintActivity",
    "routeId": "give-print",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyWalletActivity",
    "routeId": "my-wallet",
    "module": "主城/潮玩主页",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.WithdrawalActivity",
    "routeId": "withdrawal",
    "module": "主城/潮玩主页",
    "feature": "抽签/抽奖",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyWalletHistoryActivity",
    "routeId": "my-wallet-history",
    "module": "主城/潮玩主页",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LottieAnimationActivity",
    "routeId": "lottie-animation",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.HotBonusActivity",
    "routeId": "hot-bonus",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MailHomeActivity",
    "routeId": "mail-home",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.IPostedActivity",
    "routeId": "i-posted",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ISoldActivity",
    "routeId": "i-sold",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.WinningListActivity",
    "routeId": "winning-list",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MasterRabbitActivity",
    "routeId": "master-rabbit",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ConfirmDrawOrderActivity",
    "routeId": "confirm-draw-order",
    "module": "主城/潮玩主页",
    "feature": "抽签/抽奖",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.PayDrawResultActivity",
    "routeId": "pay-draw-result",
    "module": "主城/潮玩主页",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.AcceptGiftsActivity",
    "routeId": "accept-gifts",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.TideShareActivity",
    "routeId": "tide-share",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.BuySellDetailsActivity",
    "routeId": "buy-sell-details",
    "module": "主城/潮玩主页",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.GlobalTrendPlayActivity",
    "routeId": "global-trend-play",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ConfirmMakeActivity",
    "routeId": "confirm-make",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SaleByDrawActivity",
    "routeId": "sale-by-draw",
    "module": "主城/潮玩主页",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SaleByDrawResultActivity",
    "routeId": "sale-by-draw-result",
    "module": "主城/潮玩主页",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashCardActivity",
    "routeId": "flash-card",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SellGiftBagActivity",
    "routeId": "sell-gift-bag",
    "module": "主城/潮玩主页",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashCardLogsActivity",
    "routeId": "flash-card-logs",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MasterPointsDetailsActivity",
    "routeId": "master-points-details",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MasterDetailsActivity",
    "routeId": "master-details",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SendFlashcardActivity",
    "routeId": "send-flashcard",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.CommonConfirmOrderActivity",
    "routeId": "common-confirm-order",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardOrderDetailsActivity",
    "routeId": "flashcard-order-details",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LuckyBagActivity",
    "routeId": "lucky-bag",
    "module": "主城/潮玩主页",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LuckyBagLogsActivity",
    "routeId": "lucky-bag-logs",
    "module": "主城/潮玩主页",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LuckyBagRankingActivity",
    "routeId": "lucky-bag-ranking",
    "module": "主城/潮玩主页",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LuckyBagOrderDetailsActivity",
    "routeId": "lucky-bag-order-details",
    "module": "主城/潮玩主页",
    "feature": "盲盒/福袋",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.LogisticsActivity",
    "routeId": "logistics",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.ConfirmDepositOrderActivity",
    "routeId": "confirm-deposit-order",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.DepositOrderDetailsActivity",
    "routeId": "deposit-order-details",
    "module": "主城/潮玩主页",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashCardByScanActivity",
    "routeId": "flash-card-by-scan",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardTradeActivity",
    "routeId": "flashcard-trade",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardTradeOperateActivity",
    "routeId": "flashcard-trade-operate",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardTradeLogsActivity",
    "routeId": "flashcard-trade-logs",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardOrderTradeActivity",
    "routeId": "flashcard-order-trade",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardSaleActivity",
    "routeId": "flashcard-sale",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.WalletIntegralActivity",
    "routeId": "wallet-integral",
    "module": "主城/潮玩主页",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyIntegralActivity",
    "routeId": "my-integral",
    "module": "主城/潮玩主页",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyIntegralHistoryActivity",
    "routeId": "my-integral-history",
    "module": "主城/潮玩主页",
    "feature": "钱包/资产",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SynthesisCardActivity",
    "routeId": "synthesis-card",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashCardSynthesisSuccessActivity",
    "routeId": "flash-card-synthesis-success",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MySynthesisActivity",
    "routeId": "my-synthesis",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.FlashcardExchangeActivity",
    "routeId": "flashcard-exchange",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.RareCardTradeActivity",
    "routeId": "rare-card-trade",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.GoldCardTradeActivity",
    "routeId": "gold-card-trade",
    "module": "主城/潮玩主页",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.CardServiceProviderActivity",
    "routeId": "card-service-provider",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.CardRecordActivity",
    "routeId": "card-record",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SellGoldCardActivity",
    "routeId": "sell-gold-card",
    "module": "主城/潮玩主页",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.flashcard.CardSellSuccessActivity",
    "routeId": "card-sell-success",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.SellGoldRabbitActivity",
    "routeId": "sell-gold-rabbit",
    "module": "主城/潮玩主页",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.CardCabinetActivity",
    "routeId": "card-cabinet",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.CabinetPickUpActivity",
    "routeId": "cabinet-pick-up",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.CardPickupSuccActivity",
    "routeId": "card-pickup-succ",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.CardStorageLogActivity",
    "routeId": "card-storage-log",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.WithdrawResultActivity",
    "routeId": "withdraw-result",
    "module": "主城/潮玩主页",
    "feature": "抽签/抽奖",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MonkeyFightingSiteActivity",
    "routeId": "monkey-fighting-site",
    "module": "主城/潮玩主页",
    "feature": "斗猿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MonkeyFightingHistoryActivity",
    "routeId": "monkey-fighting-history",
    "module": "主城/潮玩主页",
    "feature": "斗猿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.MyNXRedPackageHistoryActivity",
    "routeId": "my-n-x-red-package-history",
    "module": "主城/潮玩主页",
    "feature": "主城/潮玩主页",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.NewBattleRoyalActivity",
    "routeId": "new-battle-royal",
    "module": "主城/潮玩主页",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.NewBettingHistoryActivity",
    "routeId": "new-betting-history",
    "module": "主城/潮玩主页",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.home.ui.CardCabinetListActivity",
    "routeId": "card-cabinet-list",
    "module": "主城/潮玩主页",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DigitalPaintingDetailsActivity",
    "routeId": "digital-painting-details",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.PrintAuctionActivity",
    "routeId": "print-auction",
    "module": "数字潮玩",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.PrintBiddingActivity",
    "routeId": "print-bidding",
    "module": "数字潮玩",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.BiddingDetailsActivity",
    "routeId": "bidding-details",
    "module": "数字潮玩",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.AuctionDetailsActivity",
    "routeId": "auction-details",
    "module": "数字潮玩",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DrawDetailsActivity",
    "routeId": "draw-details",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.ChoicePledgeActivity",
    "routeId": "choice-pledge",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DrawCodeActivity",
    "routeId": "draw-code",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.ExchangeDetailsActivity",
    "routeId": "exchange-details",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.OfferingCalendarActivity",
    "routeId": "offering-calendar",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.GlobalTideActivity",
    "routeId": "global-tide",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.ExchangeActivity",
    "routeId": "exchange",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.AuctionRecordsActivity",
    "routeId": "auction-records",
    "module": "数字潮玩",
    "feature": "竞拍",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.PrintsConfirmOrderActivity",
    "routeId": "prints-confirm-order",
    "module": "数字潮玩",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.PrintsPayActivity",
    "routeId": "prints-pay",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.ScanCodeActivity",
    "routeId": "scan-code",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DigitalLuckyDrawActivity",
    "routeId": "digital-lucky-draw",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DigitalLuckDrawWinnerActivity",
    "routeId": "digital-luck-draw-winner",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DealInfoActivity",
    "routeId": "deal-info",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.PrintDrawActivity",
    "routeId": "print-draw",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.TideDetailsActivity",
    "routeId": "tide-details",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.SaleReleaseTideActivity",
    "routeId": "sale-release-tide",
    "module": "数字潮玩",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.GlobalTideDetailsActivity",
    "routeId": "global-tide-details",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.LuckyDraw100Win400Activity",
    "routeId": "lucky-draw100-win400",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.MostPopularRankActivity",
    "routeId": "most-popular-rank",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.ApplyCooperationActivity",
    "routeId": "apply-cooperation",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.TideTradeDetailsActivity",
    "routeId": "tide-trade-details",
    "module": "数字潮玩",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DetailSoldActivity",
    "routeId": "detail-sold",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.MostPopularRecordActivity",
    "routeId": "most-popular-record",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.LuckDraw100Win400ListActivity",
    "routeId": "luck-draw100-win400-list",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.LomoLotteryActivity",
    "routeId": "lomo-lottery",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.LotteryDetailsActivity",
    "routeId": "lottery-details",
    "module": "数字潮玩",
    "feature": "抽签/抽奖",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.SearchTideActivity",
    "routeId": "search-tide",
    "module": "数字潮玩",
    "feature": "数字潮玩",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DigitalCardDetailActivity",
    "routeId": "digital-card-detail",
    "module": "数字潮玩",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.digtal.ui.DigitalcardIndexActivity",
    "routeId": "digitalcard-index",
    "module": "数字潮玩",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.BecomeDesignerActivity",
    "routeId": "become-designer",
    "module": "设计师",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.UploadWorkActivity",
    "routeId": "upload-work",
    "module": "设计师",
    "feature": "设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.FillInfoActivity",
    "routeId": "fill-info",
    "module": "设计师",
    "feature": "设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.DesignerAwardActivity",
    "routeId": "designer-award",
    "module": "设计师",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.MyWorkActivity",
    "routeId": "my-work",
    "module": "设计师",
    "feature": "设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.IndividualDesignerActivity",
    "routeId": "individual-designer",
    "module": "设计师",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.IpCooperationActivity",
    "routeId": "ip-cooperation",
    "module": "设计师",
    "feature": "设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.design.ui.TideCreationActivity",
    "routeId": "tide-creation",
    "module": "设计师",
    "feature": "设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.LevelRewardActivity",
    "routeId": "level-reward",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.ProbDetailActivity",
    "routeId": "prob-detail",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.UndertownLogsActivity",
    "routeId": "undertown-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.LevelRewardLogsActivity",
    "routeId": "level-reward-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.TicketAllocationLogsActivity",
    "routeId": "ticket-allocation-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.ModelAllotActivity",
    "routeId": "model-allot",
    "module": "地下城",
    "feature": "地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.DailyTopHundredActivity",
    "routeId": "daily-top-hundred",
    "module": "地下城",
    "feature": "地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.UndertownLogsDetailActivity",
    "routeId": "undertown-logs-detail",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.UndertownActivity",
    "routeId": "undertown",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.TideUndertownLogsActivity",
    "routeId": "tide-undertown-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.ApeUndertownActivity",
    "routeId": "ape-undertown",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.MedalAllotActivity",
    "routeId": "medal-allot",
    "module": "地下城",
    "feature": "勋章",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.NewLevelRewardActivity",
    "routeId": "new-level-reward",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.NewTicketAllocationLogsActivity",
    "routeId": "new-ticket-allocation-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.NewProbDetailActivity",
    "routeId": "new-prob-detail",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.ApeLadderLogsActivity",
    "routeId": "ape-ladder-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.NewLevelRewardLogsActivity",
    "routeId": "new-level-reward-logs",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.NewDailyTopHundredActivity",
    "routeId": "new-daily-top-hundred",
    "module": "地下城",
    "feature": "地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.undertown.ui.dungeons.ApeLadderLogsDetailActivity",
    "routeId": "ape-ladder-logs-detail",
    "module": "地下城",
    "feature": "宝石地下城",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.HeroListActivity",
    "routeId": "hero-list",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardDeedActivity",
    "routeId": "wizard-deed",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.DarkPlanetActivity",
    "routeId": "dark-planet",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.HeroActivity",
    "routeId": "hero",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.UpgradeUFOActivity",
    "routeId": "upgrade-u-f-o",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.ExploreRecordActivity",
    "routeId": "explore-record",
    "module": "宇宙探索",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.AddWarehouseActivity",
    "routeId": "add-warehouse",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.HeroDetailRecordActivity",
    "routeId": "hero-detail-record",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.InviteAccelerateRecordActivity",
    "routeId": "invite-accelerate-record",
    "module": "宇宙探索",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.InviteHelpActivity",
    "routeId": "invite-help",
    "module": "宇宙探索",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.HeroStoreActivity",
    "routeId": "hero-store",
    "module": "宇宙探索",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.AirshipLogsActivity",
    "routeId": "airship-logs",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardStarActivity",
    "routeId": "wizard-star",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardContractDetailsActivity",
    "routeId": "wizard-contract-details",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardContractDetailsRabbitsActivity",
    "routeId": "wizard-contract-details-rabbits",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardContractActivity",
    "routeId": "wizard-contract",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardDepositTakeRecordActivity",
    "routeId": "wizard-deposit-take-record",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.WizardNDTUPondActivity",
    "routeId": "wizard-n-d-t-u-pond",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.ExploreWarehouseActivity",
    "routeId": "explore-warehouse",
    "module": "宇宙探索",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.ExplorePlanetActivity",
    "routeId": "explore-planet",
    "module": "宇宙探索",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.ExploreLogsActivity",
    "routeId": "explore-logs",
    "module": "宇宙探索",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.TempleActivity",
    "routeId": "temple",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.universe.ui.UniverseActivity",
    "routeId": "universe",
    "module": "宇宙探索",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.GoldMineActivity",
    "routeId": "gold-mine",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.FineGoldActivity",
    "routeId": "fine-gold",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.MyMineralActivity",
    "routeId": "my-mineral",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.MineralRecordActivity",
    "routeId": "mineral-record",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.MineralDataActivity",
    "routeId": "mineral-data",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.FineRecordActivity",
    "routeId": "fine-record",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.StarPageActivity",
    "routeId": "star-page",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.GoldPageActivity",
    "routeId": "gold-page",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.TakeGoldActivity",
    "routeId": "take-gold",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.TakeOrderInfoActivity",
    "routeId": "take-order-info",
    "module": "黄金矿场",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.OreTradingActivity",
    "routeId": "ore-trading",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.BecomeGoldServiceActivity",
    "routeId": "become-gold-service",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.GoldServiceProviderActivity",
    "routeId": "gold-service-provider",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.ServiceProviderRecordActivity",
    "routeId": "service-provider-record",
    "module": "黄金矿场",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.GoldExchangeActivity",
    "routeId": "gold-exchange",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.MonkeyContractActivity",
    "routeId": "monkey-contract",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.gold.ui.activity.ShipRecordActivity",
    "routeId": "ship-record",
    "module": "黄金矿场",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.MoonCakeMainActivity",
    "routeId": "moon-cake-main",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.AddAddressActivity",
    "routeId": "add-address",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.AddressActivity",
    "routeId": "address",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.PaySuccessActivity",
    "routeId": "pay-success",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.MyMoonCakeVolumeOrderActivity",
    "routeId": "my-moon-cake-volume-order",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.MoonCakeVolumeOrderDetailsActivity",
    "routeId": "moon-cake-volume-order-details",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.MoonCakeOrderDetailsActivity",
    "routeId": "moon-cake-order-details",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.ConfirmMoonOrderActivity",
    "routeId": "confirm-moon-order",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.MoonCakeDetailsActivity",
    "routeId": "moon-cake-details",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.MyMoonCakeOrderActivity",
    "routeId": "my-moon-cake-order",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.huawei.hms.hmsscankit.ScanKitActivity",
    "routeId": "scan-kit",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.ScanActivity",
    "routeId": "scan",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.LogisticsActivity",
    "routeId": "logistics",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.ActivityExchangeMoonCake",
    "routeId": "activity-exchange-moon-cake",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.TakeDeliveryAddressActivity",
    "routeId": "take-delivery-address",
    "module": "月饼/兑换",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.order.TakeSuccessActivity",
    "routeId": "take-success",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.TakeDeliveryActivity",
    "routeId": "take-delivery",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.MoonCakeVolumeDetailsActivity",
    "routeId": "moon-cake-volume-details",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.TakeDeliverySuccessActivity",
    "routeId": "take-delivery-success",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.DigitalTrendyPlayActivity",
    "routeId": "digital-trendy-play",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.CodeErrorActivity",
    "routeId": "code-error",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.MaxImageActivity",
    "routeId": "max-image",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.NewMoonCakeVolumeDetailsActivity",
    "routeId": "new-moon-cake-volume-details",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.MoonCakeMaxImageActivity",
    "routeId": "moon-cake-max-image",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.moon.ui.activity.NewTakeDeliverySuccessActivity",
    "routeId": "new-take-delivery-success",
    "module": "月饼/兑换",
    "feature": "月饼/兑换",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.RecoveryConfirmActivity",
    "routeId": "recovery-confirm",
    "module": "盲盒",
    "feature": "盲盒",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.ExtractGoodsActivity",
    "routeId": "extract-goods",
    "module": "盲盒",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.OpenBoxResultActivity",
    "routeId": "open-box-result",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.OpenBoxActivity",
    "routeId": "open-box",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.TidalBoxSeriesActivity",
    "routeId": "tidal-box-series",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.BoxOpenRecordActivity",
    "routeId": "box-open-record",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.TidalboxOrderActivity",
    "routeId": "tidalbox-order",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.BoxOrderDetailsActivity",
    "routeId": "box-order-details",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.BoxLogisticsActivity",
    "routeId": "box-logistics",
    "module": "盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.BusinessInfoActivity",
    "routeId": "business-info",
    "module": "盲盒",
    "feature": "盲盒",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.MyCardPackageActivity",
    "routeId": "my-card-package",
    "module": "盲盒",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.CardMaterialBenefitsActivity",
    "routeId": "card-material-benefits",
    "module": "盲盒",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.CardMaterialDetailsActivity",
    "routeId": "card-material-details",
    "module": "盲盒",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.PrizeOrderDetailsActivity",
    "routeId": "prize-order-details",
    "module": "盲盒",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.PrizeRecoveryConfirmActivity",
    "routeId": "prize-recovery-confirm",
    "module": "盲盒",
    "feature": "盲盒",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.box.ui.PrizeExtractGoodsActivity",
    "routeId": "prize-extract-goods",
    "module": "盲盒",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TreasureBoxActivity",
    "routeId": "treasure-box",
    "module": "宝藏盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.OpenBoxActivity",
    "routeId": "open-box",
    "module": "宝藏盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.OpenBoxResultActivity",
    "routeId": "open-box-result",
    "module": "宝藏盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TidalBoxSeriesActivity",
    "routeId": "tidal-box-series",
    "module": "宝藏盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TreasureBoxOrderActivity",
    "routeId": "treasure-box-order",
    "module": "宝藏盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TreasureBoxOrderDetailActivity",
    "routeId": "treasure-box-order-detail",
    "module": "宝藏盲盒",
    "feature": "盲盒/福袋",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TreasureExtractGoodsActivity",
    "routeId": "treasure-extract-goods",
    "module": "宝藏盲盒",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TreasureLogisticsActivity",
    "routeId": "treasure-logistics",
    "module": "宝藏盲盒",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.treasure.ui.TreasureProductDetailActivity",
    "routeId": "treasure-product-detail",
    "module": "宝藏盲盒",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mine.ui.NoticeCenterActivity",
    "routeId": "notice-center",
    "module": "消息/未成年人",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mine.ui.NoticeListActivity",
    "routeId": "notice-list",
    "module": "消息/未成年人",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mine.ui.NoticeDetailActivity",
    "routeId": "notice-detail",
    "module": "消息/未成年人",
    "feature": "系统/客服",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mine.ui.NonageAppealActivity",
    "routeId": "nonage-appeal",
    "module": "消息/未成年人",
    "feature": "消息/未成年人",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.mine.ui.NonageAppealResultActivity",
    "routeId": "nonage-appeal-result",
    "module": "消息/未成年人",
    "feature": "消息/未成年人",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.AddPitActivity",
    "routeId": "add-pit",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMyGemstoneActivity",
    "routeId": "ape-my-gemstone",
    "module": "猿宇宙",
    "feature": "宝石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeStoneRankActivity",
    "routeId": "ape-stone-rank",
    "module": "猿宇宙",
    "feature": "猿石/矿石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeGemstoneGiftActivity",
    "routeId": "ape-gemstone-gift",
    "module": "猿宇宙",
    "feature": "宝石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeBadgeBankMainActivity",
    "routeId": "ape-badge-bank-main",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeBadgeLogActivity",
    "routeId": "ape-badge-log",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.RockDiscussionActivity",
    "routeId": "rock-discussion",
    "module": "猿宇宙",
    "feature": "猿石/矿石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MonkeyPoolActivity",
    "routeId": "monkey-pool",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.PlanetCardSetActivity",
    "routeId": "planet-card-set",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.BuyMonkeyTicketSuccessActivity",
    "routeId": "buy-monkey-ticket-success",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.BuyMonkeyTicketActivity",
    "routeId": "buy-monkey-ticket",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MillionMonkeyTicketActivity",
    "routeId": "million-monkey-ticket",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeCollectionActivity",
    "routeId": "ape-collection",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeActivity",
    "routeId": "ape",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApePlanActivity",
    "routeId": "ape-plan",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.BuysNumberActivity",
    "routeId": "buys-number",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeDetailActivity",
    "routeId": "ape-detail",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeGlodExchangeActivity",
    "routeId": "ape-glod-exchange",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeExchangeRecordActivity",
    "routeId": "ape-exchange-record",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMySandsActivity",
    "routeId": "ape-my-sands",
    "module": "猿宇宙",
    "feature": "金沙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMyMedalActivity",
    "routeId": "ape-my-medal",
    "module": "猿宇宙",
    "feature": "勋章",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeTradeCenterActivity",
    "routeId": "ape-trade-center",
    "module": "猿宇宙",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeTradedOrderActivity",
    "routeId": "ape-traded-order",
    "module": "猿宇宙",
    "feature": "交易/寄售",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApePaymentStatusActivity",
    "routeId": "ape-payment-status",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMyCardsActivity",
    "routeId": "ape-my-cards",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSandsRecordActivity",
    "routeId": "ape-sands-record",
    "module": "猿宇宙",
    "feature": "金沙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApePickUpGoodsActivity",
    "routeId": "ape-pick-up-goods",
    "module": "猿宇宙",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeTakeOrderInfoActivity",
    "routeId": "ape-take-order-info",
    "module": "猿宇宙",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMedalRecordActivity",
    "routeId": "ape-medal-record",
    "module": "猿宇宙",
    "feature": "勋章",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeConfirmOrderActivity",
    "routeId": "ape-confirm-order",
    "module": "猿宇宙",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApePayActivity",
    "routeId": "ape-pay",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeCardsRecordActivity",
    "routeId": "ape-cards-record",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMakeToysActivity",
    "routeId": "ape-make-toys",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeInviteActivity",
    "routeId": "ape-invite",
    "module": "猿宇宙",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeFriendActivity",
    "routeId": "ape-friend",
    "module": "猿宇宙",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeArenaActivity",
    "routeId": "ape-arena",
    "module": "猿宇宙",
    "feature": "竞技场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeProfitRankActivity",
    "routeId": "ape-profit-rank",
    "module": "猿宇宙",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeBattleLogsActivity",
    "routeId": "ape-battle-logs",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMyHeadActivity",
    "routeId": "ape-my-head",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSandsGiftActivity",
    "routeId": "ape-sands-gift",
    "module": "猿宇宙",
    "feature": "金沙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeCardSelectionActivity",
    "routeId": "ape-card-selection",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSelectionCardsActivity",
    "routeId": "ape-selection-cards",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeUniverseCardActivity",
    "routeId": "ape-universe-card",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMedalExchangeActivity",
    "routeId": "ape-medal-exchange",
    "module": "猿宇宙",
    "feature": "勋章",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeGoldRetrieveActivity",
    "routeId": "ape-gold-retrieve",
    "module": "猿宇宙",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeGoldRetrieveResultActivity",
    "routeId": "ape-gold-retrieve-result",
    "module": "猿宇宙",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMakeToysSuccActivity",
    "routeId": "ape-make-toys-succ",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMyPlanetCardActivity",
    "routeId": "ape-my-planet-card",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeComposeCardActivity",
    "routeId": "ape-compose-card",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSplitCardActivity",
    "routeId": "ape-split-card",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.UniversePlanetCardActivity",
    "routeId": "universe-planet-card",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MillionMonkeyMyLogActivity",
    "routeId": "million-monkey-my-log",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MillionMonkeyHistoryLogActivity",
    "routeId": "million-monkey-history-log",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.HistoryMonkeyTicketActivity",
    "routeId": "history-monkey-ticket",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MonkeyTicketDetailActivity",
    "routeId": "monkey-ticket-detail",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMedalGoldRecordActivity",
    "routeId": "ape-medal-gold-record",
    "module": "猿宇宙",
    "feature": "勋章",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MonkeyKingActivity",
    "routeId": "monkey-king",
    "module": "猿宇宙",
    "feature": "炸猴王",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeCoinsTradedOrderActivity",
    "routeId": "ape-coins-traded-order",
    "module": "猿宇宙",
    "feature": "交易/寄售",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeApplicationActivity",
    "routeId": "ape-application",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeTradeCenterBadgeActivity",
    "routeId": "ape-trade-center-badge",
    "module": "猿宇宙",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeTradedOrderBadgeActivity",
    "routeId": "ape-traded-order-badge",
    "module": "猿宇宙",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeFriendExamineActivity",
    "routeId": "ape-friend-examine",
    "module": "猿宇宙",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSafeBoxActivity",
    "routeId": "ape-safe-box",
    "module": "猿宇宙",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSafeBoxOpActivity",
    "routeId": "ape-safe-box-op",
    "module": "猿宇宙",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.CardStorageActivity",
    "routeId": "card-storage",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MedalStorageActivity",
    "routeId": "medal-storage",
    "module": "猿宇宙",
    "feature": "勋章",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApePrivateMinesFriendActivity",
    "routeId": "ape-private-mines-friend",
    "module": "猿宇宙",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSafeBoxSeriesSelectActivity",
    "routeId": "ape-safe-box-series-select",
    "module": "猿宇宙",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GroupPurchaseConfirmActivity",
    "routeId": "group-purchase-confirm",
    "module": "猿宇宙",
    "feature": "拼团",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GroupPurchasePayStatusActivity",
    "routeId": "group-purchase-pay-status",
    "module": "猿宇宙",
    "feature": "拼团",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeGroupPurchaseNewActivity",
    "routeId": "ape-group-purchase-new",
    "module": "猿宇宙",
    "feature": "拼团",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GroupPurchaseOrderActivity",
    "routeId": "group-purchase-order",
    "module": "猿宇宙",
    "feature": "拼团",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GroupBuyOrderDetailAcitivity",
    "routeId": "group-buy-order-detail-acitivity",
    "module": "猿宇宙",
    "feature": "拼团",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GroupPurchaseHistoryActivity",
    "routeId": "group-purchase-history",
    "module": "猿宇宙",
    "feature": "拼团",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ProductUniverseCardListActivity",
    "routeId": "product-universe-card-list",
    "module": "猿宇宙",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.MonkeyKingRankActivity",
    "routeId": "monkey-king-rank",
    "module": "猿宇宙",
    "feature": "炸猴王",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeMyMiningFriendActivity",
    "routeId": "ape-my-mining-friend",
    "module": "猿宇宙",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeSearchActivity",
    "routeId": "ape-search",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeFriendGemstoneActivity",
    "routeId": "ape-friend-gemstone",
    "module": "猿宇宙",
    "feature": "宝石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeRanksDetailsActivity",
    "routeId": "ape-ranks-details",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeProductSpecialActivity",
    "routeId": "ape-product-special",
    "module": "猿宇宙",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.PuzzleIndexActivity",
    "routeId": "puzzle-index",
    "module": "猿宇宙",
    "feature": "拼图矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.PuzzleDetailActivity",
    "routeId": "puzzle-detail",
    "module": "猿宇宙",
    "feature": "拼图矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.PuzzleMineAddActivity",
    "routeId": "puzzle-mine-add",
    "module": "猿宇宙",
    "feature": "拼图矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.PuzzleOrderDetailActivity",
    "routeId": "puzzle-order-detail",
    "module": "猿宇宙",
    "feature": "拼图矿场",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.PuzzleRecordActivity",
    "routeId": "puzzle-record",
    "module": "猿宇宙",
    "feature": "拼图矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GemstoneLeasingActivity",
    "routeId": "gemstone-leasing",
    "module": "猿宇宙",
    "feature": "宝石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GemstoneLeasingDetailsActivity",
    "routeId": "gemstone-leasing-details",
    "module": "猿宇宙",
    "feature": "宝石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ShopManagerActivity",
    "routeId": "shop-manager",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeHeadActivity",
    "routeId": "ape-head",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GemStatisticsActivity",
    "routeId": "gem-statistics",
    "module": "猿宇宙",
    "feature": "猿宇宙",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.GiveRocksInfoActivity",
    "routeId": "give-rocks-info",
    "module": "猿宇宙",
    "feature": "猿石/矿石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.ape.ui.ApeHeadCopyrightActivity",
    "routeId": "ape-head-copyright",
    "module": "猿宇宙",
    "feature": "IP/设计师",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.warcraft.ui.WarcraftWithdrawLogActivity",
    "routeId": "warcraft-withdraw-log",
    "module": "猿石魔兽",
    "feature": "猿石魔兽",
    "mode": "UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.warcraft.ui.WarcraftExchangeLogActivity",
    "routeId": "warcraft-exchange-log",
    "module": "猿石魔兽",
    "feature": "猿石魔兽",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.battle.ui.ApeRabbitMainActivity",
    "routeId": "ape-rabbit-main",
    "module": "猿兔战斗",
    "feature": "猿兔战斗",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.battle.ui.ApeRabbitLogActivity",
    "routeId": "ape-rabbit-log",
    "module": "猿兔战斗",
    "feature": "猿兔战斗",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.battle.ui.ApeRabbitResultActivity",
    "routeId": "ape-rabbit-result",
    "module": "猿兔战斗",
    "feature": "猿兔战斗",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.battle.ui.MiningLogActivity",
    "routeId": "mining-log",
    "module": "猿兔战斗",
    "feature": "猿兔战斗",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.MarblesActivity",
    "routeId": "marbles",
    "module": "小游戏集合",
    "feature": "弹珠",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.EscapeTigerMouthRecordActivity",
    "routeId": "escape-tiger-mouth-record",
    "module": "小游戏集合",
    "feature": "虎口逃生",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.EscapeTigerMouthActivity",
    "routeId": "escape-tiger-mouth",
    "module": "小游戏集合",
    "feature": "虎口逃生",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.PunchInRecordActivity",
    "routeId": "punch-in-record",
    "module": "小游戏集合",
    "feature": "小游戏集合",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.PunchInRankActivity",
    "routeId": "punch-in-rank",
    "module": "小游戏集合",
    "feature": "小游戏集合",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.PunchInActivity",
    "routeId": "punch-in",
    "module": "小游戏集合",
    "feature": "小游戏集合",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.SportsMeetActivity",
    "routeId": "sports-meet",
    "module": "小游戏集合",
    "feature": "运动会",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.SportLogsActivity",
    "routeId": "sport-logs",
    "module": "小游戏集合",
    "feature": "运动会",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.ChickenActivity",
    "routeId": "chicken",
    "module": "小游戏集合",
    "feature": "今晚吃鸡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.ChickenLogsActivity",
    "routeId": "chicken-logs",
    "module": "小游戏集合",
    "feature": "今晚吃鸡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.applet.ui.BattleRoyalRankActivity",
    "routeId": "battle-royal-rank",
    "module": "小游戏集合",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.RedPackageInfoActivity",
    "routeId": "red-package-info",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.RedPackageGoodsActivity",
    "routeId": "red-package-goods",
    "module": "NX竞技",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.BattleRockActivity",
    "routeId": "battle-rock",
    "module": "NX竞技",
    "feature": "猿石/矿石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.ChallengeBossActivity",
    "routeId": "challenge-boss",
    "module": "NX竞技",
    "feature": "Boss挑战",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.NxFriendExamineActivity",
    "routeId": "nx-friend-examine",
    "module": "NX竞技",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.NxRanksDetailsActivity",
    "routeId": "nx-ranks-details",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.MyNxFriendActivity",
    "routeId": "my-nx-friend",
    "module": "NX竞技",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.NxSearchActivity",
    "routeId": "nx-search",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.NxFriendWorkActivity",
    "routeId": "nx-friend-work",
    "module": "NX竞技",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.NxFriendGemstoneActivity",
    "routeId": "nx-friend-gemstone",
    "module": "NX竞技",
    "feature": "宝石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.MoreActActivity",
    "routeId": "more-act",
    "module": "NX竞技",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.MyActActivity",
    "routeId": "my-act",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.ActDetailActivity",
    "routeId": "act-detail",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.RewardLogsActivity",
    "routeId": "reward-logs",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.MyPrizeActivity",
    "routeId": "my-prize",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.OrderDetailsActivity",
    "routeId": "order-details",
    "module": "NX竞技",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.BuyPrizeActivity",
    "routeId": "buy-prize",
    "module": "NX竞技",
    "feature": "NX竞技",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.ArenaHomeActivity",
    "routeId": "arena-home",
    "module": "NX竞技",
    "feature": "竞技场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.ArenaRankActivity",
    "routeId": "arena-rank",
    "module": "NX竞技",
    "feature": "竞技场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.ArenaLogsActivity",
    "routeId": "arena-logs",
    "module": "NX竞技",
    "feature": "竞技场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.nx.ui.ArenaPoolActivity",
    "routeId": "arena-pool",
    "module": "NX竞技",
    "feature": "竞技场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.MyStoreManagerOrderActivity",
    "routeId": "my-store-manager-order",
    "module": "店长/代理",
    "feature": "黄金矿场",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.GiveCardActivity",
    "routeId": "give-card",
    "module": "店长/代理",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentLogActivity",
    "routeId": "agent-log",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentStockDetailsActivity",
    "routeId": "agent-stock-details",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentListActivity",
    "routeId": "agent-list",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentThirdLevelListActivity",
    "routeId": "agent-third-level-list",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AddAgentActivity",
    "routeId": "add-agent",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentCardOrderActivity",
    "routeId": "agent-card-order",
    "module": "店长/代理",
    "feature": "卡牌/闪卡",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentPaymentActivity",
    "routeId": "agent-payment",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.PaymentToExamineActivity",
    "routeId": "payment-to-examine",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentMainActivity",
    "routeId": "agent-main",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentInfoActivity",
    "routeId": "agent-info",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentStockActivity",
    "routeId": "agent-stock",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentMarginActivity",
    "routeId": "agent-margin",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentConfirmOrderActivity",
    "routeId": "agent-confirm-order",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.StoreDataActivity",
    "routeId": "store-data",
    "module": "店长/代理",
    "feature": "黄金矿场",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.AgentOrderDetailActivity",
    "routeId": "agent-order-detail",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.PickConfirmOrderActivity",
    "routeId": "pick-confirm-order",
    "module": "店长/代理",
    "feature": "商城/订单",
    "mode": "CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.agent.ui.PickStatusActivity",
    "routeId": "pick-status",
    "module": "店长/代理",
    "feature": "店长/代理",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocks.beast.ui.AnimalsMainActivity",
    "routeId": "animals-main",
    "module": "方块兽/动物玩法",
    "feature": "方块兽/动物玩法",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocks.beast.ui.activity.BeastPrizesActivity",
    "routeId": "beast-prizes",
    "module": "方块兽/动物玩法",
    "feature": "方块兽/动物玩法",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocks.beast.ui.activity.ResultsActivity",
    "routeId": "results",
    "module": "方块兽/动物玩法",
    "feature": "方块兽/动物玩法",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocks.beast.ui.activity.RankActivity",
    "routeId": "rank",
    "module": "方块兽/动物玩法",
    "feature": "方块兽/动物玩法",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocks.beast.ui.activity.HistoryRecordActivity",
    "routeId": "history-record",
    "module": "方块兽/动物玩法",
    "feature": "方块兽/动物玩法",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.hundred.ui.ApeWebActivity",
    "routeId": "ape-web",
    "module": "百人/IP内容",
    "feature": "百人/IP内容",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.hundred.ui.HundredImageViewerActivity",
    "routeId": "hundred-image-viewer",
    "module": "百人/IP内容",
    "feature": "百人/IP内容",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.hundred.ui.ApeProductActivity",
    "routeId": "ape-product",
    "module": "百人/IP内容",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.hundred.ui.ApeTrendsActivity",
    "routeId": "ape-trends",
    "module": "百人/IP内容",
    "feature": "百人/IP内容",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.hundred.ui.ApeBrandActivity",
    "routeId": "ape-brand",
    "module": "百人/IP内容",
    "feature": "百人/IP内容",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.hundred.ui.ApeBrandDetailActivity",
    "routeId": "ape-brand-detail",
    "module": "百人/IP内容",
    "feature": "百人/IP内容",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.reboom.ui.RocksMonkeyKingActivity",
    "routeId": "rocks-monkey-king",
    "module": "炸猴王",
    "feature": "炸猴王",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.reboom.ui.RocksMonkeyKingRankActivity",
    "routeId": "rocks-monkey-king-rank",
    "module": "炸猴王",
    "feature": "炸猴王",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.reboom.ui.RocksMonkeyPoolActivity",
    "routeId": "rocks-monkey-pool",
    "module": "炸猴王",
    "feature": "猿石/矿石",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.superlink.ui.SuperBoxLinkActivity",
    "routeId": "super-box-link",
    "module": "超级链接",
    "feature": "盲盒/福袋",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.superlink.ui.BuyRecordsActivity",
    "routeId": "buy-records",
    "module": "超级链接",
    "feature": "超级链接",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.superlink.ui.FriendsDetailActivity",
    "routeId": "friends-detail",
    "module": "超级链接",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.superlink.ui.SuperLinkBindInviterActivity",
    "routeId": "super-link-bind-inviter",
    "module": "超级链接",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.superlink.ui.SuperLinkInviteCodeActivity",
    "routeId": "super-link-invite-code",
    "module": "超级链接",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.superlink.ui.LinkInviteLogsActivity",
    "routeId": "link-invite-logs",
    "module": "超级链接",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.rob.ui.RobMainActivity",
    "routeId": "rob-main",
    "module": "抢夺",
    "feature": "抢夺/抢劫",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.rob.ui.RobRankActivity",
    "routeId": "rob-rank",
    "module": "抢夺",
    "feature": "抢夺/抢劫",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.rob.ui.RobLogActivity",
    "routeId": "rob-log",
    "module": "抢夺",
    "feature": "抢夺/抢劫",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.mall.ui.BlocksDetailActivity",
    "routeId": "blocks-detail",
    "module": "方块兽",
    "feature": "方块兽",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.mall.ui.BlockGoodsActivity",
    "routeId": "block-goods",
    "module": "方块兽",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.mall.ui.BlocksDeliveryGoodsActivity",
    "routeId": "blocks-delivery-goods",
    "module": "方块兽",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.mall.ui.BlocksDeviceAdapterActivity",
    "routeId": "blocks-device-adapter",
    "module": "方块兽",
    "feature": "方块兽",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.multiple.ui.MultiplePitActivity",
    "routeId": "multiple-pit",
    "module": "多人矿坑",
    "feature": "多人矿坑",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.multiple.ui.GrandPrizeLogActivity",
    "routeId": "grand-prize-log",
    "module": "多人矿坑",
    "feature": "多人矿坑",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.multiple.ui.ParticipateInLogActivity",
    "routeId": "participate-in-log",
    "module": "多人矿坑",
    "feature": "多人矿坑",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocksTug.ui.activity.TugActivity",
    "routeId": "tug",
    "module": "拔河",
    "feature": "拔河",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocksTug.ui.activity.TugRecordActivity",
    "routeId": "tug-record",
    "module": "拔河",
    "feature": "拔河",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.ticket.modules.rocksTug.ui.activity.TugRankActivity",
    "routeId": "tug-rank",
    "module": "拔河",
    "feature": "拔河",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.DaggerActivity",
    "routeId": "dagger",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.DaggerNewActivity",
    "routeId": "dagger-new",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.DaggerRecordActivity",
    "routeId": "dagger-record",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.NailActivity",
    "routeId": "nail",
    "module": "方块兽",
    "feature": "方块兽",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.DaggerTradeActivity",
    "routeId": "dagger-trade",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.TradeRecordActivity",
    "routeId": "trade-record",
    "module": "方块兽",
    "feature": "交易/寄售",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.DaggerReleaseActivity",
    "routeId": "dagger-release",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.ShareActivity",
    "routeId": "share",
    "module": "方块兽",
    "feature": "方块兽",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.ShareFriendActivity",
    "routeId": "share-friend",
    "module": "方块兽",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.ShareInputActivity",
    "routeId": "share-input",
    "module": "方块兽",
    "feature": "方块兽",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.RobberyLogActivity",
    "routeId": "robbery-log",
    "module": "方块兽",
    "feature": "抢夺/抢劫",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.RobberyRankActivity",
    "routeId": "robbery-rank",
    "module": "方块兽",
    "feature": "抢夺/抢劫",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.MyInviterActivity",
    "routeId": "my-inviter",
    "module": "方块兽",
    "feature": "邀请/社交",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.BattleRoyalActivity",
    "routeId": "battle-royal",
    "module": "方块兽",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.BettingHistoryActivity",
    "routeId": "betting-history",
    "module": "方块兽",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.RobberyKillerActivity",
    "routeId": "robbery-killer",
    "module": "方块兽",
    "feature": "抢夺/抢劫",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.BattleRoyalRankActivity",
    "routeId": "battle-royal-rank",
    "module": "方块兽",
    "feature": "大逃杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.AssassinationHistoryActivity",
    "routeId": "assassination-history",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.blocks.battle.ui.MyDaggerActivity",
    "routeId": "my-dagger",
    "module": "方块兽",
    "feature": "匕首/刺杀",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.qq.e.ads.ADActivity",
    "routeId": "a-d",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qq.e.ads.PortraitADActivity",
    "routeId": "portrait-a-d",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qq.e.ads.LandscapeADActivity",
    "routeId": "landscape-a-d",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.CollectShipActivity",
    "routeId": "collect-ship",
    "module": "公共/飞船",
    "feature": "公共/飞船",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.LomoLoginActivity",
    "routeId": "lomo-login",
    "module": "公共/飞船",
    "feature": "账号/身份",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.ShipLogActivity",
    "routeId": "ship-log",
    "module": "公共/飞船",
    "feature": "公共/飞船",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.AirshipListActivity",
    "routeId": "airship-list",
    "module": "公共/飞船",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.AirshipActivity",
    "routeId": "airship",
    "module": "公共/飞船",
    "feature": "宇宙探索",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.SystemMaintenanceActivity",
    "routeId": "system-maintenance",
    "module": "公共/飞船",
    "feature": "公共/飞船",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.modules.common.ui.GoodsPreviewActivity",
    "routeId": "goods-preview",
    "module": "公共/飞船",
    "feature": "商城/订单",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "com.caike.lomo.slapi.SLEntryActivity",
    "routeId": "s-l-entry",
    "module": "系统入口",
    "feature": "系统入口",
    "mode": "CLONE_1_TO_1"
  },
  {
    "legacyActivity": "ezy.arch.router.RouterActivity",
    "routeId": "router",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.alipay.sdk.app.AlipayResultActivity",
    "routeId": "alipay-result",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.album.app.album.AlbumActivity",
    "routeId": "album",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.album.app.album.GalleryActivity",
    "routeId": "gallery",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.album.app.album.NullActivity",
    "routeId": "null",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.album.app.gallery.GalleryActivity",
    "routeId": "gallery",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.album.app.gallery.GalleryAlbumActivity",
    "routeId": "gallery-album",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.album.app.camera.CameraActivity",
    "routeId": "camera",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.zhihu.matisse.ui.MatisseActivity",
    "routeId": "matisse",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.zhihu.matisse.internal.ui.AlbumPreviewActivity",
    "routeId": "album-preview",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.zhihu.matisse.internal.ui.SelectedPreviewActivity",
    "routeId": "selected-preview",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.durban.DurbanActivity",
    "routeId": "durban",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.draggable.library.extension.ImagesViewerActivity",
    "routeId": "images-viewer",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "ezy.sdk3rd.social.platforms.weixin.WXCallbackActivity",
    "routeId": "w-x-callback",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yanzhenjie.permission.bridge.BridgeActivity",
    "routeId": "bridge",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.ServiceMessageActivity",
    "routeId": "service-message",
    "module": "第三方SDK",
    "feature": "系统/客服",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.session.activity.WatchMessagePictureActivity",
    "routeId": "watch-message-picture",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.session.activity.PickImageActivity",
    "routeId": "pick-image",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.common.media.picker.activity.PickerAlbumActivity",
    "routeId": "picker-album",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.common.media.picker.activity.PickerAlbumPreviewActivity",
    "routeId": "picker-album-preview",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.common.media.picker.activity.PreviewImageFromCameraActivity",
    "routeId": "preview-image-from-camera",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.FileDownloadActivity",
    "routeId": "file-download",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.UrlImagePreviewActivity",
    "routeId": "url-image-preview",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.CardPopupActivity",
    "routeId": "card-popup",
    "module": "第三方SDK",
    "feature": "卡牌/闪卡",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.session.activity.CaptureVideoActivity",
    "routeId": "capture-video",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.uikit.session.activity.WatchVideoActivity",
    "routeId": "watch-video",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.LeaveMessageActivity",
    "routeId": "leave-message",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.WatchPictureActivity",
    "routeId": "watch-picture",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.LeaveMsgCustomFieldMenuActivity",
    "routeId": "leave-msg-custom-field-menu",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.mediaselect.internal.ui.activity.AlbumPreviewActivity",
    "routeId": "album-preview",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.mediaselect.internal.ui.activity.SelectedPreviewActivity",
    "routeId": "selected-preview",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.mediaselect.internal.ui.activity.MatisseActivity",
    "routeId": "matisse",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.fileselect.ui.activity.FilePickerActivity",
    "routeId": "file-picker",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.UserWorkSheetListActivity",
    "routeId": "user-work-sheet-list",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qiyukf.unicorn.ui.activity.WorkSheetDetailActivity",
    "routeId": "work-sheet-detail",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.alipay.sdk.app.H5PayActivity",
    "routeId": "h5-pay",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.alipay.sdk.app.H5AuthActivity",
    "routeId": "h5-auth",
    "module": "第三方SDK",
    "feature": "账号/身份",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.alipay.sdk.app.PayResultActivity",
    "routeId": "pay-result",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.alipay.sdk.app.H5OpenAuthActivity",
    "routeId": "h5-open-auth",
    "module": "第三方SDK",
    "feature": "账号/身份",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.alipay.sdk.app.APayEntranceActivity",
    "routeId": "a-pay-entrance",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.tencent.bugly.beta.ui.BetaActivity",
    "routeId": "beta",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "cn.jpush.android.ui.PopWinActivity",
    "routeId": "pop-win",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "cn.jpush.android.ui.PushActivity",
    "routeId": "push",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "cn.jpush.android.service.DActivity",
    "routeId": "d",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "cn.jpush.android.service.JNotifyActivity",
    "routeId": "j-notify",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.xuexiang.xupdate.widget.UpdateDialogActivity",
    "routeId": "update-dialog",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.dtf.face.ui.PortFaceLoadingActivity",
    "routeId": "port-face-loading",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.dtf.face.ui.LandFaceLoadingActivity",
    "routeId": "land-face-loading",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.dtf.face.ui.ToygerLandActivity",
    "routeId": "toyger-land",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.dtf.face.ui.ToygerPortActivity",
    "routeId": "toyger-port",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.yiqun.superlink.open.SLEntryActivity",
    "routeId": "s-l-entry",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.labcv.bytedcertsdk.activities.FaceLiveSDKActivity",
    "routeId": "face-live-s-d-k",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.labcv.bytedcertsdk.activities.FaceLivePreActivity",
    "routeId": "face-live-pre",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.labcv.bytedcertsdk.activities.SDKWebActivity",
    "routeId": "s-d-k-web",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.labcv.bytedcertsdk.activities.OCRTakePhotoActivity",
    "routeId": "o-c-r-take-photo",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.applog.migrate.MigrateDetectorActivity",
    "routeId": "migrate-detector",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Activity",
    "routeId": "stub_-standard_",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Portrait_Activity",
    "routeId": "stub_-standard_-portrait_",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Activity_T",
    "routeId": "stub_-standard_-activity_-t",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_Standard_Landscape_Activity",
    "routeId": "stub_-standard_-landscape_",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_Activity",
    "routeId": "stub_",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_SingleTask_Activity_T",
    "routeId": "stub_-single-task_-activity_-t",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.bytedance.sdk.openadsdk.stub.activity.Stub_SingleTask_Activity",
    "routeId": "stub_-single-task_",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.ss.android.downloadlib.addownload.compliance.AppPrivacyPolicyActivity",
    "routeId": "app-privacy-policy",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.ss.android.downloadlib.addownload.compliance.AppDetailInfoActivity",
    "routeId": "app-detail-info",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.ss.android.downloadlib.activity.TTDelegateActivity",
    "routeId": "t-t-delegate",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.ss.android.downloadlib.activity.JumpKllkActivity",
    "routeId": "jump-kllk",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.ss.android.socialbase.appdownloader.view.DownloadTaskDeleteActivity",
    "routeId": "download-task-delete",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.ss.android.socialbase.appdownloader.view.JumpUnknownSourceActivity",
    "routeId": "jump-unknown-source",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.AdWebViewActivity",
    "routeId": "ad-web-view",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.KsFullScreenVideoActivity",
    "routeId": "ks-full-screen-video",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.KsFullScreenLandScapeVideoActivity",
    "routeId": "ks-full-screen-land-scape-video",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.KsRewardVideoActivity",
    "routeId": "ks-reward-video",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.KSRewardLandScapeVideoActivity",
    "routeId": "k-s-reward-land-scape-video",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.FeedDownloadActivity",
    "routeId": "feed-download",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$KsTrendsActivity",
    "routeId": "base-fragment-activity$-ks-trends",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$ProfileHomeActivity",
    "routeId": "base-fragment-activity$-profile-home",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$ProfileVideoDetailActivity",
    "routeId": "base-fragment-activity$-profile-video-detail",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$TubeProfileActivity",
    "routeId": "base-fragment-activity$-tube-profile",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$ChannelDetailActivity",
    "routeId": "base-fragment-activity$-channel-detail",
    "module": "第三方SDK",
    "feature": "邀请/社交",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$TubeDetailActivity",
    "routeId": "base-fragment-activity$-tube-detail",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$EpisodeDetailActivity",
    "routeId": "base-fragment-activity$-episode-detail",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$RequestInstallPermissionActivity",
    "routeId": "base-fragment-activity$-request-install-permission",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity1",
    "routeId": "base-fragment-activity$-fragment-activity1",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$GoodsPlayBackActivity",
    "routeId": "base-fragment-activity$-goods-play-back",
    "module": "第三方SDK",
    "feature": "商城/订单",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity2",
    "routeId": "base-fragment-activity$-fragment-activity2",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity3",
    "routeId": "base-fragment-activity$-fragment-activity3",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity4",
    "routeId": "base-fragment-activity$-fragment-activity4",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity5",
    "routeId": "base-fragment-activity$-fragment-activity5",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity6",
    "routeId": "base-fragment-activity$-fragment-activity6",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity7",
    "routeId": "base-fragment-activity$-fragment-activity7",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity8",
    "routeId": "base-fragment-activity$-fragment-activity8",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity9",
    "routeId": "base-fragment-activity$-fragment-activity9",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivity10",
    "routeId": "base-fragment-activity$-fragment-activity10",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleTop1",
    "routeId": "base-fragment-activity$-fragment-activity-single-top1",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleTop2",
    "routeId": "base-fragment-activity$-fragment-activity-single-top2",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleInstance1",
    "routeId": "base-fragment-activity$-fragment-activity-single-instance1",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$FragmentActivitySingleInstance2",
    "routeId": "base-fragment-activity$-fragment-activity-single-instance2",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$DeveloperConfigActivity",
    "routeId": "base-fragment-activity$-developer-config",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivity",
    "routeId": "base-fragment-activity$-landscape-fragment",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTop1",
    "routeId": "base-fragment-activity$-landscape-fragment-activity-single-top1",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTop2",
    "routeId": "base-fragment-activity$-landscape-fragment-activity-single-top2",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTask1",
    "routeId": "base-fragment-activity$-landscape-fragment-activity-single-task1",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleTask2",
    "routeId": "base-fragment-activity$-landscape-fragment-activity-single-task2",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleInstance1",
    "routeId": "base-fragment-activity$-landscape-fragment-activity-single-instance1",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.kwad.sdk.api.proxy.app.BaseFragmentActivity$LandscapeFragmentActivitySingleInstance2",
    "routeId": "base-fragment-activity$-landscape-fragment-activity-single-instance2",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qq.e.ads.RewardvideoPortraitADActivity",
    "routeId": "rewardvideo-portrait-a-d",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qq.e.ads.RewardvideoLandscapeADActivity",
    "routeId": "rewardvideo-landscape-a-d",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  },
  {
    "legacyActivity": "com.qq.e.ads.DialogActivity",
    "routeId": "dialog",
    "module": "第三方SDK",
    "feature": "第三方SDK",
    "mode": "PLATFORM_ADAPTER"
  }
] as LegacyRoute[];

export function findLegacyRoute(activity: string): LegacyRoute | undefined {
  return LEGACY_ROUTES.find(x => x.legacyActivity === activity);
}
