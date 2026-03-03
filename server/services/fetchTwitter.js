const API_BASE = 'https://api.twitterapi.io';

export async function fetchTwitter(keywords = []) {
  const apiKey = process.env.TWITTERAPI_IO_API_KEY;
  if (!apiKey || !keywords.length) return [];

  const terms = keywords.slice(0, 3).map((k) => `"${k}"`).join(' OR ');
  const query = terms || 'AI OR GPT';

  const items = [];
  let cursor = '';
  let page = 0;
  const maxPages = 2;

  try {
    while (page < maxPages) {
      const params = new URLSearchParams({
        query,
        queryType: 'Latest',
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
        items.push({
          source: 'twitter',
          externalId: t.id,
          title: (t.text || '').slice(0, 100),
          summary: (t.text || '').slice(0, 300),
          url: t.url || `https://x.com/i/status/${t.id}`,
          rawContent: (t.text || '').slice(0, 2000),
          publishedAt: t.createdAt || null,
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
