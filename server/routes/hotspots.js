import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 来源类型到 SQL 条件的映射（支持多选）
function buildSourceConditions(sourcesParam) {
  if (!sourcesParam || typeof sourcesParam !== 'string') return { where: '', params: [] };
  const types = sourcesParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (types.length === 0) return { where: '', params: [] };
  const map = {
    twitter: ["source = 'twitter'"],
    reddit: ["source LIKE 'reddit:%'"],
    huggingface: ["source = 'huggingface'"],
    hackernews: ["source = 'hackernews'"],
    googlenews: ["source = 'googlenews'"],
    duckduckgo: ["source = 'duckduckgo'"],
    rss: ["source LIKE 'rss:%'"],
    devnews: ["source LIKE 'devnews:%'"],
  };
  const conditions = [];
  const params = [];
  for (const t of types) {
    if (map[t]) conditions.push(...map[t]);
  }
  if (conditions.length === 0) return { where: '', params: [] };
  return { where: ' AND (' + conditions.join(' OR ') + ')', params };
}

// 时间范围：1h | today | 7d | 30d | custom（需 dateFrom, dateTo）
function buildTimeConditions(timeRange, dateFrom, dateTo) {
  if (!timeRange) return { where: '', params: [] };
  const now = new Date();
  let start;
  switch (timeRange) {
    case '1h':
      start = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (dateFrom) start = new Date(dateFrom);
      else return { where: '', params: [] };
      break;
    default:
      return { where: '', params: [] };
  }
  let end = timeRange === 'custom' && dateTo ? new Date(dateTo) : now;
  if (timeRange === 'custom' && dateTo) {
    end.setHours(23, 59, 59, 999);
  }
  const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
  const endStr = end.toISOString().slice(0, 19).replace('T', ' ');
  return {
    where: " AND COALESCE(published_at, created_at) >= ? AND COALESCE(published_at, created_at) <= ?",
    params: [startStr, endStr],
  };
}

// 排序：latest_discovery | latest_published | popularity | importance | relevance
function buildOrderBy(sort) {
  switch (sort) {
    case 'latest_published':
      return 'ORDER BY COALESCE(published_at, created_at) DESC, id DESC';
    case 'popularity':
      return `ORDER BY (
        COALESCE(like_count, 0) * 2 + COALESCE(retweet_count, 0) * 3 + COALESCE(view_count, 0) * 0.001
      ) DESC, id DESC`;
    case 'importance':
      return `ORDER BY CASE COALESCE(importance, 'medium')
        WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END DESC, id DESC`;
    case 'relevance':
      return 'ORDER BY COALESCE(relevance_score, 0) DESC, id DESC';
    case 'latest_discovery':
    default:
      return 'ORDER BY created_at DESC, id DESC';
  }
}

router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      sources,
      search,
      keyword,
      sort = 'latest_discovery',
      timeRange,
      dateFrom,
      dateTo,
      importance,
      authenticity,
      relevanceMin,
      relevanceMax,
    } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));

    let where = '';
    const params = [];

    // 兼容旧版单 source；支持 sources 为 string 或 array
    let srcParam = sources ?? source;
    if (Array.isArray(srcParam)) srcParam = srcParam.filter(Boolean).join(',');
    if (srcParam != null && typeof srcParam !== 'string') srcParam = String(srcParam);
    const srcCond = buildSourceConditions(srcParam);
    where += srcCond.where;
    params.push(...srcCond.params);

    if (search && search.trim()) {
      where += ' AND (title LIKE ? OR summary LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }
    if (keyword && keyword.trim()) {
      where += ' AND (matched_keywords LIKE ?)';
      params.push(`%${keyword.trim()}%`);
    }

    const timeCond = buildTimeConditions(timeRange, dateFrom, dateTo);
    where += timeCond.where;
    params.push(...timeCond.params);

    if (importance && typeof importance === 'string') {
      const levels = importance.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const valid = ['urgent', 'high', 'medium', 'low'].filter((l) => levels.includes(l));
      if (valid.length) {
        where += ` AND importance IN (${valid.map(() => '?').join(',')})`;
        params.push(...valid);
      }
    }
    if (authenticity && ['verified', 'suspected_false'].includes(authenticity)) {
      where += ' AND authenticity = ?';
      params.push(authenticity);
    }
    const relMin = parseInt(relevanceMin, 10);
    const relMax = parseInt(relevanceMax, 10);
    if (Number.isFinite(relMin) && relMin >= 0) {
      where += ' AND COALESCE(relevance_score, 0) >= ?';
      params.push(relMin);
    }
    if (Number.isFinite(relMax) && relMax <= 100) {
      where += ' AND COALESCE(relevance_score, 0) <= ?';
      params.push(relMax);
    }

    const orderBy = buildOrderBy(sort);
    const limitVal = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM hotspots WHERE 1=1 ${where}`);
    const { total } = countStmt.get(...params);

    const listStmt = db.prepare(
      `SELECT * FROM hotspots WHERE 1=1 ${where} ${orderBy} LIMIT ? OFFSET ?`
    );
    const rows = listStmt.all(...params, limitVal, offset);
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
