const API_BASE = 'https://api.twitterapi.io';
import { getTwitterFilterConfig, passesTwitterFilter } from './twitterFilter.js';

export async function fetchTwitter(keywords = [], filterConfig) {
  const apiKey = process.env.TWITTERAPI_IO_API_KEY;
  if (!apiKey) return [];

  const config = filterConfig || getTwitterFilterConfig({});
  const terms = keywords.length
    ? keywords.slice(0, 3).map((k) => `"${k}"`).join(' OR ')
    : 'AI OR GPT OR LLM OR Claude';
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = `${terms} since:${since}`;

  const items = [];
  let cursor = '';
  let page = 0;
  const maxPages = 3;

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
        const a = t.author || {};
        const handle = a.userName || a.username || a.screen_name || a.name || '';
        const displayName = a.name || a.displayName || '';
        const followers = a.followers ?? a.followersCount ?? a.follower_count ?? 0;
        let authorStr = '';
        if (handle) {
          authorStr = `@${handle}`;
          if (displayName && displayName !== handle) authorStr = `${displayName} (@${handle})`;
          if (followers > 0) {
            const fmtF = followers >= 1000000 ? `${(followers / 1000000).toFixed(1)}M`
              : followers >= 1000 ? `${(followers / 1000).toFixed(1)}k`
              : String(followers);
            authorStr += ` · ${fmtF} followers`;
          }
        }
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
          author: authorStr,
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
