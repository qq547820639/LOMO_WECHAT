type JsonRecord = Record<string, unknown>;

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const requiredRuntime = [
  'APP_SECRET',
  'APP_WX_APPID',
  'APP_WX_APPSECRET',
  'APP_PERSISTENCE',
  'APP_CLOUD_ENV',
] as const;

function parseArgs(argv: string[]): { url: string; timeoutMs: number; skipInvalidCode: boolean } {
  let url = process.env.APP_SERVER_URL || '';
  let timeoutMs = 10000;
  let skipInvalidCode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--url') url = argv[++index] || '';
    else if (argument === '--timeout-ms') timeoutMs = Number(argv[++index]);
    else if (argument === '--skip-invalid-code') skipInvalidCode = true;
    else if (argument === '--help') {
      console.log('Usage: node dist/tools/src/cloudrun_readiness.js --url https://host [--timeout-ms 10000] [--skip-invalid-code]');
      process.exit(0);
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!/^https:\/\//.test(url)) throw new Error('Set --url (HTTPS) or APP_SERVER_URL to the CloudRun origin');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error('--timeout-ms must be an integer between 1000 and 60000');
  return { url: url.replace(/\/+$/, ''), timeoutMs, skipInvalidCode };
}

function checkRuntimeSecrets(env: NodeJS.ProcessEnv): CheckResult[] {
  const results: CheckResult[] = [];
  const missing = requiredRuntime.filter((name) => !env[name]?.trim());
  results.push({ name: 'runtime-secrets-present', ok: missing.length === 0, detail: missing.length ? `missing ${missing.join(', ')}` : 'required values are present' });
  results.push({ name: 'app-secret-strength', ok: !!env.APP_SECRET && env.APP_SECRET.length >= 32 && !env.APP_SECRET.includes('DO-NOT-USE-IN-PROD'), detail: 'APP_SECRET is at least 32 characters and not a development placeholder' });
  results.push({ name: 'wechat-appid-format', ok: /^wx[a-f0-9]{16}$/.test(env.APP_WX_APPID || ''), detail: 'APP_WX_APPID matches wx plus 16 hexadecimal characters' });
  results.push({ name: 'wechat-appsecret-strength', ok: !!env.APP_WX_APPSECRET && env.APP_WX_APPSECRET.length >= 32, detail: 'APP_WX_APPSECRET is at least 32 characters' });
  results.push({ name: 'cloudbase-persistence', ok: env.APP_PERSISTENCE === 'cloudbase', detail: 'APP_PERSISTENCE=cloudbase' });
  results.push({ name: 'cloudbase-environment', ok: !!env.APP_CLOUD_ENV?.trim(), detail: 'APP_CLOUD_ENV is configured' });
  return results;
}

async function requestJson(url: string, init: RequestInit, timeoutMs: number): Promise<{ status: number; body: JsonRecord | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: JsonRecord | null = null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as JsonRecord;
    } catch {
      body = null;
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

async function runReadiness(url: string, timeoutMs: number, skipInvalidCode: boolean): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  let bootstrap: { status: number; body: JsonRecord | null };
  try {
    bootstrap = await requestJson(`${url}/v1/config/bootstrap`, { method: 'GET' }, timeoutMs);
    const ok = bootstrap.status === 200 && bootstrap.body?.ok === true && bootstrap.body?.profile === 'wechat-release';
    results.push({ name: 'bootstrap-readiness', ok, detail: `HTTP ${bootstrap.status}; profile=${String(bootstrap.body?.profile || 'missing')}` });
  } catch (error) {
    results.push({ name: 'bootstrap-readiness', ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
  if (!skipInvalidCode) {
    try {
      const response = await requestJson(`${url}/v1/auth/wechat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: `readiness-invalid-${Date.now()}-${Math.random().toString(16).slice(2)}` }),
      }, timeoutMs);
      const token = typeof response.body?.token === 'string' && response.body.token.length > 0;
      results.push({ name: 'invalid-code-rejected', ok: !token && response.status >= 400, detail: `HTTP ${response.status}; token-issued=${token}` });
    } catch (error) {
      results.push({ name: 'invalid-code-rejected', ok: false, detail: error instanceof Error ? error.message : String(error) });
    }
  } else results.push({ name: 'invalid-code-rejected', ok: true, detail: 'skipped by explicit flag; run before production traffic' });
  return results;
}

export async function main(argv = process.argv.slice(2), env = process.env): Promise<number> {
  const options = parseArgs(argv);
  if (options.skipInvalidCode && (env.NODE_ENV === 'production' || env.APP_PROFILE === 'wechat-release')) throw new Error('--skip-invalid-code is forbidden for production readiness');
  const results = [
    ...checkRuntimeSecrets(env),
    ...(await runReadiness(options.url, options.timeoutMs, options.skipInvalidCode)),
  ];
  for (const result of results) console.log(`[${result.ok ? 'PASS' : 'FAIL'}] ${result.name}: ${result.detail}`);
  return results.every((result) => result.ok) ? 0 : 1;
}

if (require.main === module) {
  main().then((code) => { process.exitCode = code; }).catch((error) => { console.error(`[FAIL] readiness: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
}
