import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageMotion } from '@/components/ui/PageMotion';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Info, Terminal, Globe, Cpu } from 'lucide-react';

export default function About() {
  return (
    <PageMotion className="space-y-6 max-w-2xl">
      <AuroraBackground>
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-primary/60" />
            <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary/60">
              About
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            关于 Trendly
          </h1>
          <p className="text-sm text-muted-foreground">
            让 AI 领域前沿资讯触手可及
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                Trendly
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">Trendly</strong> 从 Hugging Face、Reddit、Twitter、Hacker News、
                Google News、DuckDuckGo、TechCrunch/The Verge 等开发者新闻、自定义 RSS 拉取 AI 热点，
                经 OpenRouter 大模型过滤后，第一时间送达你。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="size-4 text-primary" />
                环境变量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  { name: 'OPENROUTER_API_KEY', desc: '必填 — 大模型过滤', required: true },
                  { name: 'SMTP_* / NOTIFY_EMAIL', desc: '邮件推送', required: false },
                  { name: 'REDDIT_*', desc: 'Reddit 数据源', required: false },
                  { name: 'TWITTERAPI_IO_API_KEY', desc: 'Twitter 数据源', required: false },
                ].map((item) => (
                  <li key={item.name} className="flex items-start gap-3 py-1.5">
                    <code className="shrink-0 text-xs bg-white/[0.04] border border-white/[0.08] rounded px-2 py-0.5 text-primary/90 font-mono">
                      {item.name}
                    </code>
                    <span className="text-xs text-muted-foreground leading-5">
                      {item.required && <span className="text-primary mr-1">*</span>}
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                提示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Twitter 无 API 时，可用 twitrss.com 转为 RSS 后添加到消息源。
              </p>
            </CardContent>
          </Card>
        </div>
      </AuroraBackground>
    </PageMotion>
  );
}
