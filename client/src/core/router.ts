/**
 * 路由与屏幕栈 —— 每个 44 族功能至少一个 Screen；680 Activity 按 routes.json 映射到 /family 路由。
 */
export interface ScreenCtx {
  app: any; // LomoClientApp
  params: Record<string, any>;
}

export abstract class Screen {
  app!: any;
  params: Record<string, any> = {};
  loading = false;
  error: string | null = null;
  route: string = '';
  title: string = '';

  /** 进入屏幕时加载远程状态；实现用 this.app.api */
  onEnter(): void | Promise<void> {}
  onExit(): void {}
  /** 每帧渲染；用 this.app.ui 绘制并注册命中 */
  abstract render(): void;
  /** 定时刷新（毫秒）；返回 0 表示不轮询 */
  pollMs(): number { return 0; }

  protected async run(action: () => Promise<void>): Promise<void> {
    this.loading = true;
    try { await action(); this.error = null; } catch (e: any) { this.error = String(e?.message || e); } finally { this.loading = false; }
  }
}

export class Router {
  stack: Screen[] = [];
  currentTab = 'games';
  tabs: Record<string, Screen> = {};
  private pollTimer: any = null;

  constructor(private app: any) {}

  registerTab(tab: string, screen: Screen): void {
    screen.app = this.app;
    this.tabs[tab] = screen;
  }

  get current(): Screen {
    if (this.stack.length) return this.stack[this.stack.length - 1];
    const t = this.tabs[this.currentTab] ?? Object.values(this.tabs)[0];
    if (!t) throw new Error('no screens registered');
    return t;
  }

  switchTab(tab: string): void {
    while (this.stack.length) this.pop(true);
    this.currentTab = tab;
    this.setupPoll();
  }

  push(screen: Screen, params: Record<string, any> = {}): void {
    screen.app = this.app;
    screen.params = params;
    this.stack.push(screen);
    Promise.resolve(screen.onEnter()).catch((e) => { screen.error = String(e?.message || e); });
    this.setupPoll();
    this.app.audioManager.playSfx('nav');
  }

  pop(silent = false): void {
    const top = this.stack.pop();
    if (top) top.onExit();
    if (!silent) this.setupPoll();
  }

  private setupPoll(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    const cur = this.current;
    const ms = cur?.pollMs() ?? 0;
    if (ms > 0) {
      this.pollTimer = setInterval(() => {
        Promise.resolve(cur.onEnter()).catch(() => {});
      }, ms);
    }
  }

  dispose(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    while (this.stack.length) this.pop(true);
  }
}
