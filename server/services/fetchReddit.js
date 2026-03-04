const SUBREDDITS = ['MachineLearning', 'LocalLLaMA', 'ArtificialIntelligence', 'OpenAI', 'ChatGPT'];

export async function fetchReddit() {
  const apiKey = process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_REFRESH_TOKEN;
  if (!apiKey) return [];

  let snoowrap;
  try {
    const mod = await import('snoowrap');
    snoowrap = mod.default;
  } catch {
    return [];
  }

  const r = new snoowrap({
    userAgent: 'Trendly/1.0',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const items = [];
  for (const sub of SUBREDDITS) {
    try {
      const hot = await r.getSubreddit(sub).getHot({ limit: 15 });
      const new_ = await r.getSubreddit(sub).getNew({ limit: 10 });
      const seen = new Set();
      for (const post of [...hot, ...new_]) {
        const id = post.id;
        if (seen.has(id)) continue;
        seen.add(id);
        items.push({
          source: `reddit:r/${sub}`,
          externalId: id,
          title: post.title || 'Untitled',
          summary: (post.selftext || '').slice(0, 300),
          url: `https://reddit.com${post.permalink}`,
          rawContent: (post.title + ' ' + (post.selftext || '')).slice(0, 2000),
          publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
          likeCount: post.ups ?? post.score ?? 0,
          retweetCount: post.num_comments ?? 0,
          viewCount: 0,
        });
      }
    } catch (e) {
      console.error('[Reddit]', sub, e.message);
    }
  }
  return items;
}
