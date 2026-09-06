# CloudBase MCP 接入与只读诊断（2026-09-06）

## 结论

已按用户提供的官方 Codex 接入指南，安装并配置 **`@cloudbase/cloudbase-mcp@2.33.0`**。独立 stdio JSON-RPC 客户端完成 `initialize`、`notifications/initialized`、`tools/list`，发现 **38 个工具**；现有 CloudBase 账号登录态可用，目标环境和云托管服务均可只读查询。

这解决了本机缺少 CloudBase MCP 的接入问题，**没有证明微信端 85088 已修复**。当前证据确认云托管已开通、服务正常且开放 `MINIAPP` 访问类型；仍需核对小游戏 AppID 与目标环境的关联/共享授权，以及微信请求的完整错误信息。本轮没有部署、调整云访问权限、绑定/转换云环境或轮换密钥。

## 1. 安装与配置结果

| 项目 | 实际结果 |
|---|---|
| npm 包 | `@cloudbase/cloudbase-mcp`，版本 `2.33.0` |
| 安装方式 | `npm install --global @cloudbase/cloudbase-mcp` |
| 可执行文件 | `/Users/panhao/.local/bin/cloudbase-mcp` |
| 实际 Codex CLI | `/Applications/ChatGPT.app/Contents/Resources/codex` |
| 配置文件 | `/Users/panhao/.codex/config.toml` |
| MCP 名称 / 传输 | `cloudbase` / `stdio`，已启用 |
| 仅新增的 MCP 环境变量 | `INTEGRATION_IDE=CodeX` |
| 协议 / 服务标识 | `2024-11-05` / `cloudbase-mcp`，版本 `2.33.0` |
| 初始化工具数量 | `38` |

安装前只读取并输出已有 MCP 名称、启用状态及传输类型，确认没有同名 `cloudbase`。原有 `computer-use`、`cua_repl`、`node_repl` 配置及启用状态保留；未批量安装 CloudBase Skills，未修改全局 `AGENTS.md`。

执行的注册命令使用绝对路径，避免桌面进程 PATH 与终端不同：

```bash
/Applications/ChatGPT.app/Contents/Resources/codex mcp add cloudbase \
  --env INTEGRATION_IDE=CodeX -- /Users/panhao/.local/bin/cloudbase-mcp
```

新增配置不含 CAM SecretId/SecretKey、微信 AppSecret、应用签名密钥或管理员令牌。现有账号登录态已足够查询；一次环境查询另以仅进程内读取本地现有 CAM 变量验证，未把凭据写入 MCP 配置、报告或新文件。

安装后的首次验证直接连接已安装 MCP 进程完成，没有创建新 Codex 任务或要求中断当前 QA。继续执行期间宿主已加载 CloudBase 原生工具，当前工具目录可发现这 38 项；下述本地探针仍保留为安装阶段的可复现证据。

## 2. 本地验证证据

本地临时验收产物：

- `build/qa-evidence/cloudbase-mcp-probe.cjs`：启动官方 MCP、执行 JSON-RPC 请求并对输出脱敏；云服务变量只保留名称。
- `build/qa-evidence/cloudbase-mcp-tools.json`：初始化响应与 38 个工具的定义，不含云凭据。

初始化及工具列举过程中未出现非 JSON stdout，也未输出 stderr。`auth(action="status")` 返回：

```json
{
  "auth_status": "READY",
  "credential_scope": "account",
  "current_env_id": "lomo-wechat-d0gcakr952f0d90b8",
  "current_region": "ap-shanghai"
}
```

首次 `auth(status)` 报告 MCP 已自动选择唯一可见环境（`AUTO_BOUND`）；这是 MCP 的本地操作上下文，**不是微信 AppID 与云环境的关联或授权证明**。

## 3. 云端只读查询结果

