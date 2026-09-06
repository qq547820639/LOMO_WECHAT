import * as assert from 'node:assert';
import { MiniGameClientApp } from '../client/src/app/main';
import { ApiClient, HttpTransport } from '../client/src/net/api';
import { NodePlatform } from '../client/src/platform/platform';
import { ComplianceGateScreen } from '../client/src/features/compliance_gate';

export async function run(): Promise<void> {
  const wxLike = { kind: 'wx' } as any;
  assert.throws(
    () => new MiniGameClientApp(wxLike, { profile: 'wechat-release', standalone: false }),
    /APP_SERVER_URL is required for WeChat runtime/,
  );

  const node = new NodePlatform();
  const events: string[] = [];
  node.onTouchStart((x, y) => events.push(`start:${x},${y}`));
  node.onTouchEnd((x, y) => events.push(`end:${x},${y}`));
  node.tap(12, 34);
  assert.deepEqual(events, ['start:12,34', 'end:12,34']);

  const mismatched = new ApiClient({
    async request() { return { ok: true, profile: 'full-clone', release: { profile: 'full-clone' } }; },
  });
  await assert.rejects(() => mismatched.connect('wechat-release'), /server profile mismatch/);
  let requested = '';
  const http = new HttpTransport({
    async httpRequest(o: any) { requested = o.url; return { statusCode: 200, data: { ok: true } }; },
  } as any, 'https://api.example.test///');
  await http.request('/v1/config/bootstrap', 'GET');
  assert.equal(requested, 'https://api.example.test/v1/config/bootstrap');

  let passes = 0;
  const gate = new ComplianceGateScreen(() => { passes++; });
  (gate as any).app = { platform: node, telemetry() {}, showToast() {}, showModal() {} };
  gate.onEnter();
  await Promise.resolve();
  (gate as any).pass();
  assert.equal(passes, 1);
  (gate as any).resetForRetry();
  (gate as any).pass();
  assert.equal(passes, 2);
  console.log('client-platform ok: wx standalone guard/node touch dispatch');
}

if (require.main === module) run().catch((e) => { console.error(e); process.exit(1); });
