import db from '../db.js';
import { fetchHuggingFace, fetchCustomRss } from './fetchRss.js';
import { fetchReddit } from './fetchReddit.js';
import { fetchTwitter } from './fetchTwitter.js';
import { fetchHackerNews } from './fetchHackerNews.js';
import { fetchDevNews } from './fetchDevNews.js';
import { fetchGoogleNews } from './fetchGoogleNews.js';
import { fetchDuckDuckGo } from './fetchDuckDuckGo.js';
import { getTwitterFilterConfig } from './twitterFilter.js';
import { filterAndSummarize } from './openRouter.js';
import { expandKeyword } from './keywordExpand.js';

/** 策略：数据采集（尽量多）→ 基础过滤（去重、时间）→ AI 深度分析（相关性、真假）→ 最终展示 */

function getMatchedKeywords(text, keywords) {
  if (!keywords?.length || !text) return [];
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
}

function buildKeywordConfigs() {
  const rows = db.prepare('SELECT id, keyword, enabled, variants_json FROM keywords WHERE enabled = 1').all();
  const configs = [];
  for (const row of rows) {
    let variants = [];
    if (row.variants_json) {
      try {
        const parsed = JSON.parse(row.variants_json);
        if (Array.isArray(parsed.variants)) {
          variants = parsed.variants;
        }
      } catch {
        // ignore parse error, will regenerate
      }
    }
    configs.push({
      id: row.id,
      keyword: row.keyword,
      variants,
    });
  }
  return configs;
}

async function runWithConcurrency(items, limit, worker) {
  if (!Array.isArray(items) || items.length === 0) return;
  const poolSize = Math.max(1, limit || 1);
  let index = 0;

  async function next() {
    const current = index;
    if (current >= items.length) return;
    index += 1;
    await worker(items[current], current);
    return next();
  }

  const runners = [];
  for (let i = 0; i < poolSize && i < items.length; i += 1) {
    runners.push(next());
  }
  await Promise.all(runners);
}

async function ensureKeywordVariants(configs) {
  const stmt = db.prepare(
    "UPDATE keywords SET variants_json = ?, variants_updated_at = datetime('now') WHERE id = ?"
  );

  await runWithConcurrency(configs, 3, async (cfg) => {
    if (Array.isArray(cfg.variants) && cfg.variants.length > 0) return;
    try {
      const expanded = await expandKeyword(cfg.keyword);
      cfg.variants = expanded.variants || [];
      stmt.run(
        JSON.stringify({
          keyword: expanded.keyword,
          variants: cfg.variants,
        }),
        cfg.id
      );
    } catch (e) {
      console.error('[Scanner] expandKeyword failed for', cfg.keyword, e.message);
      cfg.variants = [{ text: cfg.keyword, type: 'exact', weight: 1 }];
    }
  });
}

function buildQueryTermsFromVariants(configs, minWeight = 0.6) {
  const terms = [];
  for (const cfg of configs) {
    const vars = Array.isArray(cfg.variants) ? cfg.variants : [];
    for (const v of vars) {
      const w = Number.isFinite(Number(v.weight)) ? Number(v.weight) : 1;
      if (w < minWeight) continue;
      if (!v.text) continue;
      terms.push(v.text);
    }
  }
  const unique = [];
  const seen = new Set();
  for (const t of terms) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(t);
  }
  return unique;
}

// URL 归一化 & 跨来源去重，避免同一条新闻在列表中重复出现
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    u.hash = '';
    if (u.pathname === '/') u.pathname = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

function dedupeByUrl(items) {
  const seen = new Map();
  const sourcePriority = {
    twitter: 4,
    hackernews: 4,
    reddit: 3,
    googlenews: 2,
    duckduckgo: 2,
    devnews: 2,
    huggingface: 2,
    rss: 1,
  };

  for (const item of items) {
    const key = normalizeUrl(item.url || item.link || '');
    if (!key) continue;
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, item);
      continue;
    }
    const getPriority = (source) => {
      if (!source) return 0;
      const s = String(source).toLowerCase();
      if (s.startsWith('reddit:')) return sourcePriority.reddit;
      if (s.startsWith('rss:')) return sourcePriority.rss;
      if (s.startsWith('devnews:')) return sourcePriority.devnews;
      return sourcePriority[s] ?? 0;
    };
    const p1 = getPriority(prev.source);
    const p2 = getPriority(item.source);
    if (p2 > p1) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

