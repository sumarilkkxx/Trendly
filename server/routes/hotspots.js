import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, source, search } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));

    let where = '';
    const params = [];
    if (source) {
      where += ' AND source = ?';
      params.push(source);
    }
    if (search && search.trim()) {
      where += ' AND (title LIKE ? OR summary LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM hotspots WHERE 1=1 ${where}`);
    const { total } = countStmt.get(...params);

    const listStmt = db.prepare(
      `SELECT * FROM hotspots WHERE 1=1 ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    );
    const rows = listStmt.all(...params, Math.min(50, Math.max(1, parseInt(limit, 10))), offset);

    res.json({ items: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 删除单条热点
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const stmt = db.prepare('DELETE FROM hotspots WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// 删除全部热点
router.delete('/', (req, res) => {
  try {
    db.exec('DELETE FROM hotspots');
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
