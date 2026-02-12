import { NextRequest, NextResponse } from "next/server";
import { narrate, checkTTSHealth } from "@/lib/narrator";

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
    const health = await checkTTSHealth();
    return NextResponse.json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS server unreachable";
    return NextResponse.json({ error: message, status: "unreachable" }, { status: 503 });
  }
}