| 查询 | 关键结果 | 能证明的范围 |
|---|---|---|
| `queryEnv(action="list", region="ap-shanghai")`，按目标 EnvId 过滤 | `lomo-wechat-d0gcakr952f0d90b8`，别名 `lomo-wechat`，`Status=NORMAL` | 当前账号能查询目标环境。 |
| `queryEnv(action="info")` | `Source=qcloud`、`EnvChannel=qc_console`、`UserInfo.WxAppId` 为空 | 环境源于腾讯云侧；空字段只作为关联核对线索。 |
| `queryCloudRun(action="envStatus")` | `IsExist=true`、`Status=normal`、上海，云托管套餐类型 `Trial` | 云托管已开通，不是未开通资源的状态。 |
| `queryCloudRun(action="list")` | 服务 `lomo-wechat`、容器型、`Status=normal` | 服务存在且控制面报告正常。 |
| `queryCloudRun(action="detail")` | 公网域名与客户端配置一致；`AccessTypes` / `OpenAccessTypes` 包含 `OA`、`PUBLIC`、`MINIAPP` | 不能将失败简单归因于服务未开放 MINIAPP 类型；类型开关不等于指定 AppID 的关联证明。 |
| 同一服务详情 | 在线版本 `lomo-wechat-002`，流量 `100%`，最近部署 `normal` | 云端仍运行历史版本，本轮本地修复包未部署。 |
| 同一服务配置 | 端口 `8080`，最小实例 `0`、最大实例 `5`；查询时 `ScaleStatus=zero` | 服务配置允许缩容至零，存在冷启动条件；该状态不能单独解释 85088。 |
| 服务详情 `revealEnvParams=false` | 显式 `ServerConfig.EnvParams` 未列出环境变量名称 | 仅说明管理配置中未列出额外变量；历史镜像可能自带 Dockerfile ENV，不能据此断言云端绝无 AppSecret。 |
| `callCloudApi` → `tcbr.DescribeEnvBaseInfo` | `IsExist=true`、`Status=normal`、目标 EnvId 与地域一致 | 已通过原生管理 API 独立确认云托管开通状态。 |

目标环境详情还显示 NoSQL 数据库 `RUNNING`，未开通 PostgreSQL 或 MySQL。初次诊断时服务端只实现内存/JSON Store；后续已实现并实测隔离云事务适配，见 [PERSISTENCE.md](PERSISTENCE.md)。在线旧版本尚未迁移或部署，数据库资源存在不等于线上玩家持久化已切换。

## 4. 85088 排障的证据与缺口

当前 QA 已在微信开发者工具使用以下环境和服务请求 bootstrap，出现错误码 85088：

```js
wx.cloud.callContainer({
  config: { env: 'lomo-wechat-d0gcakr952f0d90b8' },
  path: '/v1/config/bootstrap',
  header: { 'X-WX-SERVICE': 'lomo-wechat' },
  method: 'GET',
  success: console.log,
  fail: console.error
});
```

官方 CloudBase 文档搜索 `85088` 返回空结果，已打开的微信 `callContainer` 文档也未给出该码解释。不能把它等同于官方 FAQ 中另一个错误 `Your server is Forbidden For CallContainer`，也不能仅凭环境详情的空 `WxAppId` 就认定根因。

已直接读取并核对的官方前置条件：

1. `callContainer` 默认只能访问与当前小程序已关联的云开发环境；需要已部署的服务名和 `wx.cloud` 初始化。
2. 跨环境访问需目标环境向同主体消费方开放“环境共享”，并使用资源方 `resourceAppid`、`resourceEnv` 创建 `wx.cloud.Cloud` 实例。不能通过猜测资源方 AppID 修补客户端。
3. CloudBase MCP 的账号认证、服务的 `MINIAPP` 类型开关、小游戏 AppID 与环境的关联，是不同层级，不能互相替代。
4. 正常 `callContainer` 链路不依赖小程序的 request 合法域名；此前直接 `wx.request` 被域名校验拦截是另一条链路。CDN 下载仍需对应域名配置与微信运行时验证。

本轮没有得到该小游戏 AppID `wxec103651e807c540` 已关联目标环境或已获得共享授权的直接证据。下一步应核验关联记录，并保留同一次失败的完整 `errMsg`、基础库版本、AppID、env、服务名、时间及可用请求标识；关联证据充分后再评估是否需要代码配置变更。

### 窄时间窗日志复查

