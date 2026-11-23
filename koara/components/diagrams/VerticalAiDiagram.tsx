import type { VerticalAiFlowStep, VerticalDomain } from "@/content/types";

/**
 * VERTICAL AI ECOSYSTEM — HTML/CSS 흐름도.
 *
 * 산업 → AI 특화 → AI 활용 → 창업 → 마케팅 → 교육 → 출판 → 전문가 → 프로젝트
 *
 * · 모바일: 세로로 쌓이고 화살표가 아래를 향한다.
 * · sm 이상: 가로로 흐르며 줄바꿈된다 (긴 흐름이 잘리지 않는다).
 */
export function VerticalAiDiagram({
  flow,
  domains,
}: {
  flow: VerticalAiFlowStep[];
  domains: VerticalDomain[];
}) {
  return (
    <div>
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2.5">
        {flow.map((step, i) => (
          <li key={step.labelEn} className="flex flex-col sm:contents">
            <div className="rounded-xl border border-line-navy bg-navy-soft px-4 py-3">
              <p className="eyebrow text-[0.58rem] text-brand-light">
                {step.labelEn}
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {step.labelKo}
              </p>
            </div>
            {i < flow.length - 1 ? (
              /* 세로로 쌓이는 모바일에서는 화살표도 아래를 향하게 회전한다 */
              <span
                aria-hidden="true"
                className="my-1 self-center rotate-90 text-white/30 sm:my-0 sm:rotate-0 sm:px-0.5"
              >
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-8 border-t border-line-navy pt-6">
        <p className="eyebrow text-[0.62rem] text-brand-light">
          EXPANDABLE DOMAINS
        </p>
        <p className="mt-2 text-sm text-white/60">
          같은 구조를 산업별로 확장합니다. 각 분야의 상세 내용은 준비 중입니다.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {domains.map((d) => (
            <li
              key={d.id}
              className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-white/80"
            >
              {d.labelKo}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
