import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Keywords() {
  const [list, setList] = useState([]);
  const [input, setInput] = useState('');

  const load = async () => {
    try {
      const data = await api.keywords.list();
      setList(data);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const kw = input.trim();
    if (!kw) return;
    try {
      await api.keywords.add(kw);
      setInput('');
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.keywords.remove(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggle = async (id, enabled) => {
    try {
      await api.keywords.toggle(id, !enabled);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-cyber-accent">关键词管理</h1>

      <div className="hud-card p-5">
        <p className="text-cyber-muted text-sm mb-3">
          添加关键词后，系统会从各消息源拉取内容并过滤匹配
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="例如：GPT-5、Vibe Coding"
            className="flex-1 px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
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
        <h2 className="font-display text-lg text-cyber-accent mb-4">已有关键词</h2>
        {list.length === 0 ? (
          <p className="text-cyber-muted text-sm">暂无关键词</p>
        ) : (
          <ul className="space-y-2">
            {list.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between py-2 px-3 rounded bg-cyber-bg/30"
              >
                <span className={k.enabled ? 'text-slate-200' : 'text-cyber-muted line-through'}>
                  {k.keyword}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggle(k.id, k.enabled)}
                    className="text-xs px-2 py-1 rounded text-cyber-accent hover:bg-cyber-accent/20"
                  >
                    {k.enabled ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => remove(k.id)}
                    className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/20"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
