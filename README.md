# Trendly

AI 热点监控系统：自动发现 AI 领域热点，经大模型过滤后通过邮件与 Web 列表通知。

## 技术栈

- **前端**：React + Vite + Tailwind（科技未来风）
- **后端**：Node.js + Express
- **数据库**：SQLite
- **AI**：OpenRouter
- **消息源**：Hugging Face RSS、Reddit、TwitterAPI.io、自定义 RSS

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

## 文档

- [DESIGN.md](./DESIGN.md) - 设计方案
- [API_REFERENCE.md](./API_REFERENCE.md) - API 对接参考
