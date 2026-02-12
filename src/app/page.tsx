"use client";

import { useState } from "react";
import StoryCard from "@/components/StoryCard";
import AnalysisView from "@/components/AnalysisView";
import RewriteView from "@/components/RewriteView";
import PipelineStatus from "@/components/PipelineStatus";
import type {
  RedditStory,
  StorySearchParams,
  StoryAnalysis,
  RewrittenStory,
  NarrationResult,
  GeneratedImage,
  PipelineResult,
} from "@/types";

const DEFAULT_SUBREDDITS = [
  "nosleep",
  "creepypasta",
  "shortscarystories",
  "LetsNotMeet",
  "TrueScaryStories",
  "scarystories",
  "HorrorStories",
];

type Tab = "source" | "pipeline" | "history";

export default function Home() {
  const [tab, setTab] = useState<Tab>("source");

  // Source state
  const [subreddits, setSubreddits] = useState(DEFAULT_SUBREDDITS.join(", "));
  const [sortBy, setSortBy] = useState<StorySearchParams["sortBy"]>("top");
  const [timeFilter, setTimeFilter] = useState<StorySearchParams["timeFilter"]>("week");
  const [minScore, setMinScore] = useState(100);
  const [limit, setLimit] = useState(25);
  const [stories, setStories] = useState<RedditStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<RedditStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [rewrite, setRewrite] = useState<RewrittenStory | null>(null);
  const [narration, setNarration] = useState<NarrationResult | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [skipNarration, setSkipNarration] = useState(false);
  const [skipImages, setSkipImages] = useState(false);

  // History state
  const [history, setHistory] = useState<PipelineResult[]>([]);

  async function fetchStories() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subreddits: subreddits.split(",").map((s) => s.trim()).filter(Boolean),
          sortBy,
          timeFilter,
          minScore,
          limit,
          minLength: 2000,
          maxLength: 40000,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStories(data.stories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    if (!selectedStory) return;
    setPipelineLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedStory),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function runRewrite() {
    if (!selectedStory || !analysis) return;
    setPipelineLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stories/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: selectedStory, analysis }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRewrite(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewrite failed");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function runNarration() {
    if (!rewrite) return;
    setPipelineLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rewrite.body, outputId: selectedStory?.id || "manual" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNarration(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Narration failed");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function runImageGen() {
    if (!rewrite) return;
    setPipelineLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: rewrite, outputId: selectedStory?.id || "manual" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function runFullPipeline() {
    if (!selectedStory) return;
    setPipelineLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          story: selectedStory,
          skipNarration,
          skipImages,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPipelineResult(data);
      setAnalysis(data.analysis);
      setRewrite(data.rewrittenStory);
      setNarration(data.narration);
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch("/api/pipeline");
      const data = await res.json();
      setHistory(data.runs || []);
    } catch {
      // Silently fail for history
    }
  }

  function resetPipeline() {
    setAnalysis(null);
    setRewrite(null);
    setNarration(null);
    setImages([]);
    setPipelineResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-red-500">Horror Pipeline</h1>
            <p className="text-xs text-zinc-500">Reddit Story → YouTube Video</p>
          </div>
          <nav className="flex gap-1">
            {(["source", "pipeline", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  if (t === "history") fetchHistory();
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  tab === t
                    ? "bg-red-500/20 text-red-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SOURCE TAB */}
        {tab === "source" && (
          <div className="space-y-6">
            {/* Search Controls */}
            <div className="border border-zinc-800 rounded-lg p-4 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-300">Search Parameters</h2>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Subreddits (comma separated)</label>
                <input
                  type="text"
                  value={subreddits}
                  onChange={(e) => setSubreddits(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as StorySearchParams["sortBy"])}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
                  >
                    <option value="hot">Hot</option>
                    <option value="top">Top</option>
                    <option value="new">New</option>
                    <option value="rising">Rising</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Time Filter</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as StorySearchParams["timeFilter"])}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
                  >
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Min Score</label>
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Limit per sub</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
                  />
                </div>
              </div>

              <button
                onClick={fetchStories}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? "Searching..." : "Search Reddit"}
              </button>
            </div>

            {/* Stories List */}
            {stories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-zinc-300">
                    Found {stories.length} stories
                  </h2>
                  {selectedStory && (
                    <button
                      onClick={() => {
                        resetPipeline();
                        setTab("pipeline");
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-xs font-medium"
                    >
                      Process Selected Story →
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  {stories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onSelect={setSelectedStory}
                      selected={selectedStory?.id === story.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PIPELINE TAB */}
        {tab === "pipeline" && (
          <div className="space-y-6">
            {!selectedStory ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-lg">No story selected</p>
                <p className="text-sm mt-1">Go to Source tab and search for a story first</p>
              </div>
            ) : (
              <>
                {/* Selected story info */}
                <div className="border border-zinc-800 rounded-lg p-4">
                  <h3 className="font-semibold text-zinc-200">{selectedStory.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {selectedStory.subreddit} · {selectedStory.score} pts · u/{selectedStory.author}
                  </p>
                </div>

                {/* Pipeline result status */}
                {pipelineResult && (
                  <PipelineStatus result={pipelineResult} />
                )}

                {/* Pipeline Controls */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={runFullPipeline}
                    disabled={pipelineLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
                  >
                    {pipelineLoading ? "Running..." : "Run Full Pipeline"}
                  </button>

                  <div className="border-l border-zinc-700 mx-2" />

                  <button
                    onClick={runAnalysis}
                    disabled={pipelineLoading}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg text-sm"
                  >
                    1. Analyze
                  </button>
                  <button
                    onClick={runRewrite}
                    disabled={pipelineLoading || !analysis}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 px-4 py-2 rounded-lg text-sm"
                  >
                    2. Rewrite
                  </button>
                  <button
                    onClick={runNarration}
                    disabled={pipelineLoading || !rewrite}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 px-4 py-2 rounded-lg text-sm"
                  >
                    3. Narrate
                  </button>
                  <button
                    onClick={runImageGen}
                    disabled={pipelineLoading || !rewrite}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 px-4 py-2 rounded-lg text-sm"
                  >
                    4. Images
                  </button>

                  <div className="border-l border-zinc-700 mx-2" />

                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={skipNarration}
                      onChange={(e) => setSkipNarration(e.target.checked)}
                      className="rounded"
                    />
                    Skip narration
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={skipImages}
                      onChange={(e) => setSkipImages(e.target.checked)}
                      className="rounded"
                    />
                    Skip images
                  </label>
                </div>

                {/* Results */}
                <div className="space-y-6">
                  {analysis && (
                    <section>
                      <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                        Analysis
                      </h2>
                      <AnalysisView analysis={analysis} />
                    </section>
                  )}

                  {rewrite && (
                    <section>
                      <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                        Rewritten Story
                      </h2>
                      <RewriteView rewrite={rewrite} />
                    </section>
                  )}

                  {narration && (
                    <section>
                      <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                        Narration
                      </h2>
                      <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900">
                        <div className="flex items-center gap-4">
                          <audio controls src={narration.audioUrl} className="flex-1" />
                          <div className="text-xs text-zinc-500">
                            <p>{Math.round(narration.durationSeconds / 60)} min</p>
                            <p>{narration.characterCount.toLocaleString()} chars</p>
                          </div>
                        </div>
                        <a
                          href={narration.audioUrl}
                          download
                          className="inline-block mt-3 text-xs text-red-400 hover:text-red-300"
                        >
                          Download MP3
                        </a>
                      </div>
                    </section>
                  )}

                  {images.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                        Generated Images ({images.length})
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        {images.map((img, i) => (
                          <div key={i} className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900">
                            <img src={img.imageUrl} alt={img.sceneDescription} className="w-full aspect-video object-cover" />
                            <div className="p-3">
                              <p className="text-xs text-zinc-300">{img.sceneDescription}</p>
                              <a
                                href={img.imageUrl}
                                download
                                className="text-xs text-red-400 hover:text-red-300 mt-1 inline-block"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300">Pipeline History</h2>
            {history.length === 0 ? (
              <p className="text-zinc-500 text-sm">No pipeline runs yet.</p>
            ) : (
              history.map((run) => (
                <div key={run.id} className="border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-200 text-sm">
                        {run.originalStory?.title || "Unknown story"}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {run.originalStory?.subreddit} · Score: {run.analysis?.overallScore || "N/A"}/
                        {run.analysis?.maxPossibleScore || "N/A"}
                      </p>
                    </div>
                    <PipelineStatus result={run} />
                  </div>
                  {run.error && (
                    <p className="text-xs text-red-400 mt-2">{run.error}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(run.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
