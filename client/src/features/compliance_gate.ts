/**
 * 合规门页（2026-08 官方规范 2.6 P0 工程项）：
 *  1) 《健康游戏忠告》全文 + 出版信息页 —— 小游戏启动必展示；
 *  2) 隐私授权交互层 —— wx.getPrivacySetting 判定 → 弹窗 → requirePrivacyAuthorize；
 *     未声明信息类型的接口调用会直接 errCode -12034，因此授权发生在登录/网络之前。
 *
 * 出版信息（运营者/出版单位/审批号）为 BLOCKED_EXTERNAL —— 提审前由持证主体填写，
 * 本页以 RUNTIME_REQUIRED 占位并明文标注，不做任何伪造。
 */
import { Screen } from '../core/router';
import { UI } from '../ui/widgets';
import { THEME } from '../core/theme';
import { PrivacySetting } from '../platform/platform';

const HEALTH_ADVISORY = [
  '抵制不良游戏，拒绝盗版游戏。',
  '注意自我保护，谨防受骗上当。',
  '适度游戏益脑，沉迷游戏伤身。',
  '合理安排时间，享受健康生活。',
];

const MINOR_NOTICE = '本游戏适合 16 周岁以上玩家；未成年人应在监护人监督下适度游戏，22:00 至次日 8:00 无法进入游戏。';

export class ComplianceGateScreen extends Screen {
  readonly route = '/compliance-gate';
  private acked = false;
  private privacyState: PrivacySetting | null = null;
  private privacyAuthorized = false;
  private checkingPrivacy = true;
  private continuing = false;

  constructor(private onPass: () => void) {
    super();
    this.title = '健康游戏忠告';
    // 已确认过合规页且无需隐私授权 → 自动通过（不打扰，但本次启动仍会展示隐私变更）
    if (this.app?.platform) this.checkAutoPass();
  }

  onEnter(): void {
    this.checkAutoPass();
    this.checkingPrivacy = true;
    this.privacyState = null;
    this.privacyAuthorized = false;
    this.app.platform.getPrivacySetting().then((setting: PrivacySetting) => {
      this.privacyState = setting;
      this.privacyAuthorized = !setting.needAuthorization;
      this.checkingPrivacy = false;
      if (setting.needAuthorization) this.showPrivacyPrompt();
    }).catch(() => {
      this.checkingPrivacy = false;
      this.app.showToast('隐私设置获取失败，请点击重试');
    });
  }

  private showPrivacyPrompt(): void {
    const contract = this.privacyState?.privacyContractName || '《隐私保护指引》';
    this.app.showModal('隐私保护提示', [
      contract.slice(0, 24),
      '使用登录凭证与必要的游戏行为记录。',
      '不收集手机号、位置、通讯录或相册。',
      '同意后继续；不同意将退出游戏。',
    ], [
      { label: '同意并继续', color: THEME.green, onTap: () => this.agreePrivacy() },
      { label: '不同意并退出', color: THEME.red, onTap: () => this.declinePrivacy() },
    ]);
  }

  private checkAutoPass(): void {
    if (this.acked) return;
    const ack = this.app.platform.storageGet('app.compliance.ack.v1');
    void ack; // 每次启动都展示忠告页（规范 2.6：启动即展示），ack 仅记录上报
  }

  private async agreePrivacy(): Promise<void> {
    const ok = await this.app.platform.requirePrivacyAuthorize().catch(() => false);
    this.privacyAuthorized = ok;
    if (!ok) { this.app.showToast('需要同意隐私指引才能进入游戏'); return; }
    this.app.platform.storageSet('app.privacy.consent.pending', { agree: true, contract: this.privacyState?.privacyContractName ?? '', at: Date.now() });
    this.app.telemetry('privacy_consent', { result: 'agree' });
  }

  private declinePrivacy(): void {
    this.app.telemetry('privacy_consent', { result: 'refuse' });
    this.app.platform.exitMiniProgram();
  }

  render(): void {
    const ui = this.app.ui as UI;
    const top = Math.max(12, Math.min(64, ui.h - 480));
    const ctx = ui.ctx;
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, top, ui.w, ui.h - top);
    let y = top + 18;
    ui.textCenter('健康游戏忠告', ui.w / 2, y, { size: 19, bold: true, color: THEME.gold });
    y += 34;
    ui.panel({ x: 20, y, w: ui.w - 40, h: 112 }, THEME.panel);
    HEALTH_ADVISORY.forEach((l, i) => {
      ui.textCenter(l, ui.w / 2, y + 26 + i * 22, { size: 13, bold: true });
    });
    y += 122;
    ui.panel({ x: 20, y, w: ui.w - 40, h: 60 }, THEME.panel2);
    ui.textCenter('16+ 适龄提示', ui.w / 2, y + 20, { size: 12, bold: true, color: THEME.accent2 });
    const minorLines = wrap(MINOR_NOTICE, 26);
    minorLines.slice(0, 2).forEach((l, i) => ui.textCenter(l, ui.w / 2, y + 38 + i * 15, { size: 9, color: THEME.textDim }));
    y += 70;
    // 出版信息（规范 2.6 出版信息页）—— RUNTIME_REQUIRED 占位
    ui.panel({ x: 20, y, w: ui.w - 40, h: 96 }, THEME.panel);
    ui.textCenter('出版信息', ui.w / 2, y + 20, { size: 12, bold: true });
    const pub: Array<[string, string]> = [
      ['运营单位', '待确认 · 当前仅限测试'],
      ['出版单位 / 审批号', '资质待完善 · 暂未开放运营'],
      ['著作权', '授权资料待归档'],
    ];
    pub.forEach(([k, v], i) => {
      ui.text(k, 32, y + 40 + i * 18, { size: 10, color: THEME.textDim });
      ui.text(v, 140, y + 40 + i * 18, { size: 10, color: THEME.gold });
    });
    y += 106;
    ui.button({ x: 24, y, w: ui.w - 48, h: 44 }, this.acked ? '正在连接…' : this.checkingPrivacy ? '正在确认隐私设置…' : !this.privacyState ? '重新获取隐私设置' : '我已阅读并知悉 · 进入游戏', () => this.pass(), { color: THEME.accent, size: 14, disabled: this.acked || this.checkingPrivacy });
    y += 52;
    ui.textCenter('本次启动将展示隐私指引（如平台要求）', ui.w / 2, y + 8, { size: 9, color: THEME.textDim });
  }

  private pass(): void {
    if (this.acked || this.continuing) return;
    if (this.checkingPrivacy) return;
    if (!this.privacyState) { this.onEnter(); return; }
    if (!this.privacyAuthorized) {
      this.showPrivacyPrompt();
      return;
    }
    this.acked = true;
    this.continuing = true;
    this.app.platform.storageSet('app.compliance.ack.v1', { at: Date.now() });
    this.app.telemetry('compliance_ack', { version: 1 });
    const cb = this.onPass;
    this.continuing = false;
    cb();
  }

  resetForRetry(): void {
    this.acked = false;
    this.continuing = false;
  }
}

function wrap(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) out.push(text.slice(i, i + maxChars));
  return out;
}
