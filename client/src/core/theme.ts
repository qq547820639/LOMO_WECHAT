/**
 * 客户端主题与逻辑坐标系。
 * 逻辑宽度固定 375，高度按屏幕比例；所有屏幕用逻辑坐标布局。
 */
export const THEME = {
  bg: '#091321',
  bg2: '#0f1d31',
  panel: '#162943',
  panel2: '#1d3855',
  line: '#2b4b6b',
  text: '#f1f6ff',
  textDim: '#a7bad2',
  accent: '#ff6b67',
  accent2: '#48c9b0',
  gold: '#ffd166',
  green: '#34d399',
  red: '#f87171',
  purple: '#a78bfa',
  disabled: '#555c78',
  radius: 10,
};

export interface Layout { w: number; h: number }

export function fmtNum(n: number): string {
  if (n == null || !isFinite(n)) return '0';
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(1) + '万';
  return String(Math.round(n * 100) / 100);
}

export function fmtTime(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm' + (s % 60 ? (s % 60) + 's' : '');
  return Math.floor(m / 60) + 'h' + (m % 60) + 'm';
}
