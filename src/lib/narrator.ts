import axios from "axios";
import fs from "fs/promises";
import path from "path";

import type { NarrationResult } from "@/types";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const res = await axios.get(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
  });
  return res.data.voices;
}

export async function narrate(
  text: string,
  outputId: string
): Promise<NarrationResult> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID not set");

  const res = await axios.post(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`,
    {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
    }
  );

  const outputDir = process.env.OUTPUT_DIR || "./output";
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${outputId}-narration.mp3`);
  await fs.writeFile(filePath, Buffer.from(res.data));

  // Estimate duration: ~150 words per minute for narration
  const wordCount = text.split(/\s+/).length;
  const estimatedDuration = (wordCount / 150) * 60;

  return {
    audioUrl: `/output/${outputId}-narration.mp3`,
    audioFilePath: filePath,
    durationSeconds: Math.round(estimatedDuration),
    characterCount: text.length,
  };
}
