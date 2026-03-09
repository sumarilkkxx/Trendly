import cron from 'node-cron';
import db from './db.js';
import { runScan } from './services/scanner.js';
import { sendDigest } from './services/email.js';

let scanTask = null;
let notifyTask = null;

function getScanInterval() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'scan_interval_minutes'").get();
  return Math.max(5, parseInt(row?.value, 10) || 30);
}

function getNotifyInterval() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'notify_interval_hours'").get();
  return Math.max(1, parseInt(row?.value, 10) || 4);
}

function isNotifyEnabled() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'notify_enabled'").get();
  const v = (row?.value ?? 'true').toString().toLowerCase();
  return v !== 'false' && v !== '0';
}

export function startScheduler() {
  const scanMins = getScanInterval();
  const notifyHrs = getNotifyInterval();

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
      const rows = db.prepare('SELECT * FROM hotspots WHERE notified_at IS NULL ORDER BY created_at DESC LIMIT 50').all();
      if (rows.length > 0) {
        await sendDigest(rows);
        const stmt = db.prepare('UPDATE hotspots SET notified_at = datetime(\'now\') WHERE id = ?');
        for (const r of rows) stmt.run(r.id);
      }
    } catch (e) {
      console.error('[Scheduler] Notify error:', e.message);
    }
  });

  console.log(`[Scheduler] Scan every ${scanMins}min, notify every ${notifyHrs}h`);
}
