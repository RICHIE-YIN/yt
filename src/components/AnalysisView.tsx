"use client";

import type { StoryAnalysis } from "@/types";

interface AnalysisViewProps {
  analysis: StoryAnalysis;
}

export default function AnalysisView({ analysis }: AnalysisViewProps) {
  const passColor = analysis.passed ? "text-green-400" : "text-red-400";
  const passBg = analysis.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="space-y-4">
      <div className={`border rounded-lg p-4 ${passBg}`}>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${passColor}`}>
            {analysis.passed ? "PASSED" : "FAILED"} — {analysis.overallScore}/{analysis.maxPossibleScore}
          </span>
          <span className="text-xs text-zinc-400">
            ~{analysis.estimatedReadTimeMinutes} min read
          </span>
        </div>
        <p className="text-sm text-zinc-300 mt-2">{analysis.summary}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {analysis.themes.map((theme) => (
            <span key={theme} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
              {theme}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {analysis.rubricScores.map((item) => (
          <div key={item.category} className="border border-zinc-700 rounded p-3 bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">{item.category}</span>
              <span
                className={`text-sm font-bold ${
                  item.score >= 7
                    ? "text-green-400"
                    : item.score >= 5
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {item.score}/{item.maxScore}
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${
                  item.score >= 7
                    ? "bg-green-500"
                    : item.score >= 5
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${(item.score / item.maxScore) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">{item.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
