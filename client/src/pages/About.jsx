export default function About() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-cyber-accent">关于</h1>

      <div className="hud-card p-5 space-y-4 text-sm">
        <p>
          <strong>Trendly</strong> 自动从 Hugging Face、Reddit、Twitter、自定义 RSS
          等源拉取 AI 热点，经 OpenRouter 大模型过滤后通知您。
        </p>
        <div>
          <h3 className="text-cyber-accent font-medium mb-2">环境变量</h3>
          <ul className="list-disc list-inside text-cyber-muted space-y-1">
            <li>OPENROUTER_API_KEY（必填）</li>
            <li>SMTP_* / NOTIFY_EMAIL（邮件通知）</li>
            <li>REDDIT_*（可选，Reddit 源）</li>
            <li>TWITTERAPI_IO_API_KEY（可选，Twitter 源）</li>
          </ul>
        </div>
        <div>
          <h3 className="text-cyber-accent font-medium mb-2">Twitter 备选</h3>
          <p className="text-cyber-muted">
            无 API Key 时，可用 twitrss.com 将 Twitter 搜索转为 RSS 后，在消息源中添加。
          </p>
        </div>
      </div>
    </div>
  );
}
