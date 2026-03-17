---
name: ai-hotspot-monitor
description: Monitors and discovers AI field hotspots through multi-source web search including Twitter, Hacker News, Google News, DuckDuckGo, tech media, and RSS. Performs relevance analysis, authenticity validation, summary generation, and topic classification using current AI model without external LLM APIs. Use when searching AI hotspots, discovering AI news, or monitoring trends in AI models, papers, and product releases.
---

# AI Hotspot Monitor

## Quick Start

This skill helps discover AI-related hotspots across multiple sources, filters outdated or irrelevant content, and provides structured, ranked summaries without requiring external AI services.

Core workflow: Multi-source collection → Basic deduplication → AI-based relevance/filtering → Ranked output

## When to Use

Use this skill when the user:
- Searches for AI hotspots or trends (e.g., "Find recent hotspots about GPT-5")
- Wants AI news aggregation (e.g., "Summarize latest AI model releases")
- Monitors specific AI topics (e.g., "Track Claude updates")
- Requests periodic or scoped AI information gathering

Trigger keywords: "AI热点", "AI新闻", "监控热点", "搜索热点", "携程热点", "模型发布", "论文热点", "发现热点", "聚合信息"

## Required User Inputs

Before starting data collection, gather these inputs:

1. **Target keywords or topic scope** (required)
   - Examples: "GPT-5", "Claude 4.6", "开源LLM", "RAG架构"
   - Multiple keywords acceptable: "GPT-5 OR Claude OR 多模态"

2. **Time range** (required if not specified)
   - Default: Past 7 days
   - Options: "last 24 hours", "past 3 days", "past 7 days", "past 30 days"

3. **Output format** (optional)
   - Quantity: Default 10-20 items, ask if unspecified
   - Detail level: Brief list vs. Detailed report with trend overview

4. **Source preferences** (optional)
   - All sources by default
   - Ask if user wants specific sources only (e.g., "Only Twitter and Hacker News")

5. **Optional**: TwitterAPI.io API Key
   - User may provide TWITTERAPI_IO_API_KEY environment variable or values
   - If not provided, skip Twitter source and continue with others

## Data Collection Strategy

### Source 1: Twitter (conditional)

**Condition**: Only when user provides valid TWITTERAPI_IO_API_KEY

**Method**: Use HTTP fetch to TwitterAPI.io advanced search endpoint

**Endpoint**: `https://api.twitterapi.io/twitter/tweet/advanced_search`

**Request format**:
```
GET /twitter/tweet/advanced_search?query=<constructed_OR_query>&queryType=Latest&cursor=
Headers: X-API-Key: <TWITTERAPI_IO_API_KEY>
```

**Query construction**:
- Combine keywords with OR: `"GPT-5" OR "GPT 5" OR "GPT-5 发布"`
- Add time filter: `since:YYYY-MM-DD`

**Fields to extract per tweet**:
- id, text, url, createdAt
- author (name, username, followers)
- engagement (likeCount, retweetCount, viewCount)

**Pagination**: Follow next_cursor if has_next_page is true, max 3-5 pages

### Source 2: Hacker News

**Method**: Browse Hacker News homepage or search page

**Collection approach**:
- Visit https://news.ycombinator.com/
- For keyword-specific search: Visit https://hn.algolia.com/?q=<keyword>
- Extract top 20-30 relevant items

**Fields to extract**:
- Title, link (URL)
- Points score, comment count
- Submission time (from timestamp or relative time)
- Upvotes for relevance weight

### Source 3: Google News

**Method**: Browse Google News search results

**Collection approach**:
- Browse https://news.google.com/search?q=<keyword>&hl=en-US&gl=US&ceid=US:en
- Extract top 20 articles from的新闻卡片

**Fields to extract**:
- Title, link
- Source name (publication)
- Publication time if available
- Snippet for relevance check

### Source 4: DuckDuckGo

**Method**: Browse DuckDuckGo search results

**Collection approach**:
- Browse https://duckduckgo.com/?q=<keyword>&ia=news
- Extract top 15-20 news items

**Fields to extract**:
- Title, link
- Source name
- Publication time
- Snippet

### Source 5: Tech Media (via web search)

**Method**: Use generic web search for targeted tech media

**Search queries**:
- `site:techcrunch.com <keyword>`
- `site:theverge.com <keyword>`
- `site:arstechnica.com <keyword>`
- `site:venturebeat.com <keyword>`

**Collection**: Browse search results and extract top items from each source

**Fields to extract**: Same as Google News (title, link, source, time, snippet)

### Source 6: RSS Feeds (via public search or user-provided URLs)

