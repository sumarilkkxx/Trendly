import { OPENROUTER_URL, callOpenRouterJson } from './openRouterShared.js';

/**
 * @param {object} item 基础内容项
 * @param {string[]} keywords 监控关键词列表（基础词）
 * @param {Array<{ keyword: string; variants?: Array<{ text: string; type: string; weight: number }> }>} keywordConfigs
 *        可选：包含每个关键词的查询变体信息，用于解释与关键词的关系
 */
export async function filterAndSummarize(item, keywords = [], keywordConfigs = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const fallback = {
    keep: true,
    summary: item.summary || item.title,
    description: item.rawContent?.slice(0, 300) || item.summary || '',
    reason: '',
    tags: [],
    relevance: 50,
    importance: 'medium',
    authenticity: 'verified',
  };
  if (!apiKey) return fallback;

  const text = [item.title, item.summary, item.rawContent].filter(Boolean).join('\n').slice(0, 1500);
  const kwHint = keywords.length ? ` 用户关注关键词：${keywords.join('、')}` : '';

  let keywordConfigHint = '';
  if (Array.isArray(keywordConfigs) && keywordConfigs.length > 0) {
    const parts = [];
    for (const kc of keywordConfigs) {
      if (!kc || !kc.keyword || !Array.isArray(kc.variants)) continue;
      const vs = kc.variants
        .filter((v) => v && v.text)
        .slice(0, 5)
        .map((v) => `${v.text}(${v.type || 'alias'})`)
        .join('，');
      if (vs) {
        parts.push(`${kc.keyword} → ${vs}`);
      }
    }
    if (parts.length > 0) {
      keywordConfigHint = `\n关键词查询变体示例：\n${parts.join('\n')}\n`;
    }
  }

  const systemPrompt = `你是 AI 内容审核助手。对输入内容输出完整 JSON（所有字段都必须填写，不可省略任何字段）。

字段说明（全局维度）：
- keep (bool): 真实有价值的 AI/技术资讯=true；营销/低质/无关=false
- summary (string): 一句话摘要
- description (string): 2-3句要点概括，让读者不用打开原文即可了解核心信息
- reason (string): 【必填】说明为何判定该内容相关/重要/可疑的理由，1-2句话，绝不能为空字符串
- tags (array of string): 【必填】1-3个话题分类标签，如 "LLM","AI Safety","开源"，绝不能为空数组
- relevance (int 0-100): 相关性
- importance ("urgent"|"high"|"medium"|"low"): urgent=安全漏洞/重大事故; high=重要发布/里程碑; medium=常规更新/讨论; low=边缘话题
- authenticity ("verified"|"suspected_false"): verified=来源可信; suspected_false=夸大/未证传闻

关键词级相关性字段（keyword_signals）：
- keyword_signals (array): 针对每个监控关键词的关系判断
- keyword_signals[i].keyword (string): 监控关键词原文
- keyword_signals[i].relation (string): "direct"|"strong"|"comparison"|"background"|"mention_only"|"unrelated"
  - direct: 文章主要就是在讲这个关键词本身（发布、更新、重大事件）
  - strong: 该关键词是文章核心要素之一（技术细节、深度讨论）
  - comparison: 只是用来和别的对象做对比或比喻，例如“某国产模型是 GPT-5 的中国版”
  - background: 作为背景信息顺带提到
  - mention_only: 偶尔提及，与主要内容关系很弱
  - unrelated: 实际与该关键词无关
- keyword_signals[i].score (int 0-100): 对【该关键词】的直接相关度评分
- keyword_signals[i].matched_variants (array of string, 可选): 命中的查询变体（如果有的话）

打分建议：
- 只有 relation 为 "direct" 或 "strong" 时，score 一般 >= 70
- "comparison" 通常在 30-60 之间
- "background"/"mention_only" 多数低于 40

输出格式（严格 JSON，所有字段必须存在）：
{
  "keep": true,
  "summary": "...",
  "description": "...",
  "reason": "...",
  "tags": ["..."],
  "relevance": 80,
  "importance": "medium",
  "authenticity": "verified",
  "keyword_signals": [
    {
      "keyword": "GPT-5",
      "relation": "direct",
      "score": 88,
      "matched_variants": ["GPT-5","GPT 5"]
    }
  ]
}

示例：
输入：OpenAI 发现 ChatGPT 存在严重 RCE 漏洞
输出：{"keep":true,"summary":"ChatGPT RCE 漏洞需紧急修复","description":"OpenAI 安全团队发现 ChatGPT 存在远程代码执行漏洞，攻击者可通过构造提示词触发。官方已发布修复补丁。","reason":"安全漏洞直接影响主流 AI 产品，属紧急安全事件","tags":["AI Safety","ChatGPT"],"relevance":95,"importance":"urgent","authenticity":"verified"}

输入：某开发者分享了使用 LangChain 构建 RAG 应用的教程
输出：{"keep":true,"summary":"LangChain RAG 应用实战教程","description":"开发者详细分享了使用 LangChain 框架构建检索增强生成应用的完整流程，包括向量数据库选型和提示词优化技巧。","reason":"实用技术教程，对 AI 应用开发者有参考价值","tags":["LangChain","RAG","教程"],"relevance":70,"importance":"medium","authenticity":"verified"}`;

  const userPrompt = `内容来源：${item.source}\n标题：${item.title}\n\n正文片段：\n${text}\n${kwHint}${keywordConfigHint}\n\n请判断并回复 JSON。`;

  try {
    const data = await callOpenRouterJson({
      model: 'google/gemini-3-flash-preview',
      systemPrompt,
      userPrompt,
      max_tokens: 600,
    });
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.log('[OpenRouter] No content in response:', JSON.stringify(data).slice(0, 200));
      return fallback;
    }

    const parsed = JSON.parse(content);
    if (!parsed.reason || !parsed.tags?.length) {
      console.log('[OpenRouter] Missing reason/tags — raw:', content.slice(0, 400));
    }
    let rel = parseInt(parsed.relevance, 10);
    if (Number.isNaN(rel) || rel < 0 || rel > 100) rel = 50;
    const importance = ['urgent', 'high', 'medium', 'low'].includes(parsed.importance)
      ? parsed.importance
      : 'medium';
    const authenticity = ['verified', 'suspected_false'].includes(parsed.authenticity)
      ? parsed.authenticity
      : 'verified';
    const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === 'string').slice(0, 3) : [];

    let keywordSignals = [];
    if (Array.isArray(parsed.keyword_signals)) {
      keywordSignals = parsed.keyword_signals
        .map((ks) => ({
          keyword: typeof ks.keyword === 'string' ? ks.keyword : '',
          relation: typeof ks.relation === 'string' ? ks.relation : 'unrelated',
          score: Number.isFinite(Number(ks.score)) ? Math.max(0, Math.min(100, Number(ks.score))) : 0,
          matched_variants: Array.isArray(ks.matched_variants)
            ? ks.matched_variants.filter((v) => typeof v === 'string').slice(0, 5)
            : [],
        }))
        .filter((ks) => ks.keyword);
    }

    return {
      keep: !!parsed.keep,
      summary: typeof parsed.summary === 'string' ? parsed.summary : (item.summary || item.title),
      description: typeof parsed.description === 'string' ? parsed.description : '',
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      tags,
      relevance: rel,
      importance,
      authenticity,
      keyword_signals: keywordSignals,
    };
  } catch (e) {
    console.log('[OpenRouter] Exception:', e.message);
    return fallback;
  }
}
