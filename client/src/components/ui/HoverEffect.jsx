import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const IMPORTANCE_LABELS = { urgent: '紧急', high: '高', medium: '中', low: '低' };
function ImportanceBadge({ level }) {
  if (!level || !IMPORTANCE_LABELS[level]) return null;
  const urgent = level === 'urgent' ? 'border-amber-500/50 text-amber-400' : '';
  const high = level === 'high' ? 'border-primary/50 text-primary' : '';
  return (
    <span className={cn('text-[10px] px-1 py-0.5 rounded border shrink-0', urgent || high || 'border-white/20 text-muted-foreground')}>
      {IMPORTANCE_LABELS[level]}
    </span>
  );
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
                  'group relative overflow-hidden rounded-xl border h-full flex flex-col',
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
                <div className="relative flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug line-clamp-2 text-foreground flex-1 min-w-0 text-[15px]">
                      {item.title}
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
                    return summary ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {summary}
                      </p>
                    ) : null;
                  })()}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                    <Badge variant="outline" className="text-[11px] px-1.5 py-0.5 border-white/20 bg-white/5 font-normal text-foreground shrink-0">
                      {formatSource(item.source)}
                    </Badge>
                    <ImportanceBadge level={item.importance} />
                    {item.authenticity === 'suspected_false' && (
                      <span className="text-[10px] px-1 py-0.5 rounded border border-amber-500/40 text-amber-400 shrink-0">待核实</span>
                    )}
                    {keywords.slice(0, 2).map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="text-[11px] px-1.5 py-0.5 border-white/10 bg-white/5 font-normal shrink-0"
                      >
                        {kw}
                      </Badge>
                    ))}
                    {keywords.length > 2 && (
                      <span className="text-muted-foreground shrink-0">+{keywords.length - 2}</span>
                    )}
                    {(popularityText || (item.relevance_score ?? item.relevance) != null) && (
                      <span className="ml-auto inline-flex items-center gap-2 shrink-0">
                        {popularityText && (
                          <span className="text-muted-foreground truncate max-w-[100px]" title={popularityText}>
                            {popularityText}
                          </span>
                        )}
                        <RelevanceDisplay score={item.relevance_score ?? item.relevance} />
                      </span>
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
    </div>
  );
}
