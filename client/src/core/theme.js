"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEME = void 0;
exports.fmtNum = fmtNum;
exports.fmtTime = fmtTime;
/**
 * 客户端主题与逻辑坐标系。
 * 逻辑宽度固定 375，高度按屏幕比例；所有屏幕用逻辑坐标布局。
 */
exports.THEME = {
    bg: '#0f1220',
    bg2: '#171b2e',
    panel: '#1e2438',
    panel2: '#262d47',
    line: '#333c5e',
    text: '#e8ecf8',
    textDim: '#9aa3c0',
    accent: '#ff5c8a',
    accent2: '#38bdf8',
    gold: '#fbbf24',
    green: '#34d399',
    red: '#f87171',
    purple: '#a78bfa',
    disabled: '#555c78',
    radius: 10,
};
function fmtNum(n) {
    if (n == null || !isFinite(n))
        return '0';
    if (Math.abs(n) >= 1e8)
        return (n / 1e8).toFixed(2) + '亿';
    if (Math.abs(n) >= 1e4)
        return (n / 1e4).toFixed(1) + '万';
    return String(Math.round(n * 100) / 100);
}
function fmtTime(ms) {
    if (ms <= 0)
        return '0s';
    const s = Math.ceil(ms / 1000);
    if (s < 60)
        return s + 's';
    const m = Math.floor(s / 60);
    if (m < 60)
        return m + 'm' + (s % 60 ? (s % 60) + 's' : '');
    return Math.floor(m / 60) + 'h' + (m % 60) + 'm';
}
