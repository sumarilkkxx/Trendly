import db from '../db.js';
import { sendDigest as sendEmailDigest } from './email.js';

function getDueChannels() {
  return db
    .prepare(
      `
      SELECT *
      FROM notification_channels
      WHERE enabled = 1
        AND (
          last_run_at IS NULL
          OR (strftime('%s', 'now') - strftime('%s', last_run_at)) >= interval_minutes * 60
        )
    `
    )
    .all();
}

function getAllEnabledChannels() {
  return db
    .prepare(
      `
      SELECT *
      FROM notification_channels
      WHERE enabled = 1
    `
    )
    .all();
}

function parseConfig(channel) {
  try {
    return channel && channel.config_json
      ? JSON.parse(channel.config_json)
      : {};
  } catch {
    return {};
  }
}

function markChannelRun(channelId) {
  db.prepare(
    `
    UPDATE notification_channels
    SET last_run_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(channelId);
}

function recordNotifications(channelId, items) {
  if (!items || !items.length) return;

  const insertStmt = db.prepare(
    `
    INSERT OR IGNORE INTO hotspot_notifications (hotspot_id, channel_id, notified_at)
    VALUES (?, ?, datetime('now'))
  `
  );

  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      insertStmt.run(r.id, channelId);
    }
  });

  insertMany(items);
}

function getPendingHotspotsForChannel(channelId, limit = 50) {
  return db
    .prepare(
      `
      SELECT h.*
      FROM hotspots h
      LEFT JOIN hotspot_notifications hn
        ON hn.hotspot_id = h.id AND hn.channel_id = ?
      WHERE hn.id IS NULL
      ORDER BY h.created_at DESC
      LIMIT ?
    `
    )
    .all(channelId, limit);
}

/** 最近 N 分钟内更新的热点中，该通道尚未推送的（用于“立即扫描”后即时推送） */
function getRecentlyUpdatedPendingForChannel(channelId, sinceMinutes = 3, limit = 50) {
  return db
    .prepare(
      `
      SELECT h.*
      FROM hotspots h
      LEFT JOIN hotspot_notifications hn
        ON hn.hotspot_id = h.id AND hn.channel_id = ?
      WHERE hn.id IS NULL
        AND h.updated_at >= datetime('now', ?)
      ORDER BY h.updated_at DESC
      LIMIT ?
    `
    )
    .all(channelId, `-${sinceMinutes} minutes`, limit);
}

function buildTextDigest(items) {
  if (!items || items.length === 0) return '';
  const lines = [];
  lines.push(`Trendly 热点播报 · 共 ${items.length} 条`);
  lines.push('——————————————');

  const maxItems = Math.min(items.length, 8);
  for (let i = 0; i < maxItems; i += 1) {
    const it = items[i];
    const title = it.title || '（无标题）';
    const summary =
      (it.summary || '').length > 80
        ? `${it.summary.slice(0, 80)}…`
        : it.summary || '';
    const url = it.url || '';
    lines.push(`${i + 1}. ${title}`);
    if (summary) {
      lines.push(`   · ${summary}`);
    }
    if (url) {
      lines.push(`   ↗ ${url}`);
    }
    lines.push('');
  }

  if (items.length > maxItems) {
    lines.push(
      `… 还有 ${items.length - maxItems} 条新内容，可在 Trendly Web 端查看完整列表。`
    );
  }

  return lines.join('\n');
}

async function sendWebhookDigest(channel, items) {
  const cfg = parseConfig(channel);
  const url = cfg.webhook_url;
  if (!url) {
    console.warn(
      `[Notifications] Channel ${channel.id} (${channel.type}) missing webhook_url, skip`
    );
    return;
  }

  const text = buildTextDigest(items);
  if (!text) return;

  let payload;

  if (channel.type === 'wecom') {
    // 企业微信机器人：markdown 消息
    payload = {
      msgtype: 'markdown',
      markdown: {
        content: text,
      },
    };
  } else if (channel.type === 'dingtalk') {
    // 钉钉自定义机器人：markdown 消息
    payload = {
      msgtype: 'markdown',
      markdown: {
        title: 'Trendly 热点通知',
        text,
      },
    };
  } else if (channel.type === 'feishu') {
    // 飞书自定义机器人：文本消息
    payload = {
      msg_type: 'text',
      content: {
        text,
      },
    };
  } else {
    // 其他类型也尝试发送纯文本
    payload = {
      text,
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(
      `[Notifications] Webhook channel ${channel.id} (${channel.type}) error: ${res.status} ${res.statusText} ${body}`
    );
  }
}

async function sendChannelDigest(channel, items) {
  if (!items || !items.length) return;

  if (channel.type === 'email') {
    await sendEmailDigest(items);
    return;
  }

  if (['wecom', 'feishu', 'dingtalk'].includes(channel.type)) {
    await sendWebhookDigest(channel, items);
    return;
  }

  // 未知类型：暂时忽略但记录日志
  console.warn(
    `[Notifications] Unknown channel type "${channel.type}" for channel ${channel.id}, skip`
  );
}

export async function runNotificationTick() {
  const channels = getDueChannels();
  if (!channels.length) return;

  for (const ch of channels) {
    try {
      const items = getPendingHotspotsForChannel(ch.id, 50);
      if (!items.length) {
        markChannelRun(ch.id);
        continue;
      }

      console.log(
        `[Notifications] Sending digest via channel #${ch.id} (${ch.type}, interval=${ch.interval_minutes}min) with ${items.length} items`
      );

      await sendChannelDigest(ch, items);
      recordNotifications(ch.id, items);
      markChannelRun(ch.id);
    } catch (e) {
      console.error(
        `[Notifications] Error for channel #${ch.id} (${ch.type}):`,
        e.message
      );
    }
  }
}

// 供“立即扫描”之后调用：优先推送“本轮刚更新的热点”，否则推送任意未推送过的热点
export async function runNotificationNow() {
  const channels = getAllEnabledChannels();
  if (!channels.length) {
    console.log('[Notifications] runNotificationNow: no enabled channels, skip');
    return;
  }

  for (const ch of channels) {
    try {
      // 优先：最近 3 分钟内更新的、该通道尚未推送的（即本轮扫描结果）
      let items = getRecentlyUpdatedPendingForChannel(ch.id, 3, 50);
      if (!items.length) {
        items = getPendingHotspotsForChannel(ch.id, 50);
      }
      if (!items.length) {
        console.log(`[Notifications] runNotificationNow: channel #${ch.id} (${ch.type}) has no pending items, skip`);
        continue;
      }

      console.log(
        `[Notifications] Sending immediate digest via channel #${ch.id} (${ch.type}) with ${items.length} items`
      );

      await sendChannelDigest(ch, items);
      recordNotifications(ch.id, items);
      markChannelRun(ch.id);
    } catch (e) {
      console.error(
        `[Notifications] Error for immediate channel #${ch.id} (${ch.type}):`,
        e.message
      );
    }
  }
}

