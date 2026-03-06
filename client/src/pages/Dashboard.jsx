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
      const hp = await api.hotspots.list({ limit: 9, sort: 'dashboard_priority' }, { signal });
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
    <PageMotion className="space-y-10">
      <AuroraBackground className="rounded-[28px] px-4 py-4 sm:px-6 sm:py-6">
        <section className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-6 backdrop-blur-sm sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium tracking-widest uppercase text-primary">
                Trendly · AI Signal
              </span>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  多源聚合，实时追踪 AI 前沿信号
                </h1>
                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  自动抓取 · 智能排序 · 优先展示高价值动态
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:items-start lg:items-end">
              <Button
                onClick={runScan}
                disabled={scanning}
                className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,170,0.2)] hover:shadow-[0_0_24px_rgba(0,212,170,0.3)] transition-shadow"
              >
                <Zap className="size-4" />
                {scanning ? '扫描中…' : '立即扫描'}
              </Button>
            </div>
          </div>

          <BentoGrid className="mt-8 gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            {statItems.map(({ label, value, icon: Icon }) => (
              <BentoGridItem
                key={label}
                icon={<Icon />}
                title={label}
                className="min-h-[148px] bg-white/[0.03] px-1"
              >
                <span className="mt-3 text-3xl font-bold text-primary tabular-nums">{value}</span>
              </BentoGridItem>
            ))}
          </BentoGrid>
        </section>

        <section className="mt-10 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-foreground">Top 9 · 前沿焦点</h2>
              <p className="text-sm text-muted-foreground">
                按真实性 × 重要程度 × 热度综合排序
              </p>
            </div>
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
              className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center"
              style={emptyStateStyle}
            >
              <p className="text-sm text-muted-foreground">
                暂无信号 · 添加消息源后点击「立即扫描」开始追踪
              </p>
            </div>
          ) : (
            <HoverEffect items={hotspots} className="pt-1" onDeleteItem={handleDeleteItem} />
          )}
        </section>
      </AuroraBackground>
    </PageMotion>
  );
}
