/**
 * Hacker News - Algolia API
 * 特点：AI/技术热点专业来源，无需 API Key
 * @see https://hn.algolia.com/api
 */

const HN_API = 'https://hn.algolia.com/api/v1';
const MIN_POINTS = 10;
const DAYS = 7;

export async function fetchHackerNews(keywords = []) {
  const items = [];
  const queries = keywords.length
    ? keywords
    : ['AI', 'machine learning', 'GPT', 'LLM', 'Claude', 'open source'];
  const createdAtMin = Math.floor((Date.now() - DAYS * 24 * 60 * 60 * 1000) / 1000);

  for (const q of queries.slice(0, 6)) {
    try {
      const url = `${HN_API}/search?query=${encodeURIComponent(q)}&tags=story&numericFilters=points>${MIN_POINTS},created_at_i>${createdAtMin}&hitsPerPage=25`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Trendly/1.0' },
      });
      const data = await res.json();

      for (const hit of data.hits || []) {
        const url_ = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        items.push({
          source: 'hackernews',
          externalId: hit.objectID,
          title: hit.title || 'Untitled',
          summary: (hit.story_text || '').slice(0, 300),
          url: url_,
          rawContent: ((hit.title || '') + ' ' + (hit.story_text || '')).slice(0, 2000),
          publishedAt: hit.created_at || null,
          likeCount: hit.points ?? 0,
          retweetCount: hit.num_comments ?? 0,
          viewCount: 0,
          author: hit.author || '',
        });
      }
    } catch (e) {
      console.error('[HN] fetch failed:', q, e.message);
    }
  }

  const seen = new Set();
  return items.filter((i) => {
    if (seen.has(i.externalId)) return false;
    seen.add(i.externalId);
    return true;
  });
}
