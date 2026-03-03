import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM keywords ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { keyword } = req.body || {};
    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({ error: 'keyword is required' });
    }
    const stmt = db.prepare('INSERT INTO keywords (keyword, enabled) VALUES (?, 1)');
    const result = stmt.run(keyword.trim());
    const row = db.prepare('SELECT * FROM keywords WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Keyword already exists' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const stmt = db.prepare('DELETE FROM keywords WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
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
    const stmt = db.prepare('UPDATE keywords SET enabled = ? WHERE id = ?');
    const result = stmt.run(enabled ? 1 : 0, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    const row = db.prepare('SELECT * FROM keywords WHERE id = ?').get(id);
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
