import { Router } from 'express';
import db from '../db.js';

const router = Router();

const SETTING_DEFAULTS = {
  scan_interval_minutes: 30,
  notify_interval_hours: 4,
  notify_enabled: 'true',
  twitter_filter_mode: 'standard',
  twitter_min_likes: 10,
  twitter_min_retweets: 5,
  twitter_min_views: 500,
  twitter_min_followers: 100,
  twitter_exclude_replies: 'true',
  theme: 'light',
};

function parseSetting(key, value) {
  if (value === undefined || value === null || value === '') {
    return SETTING_DEFAULTS[key] ?? '';
  }
  if (key === 'scan_interval_minutes' || key === 'notify_interval_hours') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? (key.includes('scan') ? 30 : 4) : parsed;
  }
  if (key.startsWith('twitter_min_')) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? (SETTING_DEFAULTS[key] ?? 0) : parsed;
  }
  if (key === 'twitter_exclude_replies') {
    return value === 'false' ? 'false' : 'true';
  }
  return value;
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const obj = { ...SETTING_DEFAULTS };
    for (const { key, value } of rows) {
      obj[key] = parseSetting(key, value);
    }
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const allowed = [
      'scan_interval_minutes', 'notify_interval_hours', 'notify_enabled', 'webhook_url', 'webhook_type', 'theme_range',
      'twitter_filter_mode', 'twitter_min_likes', 'twitter_min_retweets', 'twitter_min_views',
      'twitter_min_followers', 'twitter_exclude_replies',
      'theme',
    ];
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    for (const key of allowed) {
      if (key in body) {
        const v = body[key];
        stmt.run(key, typeof v === 'number' ? String(v) : (v ?? ''));
      }
    }

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const obj = { ...SETTING_DEFAULTS };
    for (const { key, value } of rows) {
      obj[key] = parseSetting(key, value);
    }
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
