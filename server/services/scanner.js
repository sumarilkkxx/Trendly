import db from '../db.js';
import { fetchHuggingFace, fetchCustomRss } from './fetchRss.js';
import { fetchReddit } from './fetchReddit.js';
import { fetchTwitter } from './fetchTwitter.js';
import { filterAndSummarize } from './openRouter.js';

function matchKeyword(text, keywords) {
  if (!keywords?.length || !text) return true;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export async function runScan() {
  const keywords = db.prepare('SELECT keyword FROM keywords WHERE enabled = 1').all();
  const kwList = keywords.map((r) => r.keyword);

  const all = [];
  const [hf, custom, reddit, twitter] = await Promise.all([
    fetchHuggingFace(),
    fetchCustomRss(),
    fetchReddit(),
    fetchTwitter(kwList),
  ]);

  all.push(...hf, ...custom, ...reddit, ...twitter);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO hotspots (source, external_id, title, summary, url, raw_content, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let newCount = 0;

  for (const item of all) {
    const text = [item.title, item.summary, item.rawContent].filter(Boolean).join(' ');
    if (kwList.length && !matchKeyword(text, kwList)) continue;

    const { keep, summary } = await filterAndSummarize(item, kwList);
    if (!keep) continue;

    try {
      const result = insertStmt.run(
        item.source,
        String(item.externalId),
        item.title,
        summary || item.summary,
        item.url,
        item.rawContent || '',
        item.publishedAt
      );
      if (result.changes > 0) newCount++;
    } catch (e) {
      // UNIQUE violation = already exists, ignore
    }
  }

  return { scanned: all.length, new: newCount };
}
