// 排序选项
export const SORT_OPTIONS = [
  { value: 'dashboard_priority', label: '仪表盘优先级' },
  { value: 'latest_discovery', label: '最新发现' },
  { value: 'latest_published', label: '最新发布' },
  { value: 'importance', label: '重要程度优先' },
  { value: 'relevance', label: '相关性最高' },
  { value: 'popularity', label: '热度综合' },
];

// 重要程度（筛选）
export const IMPORTANCE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

// 真实性
export const AUTHENTICITY_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'verified', label: 'AI 验证为真实' },
  { value: 'suspected_false', label: '疑似虚假' },
];

// 相关性分数区间
export const RELEVANCE_RANGE_OPTIONS = [
  { value: '', label: '全部', min: null, max: null },
  { value: '0-25', label: '0-25', min: 0, max: 25 },
  { value: '25-50', label: '25-50', min: 25, max: 50 },
  { value: '50-75', label: '50-75', min: 50, max: 75 },
  { value: '75-100', label: '75-100', min: 75, max: 100 },
];

// 数据来源
export const SOURCE_OPTIONS = [
  { value: 'twitter', label: 'Twitter' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'hackernews', label: 'Hacker News' },
  { value: 'googlenews', label: 'Google News' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
  { value: 'huggingface', label: 'Hugging Face' },
  { value: 'rss', label: '自定义 RSS' },
  { value: 'devnews', label: '开发者新闻' },
];

// 时间范围（抓取与筛选均限定 7 天内）
export const TIME_RANGE_OPTIONS = [
  { value: '', label: '全部时间' },
  { value: '1h', label: '最近 1 小时' },
  { value: 'today', label: '今天' },
  { value: '3d', label: '近 3 天' },
  { value: '7d', label: '近 7 天' },
];
