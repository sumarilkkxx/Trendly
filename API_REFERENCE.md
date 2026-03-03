# API 对接参考（基于 MCP 获取的最新文档）

> 本文档通过 MCP 拉取各平台最新官方文档整理，开发时请以此为准，避免使用过时代码。

**文档更新时间**：基于 2025 年 3 月获取的官方文档

---

## 一、OpenRouter API

**文档来源**：[openrouter.ai/docs](https://openrouter.ai/docs)

### 端点与认证

- **Base URL**：`https://openrouter.ai/api/v1`
- **Chat 端点**：`POST /chat/completions`
- **认证**：`Authorization: Bearer <OPENROUTER_API_KEY>`

### 请求格式（OpenAI 兼容）

```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <OPENROUTER_API_KEY>',
    'Content-Type': 'application/json',
    'HTTP-Referer': '<YOUR_SITE_URL>',    // 可选，用于 OpenRouter 排行榜
    'X-OpenRouter-Title': '<YOUR_SITE_NAME>',  // 可选
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o-mini',  // 或 anthropic/claude-3-haiku 等，见 openrouter.ai/models
    messages: [
      { role: 'user', content: '...' }
    ],
    max_tokens: 1024,
    temperature: 0.3,
  }),
});
```

### 推荐 SDK（官方）

```bash
npm install @openrouter/sdk
```

```typescript
import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const completion = await openRouter.chat.send({
  model: 'openai/gpt-4o-mini',
  messages: [{ role: 'user', content: '...' }],
  stream: false,
});

console.log(completion.choices[0].message.content);
```

### 结构化输出（内容过滤用）

可使用 `response_format` 强制 JSON 输出，便于 AI 判断结果解析：

```json
{
  "response_format": { "type": "json_object" },
  "model": "openai/gpt-4o-mini",
  "messages": [...]
}
```

---

## 二、TwitterAPI.io API

**文档来源**：[docs.twitterapi.io](https://docs.twitterapi.io) OpenAPI Spec

### 端点与认证

- **Base URL**：`https://api.twitterapi.io`
- **认证**：请求头 `X-API-Key: <API_KEY>`
- **OpenAPI**：https://docs.twitterapi.io/api-reference/openapi.json

### 关键词搜索（高级搜索）

- **端点**：`GET /twitter/tweet/advanced_search`
- **参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | 搜索关键词，支持 `"AI" OR "GPT"`、`from:username`、`since:YYYY-MM-DD` 等 |
| queryType | string | 是 | `Latest` 或 `Top`，默认 `Latest` |
| cursor | string | 否 | 分页游标，首次传空字符串 |

- **响应**：`{ tweets: Tweet[], has_next_page: boolean, next_cursor: string }`
- **Tweet 字段**：`id`, `text`, `url`, `createdAt`, `author`, `likeCount`, `retweetCount` 等

### 示例

```typescript
const res = await fetch(
  `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent('AI OR GPT')}&queryType=Latest&cursor=`,
  {
    headers: { 'X-API-Key': process.env.TWITTERAPI_IO_API_KEY },
  }
);
const data = await res.json();
// data.tweets, data.has_next_page, data.next_cursor
```

---

## 三、rss-parser（RSS 解析）

**文档来源**：[npmjs.com/package/rss-parser](https://www.npmjs.com/package/rss-parser) v3.13.0

### 安装

```bash
npm install rss-parser
```

### 用法（Node.js）

```javascript
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Trendly/1.0' },
});

const feed = await parser.parseURL('https://huggingface.co/blog/feed.xml');

feed.items.forEach(item => {
  console.log(item.title, item.link, item.pubDate, item.contentSnippet);
});
```

### 输出字段

- `feed.title`, `feed.link`
- `feed.items[]`：`title`, `link`, `pubDate`, `content`, `contentSnippet`, `guid`, `isoDate`

---

## 四、snoowrap（Reddit API）

**文档来源**：[github.com/not-an-aardvark/snoowrap](https://github.com/not-an-aardvark/snoowrap)

> 注意：snoowrap 仓库已于 2024 年 3 月归档，但库仍可使用。需 Reddit OAuth 凭证。

### 安装

```bash
npm install snoowrap
```

### 认证配置

```javascript
const snoowrap = require('snoowrap');

const r = new snoowrap({
  userAgent: 'Trendly/1.0 by YourApp',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN,
});
```

### 获取子版块帖子

```javascript
// Hot 帖子
const hotPosts = await r.getSubreddit('MachineLearning').getHot({ limit: 25 });

// New 帖子
const newPosts = await r.getSubreddit('MachineLearning').getNew({ limit: 25 });

hotPosts.forEach(post => {
  console.log(post.title, post.url, post.selftext, post.created_utc);
});
```

### 凭证获取

在 https://www.reddit.com/prefs/apps 创建应用，使用 OAuth 流程获取 refreshToken。可参考 [reddit-oauth-helper](https://github.com/not-an-aardvark/reddit-oauth-helper)。

---

## 五、Spectre UI（前端组件）

**文档来源**：[spectreui.dev/docs](https://spectreui.dev/docs)

### 安装

```bash
pnpm add @spectre-ui/core framer-motion
```

### 基础用法

```tsx
import { SpectreThemeProvider, Button, Card, CardHeader, CardTitle, CardContent } from "@spectre-ui/core";
import "@spectre-ui/core/styles.css";

function App() {
  return (
    <SpectreThemeProvider defaultTheme="dark">
      <Card variant="hud">
        <CardHeader>
          <CardTitle>Mission Briefing</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="primary">Accept</Button>
        </CardContent>
      </Card>
    </SpectreThemeProvider>
  );
}
```

### Tailwind 集成

```bash
pnpm add @spectre-ui/tailwind-config
```

```javascript
// tailwind.config.ts
import { spectreUIPlugin } from "@spectre-ui/tailwind-config/plugin";

export default {
  plugins: [spectreUIPlugin],
};
```

---

## 六、Nodemailer（邮件）

### 安装

```bash
npm install nodemailer
```

### 基本用法

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'user@example.com',
  subject: 'AI 热点通知',
  html: '<h2>标题</h2><p>摘要</p><a href="...">原文链接</a>',
});
```

---

## 七、版本与依赖汇总

| 依赖 | 版本/说明 |
|------|----------|
| @openrouter/sdk | 最新（推荐）或使用 fetch 直连 |
| rss-parser | ^3.13.0 |
| snoowrap | ^1.23.0 |
| @spectre-ui/core | ^1.0.1 |
| framer-motion | peer dependency of Spectre UI |
| nodemailer | 最新 |
| node-cron | 最新（定时任务） |

---

开发时请优先查阅各平台**官方文档**，本文档作为快速参考。若 API 有变更，以官方文档为准。
