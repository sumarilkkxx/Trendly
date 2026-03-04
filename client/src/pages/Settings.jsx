import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sliders, KeyRound, Rss, Plus } from 'lucide-react';
import { PageMotion } from '@/components/ui/PageMotion';
import { api } from '@/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuroraBackground } from '@/components/ui/AuroraBackground';

const TWITTER_MODES = [
  { id: 'loose', label: '宽松模式', hint: '点赞≥5，转发≥2，浏览≥200', desc: '保留更多内容' },
  { id: 'standard', label: '标准模式', hint: '点赞≥10，转发≥5，浏览≥500', desc: '推荐' },
  { id: 'strict', label: '严格模式', hint: '点赞≥50，转发≥20，浏览≥2000', desc: '只保留热门' },
  { id: 'custom', label: '自定义', hint: '我来指定具体阈值', desc: '' },
];

export default function SettingsPage() {
  const [s, setS] = useState({
    scan_interval_minutes: 30,
    notify_interval_hours: 4,
    twitter_filter_mode: 'strict',
    twitter_min_likes: 50,
    twitter_min_retweets: 20,
    twitter_min_views: 2000,
  });
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput] = useState('');
  const [sources, setSources] = useState([]);
  const [rssUrl, setRssUrl] = useState('');
  const [rssName, setRssName] = useState('');

  const loadKeywords = async () => {
    try {
      const data = await api.keywords.list();
      setKeywords(data);
    } catch (e) {
      alert(e.message);
    }
  };

  const loadSources = async () => {
    try {
      const data = await api.sources.list();
      setSources(data);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    api.settings
      .get()
      .then((data) => {
        const { theme, ...rest } = data;
        setS((prev) => ({ ...prev, ...rest }));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadKeywords();
    loadSources();
  }, []);

  const saveSettings = async () => {
    try {
      await api.settings.update(s);
      alert('已保存');
    } catch (e) {
      alert(e.message);
    }
  };

  const addKeyword = async () => {
    const kw = kwInput.trim();
    if (!kw) return;
    try {
      await api.keywords.add(kw);
      setKwInput('');
      loadKeywords();
    } catch (e) {
      alert(e.message);
    }
  };

  const removeKeyword = async (id) => {
    try {
      await api.keywords.remove(id);
      loadKeywords();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleKeyword = async (id, enabled) => {
    try {
      await api.keywords.toggle(id, !enabled);
      loadKeywords();
    } catch (e) {
      alert(e.message);
    }
  };

  const addSource = async () => {
    if (!rssUrl.trim()) return;
    try {
      await api.sources.add(rssUrl.trim(), rssName.trim());
      setRssUrl('');
      setRssName('');
      loadSources();
    } catch (e) {
      alert(e.message);
    }
  };

  const removeSource = async (id) => {
    try {
      await api.sources.remove(id);
      loadSources();
    } catch (e) {
      alert(e.message);
    }
  };

  const isCustom = s.twitter_filter_mode === 'custom';

  return (
    <PageMotion className="space-y-10">
      <AuroraBackground>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            设置
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            通知频率、Twitter 过滤、关键词与消息源管理
          </p>
        </div>

        <div className="space-y-8 max-w-4xl">
          {/* 1. 关键词管理 */}
          <Card className="border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="size-4 text-primary shrink-0" />
                关键词管理
              </CardTitle>
              <CardDescription>添加后系统将自动匹配各消息源</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="如 GPT-5、Vibe Coding、Claude"
                  className="flex-1 bg-white/5 border-white/10 min-w-0"
                />
                <Button onClick={addKeyword} className="sm:shrink-0">
                  <Plus className="size-4" />
                  添加
                </Button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  已有关键词 <span className="text-foreground font-medium">{keywords.length}</span> 个
                </p>
                {keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">暂无关键词</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((k, i) => (
                      <motion.div
                        key={k.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] pl-3 pr-1 py-1.5 hover:border-primary/20 transition-colors"
                      >
                        <span
                          className={
                            k.enabled
                              ? 'text-sm text-foreground'
                              : 'text-sm text-muted-foreground line-through'
                          }
                        >
                          {k.keyword}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs"
                          onClick={() => toggleKeyword(k.id, k.enabled)}
                        >
                          {k.enabled ? '禁用' : '启用'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs text-destructive hover:text-destructive"
                          onClick={() => removeKeyword(k.id)}
                        >
                          删除
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. 消息源 */}
          <Card className="border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="size-4 text-primary shrink-0" />
                消息源
              </CardTitle>
              <CardDescription>内置 Hugging Face · 可添加 Planet AI、twitrss 等 RSS</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3">
                <Input
                  type="url"
                  value={rssUrl}
                  onChange={(e) => setRssUrl(e.target.value)}
                  placeholder="RSS URL"
                  className="bg-white/5 border-white/10 min-w-0"
                />
                <Input
                  type="text"
                  value={rssName}
                  onChange={(e) => setRssName(e.target.value)}
                  placeholder="名称（可选）"
                  className="bg-white/5 border-white/10"
                />
                <Button onClick={addSource} className="sm:shrink-0">
                  <Plus className="size-4" />
                  添加
                </Button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  自定义 RSS <span className="text-foreground font-medium">{sources.length}</span> 个
                </p>
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">暂无 RSS 源</p>
                ) : (
                  <ul className="space-y-2">
                    {sources.map((s, i) => (
                      <motion.li
                        key={s.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-white/10 bg-white/[0.02] hover:border-primary/20 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">
                            {s.name || s.url}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {s.url}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => removeSource(s.id)}
                        >
                          删除
                        </Button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. 检查与推送频率 */}
          <Card className="border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="size-4 text-primary shrink-0" />
                检查与推送频率
              </CardTitle>
              <CardDescription>设置扫描和邮件汇总间隔</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md">
                <div className="space-y-1.5">
                  <label
                    htmlFor="scan-interval"
                    className="text-sm font-medium text-foreground block"
                  >
                    检查频率（分钟）
                  </label>
                  <Input
                    id="scan-interval"
                    type="number"
                    min={5}
                    max={1440}
                    value={s.scan_interval_minutes}
                    onChange={(e) =>
                      setS((p) => ({
                        ...p,
                        scan_interval_minutes: parseInt(e.target.value, 10) || 30,
                      }))
                    }
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">默认 30 分钟</p>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="notify-interval"
                    className="text-sm font-medium text-foreground block"
                  >
                    通知频率（小时）
                  </label>
                  <Input
                    id="notify-interval"
                    type="number"
                    min={1}
                    max={24}
                    value={s.notify_interval_hours}
                    onChange={(e) =>
                      setS((p) => ({
                        ...p,
                        notify_interval_hours: parseInt(e.target.value, 10) || 4,
                      }))
                    }
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">默认 4 小时汇总</p>
                </div>
              </div>
              <Button onClick={saveSettings} className="mt-4">
                保存
              </Button>
            </CardContent>
          </Card>

          {/* 4. Twitter 信息质量过滤 */}
          <Card className="border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="size-4 text-primary shrink-0" />
                Twitter 信息质量过滤
              </CardTitle>
              <CardDescription>仅保留满足互动阈值的推文</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TWITTER_MODES.map((m) => {
                  const checked = s.twitter_filter_mode === m.id;
                  return (
                    <label
                      key={m.id}
                      className={`
                        flex flex-col gap-1.5 p-4 rounded-lg cursor-pointer transition-all border-2
                        ${
                          checked
                            ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(0,212,170,0.1)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="twitter_filter_mode"
                        value={m.id}
                        checked={checked}
                        onChange={() =>
                          setS((p) => ({ ...p, twitter_filter_mode: m.id }))
                        }
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{m.label}</span>
                      {m.desc && (
                        <span className="text-primary text-xs">{m.desc}</span>
                      )}
                      <span className="text-muted-foreground text-xs">{m.hint}</span>
                    </label>
                  );
                })}
              </div>
              {isCustom && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-5 pt-5 border-t border-white/10"
                >
                  <p className="text-sm font-medium text-foreground mb-3">自定义阈值</p>
                  <div className="grid grid-cols-3 gap-4 max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground block">点赞≥</label>
                      <Input
                        type="number"
                        min={0}
                        value={s.twitter_min_likes}
                        onChange={(e) =>
                          setS((p) => ({
                            ...p,
                            twitter_min_likes: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground block">转发≥</label>
                      <Input
                        type="number"
                        min={0}
                        value={s.twitter_min_retweets}
                        onChange={(e) =>
                          setS((p) => ({
                            ...p,
                            twitter_min_retweets: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground block">浏览≥</label>
                      <Input
                        type="number"
                        min={0}
                        value={s.twitter_min_views}
                        onChange={(e) =>
                          setS((p) => ({
                            ...p,
                            twitter_min_views: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <Button onClick={saveSettings} className="mt-5">
                保存
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuroraBackground>
    </PageMotion>
  );
}
