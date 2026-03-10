import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 仅允许通过此路由管理第三方工作平台通道
const ALLOWED_TYPES = new Set(['wecom', 'feishu', 'dingtalk']);

function normalizeIntervalMinutes(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 240;
  return Math.max(5, Math.min(n, 24 * 60));
}

function normalizeChannelPayload(body) {
  const name = (body.name || '').trim();
  const type = String(body.type || '').toLowerCase();
  const target = body.target ? String(body.target) : null;
  const enabled = body.enabled === false || body.enabled === 0 ? 0 : 1;
  const intervalMinutes = normalizeIntervalMinutes(
    body.interval_minutes ?? body.intervalMinutes
  );
  const config =
    body.config && typeof body.config === 'object' ? body.config : {};

  return { name, type, target, enabled, intervalMinutes, config };
}

router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT id, name, type, target, enabled, interval_minutes, config_json, last_run_at, created_at, updated_at
        FROM notification_channels
        WHERE type IN ('wecom', 'feishu', 'dingtalk')
        ORDER BY id ASC
      `
      )
      .all();
    const mapped = rows.map((r) => ({
      ...r,
      config: r.config_json ? JSON.parse(r.config_json) : {},
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, target, enabled, intervalMinutes, config } =
      normalizeChannelPayload(req.body || {});

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!type || !ALLOWED_TYPES.has(type)) {
      return res
        .status(400)
        .json({ error: 'type is required and must be one of email/wecom/feishu/dingtalk' });
    }

    const stmt = db.prepare(
      `
      INSERT INTO notification_channels
        (name, type, target, enabled, interval_minutes, config_json, created_at, updated_at)
      VALUES
        (@name, @type, @target, @enabled, @interval_minutes, @config_json, datetime('now'), datetime('now'))
    `
    );

    const result = stmt.run({
      name,
      type,
      target,
      enabled,
      interval_minutes: intervalMinutes,
      config_json: JSON.stringify(config || {}),
    });

    const row = db
      .prepare('SELECT * FROM notification_channels WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json({
      ...row,
      config: row.config_json ? JSON.parse(row.config_json) : {},
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const existing = db
      .prepare('SELECT * FROM notification_channels WHERE id = ?')
      .get(id);
    if (!existing) {
      return res.status(404).json({ error: 'channel not found' });
    }

    const { name, type, target, enabled, intervalMinutes, config } =
      normalizeChannelPayload({ ...existing, ...req.body });

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!type || !ALLOWED_TYPES.has(type)) {
      return res
        .status(400)
        .json({ error: 'type is required and must be one of email/wecom/feishu/dingtalk' });
    }

    const stmt = db.prepare(
      `
      UPDATE notification_channels
      SET
        name = @name,
        type = @type,
        target = @target,
        enabled = @enabled,
        interval_minutes = @interval_minutes,
        config_json = @config_json,
        updated_at = datetime('now')
      WHERE id = @id
    `
    );

    stmt.run({
      id,
      name,
      type,
      target,
      enabled,
      interval_minutes: intervalMinutes,
      config_json: JSON.stringify(config || {}),
    });

    const row = db
      .prepare('SELECT * FROM notification_channels WHERE id = ?')
      .get(id);
    res.json({
      ...row,
      config: row.config_json ? JSON.parse(row.config_json) : {},
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    db.prepare('DELETE FROM notification_channels WHERE id = ?').run(id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

