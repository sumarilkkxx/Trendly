import { useState, useEffect } from 'react';
import { PageMotion } from '@/components/ui/PageMotion';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HoverEffect } from '@/components/ui/HoverEffect';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Search, Filter, Trash2 } from 'lucide-react';

export default function Hotspots() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');

  const load = async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (source) params.source = source;
      if (search.trim()) params.search = search.trim();
      const res = await api.hotspots.list(params);
      setData(res);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    load(1);
  }, [source, search]);

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

  return (
    <PageMotion className="space-y-6">
      <AuroraBackground>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            热点列表
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            按来源或关键词筛选，一键直达原文
          </p>
        </div>

        <Card className="border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 flex-1">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索标题/摘要"
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    aria-label="搜索标题或摘要"
                  />
                </div>
                <div className="relative w-40">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="来源筛选"
                    className="pl-9 bg-white/5 border-white/10"
                    aria-label="按来源筛选"
                  />
                </div>
              </div>
              {data.total > 0 && (
                <Button
                  variant="destructive"
                  className="whitespace-nowrap"
                  onClick={handleClearAll}
                >
                  <Trash2 className="size-4" />
                  一键删除全部热点
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 bg-white/[0.02] py-16 text-center"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 212, 170, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          >
            <p className="text-muted-foreground text-sm">暂无热点</p>
          </div>
        ) : (
          <HoverEffect items={items} onDeleteItem={handleDeleteItem} />
        )}

        {data.total > data.limit && (
          <div className="flex justify-center items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => load(data.page - 1)}
              disabled={data.page <= 1}
              aria-label="上一页"
              className="border-white/10 hover:bg-white/5"
            >
              上一页
            </Button>
            <span className="text-muted-foreground text-sm">
              {data.page} / {Math.ceil(data.total / data.limit)}
            </span>
            <Button
              variant="outline"
              onClick={() => load(data.page + 1)}
              disabled={data.page >= Math.ceil(data.total / data.limit)}
              aria-label="下一页"
              className="border-white/10 hover:bg-white/5"
            >
              下一页
            </Button>
          </div>
        )}
      </AuroraBackground>
    </PageMotion>
  );
}
