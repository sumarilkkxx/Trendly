import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Trash2, ExternalLink, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, sanitizeText } from '@/lib/utils';

function formatSource(source) {
  if (!source) return '未知';
  if (source === 'twitter') return 'Twitter';
  if (source.startsWith('reddit:')) return source.replace('reddit:', 'Reddit ');
  if (source === 'huggingface') return 'Hugging Face';
  if (source.startsWith('rss:')) return source.replace('rss:', 'RSS ');
  if (source === 'hackernews') return 'Hacker News';
  if (source === 'googlenews') return 'Google News';
  if (source === 'duckduckgo') return 'DuckDuckGo';
  if (source.startsWith('devnews:')) return source.replace('devnews:', '');
  return source;
}

function formatNumber(n) {
  if (n == null || n === 0) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// 热度值（与后端排序公式一致：like*10 + retweet*5 + log10(max(view,1))*2）
function calcHotScore(item) {
  const likes = item.like_count ?? item.likeCount ?? 0;
  const retweets = item.retweet_count ?? item.retweetCount ?? 0;
  const views = item.view_count ?? item.viewCount ?? 0;
  if (likes === 0 && retweets === 0 && views === 0) return null;
  const score = likes * 10 + retweets * 5 + Math.log10(Math.max(views, 1)) * 2;
  return Math.round(score);
}

function HotScoreDisplay({ item }) {
  const score = calcHotScore(item);
  if (score == null || score <= 0) return null;
  const str = score >= 1000 ? `${(score / 1000).toFixed(1)}k` : String(score);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 shrink-0" title="热度综合分（点赞×10 + 转发×5 + 浏览对数×2）">
      <Flame className="size-3" />
      {str}
    </span>
  );
}

// 重要程度标签
function ImportanceBadge({ level }) {
  if (!level) return null;
  const config = {
    urgent: { label: '紧急', className: 'border-rose-500/50 text-rose-400 bg-rose-500/10' },
    high: { label: '高', className: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
    medium: { label: '中', className: 'border-primary/40 text-primary/90 bg-primary/10' },
    low: { label: '低', className: 'border-white/20 text-muted-foreground bg-white/5' },
  };
  const { label, className } = config[level] || { label: level, className: 'border-white/20 text-muted-foreground bg-white/5' };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0', className)} title={`重要程度：${label}`}>
      {label}
    </span>
  );
}

