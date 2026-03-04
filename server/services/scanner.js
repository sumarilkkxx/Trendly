import db from '../db.js';
import { fetchHuggingFace, fetchCustomRss } from './fetchRss.js';
import { fetchReddit } from './fetchReddit.js';
import { fetchTwitter } from './fetchTwitter.js';
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
  const [hf, custom, reddit, twitter] = await Promise.all([
    fetchHuggingFace(),
    fetchCustomRss(),
    fetchReddit(),
    fetchTwitter(kwList, twitterFilterConfig),
  ]);

  all.push(...hf, ...custom, ...reddit, ...twitter);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO hotspots (
      source, external_id, title, summary, url, raw_content, published_at,
      like_count, retweet_count, view_count, relevance_score, matched_keywords
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let newCount = 0;

  for (const item of all) {
    const text = [item.title, item.summary, item.rawContent].filter(Boolean).join(' ');
    if (kwList.length && !matchKeyword(text, kwList)) continue;

    const matchedKws = getMatchedKeywords(text, kwList);
    const { keep, summary, relevance } = await filterAndSummarize(item, kwList);
    if (!keep) continue;

    const likes = item.likeCount ?? null;
    const retweets = item.retweetCount ?? null;
    const views = item.viewCount ?? null;
    const matchedKeywordsStr = matchedKws.length ? matchedKws.join(',') : '';

    try {
      const result = insertStmt.run(
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
        relevance ?? 3,
        matchedKeywordsStr
      );
      if (result.changes > 0) newCount++;
    } catch (e) {
      // UNIQUE violation = already exists, ignore
    }
  }

  return { scanned: all.length, new: newCount };
}
