import { useState, useEffect } from 'react';
import { PageMotion } from '../components/ui/PageMotion';
import { api } from '../api';
import { BentoCard } from '../components/ui/BentoCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <PageMotion className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
          通知设置
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          检查与推送频率
        </p>
      </div>

      <BentoCard className="max-w-md">
        <div className="space-y-5">
          <div>
            <label htmlFor="scan-interval" className="block text-slate-400 text-sm mb-2">
              检查频率（分钟）
            </label>
            <Input
              id="scan-interval"
              type="number"
              min={5}
              max={1440}
              value={s.scan_interval_minutes}
              onChange={(e) =>
                setS((p) => ({ ...p, scan_interval_minutes: parseInt(e.target.value, 10) || 30 }))
              }
              className="w-full"
              aria-label="检查频率（分钟）"
            />
            <p className="text-xs text-slate-500 mt-1">默认 30 分钟</p>
          </div>
          <div>
            <label htmlFor="notify-interval" className="block text-slate-400 text-sm mb-2">
              通知频率（小时）
            </label>
            <Input
              id="notify-interval"
              type="number"
              min={1}
              max={24}
              value={s.notify_interval_hours}
              onChange={(e) =>
                setS((p) => ({ ...p, notify_interval_hours: parseInt(e.target.value, 10) || 4 }))
              }
              className="w-full"
              aria-label="通知频率（小时）"
            />
            <p className="text-xs text-slate-500 mt-1">默认 4 小时汇总</p>
          </div>
          <Button onClick={save}>保存</Button>
        </div>
      </BentoCard>
    </PageMotion>
  );
}
