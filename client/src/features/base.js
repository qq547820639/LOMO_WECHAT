"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiScreen = void 0;
/**
 * Screen 公共基类：状态拉取 / 动作执行 / 通用布局。
 */
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
class ApiScreen extends router_1.Screen {
    constructor(featureId, title) {
        super();
        this.state = null;
        this.featureId = featureId;
        this.title = title;
        this.route = '/' + featureId;
    }
    /** 默认拉取 /v1/game/state?featureId=；可覆写 */
    fetchState() {
        return this.app.api.gameState(this.featureId);
    }
    onEnter() {
        return this.run(async () => {
            var _a;
            const r = await this.fetchState();
            if (r.ok)
                this.state = (_a = r.state) !== null && _a !== void 0 ? _a : r;
            else
                this.error = r.message;
        });
    }
    async act(actionId, payload, sessionId) {
        const r = await this.app.api.action(this.featureId, actionId, payload, sessionId, Date.now() % 1e6);
        this.app.handleGameResponse(r);
        if (r.ok !== false)
            await this.onEnter();
        return r;
    }
    /** 错误/空状态渲染 */
    renderStatus(ui, top) {
        if (this.error) {
            ui.panel({ x: 12, y: top + 8, w: ui.w - 24, h: 56 }, theme_1.THEME.panel);
            ui.text('加载失败', 24, top + 30, { size: 13, color: theme_1.THEME.red, bold: true });
            ui.text(this.error.slice(0, 40), 24, top + 48, { size: 11, color: theme_1.THEME.textDim });
            ui.button({ x: ui.w - 100, y: top + 18, w: 80, h: 30 }, '重试', () => this.onEnter(), { size: 12 });
            return true;
        }
        if (!this.state) {
            ui.textCenter('加载中…', ui.w / 2, top + 40, { size: 13, color: theme_1.THEME.textDim });
            return true;
        }
        return false;
    }
}
exports.ApiScreen = ApiScreen;
