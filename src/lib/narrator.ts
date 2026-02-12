import type { NarrationResult } from "@/types";

const TTS_SERVER = process.env.TTS_SERVER_URL || "http://localhost:8321";

/**
 * Check if the local XTTS v2 TTS server is reachable.
 */
export async function checkTTSHealth(): Promise<{
  status: string;
  model_loaded: boolean;
  device: string;
  reference_exists: boolean;
}> {
  const res = await fetch(`${TTS_SERVER}/health`);
  if (!res.ok) throw new Error("TTS server unreachable");
  return res.json();
}

/**
 * Synthesize speech from text using the local XTTS v2 server.
 */
export async function narrate(
  text: string,
  outputId: string
): Promise<NarrationResult> {
  const res = await fetch(`${TTS_SERVER}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      output_id: outputId,
      language: "en",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `TTS server error: ${res.status}`);
  }

  const data = await res.json();

  return {
    audioUrl: data.audioUrl,
    audioFilePath: data.audioFilePath,
    durationSeconds: data.durationSeconds,
    characterCount: data.characterCount,
  };
}
