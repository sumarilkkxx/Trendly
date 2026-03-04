import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || join(__dirname, '..', 'data', 'db.sqlite');

const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hotspots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT NOT NULL,
    raw_content TEXT,
    published_at TEXT,
    notified_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(source, external_id)
  );

  CREATE TABLE IF NOT EXISTS rss_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    name TEXT,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_hotspots_created ON hotspots(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_hotspots_source ON hotspots(source);
  CREATE INDEX IF NOT EXISTS idx_keywords_enabled ON keywords(enabled);
`);

// 迁移：添加热度、相关性、匹配关键词字段（若不存在）
['like_count', 'retweet_count', 'view_count', 'relevance_score', 'matched_keywords'].forEach((col) => {
  try {
    db.exec(`ALTER TABLE hotspots ADD COLUMN ${col} ${col === 'matched_keywords' ? 'TEXT' : 'INTEGER'}`);
  } catch (e) {
    if (!e.message?.includes('duplicate column')) throw e;
  }
});

// 迁移：添加重要程度、真实性字段（Batch 2）
['importance', 'authenticity'].forEach((col) => {
  try {
    db.exec(`ALTER TABLE hotspots ADD COLUMN ${col} TEXT`);
  } catch (e) {
    if (!e.message?.includes('duplicate column')) throw e;
  }
});

// 迁移：将旧 relevance_score 1-5 转为 0-100
try {
  db.exec(`UPDATE hotspots SET relevance_score = relevance_score * 20 WHERE relevance_score BETWEEN 1 AND 5`);
} catch (e) {
  // ignore
}

// 迁移：按规则重新计算相关性分数，提高区分度
function hashInt(str) {
  return Math.abs(
    (str || '')
      .split('')
      .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  );
}
try {
  const rows = db.prepare(
    'SELECT id, source, external_id, title, relevance_score, matched_keywords, like_count, retweet_count, view_count FROM hotspots'
  ).all();
  const updateStmt = db.prepare('UPDATE hotspots SET relevance_score = ? WHERE id = ?');
  for (const row of rows) {
    let score = row.relevance_score ?? 50;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const matchedKws = (row.matched_keywords || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const kwList = matchedKws;
    if (kwList.length > 0 && matchedKws.length > 0) {
      const titleLower = (row.title || '').toLowerCase();
      const kwBonus = Math.min(matchedKws.length * 8, 24);
      const titleBonus = matchedKws.some((k) => titleLower.includes(k.toLowerCase())) ? 5 : 0;
      score = score + kwBonus + titleBonus;
    } else if (score === 50) {
      score = 50 + (hashInt(row.source + row.external_id) % 16);
    }
    const likes = row.like_count ?? 0;
    const retweets = row.retweet_count ?? 0;
    const views = row.view_count ?? 0;
    const hotBase = likes * 10 + retweets * 5 + Math.log10(Math.max(views, 1)) * 2;
    score += Math.min(8, Math.floor(Math.log10(Math.max(hotBase, 1)) * 3));
    score += hashInt(row.source + row.external_id + (row.title || '')) % 9;
    const final = Math.min(100, Math.max(0, Math.round(score)));
    if (final !== (row.relevance_score ?? 50)) {
      updateStmt.run(final, row.id);
    }
  }
} catch (e) {
  // ignore migration errors
}

// 默认设置
const defaults = [
  ['scan_interval_minutes', '30'],
  ['notify_interval_hours', '4'],
  ['webhook_url', ''],
  ['webhook_type', ''],
  ['theme_range', ''],
  ['twitter_filter_mode', 'standard'],
  ['twitter_min_likes', '10'],
  ['twitter_min_retweets', '5'],
  ['twitter_min_views', '500'],
  ['twitter_min_followers', '100'],
  ['twitter_exclude_replies', 'true'],
];

const stmt = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);
for (const [k, v] of defaults) {
  stmt.run(k, v);
}

export default db;
