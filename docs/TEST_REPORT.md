# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T22:21:55.940Z

## ✅ route-parity-680 (11ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (52ms)

ok

## ✅ unit-core (4ms)

ok

## ✅ unit-assets+compliance (66ms)

ok

## ✅ unit-pack (4ms)

ok

## ✅ slot-ref-integrity (5ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (1ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (45ms)

`{"scanned":0,"violations":[]}`

## ✅ gameplay-server (12ms)

ok

## ✅ release-safety (5ms)

ok

## ✅ client-platform-transport (46ms)

client-platform ok: wx standalone guard/node touch dispatch

## ✅ client-runtime-consent-session-lifecycle (64ms)

client-runtime ok: native scale contract, feature reachability, consent timeout/retry, global RAF fallback

## ✅ client-hub-layout-navigation (49ms)

client-hubs ok: no invalid account polling, clipping, visible hit bounds, final row access, player copy, empty-state navigation

## ✅ client-combat-entry-retry-balances (80ms)

client-combat ok: real button fee/HUD sync, duplicate suppression, pending-session retry, lost-response recovery, correct duel routing

## ✅ action-idempotency-loss-restart-replay (3705ms)

action-idempotency ok: lost responses, request conflicts, account scope, failures, session finish, restart and retention

## ✅ cloud-persistence-transactions-restart-replay (158ms)

persistence ok: two instances, 20-way identities/commands/slots, atomic invites/mail/rollback, lost commit response, restart, paginated ledger, fail-closed; peak 36 ops

## ✅ release-config-validation (4132ms)

[build_wechat] wechat-release → /Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/release-config-test-oA8EqU (atlases: 539, cloud-assets (boot pack 353), main pkg 2.80MB)
release-config ok: fail-closed runtime config, exact AppID, strict HTTPS, explicit cloudBase, URL validation enabled

## ✅ security-auth-persistence-hardening (5079ms)

security-hardening ok: isolated auth exchange/input validation/timeouts/login limits/tokens/admin/persistence

## ✅ server-packaging-credential-isolation (380ms)

package:server → /var/folders/8_/gnp60nfx1xq97r2hld5bys1w0000gn/T/lomo-server-package-GKa5S7/configured (440K)
Configure Cloud Run runtime credentials before deploying this package.
package:server → /var/folders/8_/gnp60nfx1xq97r2hld5bys1w0000gn/T/lomo-server-package-GKa5S7/without-credentials (440K)
Configure Cloud Run runtime credentials before deploying this package.
server-packaging ok: no embedded credentials/build without credentials/runtime fail-closed

## ✅ integration-client (409ms)

integration-client ok: drawCalls=3287 coin 500→471 fpsLoop normal

## ✅ build-wechat-bundles (7181ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/verify/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/verify/wechat-release","cloudBase":"https://assets.invalid/assets/game/"}`

## ✅ bundle-size-gate (48ms)

build/verify/wechat-full-clone: 2.80MB / 4.00MB
build/verify/wechat-release: 2.80MB / 4.00MB

## ✅ bundle-smoke (2904ms)

`["build/verify/wechat-full-clone: gate→home ok, drawCalls=6401, drawImage=48","build/verify/wechat-release: gate→home ok, drawCalls=6113, drawImage=48"]`

## 性能/体积

- 无头启动+全功能冒烟: 409ms（含两局完整玩法）
- 双产物构建耗时: 7181ms
- FULL CLONE 包: 2867 KB
- RELEASE 包: 2867 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。