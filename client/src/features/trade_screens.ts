/**
 * 交易生态屏幕（沙盒）+ 商业 + 钱包/结算沙盒桥。
 * FULL: 市场挂单/购买/竞拍/订单/店长 全链路（TEST_CREDIT 沙盒）。
 * RELEASE: 相关路由被服务端三层关闭，页面显示合规替代说明。
 */
import { ApiScreen } from './base';
import { Screen } from '../core/router';
import { UI } from '../ui/widgets';
import { THEME, fmtNum } from '../core/theme';
import { registerRoute } from './registry';

// ---------------- 市场（挂单/购买） ----------------
export class MarketScreen extends ApiScreen {
  route = '/market';
  private listPrice = 50;

  constructor(featureId = 'p2pTrade', title = '交易市场') { super(featureId, title); }

  protected fetchState(): Promise<any> {
    return this.app.api.get('/v1/market/listings');
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, THEME.panel2);
    ui.text('沙盒市场：卡牌/宝石/金沙 挂单流通（TEST_CREDIT 结算）', 24, y + 20, { size: 11, color: THEME.gold });
    ui.text('RELEASE 下本页面及其 API 被三层关闭，转 NPC 兑换', 24, y + 38, { size: 10, color: THEME.textDim });
    y += 64;
    // 我的可售物品快捷挂单
    const cards = (this.app.player?.inventory ?? []);
    const sellable = Object.entries(cards).filter(([k, v]: any) => k.startsWith('card_') && v.qty > 0);
    if (sellable.length) {
      ui.text('挂单我的卡牌', 16, y + 12, { size: 12, color: THEME.textDim });
      y += 16;
      const s = sellable[0] as [string, any];
      ui.panel({ x: 12, y, w: ui.w - 24, h: 44 }, THEME.panel);
      ui.text(`${s[0]} ×${s[1].qty}`, 24, y + 26, { size: 11 });
      ui.button({ x: ui.w - 170, y: y + 5, w: 70, h: 32 }, `挂${this.listPrice}`, () => this.postList({ templateId: s[0], qty: 1, unitPrice: this.listPrice }), { size: 10, color: THEME.gold });
      ui.button({ x: ui.w - 94, y: y + 5, w: 70, h: 32 }, `挂${this.listPrice * 2}`, () => this.postList({ templateId: s[0], qty: 1, unitPrice: this.listPrice * 2 }), { size: 10, color: THEME.gold });
      y += 52;
    }
    ui.text('在售挂单', 16, y + 12, { size: 12, color: THEME.textDim });
    y += 16;
    const listings = st.listings ?? [];
    if (!listings.length) ui.text('市场空空，去挂一单吧', 24, y + 14, { size: 11, color: THEME.textDim });
    listings.slice(0, 8).forEach((l: any) => {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 44 }, THEME.panel);
      const name = l.templateId ?? l.assetId ?? '?';
      ui.text(`${l.sellerNick}: ${name} ×${l.qty}`, 24, y + 18, { size: 11 });
      ui.text(`${l.kind === 'auction' ? '竞拍 ' : ''}${fmtNum(l.unitPrice)} 沙盒币${l.kind === 'auction' && l.topBid ? ` (顶价 ${fmtNum(l.topBid)})` : ''}`, 24, y + 34, { size: 10, color: THEME.gold });
      ui.button({ x: ui.w - 92, y: y + 5, w: 78, h: 34 }, l.kind === 'auction' ? '出价' : '购买', () => {
        if (l.kind === 'auction') this.app.api.post('/v1/market/bid', { listingId: l.listingId, bid: Math.ceil((l.topBid ?? l.unitPrice) * 1.1) }).then((r: any) => this.app.handleGameResponse(r)).then(() => this.onEnter());
        else this.app.api.post('/v1/market/buy', { listingId: l.listingId }).then((r: any) => this.app.handleGameResponse(r)).then(() => this.onEnter());
      }, { size: 12, color: THEME.accent });
      y += 50;
    });
  }

  private async postList(body: any): Promise<void> {
    const r = await this.app.api.post('/v1/market/list', body);
    this.app.handleGameResponse(r);
    await this.onEnter();
  }
}

// ---------------- 竞拍（数字藏品拍卖，沙盒） ----------------
export class AuctionScreen extends MarketScreen {
  readonly route = '/digitalTrade';
  constructor() { super('digitalTrade', '数字竞拍'); }
}

// ---------------- 商城/订单（mock 支付合同） ----------------
export class MallScreen extends ApiScreen {
  readonly route = '/mall';
  constructor() { super('mall', '商城 / 订单'); }

