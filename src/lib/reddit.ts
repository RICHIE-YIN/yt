import type { RedditStory, StorySearchParams } from "@/types";

const USER_AGENT = "HorrorPipeline/1.0";

interface RedditPost {
  data: {
    id: string;
    title: string;
    author: string;
    subreddit_name_prefixed: string;
    selftext: string;
    score: number;
    num_comments: number;
    url: string;
    created_utc: number;
    permalink: string;
    is_self: boolean;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

function mapPost(post: RedditPost): RedditStory {
  return {
    id: post.data.id,
    title: post.data.title,
    author: post.data.author,
    subreddit: post.data.subreddit_name_prefixed,
    selftext: post.data.selftext,
    score: post.data.score,
    numComments: post.data.num_comments,
    url: post.data.url,
    createdUtc: post.data.created_utc,
    permalink: `https://reddit.com${post.data.permalink}`,
  };
}

export async function fetchStories(
  params: StorySearchParams
): Promise<RedditStory[]> {
  const allStories: RedditStory[] = [];

  for (const sub of params.subreddits) {
    const timeParam =
      params.sortBy === "top"
        ? `&t=${params.timeFilter}`
        : "";
    const url = `https://www.reddit.com/r/${sub}/${params.sortBy}.json?limit=${params.limit}${timeParam}&raw_json=1`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!res.ok) {
        console.error(`Failed to fetch r/${sub}: ${res.status}`);
        continue;
      }

      const listing: RedditListing = await res.json();

      const mapped = listing.data.children
        .filter((p) => p.data.is_self && p.data.selftext.length > 0)
        .map(mapPost)
        .filter((s) => {
          const len = s.selftext.length;
          return (
            s.score >= params.minScore &&
            len >= params.minLength &&
            len <= params.maxLength
          );
        });

      allStories.push(...mapped);
    } catch (err) {
      console.error(`Error fetching r/${sub}:`, err);
    }
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
