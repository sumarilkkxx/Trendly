import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Trash2, ExternalLink, Flame, ChevronRight, Clock, Radar,
  User, Tag, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, sanitizeText, relativeTime, formatAbsoluteTime } from '@/lib/utils';

/* ─── Helpers ───────────────────────────────────── */

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

const SOURCE_COLORS = {
  twitter: '#1DA1F2',
  reddit: '#FF4500',
  huggingface: '#FFD21E',
  hackernews: '#FF6600',
  googlenews: '#4285F4',
  duckduckgo: '#DE5833',
  devnews: '#A855F7',
  rss: '#6366F1',
};

function getSourceColor(source) {
  if (!source) return '#6366F1';
  const s = source.toLowerCase();
  for (const [key, color] of Object.entries(SOURCE_COLORS)) {
    if (s.includes(key)) return color;
  }
  return '#6366F1';
}

function formatNumber(n) {
  if (n == null || n === 0) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function calcHotScore(item) {
  const likes = item.like_count ?? item.likeCount ?? 0;
  const retweets = item.retweet_count ?? item.retweetCount ?? 0;
  const views = item.view_count ?? item.viewCount ?? 0;
  if (likes === 0 && retweets === 0 && views === 0) return null;
  return Math.round(likes * 10 + retweets * 5 + Math.log10(Math.max(views, 1)) * 2);
}

function getDescription(item) {
  const aiDesc = item.ai_description || item.aiDescription;
  if (aiDesc?.trim() && aiDesc.trim().length > 20) return aiDesc.trim();
  const desc = item.description || item.summary;
  if (desc?.trim() && desc.trim().length > 20) {
    const t = (item.title || '').trim().toLowerCase();
    const s = desc.trim().toLowerCase();
    if (!s.startsWith(t) && !t.startsWith(s)) return desc.trim();
  }
  return '';
}

/* ─── Importance accent colors for left border ──── */

const IMPORTANCE_BORDER = {
  urgent: 'border-l-rose-500',
  high: 'border-l-amber-500',
  medium: 'border-l-primary',
  low: 'border-l-white/20',
};

const IMPORTANCE_LABEL = {
  urgent: { text: '紧急', cls: 'text-rose-400 bg-rose-500/10 ring-rose-500/20' },
  high: { text: '高', cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' },
  medium: { text: '中', cls: 'text-primary/80 bg-primary/10 ring-primary/20' },
  low: { text: '低', cls: 'text-muted-foreground bg-white/5 ring-white/10' },
};

/* ─── Sub-components ────────────────────────────── */

function CardHeader({ item, sourceColor, onDelete, onDeleteItem }) {
  const pubRel = relativeTime(item.published_at);
  const updatedRel = relativeTime(item.updated_at);
  const author = item.author || '';

  return (
    <div className="mb-3 space-y-1.5">
      {/* Row 1: Source + Time + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <span
            className="size-2 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-transparent"
            style={{ backgroundColor: sourceColor, boxShadow: `0 0 6px ${sourceColor}60` }}
          />
          <span className="text-[11px] font-medium text-foreground/80 shrink-0">
            {formatSource(item.source)}
          </span>
          {pubRel && (
            <>
              <span className="text-white/10 shrink-0">·</span>
              <span className="text-[11px] text-muted-foreground/60 shrink-0 inline-flex items-center gap-1" title={formatAbsoluteTime(item.published_at)}>
                <Clock className="size-2.5" />
                {pubRel}
              </span>
            </>
          )}
          {updatedRel && (
            <>
              <span className="text-white/10 shrink-0">·</span>
              <span className="text-[11px] text-muted-foreground/50 shrink-0 inline-flex items-center gap-1" title={formatAbsoluteTime(item.updated_at)}>
                <Radar className="size-2.5" />
                {updatedRel}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <a
            href={item.link || item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-primary/15 transition-colors duration-150"
            aria-label="查看原文"
          >
            <ExternalLink className="size-3 text-primary/70" />
          </a>
          {onDeleteItem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive transition-colors duration-150"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              aria-label="删除该热点"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>
      {/* Row 2: Author (always visible when available) */}
      {author && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60" title={author}>
          <User className="size-3 text-primary/30 shrink-0" />
          <span className="truncate">{author}</span>
        </div>
      )}
    </div>
  );
}

function RelevanceBar({ score }) {
  if (score == null) return null;
  const pct = Math.max(0, Math.min(100, Math.round(Number(score))));
  const hue = pct > 70 ? 174 : pct > 40 ? 45 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, hsl(${hue} 80% 45% / 0.6), hsl(${hue} 90% 50% / 0.9))`,
            boxShadow: `0 0 8px hsl(${hue} 80% 50% / 0.3)`,
          }}
        />
      </div>
      <span className="text-[11px] tabular-nums font-medium shrink-0" style={{ color: `hsl(${hue} 80% 60%)` }}>
        {pct}%
      </span>
    </div>
  );
}

function PopularityChips({ item }) {
  const likes = item.like_count ?? item.likeCount;
  const retweets = item.retweet_count ?? item.retweetCount;
  const views = item.view_count ?? item.viewCount;
  const hasAny = (likes ?? 0) > 0 || (retweets ?? 0) > 0 || (views ?? 0) > 0;
  if (!hasAny) return null;

  const src = (item.source || '').toLowerCase();
  const isTwitter = src.includes('twitter');
  const isReddit = src.includes('reddit');
  const isHN = src === 'hackernews';

  const parts = [];
  if (isTwitter) {
    if (likes) parts.push(`♡ ${formatNumber(likes)}`);
    if (retweets) parts.push(`⟲ ${formatNumber(retweets)}`);
    if (views) parts.push(`◎ ${formatNumber(views)}`);
  } else if (isReddit) {
    if (likes) parts.push(`↑ ${formatNumber(likes)}`);
    if (retweets) parts.push(`💬 ${formatNumber(retweets)}`);
  } else if (isHN) {
    if (likes) parts.push(`▲ ${formatNumber(likes)}`);
    if (retweets) parts.push(`💬 ${formatNumber(retweets)}`);
  } else {
    if (likes) parts.push(`↑ ${formatNumber(likes)}`);
    if (retweets) parts.push(`💬 ${formatNumber(retweets)}`);
  }

  const hotScore = calcHotScore(item);
  const hotStr = hotScore != null && hotScore > 0
    ? (hotScore >= 1000 ? `${(hotScore / 1000).toFixed(1)}k` : String(hotScore))
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {parts.map((p, i) => (
        <span key={i} className="text-[11px] text-muted-foreground/70 tabular-nums">{p}</span>
      ))}
      {hotStr && (
        <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400/80 tabular-nums">
          <Flame className="size-2.5" />
          {hotStr}
        </span>
      )}
    </div>
  );
}

function TagsRow({ item, keywords, aiTags }) {
  const hasContent = aiTags.length > 0 || keywords.length > 0;
  if (!hasContent) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {aiTags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-[1px] rounded-full bg-accent/10 text-accent/70 ring-1 ring-accent/15"
        >
          <Tag className="size-2" />
          {tag}
        </span>
      ))}
      {keywords.slice(0, 3).map((kw) => (
        <span
          key={kw}
          className="text-[10px] px-1.5 py-[1px] rounded-full bg-primary/8 text-primary/60 ring-1 ring-primary/15"
        >
          {sanitizeText(kw)}
        </span>
      ))}
      {keywords.length > 3 && (
        <span className="text-muted-foreground/50 text-[10px]">+{keywords.length - 3}</span>
      )}
    </div>
  );
}

function ReasonSection({ reason, expanded, onToggle }) {
  const hasReason = reason?.trim();
  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
        className="inline-flex items-center gap-1.5 text-[11px] text-primary/60 hover:text-primary transition-colors duration-150 cursor-pointer"
      >
        <Sparkles className="size-3" />
        <span>AI 分析</span>
        <ChevronRight className={cn('size-3 transition-transform duration-200', expanded && 'rotate-90')} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {hasReason ? (
              <div className="mt-2 px-3 py-2 rounded-lg bg-primary/[0.04] border border-primary/10">
                <p className="text-[12px] leading-relaxed text-muted-foreground/80">
                  {sanitizeText(reason)}
                </p>
              </div>
            ) : (
              <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[12px] leading-relaxed text-muted-foreground/40 italic">
                  等待下次扫描生成 AI 分析
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ────────────────────────────── */

export function HoverEffect({ items, className, onDeleteItem, allReasonsExpanded = false }) {
  const reduce = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [expandedReasons, setExpandedReasons] = useState({});

  const toggleReason = useCallback((id) => {
    setExpandedReasons((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isReasonExpanded = useCallback((id) => {
    if (expandedReasons[id] !== undefined) return expandedReasons[id];
    return allReasonsExpanded;
  }, [expandedReasons, allReasonsExpanded]);

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5', className)}>
      {items.map((item, i) => {
        const keywords = (item.matched_keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
        const aiTags = (item.ai_tags || item.aiTags || '').split(',').map((t) => t.trim()).filter(Boolean);
        const description = getDescription(item);
        const isHovered = hoveredIndex === i;
        const itemId = item.id ?? i;
        const importance = item.importance || 'medium';
        const borderClass = IMPORTANCE_BORDER[importance] || IMPORTANCE_BORDER.medium;
        const impLabel = IMPORTANCE_LABEL[importance] || IMPORTANCE_LABEL.medium;
        const sourceColor = getSourceColor(item.source);
        const relevance = item.relevance_score ?? item.relevance;

        return (
          <motion.div
            key={itemId}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { delay: Math.min(i * 0.035, 0.35), duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            <div
              className={cn(
                'group relative overflow-hidden rounded-xl h-full flex flex-col min-h-0',
                'border-l-[3px] border border-white/[0.07]',
                'transition-all duration-300 ease-out',
                borderClass,
                isHovered
                  ? 'border-r-white/15 border-t-white/15 border-b-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(0,212,170,0.08)] translate-y-[-2px]'
                  : 'border-r-white/[0.07] border-t-white/[0.07] border-b-white/[0.07]',
              )}
              style={{
                background: isHovered
                  ? 'linear-gradient(135deg, hsl(222 35% 10% / 0.9) 0%, hsl(222 40% 8% / 0.95) 100%)'
                  : 'linear-gradient(135deg, hsl(222 35% 9% / 0.7) 0%, hsl(222 40% 7% / 0.85) 100%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Top corner glow on hover */}
              {isHovered && (
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${sourceColor}15 0%, transparent 70%)`,
                  }}
                />
              )}

              <div className="relative flex flex-col flex-1 px-4 pt-3.5 pb-4 min-w-0">
                {/* Header: Source · Time · Author + Actions */}
                <CardHeader
                  item={item}
                  sourceColor={sourceColor}
                  onDelete={() => onDeleteItem(item)}
                  onDeleteItem={onDeleteItem}
                />

                {/* Title */}
                <a
                  href={item.link || item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group/title"
                >
                  <h3 className="font-semibold leading-snug text-foreground text-[15px] group-hover/title:text-primary transition-colors duration-200 line-clamp-2">
                    {sanitizeText(item.title)}
                  </h3>
                </a>

                {/* Description */}
                {description && (
                  <p className="text-[12.5px] text-muted-foreground/70 mt-2 leading-relaxed line-clamp-3">
                    {sanitizeText(description)}
                  </p>
                )}

                {/* AI Tags + Keywords */}
                <TagsRow item={item} keywords={keywords} aiTags={aiTags} />

                {/* AI Reason (collapsible) */}
                <ReasonSection
                  reason={item.ai_reason || item.aiReason}
                  expanded={isReasonExpanded(itemId)}
                  onToggle={() => toggleReason(itemId)}
                />

                {/* Bottom section: pushed to bottom */}
                <div className="mt-auto pt-3 mt-3">
                  {/* Separator with subtle gradient */}
                  <div className="h-px mb-3" style={{ background: `linear-gradient(90deg, ${sourceColor}20, transparent 50%)` }} />

                  {/* Importance + Authenticity + Popularity */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium ring-1 shrink-0', impLabel.cls)}>
                        {impLabel.text}
                      </span>
                      {item.authenticity === 'suspected_false' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20 shrink-0">
                          待核实
                        </span>
                      )}
                    </div>
                    <PopularityChips item={item} />
                  </div>

                  {/* Relevance progress bar */}
                  <RelevanceBar score={relevance} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      {items.length > 0 &&
        Array.from({ length: (3 - (items.length % 3)) % 3 }).map((_, i) => (
          <div key={`grid-placeholder-${i}`} aria-hidden="true" className="min-w-0 hidden xl:block" />
        ))}
    </div>
  );
}
