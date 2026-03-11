import cron from 'node-cron';
import db from './db.js';
import { runScan } from './services/scanner.js';
import { sendDigest } from './services/email.js';
import { runNotificationTick } from './services/notifications.js';

let scanTask = null;
let notifyTask = null;
let channelNotifyTask = null;

function getScanIntervalHours() {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'scan_interval_hours'")
    .get();
  const hrs = parseInt(row?.value, 10);
  return Math.max(1, Number.isFinite(hrs) ? hrs : 24);
}

function getNotifyIntervalHours() {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'notify_interval_hours'")
    .get();
  const hrs = parseInt(row?.value, 10);
  return Math.max(1, Number.isFinite(hrs) ? hrs : 24);
}

function isNotifyEnabled() {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'notify_enabled'")
    .get();
  const v = (row?.value ?? 'true').toString().toLowerCase();
  return v !== 'false' && v !== '0';
}

export function startScheduler() {
  const scanHrs = getScanIntervalHours();
  const notifyHrs = getNotifyIntervalHours();

  const scanMins = Math.max(1, scanHrs * 60);

  scanTask = cron.schedule(`*/${scanMins} * * * *`, async () => {
    console.log('[Scheduler] Running scan...');
    try {
      await runScan();
    } catch (e) {
      console.error('[Scheduler] Scan error:', e.message);
    }
  });

  notifyTask = cron.schedule(`0 */${notifyHrs} * * *`, async () => {
    if (!isNotifyEnabled()) {
      console.log('[Scheduler] Email digest disabled, skip this run');
      return;
    }
    console.log('[Scheduler] Sending digest...');
    try {
      const rows = db
        .prepare(
          "SELECT * FROM hotspots WHERE notified_at IS NULL ORDER BY created_at DESC LIMIT 50"
        )
        .all();
      if (rows.length > 0) {
        await sendDigest(rows);
        const stmt = db.prepare(
          "UPDATE hotspots SET notified_at = datetime('now') WHERE id = ?"
        );
        for (const r of rows) stmt.run(r.id);
      }
    } catch (e) {
      console.error('[Scheduler] Notify error:', e.message);
    }
  });

  console.log(
    `[Scheduler] Scan every ${scanHrs}h (${scanMins}min), notify every ${notifyHrs}h`
  );

  // 通道调度：每 10 分钟检查一次所有通道是否到期，由各自的 interval_hours 控制实际频率
  channelNotifyTask = cron.schedule('*/10 * * * *', async () => {
    try {
      await runNotificationTick();
    } catch (e) {
      console.error('[Scheduler] Channel notification tick error:', e.message);
    }
  });
}
