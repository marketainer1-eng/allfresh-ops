/*
 * Design: Tech Corporate Dark - Organization Chart Section (v6)
 * - 4 layers: Top → 5대 본부 → 크리에이터커머스 × 한국버티컬AI → 비즈니스·문화
 * - Solid border = existing, Dashed border = new proposal
 * - Mobile: horizontal scroll with min-width to prevent squishing
 */

/* ── colour helpers (dark-adapted) ── */
const C = {
  purple: { bg: "rgba(60,52,137,0.25)", text: "#AFA9EC", border: "#AFA9EC" },
  green:  { bg: "rgba(8,80,65,0.25)",   text: "#5DCAA5", border: "#5DCAA5" },
  orange: { bg: "rgba(99,56,6,0.25)",   text: "#EF9F27", border: "#EF9F27" },
  blue:   { bg: "rgba(12,68,124,0.25)", text: "#85B7EB", border: "#85B7EB" },
  pink:   { bg: "rgba(153,53,86,0.25)", text: "#ED93B1", border: "#ED93B1" },
  coral:  { bg: "rgba(113,43,19,0.25)", text: "#F0997B", border: "#F0997B" },
  gray:   { bg: "rgba(255,255,255,0.06)", text: "#94A3B8", border: "#334155" },
};

/* ── tiny reusable components ── */
function Box({ color, dashed, children, className = "", large }: {
  color: keyof typeof C; dashed?: boolean; children: React.ReactNode; className?: string; large?: boolean;
}) {
  const c = C[color];
  return (
    <div
      className={`rounded-lg text-center font-medium leading-snug ${large ? "text-xs sm:text-sm py-2 sm:py-3 px-4 sm:px-8" : "text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3"} ${className}`}
      style={{ background: c.bg, color: c.text, border: `1px ${dashed ? "dashed" : "solid"} ${c.border}` }}
    >
      {children}
    </div>
  );
}

function VLine({ h = 14 }: { h?: number }) {
  return <div className="mx-auto" style={{ width: 1, height: h, background: "#334155" }} />;
}

function SubItem({ children, dashed, color }: { children: React.ReactNode; dashed?: boolean; color?: { border: string; text: string } }) {
  return (
    <div
      className="text-[9px] sm:text-[11px] text-center py-1 sm:py-1.5 px-1.5 sm:px-2 rounded leading-snug"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `0.5px ${dashed ? "dashed" : "solid"} ${color?.border ?? "#334155"}`,
        color: color?.text ?? "#94A3B8",
      }}
    >
      {children}
    </div>
  );
}

function SectionDivider({ label, chipBg, chipText }: { label: string; chipBg: string; chipText: string }) {
  return (
    <div className="flex items-center gap-3 my-4 sm:my-5">
      <div className="flex-1 h-px" style={{ background: "#1E293B" }} />
      <span
        className="inline-block text-[9px] sm:text-[10px] font-medium tracking-wider px-2 sm:px-3 py-0.5 rounded whitespace-nowrap"
        style={{ background: chipBg, color: chipText }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "#1E293B" }} />
    </div>
  );
}