// 相关性：0-100 显示百分比，1-5 显示星级
function RelevanceDisplay({ score }) {
  if (score == null) return null;
  const num = Number(score);
  if (num >= 0 && num <= 100) {
    const pct = Math.round(num);
    return (
      <span className="text-primary/90 text-xs tabular-nums" title={`相关性 ${pct}%`}>
        {pct}%
      </span>
    );
  }
  const n = Math.min(5, Math.max(1, Math.round(num)));
  return (
    <span className="text-primary/90 text-xs" title={`相关性 ${n}/5`}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

// 标题与摘要去重：若摘要与标题高度相似则只显示标题
function getDisplaySummary(title, summary) {
  if (!summary?.trim()) return null;
  const t = (title || '').trim().toLowerCase();
  const s = summary.trim().toLowerCase();
  if (s.startsWith(t) || t.startsWith(s) || s.length < 20) return null;
  return summary.trim();
}

export function HoverEffect({ items, className, onDeleteItem }) {
  const reduce = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5', className)}>
      {items.map((item, i) => {
        const likes = item.like_count ?? item.likeCount;
        const retweets = item.retweet_count ?? item.retweetCount;
        const views = item.view_count ?? item.viewCount;
        const hasPopularity = (likes ?? 0) > 0 || (retweets ?? 0) > 0 || (views ?? 0) > 0;
        const isTwitter = (item.source || '').toLowerCase().includes('twitter');
        const isReddit = (item.source || '').toLowerCase().includes('reddit');

        let popularityText = null;
        if (isTwitter && hasPopularity) {
          const parts = [];
          if (likes) parts.push(`点赞 ${formatNumber(likes)}`);
          if (retweets) parts.push(`转发 ${formatNumber(retweets)}`);
          if (views) parts.push(`浏览 ${formatNumber(views)}`);
          popularityText = parts.join(' · ');
        } else if (isReddit && (likes || retweets)) {
          const parts = [];
          if (likes) parts.push(`↑ ${formatNumber(likes)}`);
          if (retweets) parts.push(`评 ${formatNumber(retweets)}`);
          popularityText = parts.join(' · ');
        }

        const keywords = (item.matched_keywords || '')
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);

        const isHovered = hoveredIndex === i;

        return (
          <motion.div
            key={item.id ?? i}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { delay: i * 0.05, duration: 0.3 }}
            className="relative"
          >
            <a
              href={item.link || item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={cn(
                  'group relative overflow-hidden rounded-xl border h-full flex flex-col min-h-0',
                  'transition-all duration-300 cursor-pointer',
                  'border-white/10 bg-white/[0.02]',
                  isHovered && 'border-primary/40 shadow-[0_0_24px_rgba(0,212,170,0.12)] bg-white/[0.04]'
                )}
              >
                {/* Spotlight effect on hover */}
                {isHovered && (
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 212, 170, 0.15), transparent 40%)`,
                    }}
                  />
                )}
                <div className="relative flex flex-col flex-1 p-5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug text-foreground flex-1 min-w-0 text-[15px]">
                      {sanitizeText(item.title)}
                    </h3>
                    {onDeleteItem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteItem(item);
                        }}
                        aria-label="删除该热点"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  {(() => {
                    const summary = getDisplaySummary(item.title, item.description);
                    const cleanSummary = summary ? sanitizeText(summary) : '';
                    return cleanSummary ? (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap break-words">
                        {cleanSummary}
                      </p>
                    ) : null;
                  })()}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                    {/* 第一行：左=来源+关键词，右=重要程度+热度 */}
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0">
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0.5 border-white/20 bg-white/5 font-normal text-foreground shrink-0">
                          {formatSource(item.source)}
                        </Badge>
                        {item.authenticity === 'suspected_false' && (
                          <span className="text-[10px] px-1 py-0.5 rounded border border-amber-500/40 text-amber-400 shrink-0">待核实</span>
                        )}
                        {keywords.slice(0, 3).map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="text-[11px] px-1.5 py-0.5 border-white/10 bg-white/5 font-normal shrink-0"
                          >
                            {sanitizeText(kw)}
                          </Badge>
                        ))}
                        {keywords.length > 3 && (
                          <span className="text-muted-foreground shrink-0">+{keywords.length - 3}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 shrink-0">
                        <ImportanceBadge level={item.importance} />
                        <HotScoreDisplay item={item} />
                      </div>
                    </div>
                    {/* 第二行：互动数据（左，超出省略）+ 相关性（右，固定） */}
                    {(popularityText || (item.relevance_score ?? item.relevance) != null) && (
                      <div className="flex items-center justify-between gap-3 text-xs min-w-0 min-h-[1.25rem]">
                        {popularityText ? (
                          <span className="text-muted-foreground truncate min-w-0" title={popularityText}>
                            {popularityText}
                          </span>
                        ) : (
                          <span />
                        )}
                        <RelevanceDisplay score={item.relevance_score ?? item.relevance} />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ExternalLink className="size-4 text-primary" />
                  </div>
                </div>
              </div>
            </a>
          </motion.div>
        );
      })}
      {/* 占位符：xl 下 3 列时填满最后一排，保持网格整齐 */}
      {items.length > 0 &&
        Array.from({ length: (3 - (items.length % 3)) % 3 }).map((_, i) => (
          <div key={`grid-placeholder-${i}`} aria-hidden="true" className="min-w-0 hidden xl:block" />
        ))}
    </div>
  );
}
