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

// 默认设置
const defaults = [
  ['scan_interval_minutes', '30'],
  ['notify_interval_hours', '4'],
  ['webhook_url', ''],
  ['webhook_type', ''],
  ['theme_range', ''],
];

const stmt = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);
for (const [k, v] of defaults) {
  stmt.run(k, v);
}

export default db;
