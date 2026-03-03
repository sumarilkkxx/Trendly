import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Sources() {
  const [list, setList] = useState([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const load = async () => {
    try {
      const data = await api.sources.list();
      setList(data);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!url.trim()) return;
    try {
      await api.sources.add(url.trim(), name.trim());
      setUrl('');
      setName('');
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.sources.remove(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-cyber-accent">消息源配置</h1>

      <div className="hud-card p-5 space-y-3">
        <p className="text-cyber-muted text-sm">
          内置：Hugging Face 博客。可添加自定义 RSS（如 Planet AI、twitrss.com 转 Twitter）
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="RSS URL"
            className="flex-1 min-w-[200px] px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称（可选）"
            className="w-32 px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
          />
          <button
            onClick={add}
            className="px-4 py-2 rounded bg-cyber-accent/20 text-cyber-accent hover:bg-cyber-accent/30 transition"
          >
            添加
          </button>
        </div>
      </div>

      <div className="hud-card p-5">
        <h2 className="font-display text-lg text-cyber-accent mb-4">自定义 RSS 源</h2>
        {list.length === 0 ? (
          <p className="text-cyber-muted text-sm">暂无自定义源</p>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between py-2 px-3 rounded bg-cyber-bg/30"
              >
                <div>
                  <span className="text-slate-200">{s.name || s.url}</span>
                  <span className="text-cyber-muted text-xs ml-2 truncate max-w-[300px]">
                    {s.url}
                  </span>
                </div>
                <button
                  onClick={() => remove(s.id)}
                  className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/20"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
