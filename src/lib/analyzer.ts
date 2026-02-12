import OpenAI from "openai";
import type { RedditStory, StoryAnalysis } from "@/types";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const RUBRIC_PROMPT = `You are an expert horror story analyst for a YouTube narration channel.
Analyze the following Reddit horror story and score it on each rubric category.

## Scoring Rubric (each category scored 1-10):

1. **Hook Potential** - Does the story grab attention in the first few sentences? Could the opening be adapted into a strong YouTube hook?
2. **Suspense & Tension** - Does the story build dread, uncertainty, and tension throughout?
3. **Narrative Flow** - Is the pacing good for audio narration? Does it flow naturally when read aloud?
4. **Creep Factor** - How unsettling, scary, or disturbing is the content? Will it keep viewers watching?
5. **Originality** - Is this a fresh concept or a tired trope? Unique stories perform better.
6. **Character & Relatability** - Can the audience connect with the narrator/protagonist?
7. **Resolution & Payoff** - Does the ending deliver? Cliffhangers and twists work well for YouTube.
8. **Narration Length** - Is the length suitable for a YouTube video (ideal: 8-20 min read time)?

## Passing Threshold
A story passes if the overall score is 55 or higher out of 80.

## Response Format
Respond with valid JSON only (no markdown fences):
{
  "overallScore": <number>,
  "maxPossibleScore": 80,
  "passed": <boolean>,
  "rubricScores": [
    { "category": "<name>", "score": <1-10>, "maxScore": 10, "reasoning": "<brief explanation>" }
  ],
  "summary": "<2-3 sentence summary of the story>",
  "themes": ["<theme1>", "<theme2>"],
  "estimatedReadTimeMinutes": <number>
}`;

export async function analyzeStory(
  story: RedditStory
): Promise<StoryAnalysis> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [
      { role: "system", content: RUBRIC_PROMPT },
      {
        role: "user",
        content: `# ${story.title}\n\nBy: ${story.author} | Subreddit: ${story.subreddit} | Score: ${story.score}\n\n${story.selftext}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI analysis");
  }

  const parsed: StoryAnalysis = JSON.parse(content);
  return parsed;
}
