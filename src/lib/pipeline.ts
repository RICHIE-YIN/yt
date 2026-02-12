import { v4 as uuidv4 } from "uuid";
import { fetchStories, DEFAULT_SEARCH_PARAMS } from "./reddit";
import { analyzeStory } from "./analyzer";
import { rewriteStory } from "./rewriter";
import { narrate } from "./narrator";
import { generateImages } from "./imagegen";
import type {
  StorySearchParams,
  RedditStory,
  PipelineResult,
} from "@/types";

// In-memory store for pipeline runs (swap for DB later if needed)
const pipelineRuns = new Map<string, PipelineResult>();

export function getPipelineRun(id: string): PipelineResult | undefined {
  return pipelineRuns.get(id);
}

export function getAllPipelineRuns(): PipelineResult[] {
  return Array.from(pipelineRuns.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function updateRun(id: string, updates: Partial<PipelineResult>) {
  const existing = pipelineRuns.get(id);
  if (existing) {
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    pipelineRuns.set(id, updated);
  }
}

/**
 * Run the full pipeline for a single story:
 * 1. Analyze with OpenAI rubric
 * 2. Rewrite with OpenAI
 * 3. Narrate with ElevenLabs
 * 4. Generate images with Gemini
 */
export async function runPipelineForStory(
  story: RedditStory,
  options: { skipNarration?: boolean; skipImages?: boolean } = {}
): Promise<PipelineResult> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const run: PipelineResult = {
    id,
    status: "analyzing",
    originalStory: story,
    analysis: null,
    rewrittenStory: null,
    narration: null,
    images: [],
    error: null,
    createdAt: now,
    updatedAt: now,
  };
  pipelineRuns.set(id, run);

  try {
    // Step 1: Analyze
    updateRun(id, { status: "analyzing" });
    const analysis = await analyzeStory(story);
    updateRun(id, { analysis });

    if (!analysis.passed) {
      updateRun(id, {
        status: "complete",
        analysis,
      });
      return pipelineRuns.get(id)!;
    }

    // Step 2: Rewrite
    updateRun(id, { status: "rewriting" });
    const rewritten = await rewriteStory(story, analysis);
    updateRun(id, { rewrittenStory: rewritten });

    // Step 3: Narrate
    if (!options.skipNarration) {
      updateRun(id, { status: "narrating" });
      const narration = await narrate(rewritten.body, id);
      updateRun(id, { narration });
    }

    // Step 4: Generate images
    if (!options.skipImages) {
      updateRun(id, { status: "imaging" });
      const images = await generateImages(rewritten, id);
      updateRun(id, { images });
    }

    updateRun(id, { status: "complete" });
    return pipelineRuns.get(id)!;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    updateRun(id, { status: "failed", error: message });
    return pipelineRuns.get(id)!;
  }
}

/**
 * Source stories from Reddit and run the pipeline on the best one.
 */
export async function sourceAndProcess(
  searchParams?: Partial<StorySearchParams>,
  pipelineOptions?: { skipNarration?: boolean; skipImages?: boolean }
): Promise<{ stories: RedditStory[]; pipelineResult: PipelineResult | null }> {
  const params = { ...DEFAULT_SEARCH_PARAMS, ...searchParams };

  const stories = await fetchStories(params);

  if (stories.length === 0) {
    return { stories: [], pipelineResult: null };
  }

  // Sort by score descending, process the top story
  stories.sort((a, b) => b.score - a.score);
  const bestStory = stories[0];

  const pipelineResult = await runPipelineForStory(bestStory, pipelineOptions);
  return { stories, pipelineResult };
}
