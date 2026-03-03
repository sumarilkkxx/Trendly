import { useState, useEffect } from 'react';
import { api } from '../api';
import { BentoCard } from '../components/ui/BentoCard';
import { Button } from '../components/ui/Button';
import { HoverEffect } from '../components/ui/HoverEffect';
import { PageMotion } from '../components/ui/PageMotion';

export default function Dashboard() {
  const [stats, setStats] = useState({ keywords: 0, hotspots: 0, sources: 0 });
  const [hotspots, setHotspots] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [kw, hp, src] = await Promise.all([
          api.keywords.list(),
          api.hotspots.list({ limit: 6 }),
          api.sources.list(),
        ]);
        setStats({ keywords: kw.length, hotspots: hp.total ?? 0, sources: src.length });
        setHotspots((hp.items ?? []).map((h) => ({ ...h, link: h.url, description: h.summary })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      await api.scan();
      const hp = await api.hotspots.list({ limit: 6 });
      setHotspots((hp.items ?? []).map((h) => ({ ...h, link: h.url, description: h.summary })));
      setStats((s) => ({ ...s, hotspots: hp.total ?? 0 }));
    } catch (e) {
      alert(e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <PageMotion className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
            第一时间发现 AI 热点
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            简洁、高效、永不落伍
          </p>
        </div>
        <Button onClick={runScan} disabled={scanning} className="rounded-full">
          {scanning ? '扫描中…' : '立即扫描'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '关键词', value: stats.keywords, cls: 'text-cyber-accent', delay: 0 },
          { label: '热点', value: stats.hotspots, cls: 'text-cyan-400', delay: 0.05 },
          { label: 'RSS 源', value: stats.sources, cls: 'text-emerald-400', delay: 0.1 },
        ].map(({ label, value, cls, delay }) => (
          <BentoCard key={label} delay={delay}>
            <div className="text-slate-400 text-sm">{label}</div>
            <div className={`text-3xl font-display font-bold mt-1 ${cls}`}>{value}</div>
          </BentoCard>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-cyber-accent mb-4">
          最新热点
        </h2>
        {hotspots.length === 0 ? (
          <BentoCard>
            <p className="text-slate-500 text-sm text-center py-8">
              暂无热点 · 添加消息源后点击「立即扫描」
            </p>
          </BentoCard>
        ) : (
          <HoverEffect items={hotspots} />
        )}
      </div>
    </PageMotion>
  );
}
