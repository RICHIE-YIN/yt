import Snoowrap from "snoowrap";
import type { RedditStory, StorySearchParams } from "@/types";

function getClient(): Snoowrap {
  const client = new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT || "RedditHorrorBot/1.0",
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });
  client.config({ requestDelay: 1000, continueAfterRatelimitError: true });
  return client;
}

function mapSubmission(post: Snoowrap.Submission): RedditStory {
  return {
    id: post.id,
    title: post.title,
    author: typeof post.author === "string" ? post.author : post.author.name,
    subreddit: post.subreddit_name_prefixed,
    selftext: post.selftext,
    score: post.score,
    numComments: post.num_comments,
    url: post.url,
    createdUtc: post.created_utc,
    permalink: `https://reddit.com${post.permalink}`,
  };
}

export async function fetchStories(
  params: StorySearchParams
): Promise<RedditStory[]> {
  const client = getClient();
  const allStories: RedditStory[] = [];

  for (const sub of params.subreddits) {
    const subreddit = client.getSubreddit(sub);
    let posts: Snoowrap.Listing<Snoowrap.Submission>;

    const opts = { time: params.timeFilter, limit: params.limit };

    switch (params.sortBy) {
      case "top":
        posts = await subreddit.getTop(opts);
        break;
      case "new":
        posts = await subreddit.getNew({ limit: params.limit });
        break;
      case "rising":
        posts = await subreddit.getRising({ limit: params.limit });
        break;
      case "hot":
      default:
        posts = await subreddit.getHot({ limit: params.limit });
        break;
    }

    const mapped = posts
      .filter((p) => p.is_self && p.selftext.length > 0)
      .map(mapSubmission)
      .filter((s) => {
        const len = s.selftext.length;
        return (
          s.score >= params.minScore &&
          len >= params.minLength &&
          len <= params.maxLength
        );
      });

    allStories.push(...mapped);
  }

  return allStories;
}

export const DEFAULT_SEARCH_PARAMS: StorySearchParams = {
  subreddits: [
    "nosleep",
    "creepypasta",
    "shortscarystories",
    "LetsNotMeet",
    "TrueScaryStories",
    "scarystories",
    "HorrorStories",
  ],
  sortBy: "top",
  timeFilter: "week",
  minScore: 100,
  minLength: 2000,
  maxLength: 40000,
  limit: 25,
};
