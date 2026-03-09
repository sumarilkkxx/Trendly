# Trendly

AI 热点监控系统：自动发现 AI 领域热点，经大模型过滤后通过邮件与 Web 列表通知。

## 技术栈

- **前端**：React + Vite + Tailwind（科技未来风）
- **后端**：Node.js + Express
- **数据库**：SQLite
- **AI**：OpenRouter
- **消息源**：Hugging Face、Reddit、Twitter、Hacker News、Google News、DuckDuckGo、开发者新闻（TechCrunch/The Verge 等）、自定义 RSS

## 快速开始

### 1. 安装依赖

```bash
npm install
cd client && npm install && cd ..
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
# 必填
OPENROUTER_API_KEY=sk-or-xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=app-password
SMTP_FROM=Trendly <your@email.com>
NOTIFY_EMAIL=user@example.com

# 可选（不配则对应源不启用）
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=
TWITTERAPI_IO_API_KEY=
```

### 3. 启动开发

```bash
# 终端 1：后端
npm run dev:server

# 终端 2：前端（含 API 代理）
cd client && npm run dev
```

访问 http://localhost:5173

### 4. 生产构建

```bash
cd client && npm run build
npm start
```

访问 http://localhost:3000

## 功能

- **仪表盘**：概览、手动扫描
- **热点列表**：按来源/关键词筛选
- **关键词管理**：添加/启用/禁用
- **消息源配置**：自定义 RSS（含 Twitter 转 RSS）
- **通知设置**：检查频率（默认 30min）、通知频率（默认 4h）

## 关键词扩展与相关性机制

- **监控关键词（canonical keyword）**：用户在设置页维护的关键词，例如 `GPT-5`、`Claude 4.6`。
- **查询变体（query variants）**：后端调用 OpenRouter 为每个关键词生成的一组搜索短语，用于拉取更全面的结果：
  - 例如：`Claude 4.6 → ["Claude 4.6", "Claude Sonnet 4.6", "Anthropic Claude 4.6", "Anthropic Claude update"]`
  - 变体带有 `type`（`exact` / `alias` / `version_alias` / `family_update`）与 `weight`（0–1）。
- **扩展查询流程**：
  1. 加载已启用关键词，若该关键词还没有变体（或解析失败），通过 OpenRouter 生成并缓存在数据库 `keywords.variants_json` 中；
  2. 按权重筛选出推荐的查询词，构造 OR 查询：
     - Twitter：`"Claude 4.6" OR "Claude Sonnet 4.6" OR "Anthropic Claude update" ...`
     - Google News / DuckDuckGo：按变体列表分别请求 RSS/搜索接口；
  3. 所有来源结果合并后，走统一的去重 + 截断逻辑，再交给 AI 做深度分析。
- **关键词级相关性（keyword_signals）**：
  - OpenRouter 在做过滤与摘要时，会同时输出全局字段与按关键词的相关性判断：
    - 全局：`keep / summary / description / reason / tags / relevance / importance / authenticity`
    - 关键词级：`keyword_signals[]`，每个元素包含：
      - `keyword`: 监控关键词原文（如 `GPT-5`）
      - `relation`: `"direct" | "strong" | "comparison" | "background" | "mention_only" | "unrelated"`
      - `score`: 0–100，对该关键词的直接相关度
      - `matched_variants`: 可选，命中的查询变体列表
  - 后端会将 `keyword_signals` 以 JSON 形式存入 `hotspots.keyword_signals` 字段，用于后续筛选与评估。
- **过滤策略（示例）**：
  - 扫描阶段按全局 `keep` + 规则计算 `relevance_score`，只保留有价值的 AI 内容；
  - 对于监控关键词视角的热点（例如只看 GPT‑5）时，可按以下规则过滤：
    - 仅当 `relation` 属于 `"direct"` 或 `"strong"` 且 `score >= 70` 时，视为真正的该关键词热点；
    - `comparison/background/mention_only` 默认不会被当作该关键词的主要热点（可在后续版本中做“宽松模式”支持）。
- **评估与调试**：
  - Scanner 在日志中会打印部分示例结果，包括 `reason` 与前三个 `keyword_signals`，方便快速检查判断是否符合预期；
  - 可在后续通过导出 `hotspots.keyword_signals` 构建评估集（例如标注哪些是误报/漏报），再迭代 prompt 与阈值。

## 文档

- [DESIGN.md](./DESIGN.md) - 设计方案
- [API_REFERENCE.md](./API_REFERENCE.md) - API 对接参考
