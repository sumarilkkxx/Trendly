const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function filterAndSummarize(item, keywords = []) {
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

  const systemPrompt = `你是 AI 内容审核助手。对输入内容输出完整 JSON（所有 8 个字段都必须填写，不可省略任何字段）。

字段说明：
- keep (bool): 真实有价值的 AI/技术资讯=true；营销/低质/无关=false
- summary (string): 一句话摘要
- description (string): 2-3句要点概括，让读者不用打开原文即可了解核心信息
- reason (string): 【必填】说明为何判定该内容相关/重要/可疑的理由，1-2句话，绝不能为空字符串
- tags (array of string): 【必填】1-3个话题分类标签，如 "LLM","AI Safety","开源"，绝不能为空数组
- relevance (int 0-100): 相关性
- importance ("urgent"|"high"|"medium"|"low"): urgent=安全漏洞/重大事故; high=重要发布/里程碑; medium=常规更新/讨论; low=边缘话题
- authenticity ("verified"|"suspected_false"): verified=来源可信; suspected_false=夸大/未证传闻

输出格式（严格 JSON，所有 8 个字段必须存在）：
{"keep":true,"summary":"...","description":"...","reason":"...","tags":["..."],"relevance":80,"importance":"medium","authenticity":"verified"}

示例：
输入：OpenAI 发现 ChatGPT 存在严重 RCE 漏洞
输出：{"keep":true,"summary":"ChatGPT RCE 漏洞需紧急修复","description":"OpenAI 安全团队发现 ChatGPT 存在远程代码执行漏洞，攻击者可通过构造提示词触发。官方已发布修复补丁。","reason":"安全漏洞直接影响主流 AI 产品，属紧急安全事件","tags":["AI Safety","ChatGPT"],"relevance":95,"importance":"urgent","authenticity":"verified"}

输入：某开发者分享了使用 LangChain 构建 RAG 应用的教程
输出：{"keep":true,"summary":"LangChain RAG 应用实战教程","description":"开发者详细分享了使用 LangChain 框架构建检索增强生成应用的完整流程，包括向量数据库选型和提示词优化技巧。","reason":"实用技术教程，对 AI 应用开发者有参考价值","tags":["LangChain","RAG","教程"],"relevance":70,"importance":"medium","authenticity":"verified"}`;

  const userPrompt = `内容来源：${item.source}\n标题：${item.title}\n\n正文片段：\n${text}\n${kwHint}\n\n请判断并回复 JSON。`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.log('[OpenRouter] API error:', res.status, JSON.stringify(data).slice(0, 200));
      return fallback;
    }
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

    return {
      keep: !!parsed.keep,
      summary: typeof parsed.summary === 'string' ? parsed.summary : (item.summary || item.title),
      description: typeof parsed.description === 'string' ? parsed.description : '',
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      tags,
      relevance: rel,
      importance,
      authenticity,
    };
  } catch (e) {
    console.log('[OpenRouter] Exception:', e.message);
    return fallback;
  }
}
