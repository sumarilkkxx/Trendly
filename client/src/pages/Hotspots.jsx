import { useState, useEffect } from 'react';
import { api } from '../api';

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

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-cyber-accent">热点列表</h1>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索标题/摘要"
          className="flex-1 min-w-[200px] px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
        />
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="按来源筛选，如 huggingface、twitter"
          className="w-48 px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
        />
      </div>

      <div className="space-y-3">
        {data.items?.length === 0 ? (
          <p className="text-cyber-muted text-sm">暂无热点</p>
        ) : (
          data.items?.map((h) => (
            <div key={h.id} className="hud-card p-5">
              <a
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-accent hover:underline font-medium"
              >
                {h.title}
              </a>
              <div className="text-cyber-muted text-sm mt-1">{h.summary}</div>
              <div className="flex gap-3 mt-2 text-xs text-cyber-muted">
                <span>{h.source}</span>
                <span>{h.created_at}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {data.total > data.limit && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => load(data.page - 1)}
            disabled={data.page <= 1}
            className="px-3 py-1 rounded bg-cyber-accent/20 text-cyber-accent disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-cyber-muted">
            {data.page} / {Math.ceil(data.total / data.limit)}
          </span>
          <button
            onClick={() => load(data.page + 1)}
            disabled={data.page >= Math.ceil(data.total / data.limit)}
            className="px-3 py-1 rounded bg-cyber-accent/20 text-cyber-accent disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
