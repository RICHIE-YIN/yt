export interface RedditStory {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  selftext: string;
  score: number;
  numComments: number;
  url: string;
  createdUtc: number;
  permalink: string;
}

export interface StorySearchParams {
  subreddits: string[];
  sortBy: "hot" | "top" | "new" | "rising";
  timeFilter: "hour" | "day" | "week" | "month" | "year" | "all";
  minScore: number;
  minLength: number;
  maxLength: number;
  limit: number;
}

export interface RubricScore {
  category: string;
  score: number;
  maxScore: number;
  reasoning: string;
}

export interface StoryAnalysis {
  overallScore: number;
  maxPossibleScore: number;
  passed: boolean;
  rubricScores: RubricScore[];
  summary: string;
  themes: string[];
  estimatedReadTimeMinutes: number;
}

export interface RewrittenStory {
  title: string;
  body: string;
  hookOpening: string;
  wordCount: number;
  changesDescription: string;
}

export interface NarrationResult {
  audioUrl: string;
  audioFilePath: string;
  durationSeconds: number;
  characterCount: number;
}

export interface GeneratedImage {
  imageUrl: string;
  imageFilePath: string;
  prompt: string;
  sceneDescription: string;
}

export interface PipelineResult {
  id: string;
  status: "pending" | "sourcing" | "analyzing" | "rewriting" | "narrating" | "imaging" | "complete" | "failed";
  originalStory: RedditStory | null;
  analysis: StoryAnalysis | null;
  rewrittenStory: RewrittenStory | null;
  narration: NarrationResult | null;
  images: GeneratedImage[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
