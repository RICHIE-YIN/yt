import { NextRequest, NextResponse } from "next/server";
import { rewriteStory } from "@/lib/rewriter";
import type { RedditStory, StoryAnalysis } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { story, analysis }: { story: RedditStory; analysis: StoryAnalysis } =
      await req.json();

    if (!story?.selftext || !analysis?.rubricScores) {
      return NextResponse.json(
        { error: "Must provide both story and analysis" },
        { status: 400 }
      );
    }

    const rewritten = await rewriteStory(story, analysis);
    return NextResponse.json(rewritten);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