/* ── Column with header box + sub-items ── */
function DeptColumn({ color, dashed, title, subs }: {
  color: keyof typeof C; dashed?: boolean; title: React.ReactNode;
  subs: { label: string; dashed?: boolean; color?: { border: string; text: string } }[];
}) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-[70px] sm:min-w-0">
      <Box color={color} dashed={dashed} className="w-full">{title}</Box>
      <VLine h={8} />
      <div className="flex flex-col gap-1 w-full">
        {subs.map((s, i) => (
          <SubItem key={i} dashed={s.dashed} color={s.color}>{s.label}</SubItem>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function OrgChartSection() {
  return (
    <section className="py-16 sm:py-24 bg-[#0A1829] relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-10 left-1/3 w-72 h-72 bg-[#12CAE2]/3 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-[#3B82F6]/4 rounded-full blur-3xl" />

      <div className="container relative z-10 max-w-5xl mx-auto px-3 sm:px-4">
        {/* Section header */}
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
          ORGANIZATION
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-10 sm:mb-16">
          조직도
        </h2>

        {/* Chart card - scrollable on mobile */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-10 overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Title + Legend */}
            <p className="text-[10px] sm:text-xs text-[#94A3B8] tracking-wider mb-2 sm:mb-3">KAIA AI에이전트협회 — 통합 조직도</p>
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap items-center">
              <span className="text-[10px] sm:text-[11px] text-[#94A3B8]">범례</span>
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: C.purple.bg, color: C.purple.text, border: `1px solid ${C.purple.border}` }}>실선 = 기존</span>
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: C.purple.bg, color: C.purple.text, border: `1px dashed ${C.purple.border}` }}>점선 = 신규 제안</span>
            </div>

            {/* ══ LAYER 1: 최상단 ══ */}
            <div className="flex flex-col items-center">
              <Box color="purple" large>조직도</Box>
              <VLine />
              {/* Horizontal connector */}
              <div className="relative w-[85%] max-w-[640px]">
                <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: "#334155" }} />
              </div>
              <div className="flex gap-1.5 sm:gap-2 w-[85%] max-w-[640px] justify-center">
                {(
                  [
                    { label: "이사회", isDashed: true, c: "purple" as const },
                    { label: "자문위원회", isDashed: true, c: "purple" as const },
                    { label: "윤리위원회", isDashed: true, c: "purple" as const },
                    { label: "사무국장\n/ 사무처", isDashed: false, c: "gray" as const },
                  ] as const
                ).map((item, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <VLine h={12} />
                    <Box color={item.c} dashed={item.isDashed} className="w-full">
                      {item.label.includes("\n") ? (
                        <>
                          {item.label.split("\n")[0]}
                          <br />
                          {item.label.split("\n")[1]}
                        </>
                      ) : (
                        item.label
                      )}
                    </Box>
                  </div>
                ))}
              </div>
            </div>

            <VLine h={18} />

            {/* ══ LAYER 2: 5대 본부 ══ */}
            <SectionDivider label="5대 본부" chipBg="rgba(60,52,137,0.3)" chipText="#AFA9EC" />

            <div className="flex gap-1.5 sm:gap-2 w-full items-start">
              <DeptColumn
                color="green" title={<>교육·자격<br />인증 본부</>}
                subs={[
                  { label: "커리큘럼개발팀", dashed: true },
                  { label: "자격인증위원회", dashed: true },
                  { label: "강사인증·관리팀", dashed: true },
                ]}
              />
              <DeptColumn
                color="blue" title={<>회원·파트너십<br />본부</>}
                subs={[
                  { label: "전문직 가입" },
                  { label: "기업회원팀", dashed: true },
                  { label: "파트너십팀", dashed: true },
                ]}
              />
              <DeptColumn
                color="orange" dashed title={<>정책·연구<br />위원회</>}
                subs={[
                  { label: "AI 정책연구소", dashed: true },
                  { label: "표준화위원회", dashed: true },
                  { label: "산업동향리포트팀", dashed: true },
                ]}
              />
              <DeptColumn
                color="pink" title={<>미디어·홍보<br />본부</>}
                subs={[
                  { label: "AI에이전트타임즈" },
                  { label: "SNS·콘텐츠팀", dashed: true },
                  { label: "컨퍼런스·행사팀", dashed: true },
                ]}
              />
              <DeptColumn
                color="coral" dashed title={<>글로벌·해외<br />협력 본부</>}
                subs={[
                  { label: "GVAIA 연계" },
                  { label: "해외지부 운영팀", dashed: true },
                  { label: "K-AI 수출지원팀", dashed: true },
                ]}
              />
            </div>

            {/* ══ LAYER 3: 크리에이터커머스협회 × 한국버티컬AI협회 ══ */}
            <SectionDivider label="크리에이터커머스협회 × 한국버티컬AI협회" chipBg="rgba(8,80,65,0.3)" chipText="#5DCAA5" />

            <div className="flex gap-1.5 sm:gap-2 w-full items-start">
              <DeptColumn
                color="green" title="코치협회"
                subs={[
                  { label: "청소년" },
                  { label: "산후" },
                  { label: "시니어" },
                ]}
              />
              <DeptColumn
                color="blue" title="전문직 · 가입"
                subs={[
                  { label: "법인", color: { border: C.blue.border, text: C.blue.text } },
                  { label: "전문직", color: { border: C.blue.border, text: C.blue.text } },
                  { label: "의료인", color: { border: C.pink.border, text: C.pink.text } },
                ]}
              />
              <DeptColumn
                color="orange" title="공간 운영"
                subs={[
                  { label: "사무실" },
                  { label: "숙소" },
                  { label: "네트워킹" },
                  { label: "워케이션" },
                ]}
              />
            </div>

            {/* ══ LAYER 4: 비즈니스·문화 ══ */}
            <SectionDivider label="비즈니스 · 문화" chipBg="rgba(99,56,6,0.3)" chipText="#EF9F27" />

            <div className="flex gap-1.5 sm:gap-2 w-full items-start">
              <DeptColumn
                color="orange" title={<>비즈니스<br />스타트업</>}
                subs={[{ label: "스타트업 파트너" }]}
              />
              <DeptColumn
                color="gray" title={<>비즈니스<br />기업-직무</>}
                subs={[{ label: "기업·직무 파트너" }]}
              />
              <DeptColumn
                color="green" title="문화 · 멘터"
                subs={[{ label: "GBK 연계", color: { border: C.green.border, text: C.green.text } }]}
              />
            </div>
          </div>
        </div>

        {/* Mobile scroll hint */}
        <p className="md:hidden text-center text-[10px] text-[#94A3B8]/60 mt-3">
          ← 좌우로 스크롤하여 전체 조직도를 확인하세요 →
        </p>
      </div>
    </section>
  );
}
