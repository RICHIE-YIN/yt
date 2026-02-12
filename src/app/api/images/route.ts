import { NextRequest, NextResponse } from "next/server";
import { generateImages } from "@/lib/imagegen";
import type { RewrittenStory } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { story, outputId }: { story: RewrittenStory; outputId: string } =
      await req.json();

    if (!story?.body || !story?.title) {
      return NextResponse.json(
        { error: "Rewritten story with title and body is required" },
        { status: 400 }
      );
    }

    const images = await generateImages(story, outputId || "manual");
    return NextResponse.json({ images });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
