import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageMotion } from '@/components/ui/PageMotion';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Info } from 'lucide-react';

export default function About() {
  return (
    <PageMotion className="space-y-6 max-w-2xl">
      <AuroraBackground>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            关于 Trendly
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            让 AI 领域前沿资讯触手可及
          </p>
        </div>

        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="size-4 text-primary" />
              Trendly
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">Trendly</strong> 从 Hugging Face、Reddit、Twitter、自定义 RSS
              等源拉取 AI 热点，经 OpenRouter 大模型过滤后，第一时间送达你。
            </p>
            <div>
              <h3 className="text-sm font-medium mb-2 text-foreground">环境变量</h3>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li>OPENROUTER_API_KEY（必填）</li>
                <li>SMTP_* / NOTIFY_EMAIL（邮件）</li>
                <li>REDDIT_*、TWITTERAPI_IO_API_KEY（可选）</li>
              </ul>
            </div>
            <p className="text-muted-foreground text-xs">
              Twitter 无 API 时，可用 twitrss.com 转为 RSS 后添加。
            </p>
          </CardContent>
        </Card>
      </AuroraBackground>
    </PageMotion>
  );
}
