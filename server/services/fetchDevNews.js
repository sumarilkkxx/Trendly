/**
 * 开发者新闻源 - TechCrunch、The Verge、Ars Technica 等 RSS
 * 特点：科技媒体主流来源
 */

import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Trendly/1.0' },
});

const DEV_NEWS_FEEDS = [
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired' },
];

export async function fetchDevNews() {
  const items = [];

  for (const feed of DEV_NEWS_FEEDS) {
    try {
      const data = await parser.parseURL(feed.url);
      for (const item of data.items || []) {
        items.push({
          source: `devnews:${feed.name}`,
          externalId: item.guid || item.link || item.title,
          title: item.title || 'Untitled',
          summary: item.contentSnippet || (item.content || '').slice(0, 300),
          url: item.link || '',
          rawContent: (item.contentSnippet || item.content || '').slice(0, 2000),
          publishedAt: item.isoDate || item.pubDate || null,
        });
      }
    } catch (e) {
      console.error('[DevNews] fetch failed:', feed.name, e.message);
    }
  }

  return items;
}
