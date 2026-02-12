"use client";

import { useState } from "react";
import type { RewrittenStory } from "@/types";

interface RewriteViewProps {
  rewrite: RewrittenStory;
}

export default function RewriteView({ rewrite }: RewriteViewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900">
        <h3 className="font-bold text-zinc-100">{rewrite.title}</h3>
        <div className="flex gap-3 mt-1 text-xs text-zinc-500">
          <span>{rewrite.wordCount} words</span>
          <span>~{Math.round(rewrite.wordCount / 150)} min narration</span>
        </div>
      </div>

      <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4">
        <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
          Hook Opening
        </span>
        <p className="text-sm text-zinc-200 mt-2 italic">
          &ldquo;{rewrite.hookOpening}&rdquo;
        </p>
      </div>

      <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Changes Made
        </span>
        <p className="text-sm text-zinc-300 mt-1">{rewrite.changesDescription}</p>
      </div>

      <div className="border border-zinc-700 rounded-lg bg-zinc-900 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center justify-between"
        >
          <span>Full Rewritten Story</span>
          <span className="text-zinc-500">{expanded ? "▲" : "▼"}</span>
        </button>
        {expanded && (
          <div className="px-4 pb-4 max-h-96 overflow-y-auto">
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {rewrite.body}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
