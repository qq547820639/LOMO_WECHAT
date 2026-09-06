# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T23:17:09.622Z

## ✅ route-parity-680 (9ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (46ms)

ok

## ✅ unit-core (3ms)

ok

## ✅ unit-assets+compliance (71ms)

ok

## ✅ unit-pack (4ms)

ok

## ✅ slot-ref-integrity (4ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (1ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (2045ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (13ms)

ok

## ✅ release-safety (5ms)

ok

## ✅ client-platform-transport (43ms)

client-platform ok: wx standalone guard/node touch dispatch

## ✅ client-runtime-consent-session-lifecycle (58ms)

client-runtime ok: native scale contract, feature reachability, consent timeout/retry, global RAF fallback

## ✅ client-hub-layout-navigation (41ms)

client-hubs ok: no invalid account polling, clipping, visible hit bounds, final row access, player copy, empty-state navigation

## ✅ client-combat-entry-retry-balances (65ms)

client-combat ok: real button fee/HUD sync, duplicate suppression, pending-session retry, lost-response recovery, correct duel routing

## ✅ action-idempotency-loss-restart-replay (3712ms)

action-idempotency ok: lost responses, request conflicts, account scope, failures, session finish, restart and retention

## ✅ cloud-persistence-transactions-restart-replay (152ms)

persistence ok: two instances, 20-way identities/commands/slots, atomic invites/mail/rollback, lost commit response, restart, paginated ledger, fail-closed; peak 36 ops

## ✅ release-config-validation (1187ms)

[build_wechat] wechat-release → /Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/release-config-test-rqyryo (atlases: 539, cloud-assets (boot pack 131), main pkg 2.88MB)
release-config ok: fail-closed runtime config, exact AppID, strict HTTPS, explicit cloudBase, URL validation enabled

## ✅ security-auth-persistence-hardening (5069ms)

security-hardening ok: isolated auth exchange/input validation/timeouts/login limits/tokens/admin/persistence

## ✅ server-packaging-credential-isolation (363ms)

package:server → /var/folders/8_/gnp60nfx1xq97r2hld5bys1w0000gn/T/lomo-server-package-IF6Ebr/configured (440K)
Configure Cloud Run runtime credentials before deploying this package.
package:server → /var/folders/8_/gnp60nfx1xq97r2hld5bys1w0000gn/T/lomo-server-package-IF6Ebr/without-credentials (440K)
Configure Cloud Run runtime credentials before deploying this package.
server-packaging ok: no embedded credentials/build without credentials/runtime fail-closed

## ✅ integration-client (421ms)

integration-client ok: drawCalls=3303 coin 500→434 fpsLoop normal

## ✅ build-wechat-bundles (3496ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/verify/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/verify/wechat-release","cloudBase":"https://assets.invalid/assets/game/"}`

## ✅ bundle-size-gate (20ms)

build/verify/wechat-full-clone: 2.89MB / 4.00MB
build/verify/wechat-release: 2.89MB / 4.00MB

## ✅ bundle-smoke (2897ms)

`["build/verify/wechat-full-clone: gate→home ok, drawCalls=6229, drawImage=47","build/verify/wechat-release: gate→home ok, drawCalls=5947, drawImage=47"]`

## 性能/体积

- 无头启动+全功能冒烟: 421ms（含两局完整玩法）
- 双产物构建耗时: 3496ms
- FULL CLONE 包: 2955 KB
- RELEASE 包: 2955 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。