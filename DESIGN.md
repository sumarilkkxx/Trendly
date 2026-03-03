# AI 热点监控系统 - 设计方案

> **开发须知**：具体 API 对接与实现方式请查阅 [API_REFERENCE.md](./API_REFERENCE.md)，该文档基于 MCP 拉取的最新官方文档整理，避免使用过时代码。

## 一、项目概述

**产品名称**：Trendly（AI 热点追踪器）

**核心目标**：自动发现 AI 领域热点，第一时间通过通知送达用户，无需人工搜索。支持关键词监控和主题范围内热点自动采集，并通过大模型过滤假冒/低质内容。

---

## 二、功能架构

### 2.1 核心功能模块

| 模块 | 功能描述 | 实现方式 |
|------|----------|----------|
| **关键词监控** | 用户输入关键词，当相关真实内容出现时第一时间通知 | RSS 聚合 + 内容匹配 + AI 过滤 |
| **热点采集** | 定时在指定范围（如 Vibe Coding）内搜集热点 | 定时任务 + 多源 RSS + AI 摘要 |
| **内容过滤** | 过滤假冒、营销、低质内容 | OpenRouter 大模型判断 |
| **通知推送** | 邮件 + Web 列表 | 邮件为主；架构预留 Webhook 扩展（钉钉/飞书等） |
| **热点展示** | 用户可浏览已采集的热点 | Web 响应式界面 |

### 2.2 数据流示意

```
多源并行拉取：
  - Hugging Face RSS
  - Reddit API (子版块 hot/new)
  - TwitterAPI.io 关键词搜索（可选，需 API Key）
  - 自定义 RSS（含 Planet AI、Twitter 转 RSS 等）
      ↓
关键词匹配 / 主题范围筛选
      ↓
OpenRouter AI 过滤（真实性、相关性、去重）
      ↓
入库 + 触发通知
      ↓
Web 展示 (Spectre UI) / 邮件推送
```

---

## 三、技术选型

### 3.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React + Vite + Spectre UI + Tailwind | 科技未来风、HUD 美学、响应式 |
| **后端** | Node.js + Express | 与前端同语言，易维护 |
| **数据库** | SQLite | 轻量、零配置、适合个人工具 |
| **AI 服务** | OpenRouter API | 统一接入多模型，支持 GPT/Claude 等 |
| **RSS 解析** | rss-parser (npm) | 成熟、支持 RSS/Atom |
| **Reddit** | snoowrap (npm) | Node.js Reddit API 封装 |
| **Twitter** | 直接 HTTP 请求 | TwitterAPI.io REST API，`X-API-Key` 认证 |
| **定时任务** | node-cron | 轻量级 cron |
| **邮件通知** | Nodemailer + SMTP | 通用，支持 Gmail/QQ 等；架构预留 Webhook |

> 实现时请参考 [API_REFERENCE.md](./API_REFERENCE.md)，包含 OpenRouter、TwitterAPI.io、rss-parser、snoowrap、Spectre UI 等最新对接方式（基于 MCP 获取的官方文档）。

### 3.2 消息源（多平台）