function hashInt(str) {
  return Math.abs(
    (str || '')
      .split('')
      .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  );
}

/**
 * 相关性评分规则增强：提高区分度，避免大量相同分数
 * 1. 关键词匹配：每命中 1 个关键词 +8，最多 +24
 * 2. 标题命中：任一关键词出现在标题中 +5
 * 3. 无信号时：基础分 50 + 哈希离散 0-15
 * 4. 热度加成：基于 like/retweet/view 的对数缩放，0-8 分（高互动略增相关性）
 * 5. 哈希微调：每条目再 +0-8，确保同条件不同条目有区分
 */
function computeRelevanceScore(baseRel, item, matchedKws, kwList) {
  let score = baseRel ?? 50;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (kwList.length > 0 && matchedKws.length > 0) {
    const titleLower = (item.title || '').toLowerCase();
    const kwBonus = Math.min(matchedKws.length * 8, 24);
    const titleBonus = matchedKws.some((k) => titleLower.includes(k.toLowerCase())) ? 5 : 0;
    score = score + kwBonus + titleBonus;
  } else if (score === 50) {
    score = 50 + (hashInt(item.source + item.externalId) % 16);
  }

  const likes = item.likeCount ?? item.like_count ?? 0;
  const retweets = item.retweetCount ?? item.retweet_count ?? 0;
  const views = item.viewCount ?? item.view_count ?? 0;
  const hotBase = likes * 10 + retweets * 5 + Math.log10(Math.max(views, 1)) * 2;
  const engagementBonus = Math.min(8, Math.floor(Math.log10(Math.max(hotBase, 1)) * 3));
  score += engagementBonus;

  const jitter = hashInt(item.source + item.externalId + (item.title || '')) % 9;
  score += jitter;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function loadSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const { key, value } of rows) obj[key] = value ?? '';
  return obj;
}

function isHighSignalSource(source) {
  if (!source) return false;
  const s = String(source).toLowerCase();
  if (s === 'twitter' || s.startsWith('twitter:')) return true;
  if (s === 'hackernews') return true;
  if (s === 'huggingface') return true;
  if (s.startsWith('reddit:')) return true;
  if (s.startsWith('rss:')) return true;
  if (s.startsWith('devnews:')) return true;
  return false;
}