  protected fetchState(): Promise<any> {
    return this.app.api.get('/v1/mall/goods');
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 48 }, THEME.panel2);
    ui.text('mock 支付合同：正式版需平台支付回调后幂等发货', 24, y + 20, { size: 10, color: THEME.gold });
    ui.text('RELEASE: 实物商城拆独立小程序，此处仅虚拟商品', 24, y + 36, { size: 10, color: THEME.textDim });
    y += 56;
    for (const g of st.goods ?? []) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 48 }, THEME.panel);
      ui.text(g.title, 24, y + 19, { size: 12, bold: true });
      ui.text(g.kind === 'physical' ? '实物（沙盒）' : g.kind === 'claim' ? '提货券' : '虚拟', 24, y + 36, { size: 10, color: THEME.textDim });
      ui.text(`${g.priceCoin ? g.priceCoin + ' 金币' : ''}${g.priceIntegral ? ' ' + g.priceIntegral + ' 积分' : ''}`, ui.w - 130, y + 19, { size: 11, color: THEME.gold });
      ui.button({ x: ui.w - 92, y: y + 7, w: 78, h: 34 }, '购买', () => this.buy(g.goodsId), { size: 12, color: THEME.accent });
      y += 54;
    }
  }

  private async buy(goodsId: string): Promise<void> {
    const r = await this.app.api.post('/v1/mall/order', { goodsId });
    this.app.handleGameResponse(r);
    if (r.ok) this.app.showModal('下单成功', [r.note ?? '', `订单号 ${r.order?.orderId}`, r.order?.status === 'DONE' ? '虚拟商品已发放' : '实物订单已进入履约状态（沙盒）']);
  }
}

// ---------------- 店长/代理（沙盒模型） ----------------
export class AgentScreen extends ApiScreen {
  readonly route = '/agent';
  constructor() { super('agent', '店长 / 代理'); }

  protected fetchState(): Promise<any> {
    return this.app.api.get('/v1/agent/summary');
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (this.renderStatus(ui, top)) return;
    const st = this.state;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 100 }, THEME.panel);
    ui.text(`代理等级 Lv.${st.level ?? 1}`, 24, y + 22, { size: 14, bold: true, color: THEME.gold });
    ui.text(`销售订单 ${st.sales?.orders ?? 0} · 营收 ${fmtNum(st.sales?.revenueTestCredit ?? 0)} 沙盒币`, 24, y + 44, { size: 11 });
    ui.text(`佣金比例 ${(st.commission?.rate ?? 0.05 * 100).toFixed(0)}% · 已结 ${fmtNum(st.commission?.paidTestCredit ?? 0)}`, 24, y + 62, { size: 11 });
    ui.text(st.notice ?? '', 24, y + 84, { size: 10, color: THEME.red });
    y += 110;
    ui.text('RELEASE: 代理/保证金/分销提现体系默认关闭，需独立合法业务方案后评估', 16, y, { size: 10, color: THEME.textDim });
  }
}

// ---------------- 钱包 / 结算沙盒桥 ----------------
export class WalletScreen extends ApiScreen {
  readonly route = '/walletCash';
  private sandboxBalance: string | null = null;

  constructor() { super('walletCash', '钱包 / 资产'); }

  onEnter(): Promise<void> {
    return this.run(async () => {
      await this.refreshBalances();
    });
  }

  private async refreshBalances(): Promise<void> {
    const [ledger, sandbox] = await Promise.all([
      this.app.api.get('/v1/economy/ledger?limit=15'),
      this.app.api.post('/v1/settlement/balance').catch(() => null),
    ]);
    this.state = { ledger: ledger.ok ? ledger.entries : [], invariants: ledger.ok ? ledger.invariants : null };
    this.sandboxBalance = sandbox?.ok ? sandbox.displayAmount : null;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    if (!this.app.player) { ui.textCenter('加载中…', ui.w / 2, top + 40, { size: 12 }); return; }
    const p = this.app.player;
    let y = top + 6;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 96 }, THEME.panel);
    ui.text('资产总览（服务器权威账本）', 24, y + 20, { size: 12, bold: true });
    const b = p.balances ?? {};
    const keys = Object.keys(b).filter((k) => (this.app.profile === 'full-clone' ? true : !['TEST_CREDIT', 'RED_PACKET_PROGRESS'].includes(k)));
    keys.slice(0, 12).forEach((k, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      ui.text(`${k.slice(0, 6)}`, 24 + col * 116, y + 44 + row * 18, { size: 9, color: THEME.textDim });
      ui.text(fmtNum(b[k]), 24 + col * 116, y + 56 + row * 18, { size: 11, color: THEME.gold });
    });
    y += 104;
    if (this.sandboxBalance) {
      ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, THEME.panel2);
      ui.text(`结算账户（沙盒桥）: ${this.sandboxBalance}`, 24, y + 22, { size: 12, color: THEME.gold });
      ui.text('UI_CLONE_TEST_ONLY：提现界面 1:1 复刻但永不实际兑付', 24, y + 44, { size: 10, color: THEME.red });
      y += 76;
      ui.button({ x: 12, y, w: ui.w - 24, h: 44 }, '申请提现（沙盒预览）', async () => {
        const r = await this.app.api.post('/v1/settlement/withdrawal-preview', { amount: '888.00' });
        if (r.ok) this.app.showModal('提现预览（沙盒桥）', [`手续费 ${r.fee}`, `到账 ${r.arrival}`, r.notice]);
      }, { color: THEME.accent });
      y += 54;
    }
    // 账本流水
    ui.text('账本流水（最近）', 16, y + 12, { size: 12, color: THEME.textDim });
    y += 18;
    (this.state?.ledger ?? []).slice(0, 10).forEach((e: any) => {
      ui.text(`${e.assetType} ${e.delta > 0 ? '+' : ''}${e.delta}`, 16, y, { size: 10, color: e.delta > 0 ? THEME.green : THEME.red });
      ui.text(`${e.sourceType}`, 130, y, { size: 10, color: THEME.textDim });
      ui.text(`= ${e.balanceAfter}`, ui.w - 80, y, { size: 10 });
      y += 17;
    });
    if (this.state?.invariants) {
      ui.text(`账本校验: ${this.state.invariants.ok ? '✓ 连续性正常' : '✗ ' + this.state.invariants.errors[0]}`, 16, y + 6, { size: 10, color: this.state.invariants.ok ? THEME.green : THEME.red });
    }
  }
}

