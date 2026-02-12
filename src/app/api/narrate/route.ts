import { NextRequest, NextResponse } from "next/server";
import { narrate, listVoices } from "@/lib/narrator";

export async function POST(req: NextRequest) {
  try {
    const { text, outputId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await narrate(text, outputId || "manual");
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Narration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const voices = await listVoices();
    return NextResponse.json({ voices });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list voices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
