import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const obj = {};
    for (const { key, value } of rows) {
      if (key === 'scan_interval_minutes' || key === 'notify_interval_hours') {
        obj[key] = parseInt(value, 10) || (key.includes('scan') ? 30 : 4);
      } else {
        obj[key] = value ?? '';
      }
    }
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['scan_interval_minutes', 'notify_interval_hours', 'webhook_url', 'webhook_type', 'theme_range'];
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    for (const key of allowed) {
      if (key in body) {
        const v = body[key];
        stmt.run(key, typeof v === 'number' ? String(v) : (v ?? ''));
      }
    }

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const obj = {};
    for (const { key, value } of rows) {
      if (key === 'scan_interval_minutes' || key === 'notify_interval_hours') {
        obj[key] = parseInt(value, 10) || (key.includes('scan') ? 30 : 4);
      } else {
        obj[key] = value ?? '';
      }
    }
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
