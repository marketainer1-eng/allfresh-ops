import type { ExpertIpNode } from "@/content/types";

/**
 * EXPERT IP ECOSYSTEM — 순환형 다이어그램 (HTML/CSS).
 *
 * 설계 의도
 * - 책을 출발점으로 고정하지 않는다.
 * - 콘텐츠 출발점은 책 / SNS / 영상 / 강의안 / 칼럼 / 프로젝트 경험 / 인터뷰 등
 *   어디든 될 수 있고, 서로 전환된다.
 * - 따라서 선형(1 → 2 → 3)이 아니라 중심을 둘러싼 순환 구조로 표현한다.
 *
 * 반응형
 * - 모바일: 그리드로 그대로 쌓인다 (원형 배치가 깨지지 않도록 아예 해제).
 * - md 이상: 정사각 컨테이너 안에서 원형 배치 (--x / --y 는 컨테이너 대비 %).
 */

const RADIUS = 35; // 컨테이너 기준 %

function position(index: number, total: number) {
  // 12시 방향에서 시작해 시계 방향으로 균등 배치
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Number((Math.cos(angle) * RADIUS).toFixed(3)),
    y: Number((Math.sin(angle) * RADIUS).toFixed(3)),
  };
}

export function ExpertIpDiagram({ nodes }: { nodes: ExpertIpNode[] }) {
  const core = nodes.find((n) => n.ring === "core");
  const outputs = nodes.filter((n) => n.ring === "output");
  const authority = nodes.filter((n) => n.ring === "authority");
  const activation = nodes.filter((n) => n.ring === "activation");

  return (
    <div>
      {/* ── 순환 구조 ─────────────────────────────────────────── */}
      <div className="radial grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:block">
        {/* 궤도 (md 이상에서만 보이는 장식선) */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 hidden size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20 md:block"
        />

        {core ? (
          <div className="radial-center col-span-2 rounded-2xl border border-brand-light/40 bg-brand/15 px-5 py-4 text-center sm:col-span-3 md:col-auto">
            <p className="eyebrow text-[0.58rem] text-brand-light">CORE</p>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-white md:text-base">
              {core.labelKo}
            </p>
          </div>
        ) : null}

        {outputs.map((node, i) => {
          const { x, y } = position(i, outputs.length);
          return (
            <div
              key={node.id}
              style={
                { "--x": x, "--y": y } as React.CSSProperties
              }
              className="radial-node rounded-full border border-line-navy bg-navy-soft px-4 py-2.5 text-center text-sm text-white/90 md:text-[0.82rem]"
            >
              {node.labelKo}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-white/50">
        어느 지점에서 시작해도 됩니다. 하나의 콘텐츠는 다른 형식으로 전환되며
        서로를 강화합니다.
      </p>

      {/* ── 순환의 결과 ───────────────────────────────────────── */}
      <div className="mt-10 grid gap-4 border-t border-line-navy pt-8 sm:grid-cols-2">
        <div className="rounded-2xl border border-line-navy bg-navy-soft p-6">
          <p className="eyebrow text-[0.62rem] text-brand-light">AUTHORITY</p>
          <ul className="mt-3 space-y-1.5">
            {authority.map((n) => (
              <li key={n.id} className="text-base font-medium text-white">
                {n.labelKo}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
            축적된 콘텐츠가 전문가의 권위와 브랜드로 쌓입니다.
          </p>
        </div>

        <div className="rounded-2xl border border-line-navy bg-navy-soft p-6">
          <p className="eyebrow text-[0.62rem] text-brand-light">ACTIVATION</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {activation.map((n) => (
              <li
                key={n.id}
                className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-white/85"
              >
                {n.labelKo}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
            권위는 다시 활동이 되고, 그 경험이 새로운 콘텐츠로 돌아옵니다.
          </p>
        </div>
      </div>
    </div>
  );
}