本地失败截图 `build/qa-evidence/formal-network-failure.png` 的文件修改时间为 `2026-09-06 17:44:04 +0800`。以此为近似时间线索，查询目标环境 `2026-09-06 17:40:00` 至 `2026-09-06 17:50:00` 的日志，每次最多 3–5 条。截图文件时间不等于准确请求时间；MCP 直接透传时间字符串，上游 API 的时区解释本轮未独立确认。

| 只读查询 | 实测结果 | 管理 API RequestId |
|---|---|---|
| `queryLogs(action="checkLogService")` | 环境 CLS 日志服务 `enabled=true`；不代表所有入口和容器日志均已采集 | 工具未返回 |
| `queryLogs(action="searchLogs", service="tcbr", queryString='"85088"', limit=5)` | `Results=null`，`ListOver=true` | `78ac490a-333e-47ca-9e29-644cbe7632a0` |
| 同一 tcbr 窗口，放宽为 `queryString="*"`，`limit=3` | `Results=null`，`ListOver=true` | `3660eba8-81be-47f3-941c-27f3d302e772` |
| tcb 窗口，`queryString='logType:accesslog AND "lomo-wechat"'`，`limit=5` | `Results=[]`，`ListOver=true` | `f3375a4d-eaa4-42f0-b802-6ac4394dd9f2` |
| 同一 tcb 窗口，放宽为 `queryString="logType:accesslog"`，`limit=3` | `Results=[]`，`ListOver=true` | `af2389d9-b3fc-4d45-b0dc-2ece2a6c2e85` |
| `queryCloudRun(action="getProcessLog")`，服务 `lomo-wechat`，RunId `multi_tenant_1x331CEEG4oWvk` | 历史部署记录 `normal`，BuildId `2602224742`，部署时间 `2026-09-06 10:54:06`；返回 6 条流程日志，其中时间标记约为 `10:54:15`–`10:55:10` | `ba3537f8-c4e3-4930-a6a1-92dd6f5a0396` |

已检查官方 MCP 本地 SDK 实现：`queryLogs` 调用 `tcb.SearchClsLog` 或 `tcbr.SearchClsLog`；`getProcessLog` 调用 `tcbr.DescribeCloudRunProcessLog`，参数只有目标 `EnvId` 与部署 `RunId`。这次取得的是历史部署流程记录，**不是本次失败的 HTTP 入站日志**；没有匹配日志不能推出请求未到达服务，也不能推出 85088 由 AppID 关联、冷启动或应用代码中的某一项造成。

日志结果只输出了字段、计数、时间、已知状态与管理请求标识，没有将任意日志正文或凭据写入报告。表中 RequestId 是管理查询请求标识，不能作为微信失败请求的追踪 ID。

官方 MCP 的 `searchKnowledgeBase(readDoc)` 在传入部分完整 URL 时返回了 404 页 HTML，却标记“读取成功”。已改为直接 HTTP 获取实际页面并核对正文，未把该 404 页当作有效文档。该工具现象也不等于云资源访问失败。

## 5. 可复现的只读管理操作

从仓库根目录执行；这些命令不进行部署或访问策略修改：

```bash
node build/qa-evidence/cloudbase-mcp-probe.cjs auth '{"action":"status"}'
node build/qa-evidence/cloudbase-mcp-probe.cjs queryEnv '{"action":"list","envId":"lomo-wechat-d0gcakr952f0d90b8","region":"ap-shanghai","fields":["EnvId","Alias","Status","Region"]}'
node build/qa-evidence/cloudbase-mcp-probe.cjs queryCloudRun '{"action":"detail","detailServerName":"lomo-wechat","revealEnvParams":false}'
node build/qa-evidence/cloudbase-mcp-probe.cjs queryCloudRun '{"action":"envStatus","envId":"lomo-wechat-d0gcakr952f0d90b8"}'
node build/qa-evidence/cloudbase-mcp-probe.cjs callCloudApi '{"service":"tcbr","action":"DescribeEnvBaseInfo","version":"2022-02-17","params":{"EnvId":"lomo-wechat-d0gcakr952f0d90b8"},"region":"ap-shanghai"}'
```