export async function runScan() {
  const tStart = Date.now();

  const keywordConfigs = buildKeywordConfigs();
  await ensureKeywordVariants(keywordConfigs);
  const kwList = keywordConfigs.map((r) => r.keyword);
  const settings = loadSettings();
  const twitterFilterConfig = getTwitterFilterConfig(settings);

  const expandedQueryTerms = buildQueryTermsFromVariants(keywordConfigs, 0.4);

  const all = [];
  const fetchers = [
    fetchHuggingFace(),
    fetchCustomRss(),
    fetchReddit(),
    fetchTwitter(
      expandedQueryTerms.length ? expandedQueryTerms : kwList,
      twitterFilterConfig
    ),
    fetchHackerNews(kwList),
    fetchDevNews(),
    fetchGoogleNews(expandedQueryTerms.length ? expandedQueryTerms : kwList),
    fetchDuckDuckGo(expandedQueryTerms.length ? expandedQueryTerms : kwList).catch(
      (e) => {
        console.error('[DuckDuckGo]', e.message);
        return [];
      }
    ),
  ];

  const tFetchStart = Date.now();
  const results = await Promise.all(fetchers);
  const tFetchEnd = Date.now();

  for (const r of results) all.push(...(r || []));

  // 阶段 2：基础过滤 - 时间窗口（7 天）+ 按 URL 跨来源去重
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRaw = all.filter((item) => {
    const pub = item.publishedAt ? new Date(item.publishedAt) : null;
    return !pub || pub >= cutoff;
  });

  const recent = dedupeByUrl(recentRaw);

  // 按发布时间倒序，优先处理最新内容；单次扫描最多处理 200 条以控制 AI 调用量
  const maxToProcess = 200;
  const toProcess = recent
    .sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, maxToProcess);

  const upsertStmt = db.prepare(`
    INSERT INTO hotspots (
      source, external_id, title, summary, url, raw_content, published_at,
      like_count, retweet_count, view_count, relevance_score, matched_keywords,
      importance, authenticity, ai_description, ai_reason, author, ai_tags,
      keyword_signals,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(source, external_id) DO UPDATE SET
      summary = excluded.summary,
      raw_content = excluded.raw_content,
      like_count = excluded.like_count,
      retweet_count = excluded.retweet_count,
      view_count = excluded.view_count,
      relevance_score = excluded.relevance_score,
      matched_keywords = excluded.matched_keywords,
      importance = excluded.importance,
      authenticity = excluded.authenticity,
      ai_description = excluded.ai_description,
      ai_reason = excluded.ai_reason,
      author = excluded.author,
      ai_tags = excluded.ai_tags,
      keyword_signals = excluded.keyword_signals,
      updated_at = datetime('now')
  `);

  let newCount = 0;
  let aiAttempts = 0;
  let aiKept = 0;

  const tAiStart = Date.now();

  // 阶段 3：AI 深度分析（相关性、真实性、重要程度）- 不再预先按关键词过滤，由 AI 判断
  await runWithConcurrency(
    toProcess,
    5,
    async (item, index) => {
      const text = [item.title, item.summary, item.rawContent]
        .filter(Boolean)
        .join(' ');
      const matchedKws = getMatchedKeywords(text, kwList);

      // 保守预过滤：仅当完全无关键词命中且来源不属于高信号源时，才跳过 AI 调用
      if (matchedKws.length === 0 && !isHighSignalSource(item.source)) {
        return;
      }

      const itemKeywordConfigs = keywordConfigs
        .filter((cfg) => matchedKws.includes(cfg.keyword))
        .map((cfg) => ({
          keyword: cfg.keyword,
          variants: cfg.variants,
        }));

      aiAttempts += 1;
      const aiResult = await filterAndSummarize(item, kwList, itemKeywordConfigs);
      if (!aiResult.keep) return;
      aiKept += 1;

      if (newCount < 3) {
        const ksSample = Array.isArray(aiResult.keyword_signals)
          ? aiResult.keyword_signals
              .map((k) => `${k.keyword}:${k.relation}:${k.score}`)
              .slice(0, 3)
              .join(' | ')
          : '';
        console.log(
          `[Scanner] AI result sample — reason: "${(aiResult.reason || '').slice(
            0,
            60
          )}", tags: [${(aiResult.tags || []).join(
            ','
          )}], ks: ${ksSample}`
        );
      }

      const likes = item.likeCount ?? null;
      const retweets = item.retweetCount ?? null;
      const views = item.viewCount ?? null;
      const matchedKeywordsStr = matchedKws.length ? matchedKws.join(',') : '';
      const relevanceVal = computeRelevanceScore(
        aiResult.relevance,
        item,
        matchedKws,
        kwList
      );
      const importanceVal = aiResult.importance || 'medium';
      const authenticityVal = aiResult.authenticity || 'verified';

      const aiDesc = aiResult.description || item.rawContent?.slice(0, 300) || '';
      const aiReason = aiResult.reason || '';
      const authorVal = item.author || '';
      const aiTagsVal = Array.isArray(aiResult.tags)
        ? aiResult.tags.join(',')
        : '';
      const keywordSignalsJson = aiResult.keyword_signals
        ? JSON.stringify(aiResult.keyword_signals)
        : null;

      try {
        const result = upsertStmt.run(
          item.source,
          String(item.externalId),
          item.title,
          aiResult.summary || item.summary,
          item.url,
          item.rawContent || '',
          item.publishedAt,
          likes,
          retweets,
          views,
          relevanceVal,
          matchedKeywordsStr,
          importanceVal,
          authenticityVal,
          aiDesc,
          aiReason,
          authorVal,
          aiTagsVal,
          keywordSignalsJson
        );
        if (result.changes > 0) newCount += 1;
      } catch (e) {
        // UNIQUE violation = already exists, ignore
      }
    }
  );

  const tAiEnd = Date.now();
  const tEnd = Date.now();

  return {
    scanned: toProcess.length,
    new: newCount,
    timings: {
      totalMs: tEnd - tStart,
      fetchMs: tFetchEnd - tFetchStart,
      aiMs: tAiEnd - tAiStart,
    },
    counts: {
      candidates: all.length,
      recent: recent.length,
      aiAttempts,
      aiKept,
    },
  };
}
