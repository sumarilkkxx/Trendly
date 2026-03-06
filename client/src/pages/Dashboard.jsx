import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { HoverEffect } from '@/components/ui/HoverEffect';
import { PageMotion } from '@/components/ui/PageMotion';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { Flame, KeyRound, Rss, Zap, ChevronRight, Radio } from 'lucide-react';

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

  useEffect(() => { loadStats(); }, []);

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
    { label: 'Keywords', value: stats.keywords, icon: KeyRound },
    { label: 'Hotspots', value: stats.hotspots, icon: Flame },
    { label: 'RSS Feeds', value: stats.sources, icon: Rss },
  ];

  return (
    <PageMotion className="space-y-10">
      <AuroraBackground>
        {/* ── Hero Section ───────────────────────────── */}
        <section className="scanline-overlay relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-primary animate-pulse-glow" />
                <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">
                  Trendly · AI Signal Monitor
                </span>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                多源聚合，实时追踪 AI 前沿信号
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                自动抓取 · 智能排序 · 优先展示高价值动态
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:items-end lg:pt-8">
              <Button
                onClick={runScan}
                disabled={scanning}
                size="lg"
                className="h-11 px-6"
              >
                <Zap className="size-4" />
                {scanning ? '扫描中…' : '立即扫描'}
              </Button>
            </div>
          </div>

          <BentoGrid className="relative z-10 mt-8 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            {statItems.map(({ label, value, icon: Icon }) => (
              <BentoGridItem
                key={label}
                icon={<Icon />}
                title={label}
                className="min-h-[140px]"
              >
                <span className="mt-2 text-4xl font-bold text-primary tabular-nums tracking-tight">{value}</span>
              </BentoGridItem>
            ))}
          </BentoGrid>
        </section>

        {/* ── Hotspot Feed ────────────────────────────── */}
        <section className="mt-12 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <h2 className="font-display text-lg font-semibold tracking-wide text-foreground">
                Top 9 · 前沿焦点
              </h2>
              <p className="text-xs tracking-wide text-muted-foreground/70">
                按真实性 × 重要程度 × 热度综合排序
              </p>
            </div>
            <Link
              to="/hotspots"
              className="group inline-flex items-center gap-1.5 text-sm text-primary/80 hover:text-primary transition-colors"
            >
              查看全部
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {hotspots.length === 0 ? (
            <div className="tech-grid rounded-2xl border border-white/[0.06] py-20 text-center">
              <Radio className="mx-auto mb-3 size-6 text-primary/30" />
              <p className="text-sm text-muted-foreground">
                暂无信号 · 添加消息源后点击「立即扫描」开始追踪
              </p>
            </div>
          ) : (
            <HoverEffect items={hotspots} onDeleteItem={handleDeleteItem} />
          )}
        </section>
      </AuroraBackground>
    </PageMotion>
  );
}