`DescribeEnvBaseInfo` 需要 `tcbr` 服务、版本 `2022-02-17`、顶层 `region` 与 `params.EnvId`，以上参数已实际调用成功。CloudBase MCP 还提供 `queryCloudRun(action="getDeployRecords")`、`queryCloudRun(action="getProcessLog")`，可按指定服务及部署 RunId 查询流程日志；本轮已按 §4 查询指定 RunId 和受限时间窗，未保存完整业务日志。

当前已查询的 MCP/schema、官方页面和本地 CloudBase CLI SDK 未提供可确定的“列出此 AppID 环境关联”的原生管理 Action，未猜测或调用近义 API。SDK 中 `DescribeEnvAccountCircle` 是计费周期查询，`DescribeWedaWxBind` 属于微搭应用绑定，不是本项目小游戏关联记录的替代证据。可按官方指南检查以下页面：

- 腾讯云账号中心 → 账号信息 → 登录方式 → 微信公众平台：核对关联的小程序与当前腾讯云账号是否一致。
- 微信开发者工具 → 云开发 → 设置 / 环境设置 → 管理我的环境：核对当前 AppID 可见环境是否包含目标 EnvId。
- CloudBase 官方小程序接入示例还给出：目标环境 → 环境配置 → 安全配置 → 小程序关联，核对目标 AppID 的记录。界面入口应以该账号当前可见控制台为准。

本轮补充实际打开腾讯云控制台 `https://console.cloud.tencent.com/tcb`，当前内置浏览器停留于微信/邮箱登录页，没有可复用的控制台登录态。MCP 的现有认证不会自动转为浏览器登录态，未代替用户完成扫码或从浏览器文件提取会话。

继续复查时，通过微信开发者工具 CLI 的 `cloud --help` → `cloud env --help` 确认存在官方环境列表命令，并实际执行 `cli cloud env list --appid wxec103651e807c540`。平台返回 `ret=1000`、`errmsg="system error."`、`wx_req_id="27bae783-1788691914"`，未取得环境列表。CLI 进程退出码为 0，但业务操作明确失败，不能按成功处理；也不能把没有返回列表误判为该 AppID 没有关联环境。该微信请求标识可用于平台排障，与前述 CloudBase 管理查询 RequestId 不同。

官方“使用已有腾讯云环境”流程涉及账号绑定、环境转换及扫码验证；本轮只读任务未执行这些修改。若确认需要变更，应先确认目标账号、AppID、环境、已有业务与影响范围，不能把重新部署镜像当作关联修复。

## 6. 已执行、未执行与剩余风险

- 已执行：官方包安装、新增单一 MCP 配置、协议与工具发现、现有账号状态查询、目标环境/服务/运行配置只读查询、窄窗口 CLS 日志及指定 RunId 流程日志查询、官方资料核验。
- 已复查：保留既有 MCP、配置不含新增凭据、工具数与安装版本一致、输出脱敏；报告和临时探针产物进行秘密值扫描。
- 未执行：部署、云权限调整、账号/环境关联变更、环境转换、密钥轮换、数据库迁移、完整业务日志抓取。
- 剩余风险：85088 未定位到确定根因；微信真实登录未验收；AppID 关联/共享授权尚未取得直接证据；历史镜像凭据与生产持久化问题仍在主审计风险清单内。

## 官方资料

- [CloudBase：OpenAI Codex CLI 接入指南](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/openai-codex-cli)
- [CloudBase：小程序访问云托管服务](https://docs.cloudbase.net/run/develop/access/mini)
- [微信：小程序调用云托管服务](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/call/mini.html)
- [CloudBase：创建环境及使用已有腾讯云环境](https://docs.cloudbase.net/quick-start/create-env)
- [CloudBase：账号与小程序关联 FAQ](https://docs.cloudbase.net/faq/account)
- [CloudBase：小程序 AppID 关联接入示例](https://docs.cloudbase.net/recipes/add-cloud-function-wechat-miniprogram)
- [CloudBase：云托管服务 FAQ](https://docs.cloudbase.net/run/faq/server)
