/**
 * 品牌配置 —— 用户可见字符串的唯一出处。
 * 客户端 UI 与服务端邮件共同引用；部署换牌只改这一个文件。
 * 「猿岛 ApeIsland」为自有命名：与任何既有产品/主体/IP 无关联（命名检索记录见 docs/BRAND_AUDIT.md）。
 */
export const BRAND = {
  appName: '猿岛',
  appNameEn: 'ApeIsland',
  loadingText: '猿岛 · 正在启动…',
  homeTitle: '主城 · 猿岛',
  shareTitle: '一起来玩《猿岛》！',
  welcomeMailTitle: '欢迎来到《猿岛》',
  welcomeMailBody: '开荒礼包已到账，祝玩得开心！',
  /** 主城公告栏（部署方可自有运营文案覆盖） */
  announcements: [
    '猿岛开荒季：矿场生产 · 短局玩法 · 赛季回流',
    '每日循环：签到 → 挖矿 → 对局 → 收集 → 赛季',
  ],
  /** 「我的」页版本脚注（profile 由客户端拼接） */
  versionFooter: '版本 1.0.0 · ',
} as const;
