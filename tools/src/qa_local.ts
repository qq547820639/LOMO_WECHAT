import * as fs from 'node:fs';
import * as path from 'node:path';
import { build } from './build_wechat';
import { createApp } from '../../server/src/index';

const port = Number(process.env.QA_PORT || 8798);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('QA_PORT must be between 1024 and 65535');
if (!/^wx[a-f0-9]{16}$/.test(process.env.APP_WX_APPID || '')) throw new Error('Set APP_WX_APPID to import the local QA package in WeChat DevTools');
if (!process.env.APP_CLOUD_BASE?.startsWith('https://')) throw new Error('Set APP_CLOUD_BASE to the existing asset CDN');

const keys = ['APP_SERVER_URL', 'APP_CLOUD_ENV', 'APP_CLOUD_SERVICE'] as const;
const previous = keys.map((key) => process.env[key]);
let outputDir: string;
try {
  process.env.APP_SERVER_URL = `http://127.0.0.1:${port}`;
  process.env.APP_CLOUD_ENV = '';
  process.env.APP_CLOUD_SERVICE = '';
  outputDir = build('wechat-release', { allowUnconfigured: true, outputDir: 'build/wechat-qa' });
} finally {
  keys.forEach((key, index) => {
    if (previous[index] === undefined) delete process.env[key];
    else process.env[key] = previous[index];
  });
}
const configFile = path.join(outputDir, 'project.config.json');
const projectConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
projectConfig.projectname = 'ape-island-local-qa';
projectConfig.setting.urlCheck = false;
fs.writeFileSync(configFile, JSON.stringify(projectConfig, null, 2));
const privateConfigFile = path.join(outputDir, 'project.private.config.json');
if (fs.existsSync(privateConfigFile)) {
  const privateConfig = JSON.parse(fs.readFileSync(privateConfigFile, 'utf8'));
  privateConfig.setting = { ...privateConfig.setting, urlCheck: false };
  fs.writeFileSync(privateConfigFile, JSON.stringify(privateConfig, null, 2));
}
fs.writeFileSync(path.join(outputDir, 'README.txt'), 'LOCAL QA ONLY: loopback server, synthetic identity, memory-only progress. Do not upload or distribute this package. Formal package is build/wechat-release.\n');

const { server } = createApp({
  profile: 'wechat-release',
  secret: 'local-qa-only-memory-state-not-for-production',
  persistPath: null,
  wechatCodeExchange: async () => ({ openid: 'local-qa-simulator-player' }),
});
server.on('error', (error: Error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`LOCAL QA ONLY: http://127.0.0.1:${port}; synthetic identity; memory-only progress`);
  console.log(`Import ${outputDir} in WeChat DevTools. The formal package remains separate.`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); });
