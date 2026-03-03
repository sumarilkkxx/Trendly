import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM rss_sources ORDER BY created_at').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { url, name } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'url is required' });
    }
    const stmt = db.prepare('INSERT INTO rss_sources (url, name, enabled) VALUES (?, ?, 1)');
    const result = stmt.run(url.trim(), (name || '').trim() || null);
    const row = db.prepare('SELECT * FROM rss_sources WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'RSS source already exists' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const stmt = db.prepare('DELETE FROM rss_sources WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be boolean' });
    }
    const stmt = db.prepare('UPDATE rss_sources SET enabled = ? WHERE id = ?');
    const result = stmt.run(enabled ? 1 : 0, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    const row = db.prepare('SELECT * FROM rss_sources WHERE id = ?').get(id);
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
