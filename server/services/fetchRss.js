import Parser from 'rss-parser';
import db from '../db.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Trendly/1.0' },
});

const HF_BLOG = 'https://huggingface.co/blog/feed.xml';

export async function fetchHuggingFace() {
  const items = [];
  try {
    const feed = await parser.parseURL(HF_BLOG);
    for (const item of feed.items || []) {
      items.push({
        source: 'huggingface',
        externalId: item.guid || item.link || item.title,
        title: item.title || 'Untitled',
        summary: item.contentSnippet || item.content?.slice(0, 300) || '',
        url: item.link || '',
        rawContent: (item.contentSnippet || item.content || '').slice(0, 2000),
        publishedAt: item.isoDate || item.pubDate || null,
      });
    }
  } catch (e) {
    console.error('[RSS] Hugging Face fetch failed:', e.message);
  }
  return items;
}

export async function fetchCustomRss() {
  const sources = db.prepare('SELECT url, name FROM rss_sources WHERE enabled = 1').all();
  const items = [];
  for (const { url, name } of sources) {
    try {
      const feed = await parser.parseURL(url);
      const src = name || new URL(url).hostname;
      for (const item of feed.items || []) {
        items.push({
          source: `rss:${src}`,
          externalId: item.guid || item.link || item.title,
          title: item.title || 'Untitled',
          summary: item.contentSnippet || item.content?.slice(0, 300) || '',
          url: item.link || '',
          rawContent: (item.contentSnippet || item.content || '').slice(0, 2000),
          publishedAt: item.isoDate || item.pubDate || null,
        });
      }
    } catch (e) {
      console.error('[RSS] Custom fetch failed:', url, e.message);
    }
  }
  return items;
}