// ---------------- 政策说明页（cut/defer 族诚实呈现） ----------------
export class PolicyScreen extends Screen {
  readonly route: string;
  readonly title: string;
  private featureId: string;
  private meta: any;

  constructor(featureId: string) {
    super();
    this.featureId = featureId;
    this.meta = require('../../../shared/src/gen/data.gen').FEATURES.find((f: any) => f.id === featureId) ?? {};
    this.title = this.meta.title ?? featureId;
    this.route = '/' + featureId;
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = 64;
    const release = this.meta.release ?? 'cut';
    const colors = { keep: THEME.green, defer: THEME.gold, cut: THEME.red } as any;
    let y = top + 10;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 64 }, THEME.panel);
    ui.text(`发布策略: ${release.toUpperCase()}`, 24, y + 24, { size: 15, bold: true, color: colors[release] ?? THEME.text });
    ui.text(`风险等级: ${this.meta.risk ?? 'review'}`, 24, y + 46, { size: 11, color: THEME.textDim });
    y += 74;
    ui.panel({ x: 12, y, w: ui.w - 24, h: 76 }, THEME.panel2);
    ui.text('说明', 24, y + 20, { size: 12, bold: true });
    const lines = wrap(this.meta.notes ?? '该模块保留产品模型与页面映射，按发布策略裁剪。', 24);
    lines.slice(0, 3).forEach((l, i) => ui.text(l, 24, y + 40 + i * 16, { size: 11 }));
    y += 86;
    // SANITIZATION P1-3：原版内部类名不随发布包渲染，研究细节见归档文档
    ui.panel({ x: 12, y, w: ui.w - 24, h: 38 }, THEME.panel);
    ui.text('原始证据', 24, y + 16, { size: 12, bold: true });
    ui.text('研究归档：ROUTE_PARITY_680.md（不随发布包分发）', 24, y + 30, { size: 10, color: THEME.textDim });
    y += 46;
    if (release === 'defer') {
      ui.text('FULL CLONE 下相关沙盒玩法可从对应生态入口体验。', 16, y + 6, { size: 10, color: THEME.gold });
    } else {
      ui.text('RELEASE 永久关闭；FULL CLONE 仅保留数据模型/页面映射（sandbox-only）。', 16, y + 6, { size: 10, color: THEME.red });
    }
  }
}

function wrap(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) out.push(text.slice(i, i + maxChars));
  return out;
}

export function registerTradeScreens(): void {
  registerRoute('p2pTrade', () => new MarketScreen('p2pTrade', '交易市场'));
  registerRoute('market', () => new MarketScreen('market', '交易市场'));
  registerRoute('digitalTrade', () => new AuctionScreen());
  registerRoute('mall', () => new MallScreen());
  registerRoute('moonEvent', () => new PolicyScreen('moonEvent'));
  registerRoute('agent', () => new AgentScreen());
  registerRoute('walletCash', () => new WalletScreen());
  registerRoute('redPacket', () => new PolicyScreen('redPacket'));
  registerRoute('warcraftFinance', () => new PolicyScreen('warcraftFinance'));
  registerRoute('digitalLottery', () => new PolicyScreen('digitalLottery'));
  registerRoute('physicalPrize', () => new PolicyScreen('physicalPrize'));
  registerRoute('betting', () => new PolicyScreen('betting'));
  registerRoute('creator', () => new PolicyScreen('creator'));
  registerRoute('apeHundred', () => new PolicyScreen('apeHundred'));
  registerRoute('customerService', () => new PolicyScreen('customerService'));
  registerRoute('superLink', () => new PolicyScreen('superLink'));
  registerRoute('hundred', () => new PolicyScreen('apeHundred'));
}
