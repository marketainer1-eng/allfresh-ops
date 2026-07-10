/*
 * Design: Tech Corporate Dark - Program Section
 * - Dark navy background
 * - 3 layer cards (입문, 실무, 전문가)
 * - Mobile: single column, smaller fonts
 */

const layers = [
  {
    level: "LAYER 1",
    badge: "입문",
    title: "AI 에이전트 이해 및 기초 활용",
    items: [
      "ChatGPT 에이전트 활용 워크숍",
      "기초 자동화 도구(n8n) 입문",
      "업무 효율화 사례 연구",
    ],
  },
  {
    level: "LAYER 2",
    badge: "실무",
    title: "비즈니스 적용 및 시스템 구축",
    items: [
      "기업 맞춤형 AI 도입 전략 수립",
      "멀티 에이전트 시스템(MAS) 구축 실무",
      "업무 자동화 워크플로 최적화",
    ],
  },
  {
    level: "LAYER 3",
    badge: "전문가",
    title: "산업 리더 및 컨설턴트 양성",
    items: [
      "AI 에이전트 최고위 과정 (AMP)",
      "사내 AI 도입 전문가(Change Agent) 양성",
      "AI 비즈니스 컨설턴트 인증 과정",
    ],
  },
];

export default function ProgramSection() {
  return (
    <section id="program" className="py-16 sm:py-24 bg-[#102741] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#12CAE2]/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-5 sm:px-4">
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
          COMPETENCY PROGRAM
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-3 sm:mb-4">
          역량 강화 프로그램
        </h2>
        <p className="text-center text-[#E6F9FF]/60 text-xs sm:text-sm mb-10 sm:mb-16 max-w-2xl mx-auto">
          회원사 임직원 및 업계 종사자들의 AI 역량 강화를 위한 단계별 프로그램을
          운영합니다.
        </p>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {layers.map((layer, idx) => (
            <div
              key={layer.level}
              className="glass-card p-4 sm:p-6 hover:border-[#12CAE2]/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-[#E6F9FF]/60 text-[10px] sm:text-xs font-bold tracking-wider">
                  {layer.level}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded ${
                    idx === 0
                      ? "bg-[#4ADE80]/20 text-[#4ADE80]"
                      : idx === 1
                      ? "bg-[#12CAE2]/20 text-[#12CAE2]"
                      : "bg-[#F59E0B]/20 text-[#F59E0B]"
                  }`}
                >
                  {layer.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#E6F9FF] mb-3 sm:mb-4">
                {layer.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {layer.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12CAE2] mt-1.5 sm:mt-2 shrink-0" />
                    <span className="text-xs sm:text-sm text-[#E6F9FF]/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