| 平台 | 接入方式 | 说明 |
|------|----------|------|
| **Reddit** | Reddit OAuth API + snoowrap | 监控 r/MachineLearning、r/LocalLLaMA、r/ArtificialIntelligence 等子版块 |
| **Hugging Face** | RSS + Hub API | 官方博客 `https://huggingface.co/blog/feed.xml`，可选模型/数据集更新 |
| **Twitter/X** | **TwitterAPI.io**（推荐） | 第三方 API [twitterapi.io](https://twitterapi.io/)：按量付费约 $0.15/千条推文、$0.1 免费额度、无需 Twitter 开发者审批；支持关键词高级搜索 `GET /twitter/tweet/advanced_search` |
| **Twitter 备选** | 自定义 RSS | 用户可通过 twitrss.com 等将搜索转为 RSS 后作为自定义源（零成本方案） |
| **自定义 RSS** | 通用 RSS 解析 | 用户可添加任意 RSS URL（含 Planet AI、Nitter 等） |

**预设 Reddit 子版块**：r/MachineLearning、r/LocalLLaMA、r/ArtificialIntelligence、r/OpenAI、r/ChatGPT

### 3.3 TwitterAPI.io 接入（Twitter 主方案）

- **Base URL**：`https://api.twitterapi.io`
- **认证**：请求头 `X-API-Key: <API_KEY>`
- **关键词搜索**：`GET /twitter/tweet/advanced_search?query=<关键词>&queryType=Latest`
- **query 语法**：支持 `"AI" OR "GPT"`、`from:username`、`since:YYYY-MM-DD` 等，参考 [twitter-advanced-search](https://github.com/igorbrigadir/twitter-advanced-search)
- **定价**：约 $0.15/千条推文，注册送 $0.1 免费额度，按量付费
- **文档**：[docs.twitterapi.io](https://docs.twitterapi.io/)、[API_REFERENCE.md](./API_REFERENCE.md)

### 3.4 OpenRouter 接入（AI 过滤）

- **文档**：[openrouter.ai/docs](https://openrouter.ai/docs)、[API_REFERENCE.md](./API_REFERENCE.md)
- **Base URL**：`https://openrouter.ai/api/v1`
- **认证**：`Authorization: Bearer sk-or-xxx`
- **用途**：
  1. 内容真实性/相关性判断（过滤假冒、营销）
  2. 热点摘要生成
  3. 关键词匹配增强（语义相似度）

---

## 四、调度与通知设计

### 4.1 检查频率（拉取热点）

- **可自定义**：用户可在「通知设置」中调整热点检查间隔
- **默认**：每 **30 分钟** 执行一次（从 RSS、Reddit、Twitter 等源拉取新内容）
- **与通知频率独立**：检查更频繁可更快发现热点，通知仍按 4.4 节频率汇总发送

### 4.2 通知方式（MVP vs 扩展）

| 方式 | MVP | 扩展 |
|------|-----|------|
| **邮件** | ✅ 主方案 | - |
| **Web 列表** | ✅ 已有 | - |
| **Webhook** | 架构预留 | ✅ 后续支持钉钉/飞书/Slack 等 |

### 4.3 通知内容格式（统一）

每条热点通知统一包含：

1. **标题**：热点标题或来源描述  
2. **摘要**：AI 生成的简要说明（来自 OpenRouter）  
3. **原文链接**：跳转到 Reddit/Hugging Face/Twitter 等原文

### 4.4 通知频率（发送邮件）

- **可自定义**：用户可在「通知设置」中调整邮件发送间隔
- **默认**：每 **4 小时** 汇总发送一次（digest 模式，汇集本周期内新发现的热点）

### 4.5 Webhook 扩展预留

- 数据表/配置项预留 `webhook_url`、`webhook_type`（dingtalk/feishu/slack 等）  
- 通知逻辑抽象为「发送器」接口，邮件与 Webhook 共用同一内容格式  

---

## 五、界面设计

### 5.1 设计风格

- **风格**：科技未来风（Tech Futuristic / Cyber HUD）
- **UI 组件库**：**Spectre UI**（`@spectre-ui/core`）— 专为未来科技风设计，含深色赛博美学、HUD 风格、Framer Motion 动效、Radix 无障碍
- **备选**：若兼容性需求高，可用 shadcn/ui + 自定义赛博主题
- **主色**：Cyber Dark 主题 — 深色底 + 青/蓝/紫霓虹高亮、网格背景、发光边框
- **字体**：科技感无衬线（如 Space Grotesk、Orbitron）+ 等宽辅助
- **布局**：侧边导航 + 卡片网格，响应式，支持 `prefers-reduced-motion`

### 5.2 主要页面

1. **仪表盘**：今日热点概览、各源监控状态（Reddit/HF/RSS）
2. **关键词管理**：添加/删除/启用关键词
3. **热点列表**：按时间/来源/主题筛选，支持搜索
4. **消息源配置**：启用/禁用 Reddit、Hugging Face、TwitterAPI.io、自定义 RSS；Twitter 可选用 API（需 Key）或 RSS 备选（twitrss.com）
5. **通知设置**：检查频率（默认 30 分钟）、通知频率（默认 4 小时）、邮件、范围（如 Vibe Coding）；预留 Webhook 配置入口
6. **关于/帮助**：配置说明、各平台接入指引（含 Twitter 自定义源教程）

---

## 六、API 设计（简要）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/keywords` | 获取关键词列表 |
| POST | `/api/keywords` | 添加关键词 |
| DELETE | `/api/keywords/:id` | 删除关键词 |
| GET | `/api/hotspots` | 获取热点列表（分页、筛选） |
| POST | `/api/settings` | 更新通知设置（含检查频率、通知频率、Webhook URL 等） |
| GET | `/api/settings` | 获取当前设置 |
| POST | `/api/scan` | 手动触发一次扫描（可选） |

---

## 七、环境配置

需要用户提供：

- `OPENROUTER_API_KEY`：OpenRouter API 密钥
- `SMTP_*`：邮件配置（host, user, pass, from）
- `REDDIT_CLIENT_ID`、`REDDIT_CLIENT_SECRET`、`REDDIT_REFRESH_TOKEN`：Reddit API（可选）
- `TWITTERAPI_IO_API_KEY`：TwitterAPI.io API 密钥（可选，[注册](https://twitterapi.io/) 即得 $0.1 免费额度；不配则可用自定义 RSS 如 twitrss.com 作为 Twitter 备选）
- 可选：`PORT`（默认 3000）

---

## 八、开发计划（敏捷迭代）

### 阶段一：MVP（网页版核心功能）

0. **参考** [API_REFERENCE.md](./API_REFERENCE.md) 进行各 API 对接，避免过时代码
1. 项目初始化（React+Vite+Spectre UI 前端 + Node.js 后端 + SQLite）
2. RSS 拉取与解析（Hugging Face + 自定义源）
3. Reddit API 接入（snoowrap，子版块 hot/new）
4. TwitterAPI.io 接入（高级搜索 `/twitter/tweet/advanced_search`，按关键词拉取）
5. OpenRouter 内容过滤 + 关键词管理 + 热点列表展示（Spectre UI 科技风界面）
6. 定时任务（检查频率默认 30 分钟，可配置）+ 邮件通知（默认 4 小时汇总一次）

### 阶段二：完善与测试

7. 界面打磨、响应式优化
8. 通知设置页、手动扫描
9. 端到端测试、文档

### 阶段三：Agent Skills

10. 编写 SKILL.md，封装为 Agent Skills
11. 使其他 AI 能调用监控、发现热点能力

---

## 九、已确认事项（基于反馈）

- **消息源**：Twitter/X、Reddit、Hugging Face（已纳入设计）
- **界面风格**：科技未来风，采用 Spectre UI 等适配组件库
- **通知方式**：MVP 用邮件 + Web 列表，架构预留 Webhook 扩展
- **通知内容**：标题 + 摘要 + 原文链接（统一格式）
- **检查频率**：可自定义，默认 30 分钟拉取一次
- **通知频率**：可自定义，默认 4 小时汇总发送一次

## 十、待您确认的事项

1. ~~**邮件通知**~~：已确定 — 邮件 + Web 列表，预留 Webhook
2. ~~**通知频率**~~：已确定 — 可自定义，默认 4 小时
3. ~~**Twitter 接入**~~：已确定 — 采用 **TwitterAPI.io**
4. **其他**：有无需要补充的 Reddit 子版块或 RSS 源？

确认后，我将按此方案分步骤实现，并在每步完成后向您汇报。
