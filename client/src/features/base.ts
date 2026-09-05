/**
 * Screen 公共基类：状态拉取 / 动作执行 / 通用布局。
 */
import { Screen } from '../core/router';
import { UI } from '../ui/widgets';
import { THEME } from '../core/theme';

export abstract class ApiScreen extends Screen {
  state: any = null;
  readonly featureId: string;

  constructor(featureId: string, title: string) {
    super();
    this.featureId = featureId;
    this.title = title;
    this.route = '/' + featureId;
  }

  /** 默认拉取 /v1/game/state?featureId=；可覆写 */
  protected fetchState(): Promise<any> {
    return this.app.api.gameState(this.featureId);
  }

  onEnter(): Promise<void> {
    return this.run(async () => {
      const r = await this.fetchState();
      if (r.ok) this.state = r.state ?? r;
      else this.error = r.message;
    });
  }

  protected async act(actionId: string, payload?: Record<string, unknown>, sessionId?: string): Promise<any> {
    const r = await this.app.api.action(this.featureId, actionId, payload, sessionId, Date.now() % 1e6);
    this.app.handleGameResponse(r);
    if (r.ok !== false) await this.onEnter();
    return r;
  }

  /** 错误/空状态渲染 */
  protected renderStatus(ui: UI, top: number): boolean {
    if (this.error) {
      ui.panel({ x: 12, y: top + 8, w: ui.w - 24, h: 56 }, THEME.panel);
      ui.text('加载失败', 24, top + 30, { size: 13, color: THEME.red, bold: true });
      ui.text(this.error.slice(0, 40), 24, top + 48, { size: 11, color: THEME.textDim });
      ui.button({ x: ui.w - 100, y: top + 18, w: 80, h: 30 }, '重试', () => this.onEnter(), { size: 12 });
      return true;
    }
    if (!this.state) {
      ui.textCenter('加载中…', ui.w / 2, top + 40, { size: 13, color: THEME.textDim });
      return true;
    }
    return false;
  }
}
