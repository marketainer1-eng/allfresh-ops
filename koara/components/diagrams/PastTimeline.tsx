import type { TimelineStep } from "@/content/types";

/**
 * PAST 타임라인 — 통이미지가 아니라 HTML/CSS 로 구현.
 * 각 단계가 실제 텍스트이므로 검색엔진과 AI 가 그대로 읽을 수 있다.
 *
 * · 모바일: 세로 타임라인 (왼쪽 축)
 * · lg 이상: 가로 타임라인 (위쪽 축)
 */
export function PastTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative lg:grid lg:auto-cols-fr lg:grid-flow-col lg:gap-0">
      {/* 가로축 (lg 이상) */}
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 top-2 hidden h-px bg-line lg:block"
      />

      {steps.map((step, i) => (
        <li
          key={step.labelEn}
          className="relative pl-8 pb-9 last:pb-0 lg:pb-0 lg:pl-0 lg:pr-6 lg:last:pr-0"
        >
          {/* 세로축 (모바일) — 마지막 단계 뒤에는 선을 그리지 않는다 */}
          {i < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-[5px] top-3 w-px bg-line lg:hidden"
            />
          ) : null}

          {/* 노드 */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 z-10 block size-[11px] rounded-full border-2 border-brand bg-ivory lg:top-[-3px]"
          />

          <div className="lg:pt-8">
            <p className="eyebrow text-[0.62rem] text-brand">{step.labelEn}</p>
            <h3 className="mt-2 font-sans text-base font-semibold tracking-tight text-ink sm:text-lg">
              {step.labelKo}
            </h3>
            {step.year ? (
              <p className="mt-1 text-xs text-ink-faint">
                <time dateTime={step.year}>{step.year}</time>
              </p>
            ) : null}
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
              {step.note}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
