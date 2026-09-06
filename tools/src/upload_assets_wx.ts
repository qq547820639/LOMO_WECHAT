/**
 * 微信云开发资源上传器（服务端 HTTP API）
 *
 * 为什么不用 CloudBase CLI：AppID 自带的微信侧云开发环境（cloud1-…）不向腾讯云 CAM 暴露，
 * 我们的 CAM 凭据无法操作它，DevTools CLI 也只有 env/functions 两个能力。
 * 因此改用微信官方服务端 API：
 *   1) GET  /cgi-bin/token            → access_token（AppID + AppSecret）
 *   2) POST /tcb/uploadfile           → 上传凭证 { url, token, authorization, cos_file_id }
 *   3) POST <url>  multipart/form-data → 真实上传
 *
 * 用法：
 *   APP_WX_APPID=wx…  APP_WX_APPSECRET=…  CLOUD_ENV=cloud1-…  \
 *   node dist/tools/src/upload_assets_wx.js --dir game-assets --prefix v1/assets/game/ [--concurrency 8] [--verify <域名>]
 *
 *   --verify <域名>   只上传 1 个探针文件并用该域名 curl 验证可达（避免全量白传）
 *   不带 --verify     全量上传
 *
 * 安全：AppSecret 仅从环境变量读取，不写盘、不入库、不打印。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';

const HTTP = 'https://api.weixin.qq.com';

interface UploadTicket { url: string; token: string; authorization: string; file_id: string; cos_file_id: string }

async function getAccessToken(appid: string, secret: string): Promise<string> {
  const res = await fetch(`${HTTP}/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}`);
  const json: any = await res.json();
  if (!json.access_token) throw new Error(`获取 access_token 失败: ${JSON.stringify(json).slice(0, 200)}`);
  return json.access_token as string;
}

async function getTicket(token: string, env: string, cloudPath: string): Promise<UploadTicket> {
  const res = await fetch(`${HTTP}/tcb/uploadfile?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ env, path: cloudPath }),
  });
  const json: any = await res.json();
  if (json.errcode !== 0) throw new Error(`uploadfile 失败(${json.errcode}): ${json.errmsg}`);
  return json as UploadTicket;
}

/** 手工拼 multipart（COS 对字段顺序敏感：key → Signature → token → fileid → file） */
function buildMultipart(fields: Array<{ name: string; value: string }>, fileField: { name: string; filename: string; contentType: string; buf: Buffer }) {
  const boundary = '----apeUpload' + Math.random().toString(36).slice(2);
  const CRLF = '\r\n';
  const parts: Buffer[] = [];
  for (const f of fields) {
    parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${f.name}"${CRLF}${CRLF}${f.value}${CRLF}`));
  }
  parts.push(Buffer.from(
    `--${boundary}${CRLF}Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"${CRLF}` +
    `Content-Type: ${fileField.contentType}${CRLF}${CRLF}`
  ));
  parts.push(fileField.buf);
  parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function uploadOne(token: string, env: string, localFile: string, cloudPath: string): Promise<void> {
  const ticket = await getTicket(token, env, cloudPath);
  const buf = fs.readFileSync(localFile);
  const ext = path.extname(localFile).toLowerCase();
  const contentType = ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
      : ext === '.json' ? 'application/json'
        : ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream';
  const { body, contentType: ct } = buildMultipart([
    { name: 'key', value: cloudPath },
    { name: 'Signature', value: ticket.authorization },
    { name: 'x-cos-security-token', value: ticket.token },
    { name: 'x-cos-meta-fileid', value: ticket.cos_file_id },
  ], { name: 'file', filename: path.basename(localFile), contentType, buf });
  const res = await fetch(ticket.url, { method: 'POST', headers: { 'content-type': ct }, body });
  if (!res.ok) throw new Error(`上传失败 ${res.status}: ${(await res.text()).slice(0, 160)}`);
}

function walk(dir: string, base: string, out: string[]): void {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, base, out);
    else out.push(path.relative(base, p));
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const get = (k: string, d: string): string => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
  const srcDir = rootPath(get('dir', 'game-assets'));
  const prefix = get('prefix', 'v1/assets/game/').replace(/^\/+|\/+$/g, '') + '/';
  const concurrency = Number(get('concurrency', '8')) || 8;
  const verifyDomain = argv.includes('--verify') ? (argv[argv.indexOf('--verify') + 1] || '') : null;

  const appid = process.env.APP_WX_APPID || '';
  const secret = process.env.APP_WX_APPSECRET || '';
  const env = process.env.CLOUD_ENV || process.env.APP_CLOUD_ENV || '';
  if (!appid || !secret || !env) throw new Error('需要环境变量 APP_WX_APPID / APP_WX_APPSECRET / CLOUD_ENV');
  if (!fs.existsSync(srcDir)) throw new Error(`源目录不存在: ${srcDir}`);

  const token = await getAccessToken(appid, secret);
  console.log(`[upload] access_token ok, env=${env}, src=${srcDir}, prefix=${prefix}`);

  // 探针模式：只传 1 个文件并验证域名可达
  if (verifyDomain !== null) {
    const probe = path.join(srcDir, 'manifest.json');
    const cloudPath = prefix + 'manifest.json';
    await uploadOne(token, env, probe, cloudPath);
    const url = `${verifyDomain.replace(/\/+$/, '')}/${cloudPath}`;
    const res = await fetch(url);
    console.log(`[verify] ${url} → ${res.status} ${res.ok ? 'OK' : 'FAIL'}`);
    if (!res.ok) console.log('[verify] 不可达：静态托管域名与云存储路径不匹配，需调整 prefix 或改用云存储临时链接方案');
    return;
  }

  const rels: string[] = [];
  walk(srcDir, srcDir, rels);
  console.log(`[upload] 共 ${rels.length} 个文件，并发 ${concurrency}`);

  let done = 0;
  let failed = 0;
  const failures: string[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, 16) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= rels.length) return;
      const rel = rels[i];
      const cloudPath = prefix + rel.split(path.sep).join('/');
      try {
        await uploadOne(token, env, path.join(srcDir, rel), cloudPath);
        done++;
      } catch (e) {
        // 一次重试
        try {
          await uploadOne(token, env, path.join(srcDir, rel), cloudPath);
          done++;
        } catch (e2) {
          failed++;
          failures.push(`${rel}: ${String((e2 as any)?.message || e2).slice(0, 120)}`);
        }
      }
      if ((done + failed) % 200 === 0) console.log(`[upload] 进度 ${done + failed}/${rels.length} (失败 ${failed})`);
    }
  });
  await Promise.all(workers);
  console.log(`[upload] 完成：成功 ${done} / 失败 ${failed} / 共 ${rels.length}`);
  if (failures.length) {
    console.log('[upload] 失败明细（前 10）：');
    for (const f of failures.slice(0, 10)) console.log('  - ' + f);
  }
}

main().catch((e) => { console.error('[upload] fatal', e?.message || e); process.exit(1); });
