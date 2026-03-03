import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Settings() {
  const [s, setS] = useState({
    scan_interval_minutes: 30,
    notify_interval_hours: 4,
  });

  useEffect(() => {
    api.settings.get().then(setS).catch(console.error);
  }, []);

  const save = async () => {
    try {
      await api.settings.update(s);
      alert('已保存');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-cyber-accent">通知设置</h1>

      <div className="hud-card p-5 space-y-4 max-w-md">
        <div>
          <label className="block text-cyber-muted text-sm mb-1">检查频率（分钟）</label>
          <input
            type="number"
            min={5}
            max={1440}
            value={s.scan_interval_minutes}
            onChange={(e) =>
              setS((p) => ({ ...p, scan_interval_minutes: parseInt(e.target.value, 10) || 30 }))
            }
            className="w-full px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 focus:outline-none focus:border-cyber-accent"
          />
          <p className="text-xs text-cyber-muted mt-1">默认 30 分钟拉取一次</p>
        </div>
        <div>
          <label className="block text-cyber-muted text-sm mb-1">通知频率（小时）</label>
          <input
            type="number"
            min={1}
            max={24}
            value={s.notify_interval_hours}
            onChange={(e) =>
              setS((p) => ({ ...p, notify_interval_hours: parseInt(e.target.value, 10) || 4 }))
            }
            className="w-full px-3 py-2 rounded bg-cyber-bg/50 border border-cyber-border text-slate-200 focus:outline-none focus:border-cyber-accent"
          />
          <p className="text-xs text-cyber-muted mt-1">默认 4 小时汇总发送邮件</p>
        </div>
        <button
          onClick={save}
          className="px-4 py-2 rounded bg-cyber-accent/20 text-cyber-accent hover:bg-cyber-accent/30 transition"
        >
          保存
        </button>
      </div>
    </div>
  );
}
