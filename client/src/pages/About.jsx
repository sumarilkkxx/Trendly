import { BentoCard } from '../components/ui/BentoCard';
import { PageMotion } from '../components/ui/PageMotion';

export default function About() {
  return (
    <PageMotion className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
          关于 Trendly
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          让 AI 领域前沿资讯触手可及
        </p>
      </div>

      <BentoCard>
        <p className="text-slate-300 text-sm leading-relaxed">
          <strong className="text-cyber-accent">Trendly</strong> 从 Hugging Face、Reddit、Twitter、自定义 RSS
          等源拉取 AI 热点，经 OpenRouter 大模型过滤后，第一时间送达你。
        </p>
        <div className="mt-4">
          <h3 className="text-cyber-accent font-medium text-sm mb-2">环境变量</h3>
          <ul className="text-slate-500 text-xs space-y-1">
            <li>OPENROUTER_API_KEY（必填）</li>
            <li>SMTP_* / NOTIFY_EMAIL（邮件）</li>
            <li>REDDIT_*、TWITTERAPI_IO_API_KEY（可选）</li>
          </ul>
        </div>
        <p className="mt-3 text-slate-500 text-xs">
          Twitter 无 API 时，可用 twitrss.com 转为 RSS 后添加。
        </p>
      </BentoCard>
    </PageMotion>
  );
}
