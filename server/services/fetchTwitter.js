const API_BASE = 'https://api.twitterapi.io';
import { getTwitterFilterConfig, passesTwitterFilter } from './twitterFilter.js';

export async function fetchTwitter(keywords = [], filterConfig) {
  const apiKey = process.env.TWITTERAPI_IO_API_KEY;
  if (!apiKey || !keywords.length) return [];

  const config = filterConfig || getTwitterFilterConfig({});
  const terms = keywords.slice(0, 3).map((k) => `"${k}"`).join(' OR ');
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = `${terms || 'AI OR GPT'} since:${since}`;

  const items = [];
  let cursor = '';
  let page = 0;
  const maxPages = 2;

  try {
    while (page < maxPages) {
      const params = new URLSearchParams({
        query,
        queryType: 'Top',
        cursor: cursor || '',
      });
      const res = await fetch(`${API_BASE}/twitter/tweet/advanced_search?${params}`, {
        headers: { 'X-API-Key': apiKey },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[Twitter]', data?.msg || data?.message || res.statusText);
        break;
      }
      const tweets = data.tweets || [];
      for (const t of tweets) {
        if (!passesTwitterFilter(t, config)) continue;
        items.push({
          source: 'twitter',
          externalId: t.id,
          title: (t.text || '').slice(0, 100),
          summary: (t.text || '').slice(0, 300),
          url: t.url || `https://x.com/i/status/${t.id}`,
          rawContent: (t.text || '').slice(0, 2000),
          publishedAt: t.createdAt || null,
          likeCount: t.likeCount ?? 0,
          retweetCount: t.retweetCount ?? 0,
          viewCount: t.viewCount ?? 0,
        });
      }
      if (!data.has_next_page || !data.next_cursor) break;
      cursor = data.next_cursor;
      page++;
    }
  } catch (e) {
    console.error('[Twitter]', e.message);
  }
  return items;
}
