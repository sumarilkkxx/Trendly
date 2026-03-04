const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function filterAndSummarize(item, keywords = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const fallback = {
    keep: true,
    summary: item.summary || item.title,
    relevance: 50,
    importance: 'medium',
    authenticity: 'verified',
  };
  if (!apiKey) return fallback;

  const text = [item.title, item.summary, item.rawContent].filter(Boolean).join('\n').slice(0, 1500);
  const kwHint = keywords.length ? ` 用户关注关键词：${keywords.join('、')}` : '';

  const systemPrompt = `你是一个 AI 内容审核助手。判断以下内容：
1. 是否保留：真实、有价值的 AI/技术相关资讯保留；营销、假冒、低质、无关、虚假爆料过滤
2. 真实性（严格判断）：
   - verified：已证实或来源可信、表述客观的资讯
   - suspected_false：明显夸大、未证传闻、标题党、恶搞、伪造截图/公告、钓鱼式「重大发布」等
3. 重要程度（严格按以下标准）：
   - urgent：安全漏洞/重大事故、监管政策变化、核心服务大面积中断、官方紧急公告
   - high：重要版本发布（如 GPT-5、Claude 4）、重大合作/收购、重要论文或能力突破、行业里程碑
   - medium：常规更新、教程、技巧分享、产品评测、社区讨论
   - low：周边新闻、重复内容、冷门小工具、个人吐槽、边缘话题
4. 相关性：0-100 的整数，100=非常相关，0=几乎无关

仅回复 JSON：
{"keep": true/false, "summary": "一句话摘要", "relevance": 0-100, "importance": "urgent|high|medium|low", "authenticity": "verified|suspected_false"}

示例：
输入：OpenAI 发现 ChatGPT 存在严重 RCE 漏洞，建议用户立即更新
输出：{"keep": true, "summary": "ChatGPT 存在 RCE 漏洞需立即修复", "relevance": 95, "importance": "urgent", "authenticity": "verified"}

输入：Claude 4 正式发布，支持 200K 上下文
输出：{"keep": true, "summary": "Claude 4 发布，200K 上下文", "relevance": 90, "importance": "high", "authenticity": "verified"}

输入：分享 5 个提高 GPT 提示词效果的小技巧
输出：{"keep": true, "summary": "5 个 GPT 提示词优化技巧", "relevance": 75, "importance": "medium", "authenticity": "verified"}

输入：有人用 AI 画了幅风景图
输出：{"keep": true, "summary": "AI 绘画示例", "relevance": 40, "importance": "low", "authenticity": "verified"}

输入：OpenAI 内部泄露 GPT-6 源码（无官方来源、仅截图）
输出：{"keep": false, "summary": "", "relevance": 0, "importance": "low", "authenticity": "suspected_false"}`;

  const userPrompt = `内容来源：${item.source}\n标题：${item.title}\n\n正文片段：\n${text}\n${kwHint}\n\n请判断并回复 JSON。`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 250,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content);
    let rel = parseInt(parsed.relevance, 10);
    if (Number.isNaN(rel) || rel < 0 || rel > 100) rel = 50;
    const importance = ['urgent', 'high', 'medium', 'low'].includes(parsed.importance)
      ? parsed.importance
      : 'medium';
    const authenticity = ['verified', 'suspected_false'].includes(parsed.authenticity)
      ? parsed.authenticity
      : 'verified';

    return {
      keep: !!parsed.keep,
      summary: typeof parsed.summary === 'string' ? parsed.summary : (item.summary || item.title),
      relevance: rel,
      importance,
      authenticity,
    };
  } catch (e) {
    console.error('[OpenRouter]', e.message);
    return fallback;
  }
}
