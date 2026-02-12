"use client";

import type { RedditStory } from "@/types";

interface StoryCardProps {
  story: RedditStory;
  onSelect: (story: RedditStory) => void;
  selected?: boolean;
}

export default function StoryCard({ story, onSelect, selected }: StoryCardProps) {
  const readTime = Math.round(story.selftext.split(/\s+/).length / 200);

  return (
    <div
      onClick={() => onSelect(story)}
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        selected
          ? "border-red-500 bg-red-500/10 shadow-red-500/20"
          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight text-zinc-100">
          {story.title}
        </h3>
        <span className="text-xs bg-zinc-800 px-2 py-1 rounded shrink-0 text-zinc-400">
          {story.score} pts
        </span>
      </div>

      <div className="flex gap-3 mt-2 text-xs text-zinc-500">
        <span>{story.subreddit}</span>
        <span>u/{story.author}</span>
        <span>~{readTime} min read</span>
        <span>{story.numComments} comments</span>
      </div>

      <p className="mt-2 text-xs text-zinc-400 line-clamp-3">
        {story.selftext.slice(0, 300)}...
      </p>
    </div>
  );
}
