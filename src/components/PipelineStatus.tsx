"use client";

import type { PipelineResult } from "@/types";

interface PipelineStatusProps {
  result: PipelineResult;
}

const STEPS = [
  { key: "sourcing", label: "Source" },
  { key: "analyzing", label: "Analyze" },
  { key: "rewriting", label: "Rewrite" },
  { key: "narrating", label: "Narrate" },
  { key: "imaging", label: "Images" },
  { key: "complete", label: "Done" },
] as const;

function getStepState(
  stepKey: string,
  currentStatus: PipelineResult["status"]
): "done" | "active" | "pending" | "failed" {
  if (currentStatus === "failed") {
    // When pipeline failed, mark the last step as failed
    const lastStepIdx = STEPS.length - 1;
    const stepIdx = STEPS.findIndex((s) => s.key === stepKey);
    if (stepIdx < lastStepIdx) return "pending";
    return "failed";
  }

  const statusOrder = STEPS.map((s) => s.key) as string[];
  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx = statusOrder.indexOf(stepKey);

  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function PipelineStatus({ result }: PipelineStatusProps) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const state = getStepState(step.key, result.status);
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  state === "done"
                    ? "bg-green-500 text-white"
                    : state === "active"
                    ? "bg-red-500 text-white animate-pulse"
                    : state === "failed"
                    ? "bg-red-800 text-red-200"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 ${
                  state === "active" ? "text-red-400" : "text-zinc-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 mb-4 ${
                  state === "done" ? "bg-green-500" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
