/**
 * Twitter 信息质量过滤规则
 * 宽松/标准/严格/自定义
 */
export const TWITTER_FILTER_PRESETS = {
  loose: { minLikes: 5, minRetweets: 2, minViews: 200 },
  standard: { minLikes: 10, minRetweets: 5, minViews: 500 },
  strict: { minLikes: 50, minRetweets: 20, minViews: 2000 },
};

export function getTwitterFilterConfig(settings = {}) {
  const mode = settings.twitter_filter_mode || 'strict';
  if (mode === 'custom') {
    return {
      minLikes: parseInt(settings.twitter_min_likes, 10) || 50,
      minRetweets: parseInt(settings.twitter_min_retweets, 10) || 20,
      minViews: parseInt(settings.twitter_min_views, 10) || 2000,
    };
  }
  return TWITTER_FILTER_PRESETS[mode] || TWITTER_FILTER_PRESETS.strict;
}

export function passesTwitterFilter(tweet, config) {
  const likes = tweet.likeCount ?? 0;
  const retweets = tweet.retweetCount ?? 0;
  const views = tweet.viewCount ?? 0;
  return (
    likes >= config.minLikes &&
    retweets >= config.minRetweets &&
    views >= config.minViews
  );
}
