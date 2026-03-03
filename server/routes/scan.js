import { Router } from 'express';
import { runScan } from '../services/scanner.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    await runScan();
    res.json({ ok: true, message: 'Scan completed' });
  } catch (e) {
    console.error('[Scan]', e);
    res.status(500).json({ error: e.message || 'Scan failed' });
  }
});

export default router;
