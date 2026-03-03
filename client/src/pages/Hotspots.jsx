import { useState, useEffect } from 'react';
import { PageMotion } from '../components/ui/PageMotion';
import { api } from '../api';
import { HoverEffect } from '../components/ui/HoverEffect';
import { BentoCard } from '../components/ui/BentoCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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

  return (
    <PageMotion className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
          热点列表
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          按来源或关键词筛选，一键直达原文
        </p>
      </div>

      <BentoCard>
        <div className="flex flex-wrap gap-3">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题/摘要"
            className="flex-1 min-w-[180px]"
            aria-label="搜索标题或摘要"
          />
          <Input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="来源筛选"
            className="w-40"
            aria-label="按来源筛选"
          />
        </div>
      </BentoCard>

      {items.length === 0 ? (
        <BentoCard>
          <p className="text-slate-500 text-sm text-center py-8">暂无热点</p>
        </BentoCard>
      ) : (
        <HoverEffect items={items} />
      )}

      {data.total > data.limit && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => load(data.page - 1)}
            disabled={data.page <= 1}
            aria-label="上一页"
          >
            上一页
          </Button>
          <span className="text-slate-500 text-sm">
            {data.page} / {Math.ceil(data.total / data.limit)}
          </span>
          <Button
            variant="secondary"
            onClick={() => load(data.page + 1)}
            disabled={data.page >= Math.ceil(data.total / data.limit)}
            aria-label="下一页"
          >
            下一页
          </Button>
        </div>
      )}
    </PageMotion>
  );
}