**Method**: Browse RSS feed pages and parse XML/Atom content

**Collection approach**:
- If user provides RSS URLs: Browse and parse feeds directly
- Default public feeds: Hugging Face blog (https://huggingface.co/blog/feed.xml)
- Use browser tools to fetch and parse RSS content

**Fields to extract**:
- Title, link
- pubDate or published time
- content or contentSnippet

## Pre-Processing Workflow

### 1. URL Normalization

Normalize URLs for deduplication:

```
function normalizeUrl(url):
  - Remove hash fragment (#fragment)
  - Remove trailing slash
  - Return lowercase URL
```

### 2. Cross-Source Deduplication

Group by normalized URL, keep highest-priority source per URL

**Source priority (highest to lowest)**:
1. Twitter (direct user discussions)
2. Hacker News (community-curated)
3. Reddit (verified discussions)
4. Tech publications (verified outlets)
5. Google News / DuckDuckGo (general sources)
6. Other RSS feeds
7. Generic search results

### 3. Time Window Filter

Remove items older than user-specified time range

If time not parseable, keep but mark time as "unknown"

### 4. Basic spam removal

Discard items with:
- Empty or excessively short titles (< 5 chars)
- No readable content in snippet
- All-caps or excessive exclamation marks (spam indicators)

## AI-Based Analysis (No External LLM APIs)

Use current AI model exclusively. Do not call OpenRouter, Claude API, or any external LLM service.

For each candidate item, perform:

### Analysis Checklist

- [ ] Read title, snippet, and available content
- [ ] Evaluate relevance to user keywords (0-100 scale)
- [ ] Judge authenticity and credibility
- [ ] Determine importance level
- [ ] Extract or generate summary (1 sentence)
- [ ] Generate detailed description (2-3 sentences)
- [ ] Assign topic tags (1-3 tags)
- [ ] Calculate final ranking score

### Output Structure per Item

```json
{
  "keep": true,
  "title": "string",
  "url": "string",
  "source": "source_name",
  "published_at": "ISO_8601_STRING_OR_NULL",
  "summary": "one_sentence_summary",
  "description": "two_to_three_sentence_key_points",
  "tags": ["tag1", "tag2"],
  "relevance_score": 0_to_100,
  "importance": "urgent|high|medium|low",
  "authenticity": "verified|suspected_false|unclear",
  "engagement_score": "numeric_value_from_source"
}
```

### Relevance Scoring Criteria

**Relevance (0-100)**:
- 80-100: Direct discussion of user keywords (e.g., "GPT-5 release announcement")
- 60-79: Strong contextual mention (e.g., "GPT-5 compared to GPT-4 in benchmark")
- 40-59: Tangential mention (e.g., "Next generation models like GPT-5")
- 20-39: Minor reference
- 0-19: Unrelated or extremely vague

### Importance Classification

**urgent**: Security vulnerabilities, major incidents breaking AI tools
**high**: Major product launches, significant research breakthroughs
**medium**: Routine updates, discussions, news
**low**: Edge topics, speculative discussions, minor updates

### Authenticity Classification

**verified**: Direct from official sources, verified outlets, or expert accounts
**suspected_false**: Rumors, unverified claims, sensationalized headlines
**unclear**: Not enough evidence to verify either way

### Topic Tagging

Use concise tags representing AI subdomains:
- Model families (GPT, Claude, LLaMA, Mistral, etc.)
- Capabilities (Multimodal, RAG, Agents, Code Gen, etc.)
- Safety/Ethics (AI Safety, Alignment, Privacy, etc.)
- Open Source (Open Source, Weights Released, etc.)
- Research (Paper, Benchmark, Experiment, etc.)

### Final Ranking Formula

Calculate ranking_score for sorting:

```
ranking_score = (relevance_score * 0.6) +
                (engagement_normalized * 0.2) +
                (freshness_boost * 0.2) +
                importance_boost
```

Where:
- engagement_normalized: Normalized 0-100 based on likes/retweets/views/score
- freshness_boost: Higher for more recent items (e.g., last 24 hours: +20, last 7 days: +0)
- importance_boost: urgent(+30), high(+20), medium(+10), low(+0)

Sort by ranking_score DESC, then by published_at DESC

## Output Formats

### Standard Structured Report (recommended default)

The report **must** follow this结构，避免堆砌长段落、模板化 Markdown，仅输出对用户有用的关键信息。

1. **报告开头：扫描摘要**

   - 一段简短说明本次扫描范围和结果统计，例如：

   ```text
   本次扫描关键词：Claude
   扫描时间窗口：过去 24 小时
   数据来源：Twitter、Hacker News、DuckDuckGo、RSS 等
   共发现候选信息 37 条，其中筛选出 8 条高价值热点。
   ```

2. **热点列表：逐条结构化输出**

   对每一条热点，**只输出以下 5 个维度 + 可选标签**，禁止写大段散文式描述：

   ```text
   [1] 标题：<热点标题>
   摘要：<1–2 句大致说明，不超过 3 行>
   链接：<原文 URL>
   重要程度：urgent / high / medium / low
   相关性：<0–100 的整数，如 87>
   （可选）标签：<LLM, Claude, 产品发布>
   ```

   约束：
   - 每条热点保持 **一屏内可读**，不要扩展成完整文章。
   - 如果用户只关心 Top N，则只输出前 N 条。
   - 标题/摘要中避免重复堆叠同样的信息。

3. **报告结尾：总体总结**

   在热点列表之后，增加一个简短总结区块，回答 “这份报告告诉用户什么”：

   ```text
   总结：
   - 本次扫描的高价值热点主要集中在：[简要列出 1–3 个核心主题]
   - 对用户的实际意义：[1–2 点，例如需要关注的新模型发布 / 潜在风险 / 市场动向]
   - 如需更深入了解，建议优先阅读：[列出 1–3 条最重要热点的编号和标题]
   ```

### Optional: Emoji-enhanced Presentation

For better readability and a more engaging report, the agent **may** add a small, consistent set of emojis as visual anchors. Emojis are optional and must not change the underlying structure or meaning.

Recommended usage:

1. **Scanning summary section**

   ```text
   📊 本次热点扫描概览
   🎯 关键词：Claude
   ⏱ 扫描时间窗口：过去 24 小时
   🌐 数据来源：Twitter、Hacker News、DuckDuckGo、RSS 等
   📈 候选条目：共发现 37 条，其中筛选出 8 条高价值热点
   ```

2. **Per-hotspot entry**

   Keep the same five fields, only prepend icons:

   ```text
   [1] 🏷 标题：<热点标题>
   📝 摘要：<1–2 句大致说明，不超过 3 行>
   🔗 链接：<原文 URL>
   ⚠️ 重要程度：urgent / high / medium / low
   🎯 相关性：<0–100 的整数，如 87>
   （可选）🏷 标签：LLM, Claude, 产品发布
   ```

   Rules:
   - Use exactly these emojis and order for every hotspot to keep layout stable.
   - Do not introduce additional decorative emojis inside the summary text.

3. **Closing summary**

   ```text
   📌 总结
   - 📎 主题集中在：[简要列出 1–3 个核心主题]
   - 💡 对你的意义：[1–2 点，例如需要关注的新模型发布 / 潜在风险 / 市场动向]
   - 🔍 建议优先阅读：[列出 1–3 条最重要热点的编号和标题]
   ```

If the user explicitly prefers a plain-text style, omit emojis and fall back to the standard structured report format described above.

### Detailed Thematic Report (only when explicitly requested)

当用户明确要求“详细报告/趋势分析”时，可以在上述 **标准结构** 之后，追加一个主题化分析部分，但仍需保持层次清晰：

```text
主题一：新模型 / 新版本发布
- 概要：[1 段话，总结该主题下热点的共同点]
- 代表热点：[#1, #3, #5]

主题二：安全 / 合规 / 争议
- 概要：[1 段话]
- 代表热点：[#2, #4]

整体趋势判断：
- [1–2 段，对未来几天/几周的趋势预判]
```

禁止在详细报告中重复整段复制前面已经给出的「标题/摘要/链接/重要程度/相关性」信息，只做**归纳和解释**。

## Helper Scripts (Optional)

This skill ships with three optional helper scripts under `scripts/`:

- `scripts/search_twitter.py`: Use TwitterAPI.io advanced search to fetch tweets for given keywords and time range, outputting JSON `{"items": [...]}` for AI analysis.
- `scripts/search_web.py`: Generic web hotspot collector using Hacker News Algolia API and DuckDuckGo news results to produce JSON `{"items": [...]}`.
- `scripts/generate_report.py`: Normalize a combined `{"items": [...]}` payload from any collectors and generate a simple text report field alongside cleaned items.

Typical usage pattern:

1. Run one or more collectors (e.g., `search_twitter.py`, `search_web.py`) and merge their `items` into a single JSON object.
2. Pipe the merged JSON into `generate_report.py` to normalize and produce a human-readable report.
3. Let the AI model apply the scoring, tagging, and importance classification on top of the normalized items.

Example shell workflow:

```bash
python scripts/search_web.py --keywords "GPT-5,Claude,开源LLM" > web.json

python scripts/search_twitter.py \
  --api-key "$TWITTERAPI_IO_API_KEY" \
  --keywords "GPT-5,Claude,开源LLM" \
  --since 2026-03-10 > twitter.json

python - << 'EOF'
import json
web = json.load(open("web.json", "r", encoding="utf-8"))
tw = json.load(open("twitter.json", "r", encoding="utf-8"))
items = (web.get("items") or []) + (tw.get("items") or [])
json.dump({"items": items}, open("merged.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
EOF

python scripts/generate_report.py < merged.json > report.json
```

The AI agent can then:
- Read `report.json`
- Use `items` as structured candidates
- Use `report` as a quick human-readable overview
- Apply the scoring and classification rules defined in this skill.

## Usage Examples

**Example 1**:
User: "帮我找最近 3 天 GPT-5 相关的重点新闻和讨论，附上摘要与重要性评级。"

Agent behavior:
1. Confirm keywords: "GPT-5"
2. Confirm time range: "Past 3 days"
3. Check for TWITTERAPI_IO_API_KEY
4. Browse Hacker News, Google News, DuckDuckGo, tech media
5. If Twitter key available, fetch tweets about GPT-5
6. Deduplicate, time-filter, analyze each item
7. Output compact list with 10-15 items, ranked by relevance

Expected output:
```
📊 AI Hotspots - GPT-5 (Top 12 items, past 3 days)

[1] OpenAI Announces GPT-5 Development Roadmap
📍 OpenAI Blog · 2 hours ago
📝 OpenAI 发布 GPT-5 开发路线图，计划引入更强的推理能力和安全性机制，预计 Q4 内部测试。
🏷️ GPT | OpenAI | 产品发布 | ⚠️ high | 🛡️ verified
🔗 https://openai.com/blog/gpt5-roadmap
...

[2] Researchers Begin Testing GPT-5 Alpha Model (Hacker News Discussion)
📍 Hacker News · 5 hours ago | 💬 142 upvotes
📝 Hackernews 社区讨论 GPT-5 Alpha 模型的早期访问测试概述，重点讨论推理性能提升和对齐改进。
🏷️ GPT | 研究 | 研究论文 | ⚠️ high | 🛡️ verified
🔗 https://news.ycombinator.com/item?id=xxxxx
...
```

**Example 2**:
User: "列出最近一周 AI 开源模型领域的热点，并标注哪些是高优先级需要关注的。"

Agent behavior:
1. Confirm keywords: "开源LLM", "开源模型", "open source LLM"
2. Confirm time range: "Past 7 days"
3 Collect from multiple sources
4. Focus on importance field for high priority
5. Highlight items with importance="high" or "urgent"

**Example 3**:
User: "我有 TwitterAPI.io 的 Key，帮我聚合 Claude 相关的最新讨论并做一个中文报告。"

Agent behavior:
1. Confirm keywords: "Claude"
2. Check TWITTERAPI_IO_API_KEY availability
3. Collect from Twitter + Hacker News + other sources
4. Analyze and categorize by topic tags
5. Generate detailed Chinese report with trend overview and topic groups

## Error Handling

**No Twitter API key**:
- Log "Twitter source skipped: No API key provided"
- Continue with other sources
- Mention in output: "Note: Twitter data not available due to missing API key"

**Search returns no results**:
- Expand time range (e.g., from 3 days to 7 days)
- Broaden keywords (e.g., add synonyms)
- Note in output: "Limited results found. Expanded search scope."

**Web scraping fails**:
- Try alternative sources
- Note failed sources in output
- Use remaining successful sources

**AI analysis ambiguity**:
- Use conservative relevance scores (default 50 when uncertain)
- Mark authenticity as "unclear" when verification not possible
- Prioritize information with clear source attribution

## Quality Assurance

Before finalizing output, verify:

- [ ] All top items have non-empty summaries and descriptions
- [ ] Tags are concise and representative
- [ ] URLs are clickable and valid
- [ ] Duplicate items removed across sources
- [ ] Relevance scores are justified by content analysis
- [ ] Importance levels match content significance
- [ ] Authentication flags evidence-based
- [ ] Ranking prioritizes relevant and recent items
- [ ] Output format matches user request (list vs. report)

## Additional Notes

**Important**: Never call OpenRouter, Anthropic, or other external LLM APIs during this skill's execution. Use only the current AI model for all analysis and content generation.

**Performance**: Limit analysis to 50-100 items maximum per scan to maintain response speed. Prioritize top results from each source over exhaustive crawling.

**Privacy**: Handle user-provided API keys securely. Do not display or log keys in output logs beyond "API key available/skipped" status.