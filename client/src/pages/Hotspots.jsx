import { useState, useEffect, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { PageMotion } from '@/components/ui/PageMotion';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HoverEffect } from '@/components/ui/HoverEffect';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Search, Filter, Trash2, ArrowUpDown, ChevronDown, Check, Radio, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SORT_OPTIONS,
  SOURCE_OPTIONS,
  TIME_RANGE_OPTIONS,
  AUTHENTICITY_OPTIONS,
  IMPORTANCE_OPTIONS,
  RELEVANCE_RANGE_OPTIONS,
} from '@/constants/hotspots';

export default function Hotspots() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('latest_discovery');
  const [sources, setSources] = useState([]);
  const [timeRange, setTimeRange] = useState('');
  const [authenticity, setAuthenticity] = useState('');
  const [importance, setImportance] = useState('');
  const [relevanceRange, setRelevanceRange] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [allReasonsExpanded, setAllReasonsExpanded] = useState(false);

  useEffect(() => {
    api.keywords
      .list()
      .then((data) => setKeywords(Array.isArray(data) ? data : []))
      .catch(() => setKeywords([]));
  }, []);

  const load = useCallback(async (page = 1, signal) => {
    try {
      const params = { page, limit: 21, sort };
      if (search.trim()) params.search = search.trim();
      if (keyword.trim()) params.keyword = keyword.trim();
      if (sources.length) params.sources = sources.join(',');
      if (timeRange) params.timeRange = timeRange;
      if (authenticity) params.authenticity = authenticity;
      if (importance) params.importance = importance;
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
  }, [sort, sources, timeRange, search, keyword, authenticity, importance, relevanceRange]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(1, ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const toggleSource = (v) => {
    setSources((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));
  };

  const items = (data.items ?? []).map((h) => ({
    ...h,
    link: h.url,
    description: h.summary,
    aiDescription: h.ai_description,
    aiReason: h.ai_reason,
    aiTags: h.ai_tags,
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

  return (
    <PageMotion className="space-y-6">
      <AuroraBackground>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-primary/60" />
              <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary/60">
                Signal Feed
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              热点列表
            </h1>
            <p className="text-sm text-muted-foreground">
              按来源、关键词、时间筛选，支持多种排序
            </p>
          </div>

          {/* Filter Panel — 高对比度配色 (UI/UX Pro Max) */}
          <Card className="border-0 shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <div className="hotspot-filter-panel p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Filter className="size-4 text-primary shrink-0" aria-hidden />
                  <span className="hotspot-section-title">排序与筛选</span>
                </div>
                {/* Search + Actions */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/70 pointer-events-none" aria-hidden />
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜索标题/摘要"
                      className="hotspot-search h-11 text-[15px] min-h-[44px]"
                      aria-label="搜索标题或摘要"
                    />
                  </div>
                  {data.total > 0 && (
                    <Button
                      variant="destructive"
                      className="min-h-[44px] px-5 py-2.5 whitespace-nowrap shrink-0"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="size-4" />
                      删除全部
                    </Button>
                  )}
                </div>

                {/* Sort + Source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="hotspot-filter-label flex items-center gap-2 mb-2">
                      <ArrowUpDown className="size-3.5 text-primary shrink-0" aria-hidden />
                      排序
                    </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="hotspot-form-control w-full"
                    aria-label="排序方式"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="hotspot-filter-label flex items-center gap-2 mb-2">
                    <Filter className="size-3.5 text-primary shrink-0" aria-hidden />
                    数据来源
                  </label>
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        type="button"
                        className="hotspot-select-trigger text-[15px]"
                        aria-label="选择数据来源"
                      >
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-left',
                            sources.length ? '' : 'text-muted-foreground'
                          )}
                          title={sources.length && sources.length < SOURCE_OPTIONS.length
                            ? SOURCE_OPTIONS.filter((o) => sources.includes(o.value)).map((o) => o.label).join('、')
                            : undefined
                          }
                        >
                          {sources.length === 0
                            ? '全部来源'
                            : sources.length === SOURCE_OPTIONS.length
                              ? '全部'
                              : SOURCE_OPTIONS.filter((o) => sources.includes(o.value)).map((o) => o.label).join('、')}
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-primary/40 transition-transform duration-200" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        align="start"
                        sideOffset={6}
                        className="z-50 w-[var(--radix-popover-trigger-width)] max-h-[280px] overflow-y-auto hotspot-popover-content outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                      >
                        {SOURCE_OPTIONS.map((o) => {
                          const checked = sources.includes(o.value);
                          return (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => toggleSource(o.value)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150 min-h-[40px] cursor-pointer',
                                checked ? 'bg-primary/15 text-primary' : 'text-foreground/90 hover:bg-white/[0.06]'
                              )}
                            >
                              <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border transition-colors duration-150', checked ? 'border-primary bg-primary' : 'border-white/25')}>
                                {checked && <Check className="size-2.5 text-white" strokeWidth={3} />}
                              </span>
                              {o.label}
                            </button>
                          );
                        })}
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </div>
              </div>

              {/* Keyword + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="hotspot-filter-label block mb-2">关联关键词</label>
                  {keywords.length > 0 ? (
                    <select
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="hotspot-form-control w-full"
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
                      className="hotspot-form-control w-full h-11 min-h-[44px] rounded-xl"
                    />
                  )}
                </div>
                <div>
                  <label className="hotspot-filter-label block mb-2">时间范围</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="hotspot-form-control w-full"
                    aria-label="时间范围"
                  >
                    {TIME_RANGE_OPTIONS.map((o) => (
                      <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quality Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 border-t border-[hsl(215_25%_22%)]">
                <div>
                  <label className="hotspot-filter-label block mb-2">真实性</label>
                  <select
                    value={authenticity}
                    onChange={(e) => setAuthenticity(e.target.value)}
                    className="hotspot-form-control w-full"
                    aria-label="真实性"
                  >
                    {AUTHENTICITY_OPTIONS.map((o) => (
                      <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="hotspot-filter-label block mb-2">重要程度</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value)}
                    className="hotspot-form-control w-full"
                    aria-label="重要程度"
                  >
                    {IMPORTANCE_OPTIONS.map((o) => (
                      <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="hotspot-filter-label block mb-2">相关性</label>
                  <select
                    value={relevanceRange}
                    onChange={(e) => setRelevanceRange(e.target.value)}
                    className="hotspot-form-control w-full"
                    aria-label="相关性分数区间"
                  >
                    {RELEVANCE_RANGE_OPTIONS.map((o) => (
                      <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div>
            {items.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground tabular-nums">
                  共 <span className="text-foreground font-medium">{data.total}</span> 条热点
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => setAllReasonsExpanded((v) => !v)}
                >
                  <ChevronsUpDown className="size-3.5" />
                  {allReasonsExpanded ? '收起所有分析' : '展开所有分析'}
                </Button>
              </div>
            )}
            {items.length === 0 ? (
              <div className="tech-grid rounded-2xl border border-white/[0.06] py-20 text-center">
                <Radio className="mx-auto mb-3 size-6 text-primary/20" />
                <p className="text-muted-foreground text-sm">暂无热点</p>
              </div>
            ) : (
              <HoverEffect items={items} onDeleteItem={handleDeleteItem} allReasonsExpanded={allReasonsExpanded} />
            )}

            {data.total > data.limit && (
              <div className="flex justify-center items-center gap-3 pt-6">
                <Button variant="outline" onClick={() => load(data.page - 1, undefined)} disabled={data.page <= 1} aria-label="上一页">
                  上一页
                </Button>
                <span className="font-display text-xs tracking-wider text-muted-foreground tabular-nums">
                  {data.page} / {Math.ceil(data.total / data.limit)}
                </span>
                <Button variant="outline" onClick={() => load(data.page + 1, undefined)} disabled={data.page >= Math.ceil(data.total / data.limit)} aria-label="下一页">
                  下一页
                </Button>
              </div>
            )}
          </div>
        </div>
      </AuroraBackground>
    </PageMotion>
  );
}
