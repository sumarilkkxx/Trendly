import db from '../db.js';
import { fetchHuggingFace, fetchCustomRss } from './fetchRss.js';
import { fetchReddit } from './fetchReddit.js';
import { fetchTwitter } from './fetchTwitter.js';
import { fetchHackerNews } from './fetchHackerNews.js';
import { fetchDevNews } from './fetchDevNews.js';
import { fetchGoogleNews } from './fetchGoogleNews.js';
import { fetchDuckDuckGo } from './fetchDuckDuckGo.js';
import { getTwitterFilterConfig } from './twitterFilter.js';
import { filterAndSummarize } from './openRouter.js';

function matchKeyword(text, keywords) {
  if (!keywords?.length || !text) return true;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function getMatchedKeywords(text, keywords) {
  if (!keywords?.length || !text) return [];
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
}

function hashInt(str) {
  return Math.abs(
    (str || '')
      .split('')
      .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  );
}

/**
 * 相关性评分规则增强：提高区分度，避免大量相同分数
 * 1. 关键词匹配：每命中 1 个关键词 +8，最多 +24
 * 2. 标题命中：任一关键词出现在标题中 +5
 * 3. 无信号时：基础分 50 + 哈希离散 0-15
 * 4. 热度加成：基于 like/retweet/view 的对数缩放，0-8 分（高互动略增相关性）
 * 5. 哈希微调：每条目再 +0-8，确保同条件不同条目有区分
 */
function computeRelevanceScore(baseRel, item, matchedKws, kwList) {
  let score = baseRel ?? 50;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (kwList.length > 0 && matchedKws.length > 0) {
    const titleLower = (item.title || '').toLowerCase();
    const kwBonus = Math.min(matchedKws.length * 8, 24);
    const titleBonus = matchedKws.some((k) => titleLower.includes(k.toLowerCase())) ? 5 : 0;
    score = score + kwBonus + titleBonus;
  } else if (score === 50) {
    score = 50 + (hashInt(item.source + item.externalId) % 16);
  }

  const likes = item.likeCount ?? item.like_count ?? 0;
  const retweets = item.retweetCount ?? item.retweet_count ?? 0;
  const views = item.viewCount ?? item.view_count ?? 0;
  const hotBase = likes * 10 + retweets * 5 + Math.log10(Math.max(views, 1)) * 2;
  const engagementBonus = Math.min(8, Math.floor(Math.log10(Math.max(hotBase, 1)) * 3));
  score += engagementBonus;

  const jitter = hashInt(item.source + item.externalId + (item.title || '')) % 9;
  score += jitter;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function loadSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const { key, value } of rows) obj[key] = value ?? '';
  return obj;
}

export async function runScan() {
  const keywords = db.prepare('SELECT keyword FROM keywords WHERE enabled = 1').all();
  const kwList = keywords.map((r) => r.keyword);
  const settings = loadSettings();
  const twitterFilterConfig = getTwitterFilterConfig(settings);

  const all = [];
  const fetchers = [
    fetchHuggingFace(),
    fetchCustomRss(),
    fetchReddit(),
    fetchTwitter(kwList, twitterFilterConfig),
    fetchHackerNews(kwList),
    fetchDevNews(),
    fetchGoogleNews(kwList),
    fetchDuckDuckGo(kwList).catch((e) => {
      console.error('[DuckDuckGo]', e.message);
      return [];
    }),
  ];

  const results = await Promise.all(fetchers);
  for (const r of results) all.push(...(r || []));

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = all.filter((item) => {
    const pub = item.publishedAt ? new Date(item.publishedAt) : null;
    return !pub || pub >= cutoff;
  });

  const upsertStmt = db.prepare(`
    INSERT INTO hotspots (
      source, external_id, title, summary, url, raw_content, published_at,
      like_count, retweet_count, view_count, relevance_score, matched_keywords,
      importance, authenticity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, external_id) DO UPDATE SET
      summary = excluded.summary,
      raw_content = excluded.raw_content,
      like_count = excluded.like_count,
      retweet_count = excluded.retweet_count,
      view_count = excluded.view_count,
      relevance_score = excluded.relevance_score,
      matched_keywords = excluded.matched_keywords,
      importance = excluded.importance,
      authenticity = excluded.authenticity
  `);

  let newCount = 0;

  for (const item of recent) {
    const text = [item.title, item.summary, item.rawContent].filter(Boolean).join(' ');
    if (kwList.length && !matchKeyword(text, kwList)) continue;

    const matchedKws = getMatchedKeywords(text, kwList);
    const { keep, summary, relevance, importance, authenticity } = await filterAndSummarize(item, kwList);
    if (!keep) continue;

    const likes = item.likeCount ?? null;
    const retweets = item.retweetCount ?? null;
    const views = item.viewCount ?? null;
    const matchedKeywordsStr = matchedKws.length ? matchedKws.join(',') : '';
    const relevanceVal = computeRelevanceScore(relevance, item, matchedKws, kwList);
    const importanceVal = importance || 'medium';
    const authenticityVal = authenticity || 'verified';

    try {
      const result = upsertStmt.run(
        item.source,
        String(item.externalId),
        item.title,
        summary || item.summary,
        item.url,
        item.rawContent || '',
        item.publishedAt,
        likes,
        retweets,
        views,
        relevanceVal,
        matchedKeywordsStr,
        importanceVal,
        authenticityVal
      );
      if (result.changes > 0) newCount++;
    } catch (e) {
      // UNIQUE violation = already exists, ignore
    }
  }

  return { scanned: recent.length, new: newCount };
}
