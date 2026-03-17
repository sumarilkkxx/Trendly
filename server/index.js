import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import keywordsRoutes from './routes/keywords.js';
import hotspotsRoutes from './routes/hotspots.js';
import settingsRoutes from './routes/settings.js';
import sourcesRoutes from './routes/sources.js';
import scanRoutes from './routes/scan.js';
import notificationChannelsRoutes from './routes/notificationChannels.js';
import { startScheduler } from './scheduler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/keywords', keywordsRoutes);
app.use('/api/hotspots', hotspotsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/notificationChannels', notificationChannelsRoutes);

// 静态资源（前端构建后）
const clientDist = join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/', (req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Trendly] Server running at http://localhost:${PORT}`);
  startScheduler();
});
