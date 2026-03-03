import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageMotion } from '../components/ui/PageMotion';
import { api } from '../api';
import { BentoCard } from '../components/ui/BentoCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <PageMotion className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
          消息源
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          内置 Hugging Face · 可添加 Planet AI、twitrss 等 RSS
        </p>
      </div>

      <BentoCard>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="RSS URL"
            className="flex-1 min-w-[200px]"
            aria-label="RSS 地址"
          />
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称（可选）"
            className="w-32"
            aria-label="源名称（可选）"
          />
          <Button onClick={add}>添加</Button>
        </div>
      </BentoCard>

      <BentoCard>
        <h2 className="font-display text-cyber-accent font-medium mb-4">自定义 RSS</h2>
        {list.length === 0 ? (
          <p className="text-slate-500 text-sm">暂无</p>
        ) : (
          <ul className="space-y-2">
            {list.map((s, i) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/20 hover:bg-black/30 transition"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-slate-200">{s.name || s.url}</span>
                  <span className="text-slate-500 text-xs ml-2 truncate block">{s.url}</span>
                </div>
                <button
                  onClick={() => remove(s.id)}
                  className="text-red-400/80 hover:text-red-400 text-sm ml-2 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400/50 rounded px-2 py-1.5"
                  aria-label="删除此消息源"
                >
                  删除
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </BentoCard>
    </PageMotion>
  );
}
