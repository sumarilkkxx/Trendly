/**
 * Google News RSS - 按关键词聚合新闻
 * 特点：免费、覆盖面广。链接为 news.google.com 跳转链接
 */

import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Trendly/1.0' },
});

export async function fetchGoogleNews(keywords = []) {
  const queries = keywords.length ? keywords : ['AI', 'artificial intelligence', 'machine learning'];
  const items = [];

  for (const q of queries.slice(0, 5)) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:7d&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(url);

      for (const item of feed.items || []) {
        items.push({
          source: 'googlenews',
          externalId: item.guid || item.link || item.title,
          title: item.title || 'Untitled',
          summary: item.contentSnippet || (item.content || '').slice(0, 300),
          url: item.link || '',
          rawContent: (item.contentSnippet || item.content || '').slice(0, 2000),
          publishedAt: item.isoDate || item.pubDate || null,
        });
      }
    } catch (e) {
      console.error('[GoogleNews] fetch failed:', q, e.message);
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
