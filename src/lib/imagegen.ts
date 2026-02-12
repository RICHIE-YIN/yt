import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

import type { RewrittenStory, GeneratedImage } from "@/types";

function getGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
}

interface SceneBreakdown {
  scenes: { description: string; prompt: string }[];
}

export async function generateSceneBreakdown(
  story: RewrittenStory
): Promise<SceneBreakdown> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You are a visual director for horror YouTube videos. Given a horror story, break it into 5-8 key visual scenes that would make compelling images/thumbnails for a video.

For each scene, provide:
1. A brief description of what's happening in the story at that point
2. An image generation prompt optimized for Gemini/Imagen — dark, cinematic, horror aesthetic

Respond with valid JSON only (no markdown fences):
{
  "scenes": [
    { "description": "<what happens>", "prompt": "<image gen prompt, cinematic horror style>" }
  ]
}`,
      },
      {
        role: "user",
        content: `# ${story.title}\n\n${story.body}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No scene breakdown from OpenAI");
  return JSON.parse(content);
}

export async function generateImages(
  story: RewrittenStory,
  outputId: string
): Promise<GeneratedImage[]> {
  const scenes = await generateSceneBreakdown(story);
  const gemini = getGemini();
  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const outputDir = process.env.OUTPUT_DIR || "./output";
  await fs.mkdir(outputDir, { recursive: true });

  const images: GeneratedImage[] = [];

  for (let i = 0; i < scenes.scenes.length; i++) {
    const scene = scenes.scenes[i];

    try {
      const result = await model.generateContent([
        {
          text: `Generate a dark, cinematic horror image: ${scene.prompt}. Style: photorealistic, dark lighting, atmospheric fog, muted colors with red/blue accents, 16:9 aspect ratio suitable for YouTube video.`,
        },
      ]);

      const response = result.response;
      const candidate = response.candidates?.[0];

      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const imgBuffer = Buffer.from(part.inlineData.data, "base64");
            const filePath = path.join(
              outputDir,
              `${outputId}-scene-${i + 1}.png`
            );
            await fs.writeFile(filePath, imgBuffer);

            images.push({
              imageUrl: `/output/${outputId}-scene-${i + 1}.png`,
              imageFilePath: filePath,
              prompt: scene.prompt,
              sceneDescription: scene.description,
            });
            break;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to generate image for scene ${i + 1}:`, err);
      // Continue with remaining scenes even if one fails
    }
  }

  return images;
}
