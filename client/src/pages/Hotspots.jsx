import { useState, useEffect, useCallback } from 'react';
import { PageMotion } from '@/components/ui/PageMotion';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/DatePicker';
import { HoverEffect } from '@/components/ui/HoverEffect';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Search, Filter, Trash2 } from 'lucide-react';
import {
  SORT_OPTIONS,
  SOURCE_OPTIONS,
  TIME_RANGE_OPTIONS,
  IMPORTANCE_OPTIONS,
  AUTHENTICITY_OPTIONS,
  RELEVANCE_RANGE_OPTIONS,
} from '@/constants/hotspots';

export default function Hotspots() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('latest_discovery');
  const [sources, setSources] = useState([]);
  const [timeRange, setTimeRange] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [importance, setImportance] = useState([]);
  const [authenticity, setAuthenticity] = useState('');
  const [relevanceRange, setRelevanceRange] = useState('');
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    api.keywords
      .list()
      .then((data) => setKeywords(Array.isArray(data) ? data : []))
      .catch(() => setKeywords([]));
  }, []);

  const load = useCallback(async (page = 1, signal) => {
    try {
      const params = { page, limit: 20, sort };
      if (search.trim()) params.search = search.trim();
      if (keyword.trim()) params.keyword = keyword.trim();
      if (sources.length) params.sources = sources.join(',');
      if (timeRange) {
        params.timeRange = timeRange;
        if (timeRange === 'custom') {
          if (dateFrom) params.dateFrom = dateFrom;
          if (dateTo) params.dateTo = dateTo;
        }
      }
      if (importance.length) params.importance = importance.join(',');
      if (authenticity) params.authenticity = authenticity;
      const rangeOpt = RELEVANCE_RANGE_OPTIONS.find((r) => r.value === relevanceRange);
      if (rangeOpt?.min != null) params.relevanceMin = rangeOpt.min;
      if (rangeOpt?.max != null) params.relevanceMax = rangeOpt.max;
      const res = await api.hotspots.list(params, { signal });
      if (signal?.aborted) return;
      setData(res);
    } catch (e) {
      if (e?.name === 'AbortError' || signal?.aborted) return;
      alert(e.message);
    }
  }, [sort, sources, timeRange, dateFrom, dateTo, search, keyword, importance, authenticity, relevanceRange]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(1, ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const toggleSource = (v) => {
    setSources((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));
  };
  const toggleImportance = (v) => {
    setImportance((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));
  };

  const items = (data.items ?? []).map((h) => ({
    ...h,
    link: h.url,
    description: h.summary,
  }));

  const handleDeleteItem = async (item) => {
    if (!item?.id) return;
    try {
      await api.hotspots.remove(item.id);
      setData((prev) => {
        const nextItems = (prev.items ?? []).filter((h) => h.id !== item.id);
        const nextTotal = Math.max(0, (prev.total ?? 0) - 1);
        return { ...prev, items: nextItems, total: nextTotal };
      });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('确定要删除当前所有热点吗？此操作不可恢复。')) return;
    try {
      await api.hotspots.clearAll();
      setData((prev) => ({ ...prev, items: [], total: 0, page: 1 }));
    } catch (e) {
      alert(e.message);
    }
  };

  const emptyStateStyle = {
    backgroundImage: 'linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 170, 0.03) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  return (
    <PageMotion className="space-y-6">
      <AuroraBackground>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">热点列表</h1>
              <p className="mt-1 text-muted-foreground text-sm">按来源、关键词、时间筛选，支持多种排序</p>
            </div>

            <Card className="border-white/10">
              <CardContent className="pt-6 pb-6">
                {/* 顶部：搜索、排序、操作 */}
                <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                  <div className="flex flex-wrap gap-4 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
                      <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="搜索标题/摘要"
                        className="pl-9 h-10 bg-white/5 border-white/10 text-foreground text-base placeholder:text-foreground/50 focus-visible:ring-primary/50"
                        aria-label="搜索标题或摘要"
                      />
                    </div>
                    <div className="min-w-[140px]">
                      <label className="sr-only">排序方式</label>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-full h-10 pl-3 pr-9 rounded-lg bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                        aria-label="排序方式"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {data.total > 0 && (
                    <Button variant="destructive" className="whitespace-nowrap shrink-0" onClick={handleClearAll}>
                      <Trash2 className="size-4" />
                      一键删除全部热点
                    </Button>
                  )}
                </div>

                {/* 筛选分组：数据来源 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="size-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">数据来源</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleSource(o.value)}
                        className={sources.includes(o.value) ? 'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border bg-primary/20 text-primary border-primary/40' : 'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border bg-white/5 text-foreground/90 border-white/10 hover:bg-white/[0.08] hover:border-white/20'}
                        aria-pressed={sources.includes(o.value)}
                        aria-label={`筛选来源 ${o.label}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 筛选分组：关键词与时间 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">关联关键词</label>
                    {keywords.length > 0 ? (
                      <select
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                        aria-label="按监控关键词筛选"
                      >
                        <option value="">全部</option>
                        {keywords.map((k) => (
                          <option key={k.id} value={k.keyword}>{k.keyword}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="输入关键词"
                        className="w-full h-10 bg-white/5 border-white/10 text-foreground text-base"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">时间范围</label>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                      aria-label="时间范围"
                    >
                      {TIME_RANGE_OPTIONS.map((o) => (
                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {timeRange === 'custom' && (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-sm font-medium text-foreground mb-2">日期范围</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <DatePicker
                            value={dateFrom}
                            onChange={(v) => {
                              setDateFrom(v);
                              if (dateTo && v && dateTo < v) setDateTo(v);
                            }}
                            placeholder="开始日期"
                            maxDate={new Date().toISOString().slice(0, 10)}
                          />
                        </div>
                        <span className="hidden sm:inline text-foreground/70 text-sm shrink-0">至</span>
                        <div className="flex-1 min-w-0">
                          <DatePicker
                            value={dateTo}
                            onChange={setDateTo}
                            placeholder="结束日期"
                            maxDate={new Date().toISOString().slice(0, 10)}
                            minDate={dateFrom || undefined}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 筛选分组：质量筛选 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">重要程度</label>
                    <div className="flex flex-wrap gap-2">
                      {IMPORTANCE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => toggleImportance(o.value)}
                          className={importance.includes(o.value) ? 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border bg-primary/20 text-primary border-primary/40' : 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border bg-white/5 text-foreground/90 border-white/10 hover:bg-white/[0.08]'}
                          aria-pressed={importance.includes(o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">真实性</label>
                    <select
                      value={authenticity}
                      onChange={(e) => setAuthenticity(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                      aria-label="真实性"
                    >
                      {AUTHENTICITY_OPTIONS.map((o) => (
                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">相关性</label>
                    <select
                      value={relevanceRange}
                      onChange={(e) => setRelevanceRange(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                      aria-label="相关性分数区间"
                    >
                      {RELEVANCE_RANGE_OPTIONS.map((o) => (
                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            {items.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] py-16 text-center" style={emptyStateStyle}>
                <p className="text-muted-foreground text-sm">暂无热点</p>
              </div>
            ) : (
              <HoverEffect items={items} onDeleteItem={handleDeleteItem} />
            )}

            {data.total > data.limit && (
              <div className="flex justify-center items-center gap-3 pt-4">
                <Button variant="outline" onClick={() => load(data.page - 1, undefined)} disabled={data.page <= 1} aria-label="上一页" className="border-white/10 hover:bg-white/5">上一页</Button>
                <span className="text-muted-foreground text-sm">{data.page} / {Math.ceil(data.total / data.limit)}</span>
                <Button variant="outline" onClick={() => load(data.page + 1, undefined)} disabled={data.page >= Math.ceil(data.total / data.limit)} aria-label="下一页" className="border-white/10 hover:bg-white/5">下一页</Button>
              </div>
            )}
          </div>
        </div>
      </AuroraBackground>
    </PageMotion>
  );
}