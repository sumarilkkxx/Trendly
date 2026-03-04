/**
 * Twitter 信息质量过滤规则（参考：最低点赞≥10、最低转发≥5、最低浏览≥500、作者粉丝≥100、排除回复推文）
 * 宽松/标准/严格/自定义
 */
export const TWITTER_FILTER_PRESETS = {
  loose: {
    minLikes: 5,
    minRetweets: 2,
    minViews: 200,
    minFollowers: 50,
    onlyOriginalTweets: false,
  },
  standard: {
    minLikes: 10,
    minRetweets: 5,
    minViews: 500,
    minFollowers: 100,
    onlyOriginalTweets: true,
  },
  strict: {
    minLikes: 50,
    minRetweets: 20,
    minViews: 2000,
    minFollowers: 100,
    onlyOriginalTweets: true,
  },
};

export function getTwitterFilterConfig(settings = {}) {
  const mode = settings.twitter_filter_mode || 'standard';
  if (mode === 'custom') {
    return {
      minLikes: parseInt(settings.twitter_min_likes, 10) || 10,
      minRetweets: parseInt(settings.twitter_min_retweets, 10) || 5,
      minViews: parseInt(settings.twitter_min_views, 10) || 500,
      minFollowers: parseInt(settings.twitter_min_followers, 10) ?? 100,
      onlyOriginalTweets: settings.twitter_exclude_replies !== 'false',
    };
  }
  return TWITTER_FILTER_PRESETS[mode] ?? TWITTER_FILTER_PRESETS.standard;
}

export function passesTwitterFilter(tweet, config) {
  const likes = tweet.likeCount ?? 0;
  const retweets = tweet.retweetCount ?? 0;
  const views = tweet.viewCount ?? 0;
  if (
    likes < (config.minLikes ?? 0) ||
    retweets < (config.minRetweets ?? 0) ||
    views < (config.minViews ?? 0)
  ) {
    return false;
  }
  if (config.onlyOriginalTweets && tweet.isReply) {
    return false;
  }
  const followers = tweet.author?.followers ?? tweet.author?.followersCount ?? 0;
  if ((config.minFollowers ?? 0) > 0 && followers < config.minFollowers) {
    return false;
  }
  return true;
}
