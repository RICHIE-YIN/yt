import { NextRequest, NextResponse } from "next/server";
import { analyzeStory } from "@/lib/analyzer";
import type { RedditStory } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const story: RedditStory = await req.json();

    if (!story.selftext || !story.title) {
      return NextResponse.json(
        { error: "Story must include title and selftext" },
        { status: 400 }
      );
    }

    const analysis = await analyzeStory(story);
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
