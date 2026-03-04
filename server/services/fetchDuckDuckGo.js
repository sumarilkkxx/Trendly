/**
 * DuckDuckGo 新闻 + 网页搜索
 * 特点：爬虫方式，无需 API，duck-duck-scrape 解析 DDG 页面
 */

import { searchNews, search } from 'duck-duck-scrape';

export async function fetchDuckDuckGo(keywords = []) {
  const queries = keywords.length
    ? keywords
    : ['AI artificial intelligence', 'machine learning news', 'GPT Claude LLM'];

  const items = [];
  const seen = new Set();

  for (const q of queries.slice(0, 5)) {
    try {
      const result = await searchNews(q, { offset: 0 });
      for (const article of result.results || []) {
        const id = article.url || article.title;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        items.push({
          source: 'duckduckgo',
          externalId: id,
          title: article.title || 'Untitled',
          summary: article.excerpt || '',
          url: article.url || '',
          rawContent: ((article.title || '') + ' ' + (article.excerpt || '')).slice(0, 2000),
          publishedAt: article.date || null,
        });
      }
    } catch (e) {
      console.error('[DuckDuckGo] news fetch failed:', q, e.message);
    }
  }

  for (const q of queries.slice(0, 3)) {
    try {
      const result = await search(q, { offset: 0 });
      const results = result?.results || [];
      for (const r of results) {
        const id = r.url || r.title;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        items.push({
          source: 'duckduckgo',
          externalId: id,
          title: r.title || 'Untitled',
          summary: r.description || '',
          url: r.url || '',
          rawContent: ((r.title || '') + ' ' + (r.description || '')).slice(0, 2000),
          publishedAt: null,
        });
      }
    } catch (e) {
      console.error('[DuckDuckGo] web fetch failed:', q, e.message);
    }
  }

  return items;
}
