import OpenAI from "openai";
import type { RedditStory, StoryAnalysis, RewrittenStory } from "@/types";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const REWRITE_PROMPT = `You are an expert horror story writer and YouTube content creator.
Your job is to rewrite Reddit horror stories to make them more compelling for YouTube narration.

## Your Goals:
1. **Killer Hook** - Rewrite the opening to immediately grab attention. Start with a shocking statement, question, or in-media-res moment that makes viewers unable to click away.
2. **Build Suspense** - Add tension beats, slow reveals, and dread-building moments throughout.
3. **Enhance Atmosphere** - Add sensory details (sounds, smells, feelings) that make the story more immersive for audio.
4. **Smooth Narration Flow** - Write in a way that sounds natural when read aloud. Use shorter sentences for impact. Vary sentence length for rhythm.
5. **Strengthen the Ending** - Make the resolution hit harder. Add a final twist, lingering dread, or chilling last line.
6. **First Person** - Keep it in first person. The narrator IS the protagonist.
7. **Remove Reddit-isms** - Remove references to Reddit, "update:", "edit:", etc. Make it feel like a standalone story.
8. **Maintain Core Story** - Keep the original plot, characters, and key events. You're enhancing, not replacing.

## Response Format
Respond with valid JSON only (no markdown fences):
{
  "title": "<compelling title for YouTube>",
  "body": "<the full rewritten story>",
  "hookOpening": "<just the first 2-3 sentences, the hook>",
  "wordCount": <number>,
  "changesDescription": "<brief summary of what you changed and why>"
}`;

export async function rewriteStory(
  story: RedditStory,
  analysis: StoryAnalysis
): Promise<RewrittenStory> {
  const client = getClient();

  const weakAreas = analysis.rubricScores
    .filter((r) => r.score < 7)
    .map((r) => `- ${r.category} (${r.score}/10): ${r.reasoning}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 8000,
    messages: [
      { role: "system", content: REWRITE_PROMPT },
      {
        role: "user",
        content: `# Original Story: ${story.title}

## Analysis Notes
Overall score: ${analysis.overallScore}/${analysis.maxPossibleScore}
Themes: ${analysis.themes.join(", ")}

## Areas to Improve:
${weakAreas || "Story scored well across the board — focus on polish and hook."}

## Original Story:
${story.selftext}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI rewrite");
  }

  const parsed: RewrittenStory = JSON.parse(content);
  return parsed;
}
