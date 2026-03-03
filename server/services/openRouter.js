const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function filterAndSummarize(item, keywords = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { keep: true, summary: item.summary || item.title };

  const text = [item.title, item.summary, item.rawContent].filter(Boolean).join('\n').slice(0, 1500);
  const kwHint = keywords.length ? ` 用户关注关键词：${keywords.join('、')}` : '';

  const systemPrompt = `你是一个 AI 内容审核助手。判断以下内容是否为：
1. 真实、有价值的 AI/技术相关资讯（保留）
2. 营销、假冒、低质、无关内容（过滤）

仅回复 JSON：{"keep": true/false, "summary": "一句话摘要（若保留）"}`;

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
        max_tokens: 200,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return { keep: true, summary: item.summary || item.title };

    const parsed = JSON.parse(content);
    return {
      keep: !!parsed.keep,
      summary: typeof parsed.summary === 'string' ? parsed.summary : (item.summary || item.title),
    };
  } catch (e) {
    console.error('[OpenRouter]', e.message);
    return { keep: true, summary: item.summary || item.title };
  }
}
