import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ keywords: 0, hotspots: 0, sources: 0 });
  const [hotspots, setHotspots] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [kw, hp, src] = await Promise.all([
          api.keywords.list(),
          api.hotspots.list({ limit: 5 }),
          api.sources.list(),
        ]);
        setStats({ keywords: kw.length, hotspots: hp.total ?? 0, sources: src.length });
        setHotspots(hp.items ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      await api.scan();
      const hp = await api.hotspots.list({ limit: 5 });
      setHotspots(hp.items ?? []);
      setStats((s) => ({ ...s, hotspots: hp.total ?? 0 }));
    } catch (e) {
      alert(e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-cyber-accent">仪表盘</h1>
        <button
          onClick={runScan}
          disabled={scanning}
          className="px-4 py-2 rounded bg-cyber-accent/20 text-cyber-accent hover:bg-cyber-accent/30 transition disabled:opacity-50"
        >
          {scanning ? '扫描中…' : '手动扫描'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: '关键词', value: stats.keywords, cls: 'text-cyber-accent' },
          { label: '热点总数', value: stats.hotspots, cls: 'text-cyber-glow' },
          { label: 'RSS 源', value: stats.sources, cls: 'text-cyan-400' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="hud-card p-5">
            <div className="text-cyber-muted text-sm">{label}</div>
            <div className={`text-2xl font-display font-semibold ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="hud-card p-5">
        <h2 className="font-display text-lg text-cyber-accent mb-4">最新热点</h2>
        {hotspots.length === 0 ? (
          <p className="text-cyber-muted text-sm">暂无热点，添加消息源并运行扫描</p>
        ) : (
          <ul className="space-y-3">
            {hotspots.map((h) => (
              <li key={h.id} className="border-b border-cyber-border/30 pb-3 last:border-0">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-accent hover:underline"
                >
                  {h.title}
                </a>
                <div className="text-xs text-cyber-muted mt-1">
                  {h.source} • {h.summary?.slice(0, 80)}…
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
