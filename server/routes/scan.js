import { Router } from 'express';
import { runScan } from '../services/scanner.js';
import { runNotificationNow } from '../services/notifications.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const scanResult = await runScan();
    // 扫描完成后立即触发各平台推送
    try {
      await runNotificationNow();
    } catch (e) {
      console.error('[Scan] runNotificationNow error:', e);
    }
    res.json({
      ok: true,
      message: 'Scan completed and notifications triggered',
      scan: scanResult,
    });
  } catch (e) {
    console.error('[Scan]', e);
    res.status(500).json({ error: e.message || 'Scan failed' });
  }
});

export default router;
