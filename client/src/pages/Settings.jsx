import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sliders, KeyRound, Rss, Plus, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

const TWITTER_MODES = [
  { id: 'loose', label: '宽松模式', hint: '点赞>=5，转发>=2，浏览>=200，粉丝>=50', desc: '保留更多内容' },
  { id: 'standard', label: '标准模式', hint: '点赞>=10，转发>=5，浏览>=500，粉丝>=100，排除回复', desc: '推荐' },
  { id: 'strict', label: '严格模式', hint: '点赞>=50，转发>=20，浏览>=2000，粉丝>=100，排除回复', desc: '只保留热门' },
  { id: 'custom', label: '自定义', hint: '指定具体阈值', desc: '' },
];

export default function SettingsPage() {
  const [s, setS] = useState({
    scan_interval_hours: 24,
    notify_interval_hours: 24,
    notify_enabled: 'true',
    twitter_filter_mode: 'standard',
    twitter_min_likes: 10,
    twitter_min_retweets: 5,
    twitter_min_views: 500,
    twitter_min_followers: 100,
    twitter_exclude_replies: 'true',
  });
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput] = useState('');
  const [sources, setSources] = useState([]);
  const [rssUrl, setRssUrl] = useState('');
  const [rssName, setRssName] = useState('');
  const [channels, setChannels] = useState([]);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('wecom');
  const [channelInterval, setChannelInterval] = useState(24);
  const [channelWebhook, setChannelWebhook] = useState('');

  const loadKeywords = async () => {
    try { setKeywords(await api.keywords.list()); } catch (e) { alert(e.message); }
  };
  const loadSources = async () => {
    try { setSources(await api.sources.list()); } catch (e) { alert(e.message); }
  };
  const loadChannels = async () => {
    try { setChannels(await api.notificationChannels.list()); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    api.settings.get().then((data) => {
      const { theme, ...rest } = data;
      setS((prev) => ({ ...prev, ...rest }));
    }).catch(console.error);
  }, []);

  useEffect(() => { loadKeywords(); loadSources(); loadChannels(); }, []);

  const saveSettings = async () => {
    try { await api.settings.update(s); alert('已保存'); } catch (e) { alert(e.message); }
  };

  const addKeyword = async () => {
    const kw = kwInput.trim();
    if (!kw) return;
    try { await api.keywords.add(kw); setKwInput(''); loadKeywords(); } catch (e) { alert(e.message); }
  };
  const removeKeyword = async (id) => {
    try { await api.keywords.remove(id); loadKeywords(); } catch (e) { alert(e.message); }
  };
  const toggleKeyword = async (id, enabled) => {
    try { await api.keywords.toggle(id, !enabled); loadKeywords(); } catch (e) { alert(e.message); }
  };
  const addSource = async () => {
    if (!rssUrl.trim()) return;
    try { await api.sources.add(rssUrl.trim(), rssName.trim()); setRssUrl(''); setRssName(''); loadSources(); } catch (e) { alert(e.message); }
  };
  const removeSource = async (id) => {
    try { await api.sources.remove(id); loadSources(); } catch (e) { alert(e.message); }
  };

  const addChannel = async () => {
    const name = channelName.trim();
    if (!name) return;
    const payload = {
      name,
      type: channelType,
      enabled: true,
      interval_hours: channelInterval || 24,
    };
    if (['wecom', 'feishu', 'dingtalk', 'webhook_generic'].includes(channelType)) {
      if (!channelWebhook.trim()) {
        alert('Webhook 地址不能为空');
        return;
      }
      payload.config = { webhook_url: channelWebhook.trim() };
    }
    try {
      await api.notificationChannels.create(payload);
      setChannelName('');
      setChannelWebhook('');
      setChannelInterval(24);
      setChannelType('wecom');
      loadChannels();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleChannel = async (ch) => {
    try {
      await api.notificationChannels.update(ch.id, { enabled: !ch.enabled });
      loadChannels();
    } catch (e) {
      alert(e.message);
    }
  };

  const removeChannel = async (ch) => {
    if (!window.confirm(`确定要删除通道「${ch.name}」吗？`)) return;
    try {
      await api.notificationChannels.remove(ch.id);
      loadChannels();
    } catch (e) {
      alert(e.message);
    }
  };

  const isCustom = s.twitter_filter_mode === 'custom';

  return (
    <PageMotion className="space-y-10">
      <AuroraBackground>
        {/* Header */}
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-2">
            <SettingsIcon className="size-4 text-primary/60" />
            <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary/60">
              Configuration
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            设置
          </h1>
          <p className="text-sm text-muted-foreground">
            通知频率、工作平台通道、Twitter 过滤、关键词与消息源管理
          </p>
        </div>

        <div className="space-y-8 max-w-4xl">
          {/* Keywords */}
          <Card>
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
                  className="flex-1 bg-white/[0.04] border-white/[0.08] min-w-0"
                />
                <Button onClick={addKeyword} className="sm:shrink-0">
                  <Plus className="size-4" />
                  添加
                </Button>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground/60 mb-3">
                  已有关键词 <span className="text-primary font-medium">{keywords.length}</span> 个
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
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-3 pr-1 py-1.5 hover:border-primary/20 transition-all duration-200"
                      >
                        <span className={k.enabled ? 'text-sm text-foreground' : 'text-sm text-muted-foreground line-through'}>
                          {k.keyword}
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => toggleKeyword(k.id, k.enabled)}>
                          {k.enabled ? '禁用' : '启用'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-destructive hover:text-destructive" onClick={() => removeKeyword(k.id)}>
                          删除
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RSS Sources */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="size-4 text-primary shrink-0" />
                消息源
              </CardTitle>
              <CardDescription>内置 Hugging Face、Hacker News、Google News 等 · 可添加自定义 RSS</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3">
                <Input type="url" value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="RSS URL" className="bg-white/[0.04] border-white/[0.08] min-w-0" />
                <Input type="text" value={rssName} onChange={(e) => setRssName(e.target.value)} placeholder="名称（可选）" className="bg-white/[0.04] border-white/[0.08]" />
                <Button onClick={addSource} className="sm:shrink-0">
                  <Plus className="size-4" />
                  添加
                </Button>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground/60 mb-3">
                  自定义 RSS <span className="text-primary font-medium">{sources.length}</span> 个
                </p>
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">暂无 RSS 源</p>
                ) : (
                  <ul className="space-y-2">
                    {sources.map((src, i) => (
                      <motion.li
                        key={src.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{src.name || src.url}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{src.url}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => removeSource(src.id)}>
                          删除
                        </Button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scan & Notify */}
          <Card>
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
                  <label htmlFor="scan-interval" className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground/70 block">
                    检查频率（小时）
                  </label>
                  <Input
                    id="scan-interval"
                    type="number" min={1} max={168}
                    value={s.scan_interval_hours}
                    onChange={(e) =>
                      setS((p) => ({
                        ...p,
                        scan_interval_hours: parseInt(e.target.value, 10) || 24,
                      }))
                    }
                    className="bg-white/[0.04] border-white/[0.08]"
                  />
                  <p className="text-[11px] text-muted-foreground/50">默认 24 小时</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="notify-interval" className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground/70 block">
                    通知频率（小时）
                  </label>
                  <Input
                    id="notify-interval"
                    type="number" min={1} max={24}
                    value={s.notify_interval_hours}
                    onChange={(e) =>
                      setS((p) => ({
                        ...p,
                        notify_interval_hours: parseInt(e.target.value, 10) || 24,
                      }))
                    }
                    className="bg-white/[0.04] border-white/[0.08]"
                  />
                  <p className="text-[11px] text-muted-foreground/50">默认 24 小时汇总</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between max-w-md rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(15,23,42,0.4)]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">邮件汇总推送</p>
                    <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-[1px] text-[11px] text-primary/90">
                      {s.notify_enabled !== 'false' ? '当前：已开启' : '当前：已关闭'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    定期将新的热点整理成一封摘要邮件发送到收件箱
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch
                    checked={s.notify_enabled !== 'false'}
                    onCheckedChange={(checked) =>
                      setS((p) => ({ ...p, notify_enabled: checked ? 'true' : 'false' }))
                    }
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {s.notify_enabled !== 'false' ? '开启' : '关闭'}
                  </span>
                </div>
              </div>
              <Button onClick={saveSettings} className="mt-5">保存</Button>
            </CardContent>
          </Card>

          {/* Notification Channels */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4 text-primary shrink-0" />
                通知通道与工作平台
              </CardTitle>
              <CardDescription>管理企业微信、飞书、钉钉等工作平台通道（Email 收件人请在服务器配置）</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-3">
                <Input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="通道名称，如：企业微信·增长组"
                  className="bg-white/[0.04] border-white/[0.08] min-w-0"
                />
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] rounded-md px-3 py-2 text-sm text-foreground"
                >
                  <option value="wecom">企业微信机器人</option>
                  <option value="feishu">飞书机器人</option>
                  <option value="dingtalk">钉钉机器人</option>
                  <option value="webhook_generic">通用 Webhook</option>
                  <option value="email">邮件通道</option>
                </select>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={channelInterval}
                    onChange={(e) => setChannelInterval(parseInt(e.target.value, 10) || 24)}
                    placeholder="间隔（小时）"
                    className="bg-white/[0.04] border-white/[0.08]"
                  />
                  {channelType !== 'email' && (
                    <Input
                      type="url"
                      value={channelWebhook}
                      onChange={(e) => setChannelWebhook(e.target.value)}
                      placeholder="Webhook URL"
                      className="bg-white/[0.04] border-white/[0.08]"
                    />
                  )}
                </div>
                <Button onClick={addChannel} className="sm:shrink-0">
                  <Plus className="size-4" />
                  添加通道
                </Button>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground/60 mb-3">
                  已配置通道 <span className="text-primary font-medium">{channels.length}</span> 个
                </p>
                {channels.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">暂无通道，建议先为企业微信或飞书群添加一个机器人 Webhook。</p>
                ) : (
                  <ul className="space-y-2">
                    {channels.map((ch) => (
                      <li
                        key={ch.id}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground truncate">{ch.name}</span>
                            <span className="text-[11px] rounded-full bg-white/[0.06] px-2 py-[1px] text-muted-foreground/80">
                              {ch.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            间隔：{ch.interval_hours ?? 24} 小时
                            {ch.last_run_at && ` · 上次发送：${ch.last_run_at}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={!!ch.enabled}
                            onCheckedChange={() => toggleChannel(ch)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeChannel(ch)}
                          >
                            删除
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Twitter Filter */}
          <Card>
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
                      className={`flex flex-col gap-1.5 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        checked
                          ? 'border-primary/50 bg-primary/[0.08] shadow-[0_0_20px_rgba(0,212,170,0.08)]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                      }`}
                    >
                      <input type="radio" name="twitter_filter_mode" value={m.id} checked={checked} onChange={() => setS((p) => ({ ...p, twitter_filter_mode: m.id }))} className="sr-only" />
                      <span className="font-medium text-sm text-foreground">{m.label}</span>
                      {m.desc && <span className="text-primary text-xs">{m.desc}</span>}
                      <span className="text-muted-foreground text-xs">{m.hint}</span>
                    </label>
                  );
                })}
              </div>
              {isCustom && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 pt-5 border-t border-white/[0.06]">
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground/70 mb-3">自定义阈值</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl">
                    {[
                      { label: '点赞>=', key: 'twitter_min_likes' },
                      { label: '转发>=', key: 'twitter_min_retweets' },
                      { label: '浏览>=', key: 'twitter_min_views' },
                      { label: '作者粉丝>=', key: 'twitter_min_followers' },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs text-muted-foreground block">{label}</label>
                        <Input
                          type="number" min={0}
                          value={s[key] ?? 0}
                          onChange={(e) => setS((p) => ({ ...p, [key]: parseInt(e.target.value, 10) || 0 }))}
                          className="bg-white/[0.04] border-white/[0.08]"
                        />
                      </div>
                    ))}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.twitter_exclude_replies !== 'false'}
                          onChange={(e) => setS((p) => ({ ...p, twitter_exclude_replies: e.target.checked ? 'true' : 'false' }))}
                          className="rounded border-white/20 bg-white/[0.04] accent-[hsl(174,100%,42%)]"
                        />
                        <span className="text-sm text-foreground">排除回复推文（仅保留原创）</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
              <Button onClick={saveSettings} className="mt-5">保存</Button>
            </CardContent>
          </Card>
        </div>
      </AuroraBackground>
    </PageMotion>
  );
}
