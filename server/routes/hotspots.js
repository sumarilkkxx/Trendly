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

export default router;
