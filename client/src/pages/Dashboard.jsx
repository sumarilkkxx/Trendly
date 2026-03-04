import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { HoverEffect } from '@/components/ui/HoverEffect';
import { PageMotion } from '@/components/ui/PageMotion';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { Flame, KeyRound, Rss, Zap, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ keywords: 0, hotspots: 0, sources: 0 });
  const [hotspots, setHotspots] = useState([]);
  const [scanning, setScanning] = useState(false);

  const loadHotspots = useCallback(async (signal) => {
    try {
      const hp = await api.hotspots.list({ limit: 9, sort: 'latest_discovery' }, { signal });
      if (signal?.aborted) return;
      setHotspots((hp.items ?? []).map((h) => ({ ...h, link: h.url, description: h.summary })));
    } catch (e) {
      if (e?.name === 'AbortError' || signal?.aborted) return;
      console.error(e);
    }
  }, []);

  const loadStats = async () => {
    try {
      const [kw, hp, src] = await Promise.all([
        api.keywords.list(),
        api.hotspots.list({ limit: 1 }),
        api.sources.list(),
      ]);
      setStats({ keywords: kw.length, hotspots: hp.total ?? 0, sources: src.length });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    loadHotspots(ctrl.signal);
    return () => ctrl.abort();
  }, [loadHotspots]);

  const runScan = async () => {
    setScanning(true);
    try {
      await api.scan();
      await loadHotspots(undefined);
      await loadStats();
    } catch (e) {
      alert(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!item?.id) return;
    try {
      await api.hotspots.remove(item.id);
      setHotspots((prev) => prev.filter((h) => h.id !== item.id));
      setStats((s) => ({ ...s, hotspots: Math.max(0, (s.hotspots ?? 0) - 1) }));
    } catch (e) {
      alert(e.message);
    }
  };

  const statItems = [
    { label: '关键词', value: stats.keywords, icon: KeyRound },
    { label: '热点', value: stats.hotspots, icon: Flame },
    { label: 'RSS 源', value: stats.sources, icon: Rss },
  ];

  const emptyStateStyle = {
    backgroundImage: 'linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 170, 0.03) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  return (
    <PageMotion className="space-y-8">
      <AuroraBackground>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              第一时间发现 AI 热点
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              简洁、高效、永不落伍 · 基于 OpenRouter 智能过滤
            </p>
          </div>
          <Button
            onClick={runScan}
            disabled={scanning}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,170,0.2)] hover:shadow-[0_0_24px_rgba(0,212,170,0.3)] transition-shadow"
          >
            <Zap className="size-4" />
            {scanning ? '扫描中…' : '立即扫描'}
          </Button>
        </div>

        <BentoGrid className="mb-8">
          {statItems.map(({ label, value, icon: Icon }) => (
            <BentoGridItem key={label} icon={<Icon />} title={label}>
              <span className="text-2xl font-bold text-primary tabular-nums mt-1">{value}</span>
            </BentoGridItem>
          ))}
        </BentoGrid>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">最新热点</h2>
            <Link
              to="/hotspots"
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              查看全部
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {hotspots.length === 0 ? (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.02] py-16 text-center"
              style={emptyStateStyle}
            >
              <p className="text-muted-foreground text-sm">
                暂无热点 · 添加消息源后点击「立即扫描」
              </p>
            </div>
          ) : (
            <HoverEffect items={hotspots} onDeleteItem={handleDeleteItem} />
          )}
        </div>
      </AuroraBackground>
    </PageMotion>
  );
}
