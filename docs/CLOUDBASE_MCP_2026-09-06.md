# CloudBase MCP 运行复核（2026-09-06）

## 当前状态（2026-09-07 收尾复核）

后续复核已将线上版本推进至 Deploy 016（RunId `multi_tenant_1x3HhjW1MxsurN`，BuildId `2602221200`，镜像 `lomo-wechat-016-20260907023508`）；下方历史证据中的 Deploy 013/015 仅保留为前一轮记录。

Deploy 016（RunId `multi_tenant_1x3HhjW1MxsurN`，BuildId `2602221200`，镜像 `lomo-wechat-016-20260907023508`）已部署并承载 100% 流量，状态 `normal`。运行期 CloudBase API Key 已生效，启动日志无探针或数据库初始化错误。CBR 主域根路由已启用（`Enable=true`），公网 `/health` 与 `/v1/config/bootstrap` 均返回 200；伪造微信 code 返回 502 且不签发 token。生产集合 `ape_game_state` 仍为空，尚未迁移玩家数据；真微信 `wx.cloud.callContainer`、`wx.login → code2Session` 和真实广告回执仍未验收。

本记录保存本轮通过 CloudBase MCP 完成的只读巡检与可验证处置证据。环境为 `lomo-wechat-d0gcakr952f0d90b8`（上海），服务为 `lomo-wechat`，微信小游戏 AppID 为 `wxec103651e807c540`。未输出或写入任何密钥。

## 已确认

| 检查 | 结果 | 证据边界 |
|---|---|---|
| CloudBase 认证 | `READY`，账号级凭据 | 证明 MCP 可访问账号资源，不证明小游戏 AppID 已关联 |
| 环境 | `NORMAL`，NoSQL 数据库 `RUNNING`，套餐个人版，静态路由开启 | PostgreSQL/MySQL 未开通；业务继续使用 NoSQL |
| 云托管 | 环境已开通；`lomo-wechat` 为 container，Deploy 016 状态 `normal`，流量 100% | 真实微信链路仍待验收 |
| 网关 | 两个 CBR 默认域和静态托管默认域均有启用路由 | 路由开放不等于微信小程序授权链路通过 |
| 公网 API | `GET /v1/config/bootstrap` 返回 HTTP 200，`profile=wechat-release`，`configVersion=tuning-wechat-release-1` | 只证明公网 CBR 探测链路和当前线上版本可响应 |
| 运行指标 | 最近 24 小时 `TkeQPSService` 有低量请求（峰值 0.06），`TkeHttpErrorService` 有少量错误计数样本，最新 QPS 为 0 | 低流量不足以证明容量、真机链路或业务成功率 |
| 日志服务 | CLS 已开通；按 `tcbr` 搜索没有可用业务错误记录 | 空结果不能替代容器启动、认证和真机回归 |
| 生产集合 | `ape_game_state` 已创建为空集合，权限为 `ADMINONLY` | 未读取业务文档；尚未迁移玩家数据或验证运行身份写入 |
| 生产索引 | 回读 7 个索引：`_id_`、`_openid_1`、`ape_kind_seq`、`ape_kind_board_score`、`ape_kind_owner_board_seq`、`ape_kind_created`、`ape_kind_owner_seq` | 索引存在不代表查询计划和迁移对账已验收 |
| 线上登录安全 | 对 `/v1/auth/wechat` 提交明显伪造 code，Deploy 016 返回 502 且无 token | fail-closed 门禁已生效；真实 code 仍待验收 |

## 已执行处置

- 创建空的 `ape_game_state` 集合，建立 5 个契约复合索引，并将集合权限设为 `ADMINONLY`；仅处理结构和控制面权限，未读取、导出、修改或删除业务文档。
- 重新查询 CloudRun detail、部署记录、运行日志，确认 Deploy 015 为 `normal`，100% 流量且无探针失败。
- 查询网关路由、安全域名、环境详情、认证 provider、CLS 状态和运行指标；没有删除环境、服务、路由或数据。
- 对公网 bootstrap 做带超时的真实 HTTPS GET，收到 200 和完整自有产品配置；此前“公网请求超时”结论已过期，保留为历史现象，不再作为当前状态。
- 用不可能有效的测试字符串调用线上登录接口，仅记录 HTTP 状态和响应类型，确认旧版本仍签发 token；未使用该 token 访问或修改任何玩家数据。该结果作为高优先级安全阻断，不能继续扩大线上流量。
- Deploy 015 通过伪造 code 门禁后，已启用当前 CBR 根路由；`queryGateway(getRoute)` 回读 `Enable=true`，公网 bootstrap 返回 200。
- 查询官方知识库确认：小游戏 AppID 必须在 CloudBase 控制台“环境配置 → 安全配置 → 小程序关联”绑定；`MINIAPP` 访问类型和公网路由不能替代该绑定。

## 仍需外部操作的阻断

1. 微信开发者工具对同一环境/服务的 `wx.cloud.callContainer` 仍报告 `85088`，而公网 GET 已 200。现有 MCP 没有“绑定/列出小游戏 AppID 与环境”的管理 action；需由有权限的微信/CloudBase 控制台完成 AppID 关联或环境共享，再在 `urlCheck=true` 下复测。
2. **已关闭的代码安全门禁**：Deploy 015 已部署本工作区 fail-closed 持久化与认证修复；伪造 code 返回 `WECHAT_AUTH_FAILED`/非 2xx 且不签发 token。仍需真实 code 验证官方登录与生产持久化。
3. 合法域名、真实 `wx.login → code2Session`、真实激励广告回执验签、真机弱网/前后台、资质与内容审核仍没有平台证据。

## 复测命令与判定

```bash
curl --fail --silent --show-error --max-time 45 \
  https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com/v1/config/bootstrap
```

只有同时满足“公网 200、开发者工具 `callContainer` 成功、真实 AppID 关联、真实登录和生产持久化回归”时，才可关闭 K2 与官方登录阻断。公网 200、离线测试绿灯或 Bot 训练场均不能单独宣称正式联机。
