import { NextRequest, NextResponse } from "next/server";
import {
  sourceAndProcess,
  runPipelineForStory,
  getAllPipelineRuns,
  getPipelineRun,
} from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, story, searchParams, skipNarration, skipImages } = body;

    if (mode === "single" && story) {
      // Run pipeline on a specific story
      const result = await runPipelineForStory(story, {
        skipNarration,
        skipImages,
      });
      return NextResponse.json(result);
    }

    // Default: source from Reddit and process the best story
    const result = await sourceAndProcess(searchParams, {
      skipNarration,
      skipImages,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const run = getPipelineRun(id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(run);
  }

  const runs = getAllPipelineRuns();
  return NextResponse.json({ runs });
}
