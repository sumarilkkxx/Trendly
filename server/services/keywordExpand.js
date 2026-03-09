import { OPENROUTER_URL, callOpenRouterJson } from './openRouterShared.js';

/**
 * 使用 OpenRouter 为监控关键词生成查询变体列表。
 * 返回结构：
 * {
 *   keyword: string;
 *   variants: Array<{ text: string; type: string; weight: number }>;
 * }
 */
export async function expandKeyword(keyword) {
  const base = String(keyword || '').trim();
  if (!base) {
    return { keyword: base, variants: [] };
  }

  const systemPrompt = `你是搜索查询扩展助手。
给定用户监控关键词，生成一组用于检索 AI 相关新闻/内容的查询变体。

要求：
- 保持与原始关键词高度相关，不要引入其它无关产品或公司
- 每个变体是可以直接用于搜索的短语，不要超过 8 个汉字或 6 个英文单词
- 重点覆盖：同义词、常见简称、版本别名（如 Sonnet/Haiku 等）、品牌前缀（如 Anthropic Claude）
- 不要输出解释性句子或额外说明

变体类型：
- exact: 原始关键词或非常接近的写法
- alias: 常见简称/同义写法（含中英文互译）
- version_alias: 带版本或子型号的写法（如 "Claude Sonnet 4.6"）
- family_update: 型号家族级别的更新短语（如 "Anthropic Claude update"）
- noise: 你认为多数情况下不该用于搜索的混淆短语

输出 JSON，格式固定：
{
  "keyword": "<原始关键词>",
  "variants": [
    { "text": "...", "type": "exact", "weight": 1.0 },
    { "text": "...", "type": "version_alias", "weight": 0.9 }
  ]
}

注意：
- variants 数量控制在 3-8 个之间
- weight 范围 0-1，数值越大表示越推荐用于搜索
- 所有字段必填，不要添加多余字段。`;

  const userPrompt = `监控关键词：${base}

请按照要求生成查询变体 JSON。`;

  const data = await callOpenRouterJson({
    model: 'openai/gpt-5.2',
    systemPrompt,
    userPrompt,
    max_tokens: 400,
  });

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return {
      keyword: base,
      variants: [{ text: base, type: 'exact', weight: 1 }],
    };
  }

  try {
    const parsed = JSON.parse(content);
    const variants = Array.isArray(parsed.variants) ? parsed.variants : [];
    const cleaned = variants
      .map((v) => ({
        text: String(v.text || '').trim(),
        type: String(v.type || 'alias'),
        weight: Number.isFinite(Number(v.weight)) ? Math.max(0, Math.min(1, Number(v.weight))) : 0.8,
      }))
      .filter((v) => v.text);

    const unique = [];
    const seen = new Set();
    for (const v of cleaned) {
      const key = v.text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(v);
    }

    if (!unique.some((v) => v.type === 'exact' || v.text.toLowerCase() === base.toLowerCase())) {
      unique.unshift({ text: base, type: 'exact', weight: 1 });
    }

    return {
      keyword: base,
      variants: unique.slice(0, 8),
    };
  } catch {
    return {
      keyword: base,
      variants: [{ text: base, type: 'exact', weight: 1 }],
    };
  }
}

