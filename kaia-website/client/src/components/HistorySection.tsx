/*
 * Design: Tech Corporate Dark - History Section
 * - Dark navy background with vertical timeline
 * - Desktop: centered timeline with left/right cards
 * - Mobile: single column timeline on the left
 */

const history = [
  {
    year: "2025",
    events: [
      "명지대학교 AI 이커머스학과 설립",
      "AI 미디어 커머스 연구소 설립",
      "AI에이전트타임스 미디어 설립 준비",
      "한국버티컬AI협회 도메인 확보",
    ],
    align: "left" as const,
  },
  {
    year: "2026",
    events: [
      "(주)넥서스그룹 법인 전환",
      "AI에이전트협회(KAIA) 공식 설립",
      "한국버티컬AI협회(KVAIA) 공동 출범",
      "AI에이전트타임스 미디어 설립",
    ],
    align: "right" as const,
  },
];

export default function HistorySection() {
  return (
    <section id="history" className="py-16 sm:py-24 bg-[#102741] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#12CAE2]/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-5 sm:px-4">
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
          HISTORY
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-10 sm:mb-16">
          협회 연혁
        </h2>

        {/* Mobile Timeline (single column) */}
        <div className="md:hidden relative max-w-md mx-auto">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[#12CAE2]/30" />

          {history.map((item) => (
            <div key={item.year} className="relative mb-10 last:mb-0 pl-12">
              {/* Year circle */}
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-[#12CAE2] bg-[#102741] flex items-center justify-center z-10">
                <span className="text-[#12CAE2] text-[10px] font-bold">
                  {item.year}
                </span>
              </div>

              {/* Events card */}
              <div className="glass-card p-4">
                <p className="text-[#12CAE2] text-sm font-bold mb-3">{item.year}</p>
                <ul className="space-y-2">
                  {item.events.map((event, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12CAE2] mt-1.5 shrink-0" />
                      <span className="text-[#E6F9FF]/80 text-xs leading-relaxed">
                        {event}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Timeline (centered, left/right) */}
        <div className="hidden md:block relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#12CAE2]/30 -translate-x-1/2" />

          {history.map((item) => (
            <div key={item.year} className="relative mb-16 last:mb-0">
              {/* Year circle */}
              <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-[#12CAE2] bg-[#102741] flex items-center justify-center z-10">
                <span className="text-[#12CAE2] text-sm font-bold">
                  {item.year}
                </span>
              </div>

              {/* Events card */}
              <div
                className={`w-5/12 ${
                  item.align === "left" ? "mr-auto pr-8" : "ml-auto pl-8"
                } pt-2`}
              >
                <div className="glass-card p-6">
                  <ul className="space-y-3">
                    {item.events.map((event, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#12CAE2] mt-1.5 shrink-0" />
                        <span className="text-[#E6F9FF]/80 text-sm">
                          {event}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
