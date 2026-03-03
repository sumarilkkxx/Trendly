import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageMotion } from '../components/ui/PageMotion';
import { api } from '../api';
import { BentoCard } from '../components/ui/BentoCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <PageMotion className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
          关键词管理
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          添加后系统将自动匹配各消息源
        </p>
      </div>

      <BentoCard>
        <label htmlFor="kw-input" className="block text-slate-400 text-sm mb-4">
          添加监控关键词
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            id="kw-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="如 GPT-5、Vibe Coding、Claude"
            className="flex-1"
            aria-label="关键词输入"
          />
          <Button onClick={add}>添加</Button>
        </div>
      </BentoCard>

      <BentoCard>
        <h2 className="font-display text-cyber-accent font-medium mb-4">已有关键词</h2>
        {list.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {list.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 border border-white/5"
              >
                <span className={k.enabled ? 'text-slate-200' : 'text-slate-500 line-through'}>
                  {k.keyword}
                </span>
                <button
                  onClick={() => toggle(k.id, k.enabled)}
                  className="text-xs text-cyber-accent hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyber-accent/50 rounded px-1"
                  aria-label={k.enabled ? '禁用' : '启用'}
                >
                  {k.enabled ? '禁用' : '启用'}
                </button>
                <button
                  onClick={() => remove(k.id)}
                  className="text-xs text-red-400/80 hover:text-red-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400/50 rounded px-1"
                  aria-label="删除"
                >
                  删除
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </BentoCard>
    </PageMotion>
  );
}
