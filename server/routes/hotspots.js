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

// 时间范围：1h | today | 3d | 7d（抓取与筛选均限定 7 天内）
function buildTimeConditions(timeRange) {
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
    case '3d':
      start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      return { where: '', params: [] };
  }
  const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
  const endStr = now.toISOString().slice(0, 19).replace('T', ' ');
  return {
    where: " AND COALESCE(published_at, created_at) >= ? AND COALESCE(published_at, created_at) <= ?",
    params: [startStr, endStr],
  };
}

// 排序：latest_discovery | latest_published | popularity | importance | relevance | dashboard_priority
function buildOrderBy(sort) {
  switch (sort) {
    case 'latest_published':
      return 'ORDER BY COALESCE(published_at, created_at) DESC, id DESC';
    case 'popularity':
      // 热度公式（参考 yupi-hot-monitor）：点赞权重最高，转发次之，浏览用 log10 对数缩放
      return `ORDER BY (
        COALESCE(like_count, 0) * 10 + COALESCE(retweet_count, 0) * 5
        + (log10(MAX(COALESCE(view_count, 0), 1)) * 2)
      ) DESC, id DESC`;
    case 'importance':
      return `ORDER BY CASE COALESCE(importance, 'medium')
        WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END DESC, id DESC`;
    case 'relevance':
      return 'ORDER BY COALESCE(relevance_score, 0) DESC, id DESC';
    case 'dashboard_priority':
      return `ORDER BY
        CASE COALESCE(authenticity, 'verified')
          WHEN 'suspected_false' THEN 0 ELSE 1 END DESC,
        CASE COALESCE(importance, 'medium')
          WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END DESC,
        (
          COALESCE(like_count, 0) * 10 + COALESCE(retweet_count, 0) * 5
          + (log10(MAX(COALESCE(view_count, 0), 1)) * 2)
        ) DESC,
        COALESCE(relevance_score, 0) DESC,
        COALESCE(published_at, created_at) DESC,
        id DESC`;
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
      authenticity,
      importance,
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

    const timeCond = buildTimeConditions(timeRange);
    where += timeCond.where;
    params.push(...timeCond.params);

    if (authenticity && ['verified', 'suspected_false'].includes(authenticity)) {
      where += ' AND authenticity = ?';
      params.push(authenticity);
    }
    if (importance && ['urgent', 'high', 'medium', 'low'].includes(importance)) {
      where += ' AND importance = ?';
      params.push(importance);
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
    
    res.json({
      items: rows,
      total,
      page: parseInt(page, 10),
      limit: limitVal,
      totalPages: Math.ceil(total / limitVal),
    });
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
    // 删除 hotspots 表
    db.exec('DELETE FROM hotspots');
    // 同时也删除相关的通知记录
    db.exec('DELETE FROM hotspot_notifications');
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
