"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 마케팅 파이프라인 단계
 * 분석 → 전략 → 콘텐츠 → 출하 → 일정 → 플랜
 * 각 단계는 선택된 분석(analysisId)을 들고 다음 단계로 이동한다.
 */
export const PIPELINE_STEPS = [
  { key: "analysis", label: "분석", href: "/app/marketing/history" },
  { key: "strategy", label: "전략", href: "/app/marketing/strategy" },
  { key: "content", label: "콘텐츠", href: "/app/marketing/content" },
  { key: "shipping", label: "출하", href: "/app/marketing/shipping" },
  { key: "schedule", label: "일정", href: "/app/marketing/schedule" },
  { key: "plan", label: "플랜", href: "/app/marketing/plan" },
] as const;

export type PipelineStepKey = (typeof PIPELINE_STEPS)[number]["key"];

// 마케팅 플랜(Phase C) 페이지 준비 여부 — 준비되면 true 로 전환
const PLAN_READY = false;

function stepHref(key: PipelineStepKey, href: string, analysisId?: string | null) {
  if (!analysisId) return href;
  // 분석(이력) 단계는 focus 파라미터로 해당 분석을 펼친다
  if (key === "analysis") return `${href}?focus=${analysisId}`;
  return `${href}?analysisId=${analysisId}`;
}

export default function PipelineSteps({
  current,
  analysisId,
  className,
}: {
  current: PipelineStepKey;
  analysisId?: string | null;
  className?: string;
}) {
  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.key === current);

  return (
    <nav
      aria-label="마케팅 파이프라인 단계"
      className={cn(
        "mb-5 rounded-xl border border-stone-200 bg-white/70 px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      <ol className="flex items-center gap-1 overflow-x-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const isPlan = step.key === "plan";
          // 플랜 미준비 시 비활성. 그 외엔 analysisId 가 있으면 어디로든 이동 허용,
          // 없으면 이미 지난/현재 단계까지만 이동 허용.
          const disabled = (isPlan && !PLAN_READY) || (!analysisId && i > currentIdx);

          const inner = (
            <span
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "bg-emerald-600 text-white"
                  : done
                    ? "text-emerald-700 hover:bg-emerald-50"
                    : disabled
                      ? "text-stone-300"
                      : "text-stone-500 hover:bg-stone-50",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                  active
                    ? "bg-white/25 text-white"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-400",
                )}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              {step.label}
            </span>
          );

          return (
            <li key={step.key} className="flex items-center">
              {disabled ? (
                <span aria-current={active ? "step" : undefined}>{inner}</span>
              ) : (
                <Link
                  href={stepHref(step.key, step.href, analysisId)}
                  aria-current={active ? "step" : undefined}
                >
                  {inner}
                </Link>
              )}
              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-stone-300" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * 다음 단계로 넘어가는 CTA 버튼.
 * analysisId 가 없으면 비활성 처리한다.
 */
export function NextStepButton({
  href,
  label,
  analysisId,
  disabled,
}: {
  href: string;
  label: string;
  analysisId?: string | null;
  disabled?: boolean;
}) {
  const isDisabled = disabled || !analysisId;
  const target = analysisId ? `${href}?analysisId=${analysisId}` : href;

  if (isDisabled) {
    return (
      <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-400">
        {label}
        <ChevronRight className="h-4 w-4" />
      </span>
    );
  }

  return (
    <Link
      href={target}
      className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#166534]"
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}
