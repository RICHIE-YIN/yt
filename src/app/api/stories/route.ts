import { NextRequest, NextResponse } from "next/server";
import { fetchStories, DEFAULT_SEARCH_PARAMS } from "@/lib/reddit";
import type { StorySearchParams } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params: StorySearchParams = {
      ...DEFAULT_SEARCH_PARAMS,
      ...body,
    };

    const stories = await fetchStories(params);
    return NextResponse.json({ stories, count: stories.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stories = await fetchStories(DEFAULT_SEARCH_PARAMS);
    return NextResponse.json({ stories, count: stories.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
