/**
 * DuckDuckGo 新闻搜索
 * 特点：无需 API，反爬虫较弱
 */

import { searchNews } from 'duck-duck-scrape';

export async function fetchDuckDuckGo(keywords = []) {

  const queries = keywords.length
    ? keywords
    : ['AI artificial intelligence', 'machine learning news', 'GPT Claude LLM'];

  const items = [];

  for (const q of queries.slice(0, 3)) {
    try {
      const result = await searchNews(q, { offset: 0 });

      for (const article of result.results || []) {
        items.push({
          source: 'duckduckgo',
          externalId: article.url || article.title,
          title: article.title || 'Untitled',
          summary: article.excerpt || '',
          url: article.url || '',
          rawContent: ((article.title || '') + ' ' + (article.excerpt || '')).slice(0, 2000),
          publishedAt: article.date || null,
        });
      }
    } catch (e) {
      console.error('[DuckDuckGo] fetch failed:', q, e.message);
    }
  }

  const seen = new Set();
  return items.filter((i) => {
    const id = i.externalId || i.url;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
