/*
 * Design: Tech Corporate Dark - Why KAIA Section
 * - Dark navy background
 * - 4 differentiation cards with numbers
 */

const diffs = [
  {
    num: "01",
    title: "활용 중심 접근",
    desc: "기술 중심이 아니라, AI를 실제 실행과 성장의 도구로 연결합니다.",
  },
  {
    num: "02",
    title: "확장형 구조",
    desc: "교육에서 끝나지 않고 자격, 컨설팅, 네트워크, 최고위과정으로 확장됩니다.",
  },
  {
    num: "03",
    title: "기업 변화 동반",
    desc: "개인의 학습뿐 아니라 기업의 도입과 조직의 변화까지 함께 고민합니다.",
  },
  {
    num: "04",
    title: "미래 준비",
    desc: "지금의 활용을 넘어 앞으로 열릴 직무, 시장, 산업의 변화까지 함께 준비합니다.",
  },
];

export default function WhyKaiaSection() {
  return (
    <section className="py-24 bg-[#102741] relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-3">
          DIFFERENTIATION
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-16">
          Why KAIA
        </h2>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {diffs.map((d) => (
            <div
              key={d.num}
              className="glass-card p-8 hover:border-[#12CAE2]/30 transition-all duration-300 relative"
            >
              <div className="absolute top-4 right-6 text-5xl font-black text-[#12CAE2]/10">
                {d.num}
              </div>
              <div className="w-10 h-0.5 bg-[#12CAE2] mb-4" />
              <h3 className="text-lg font-bold text-[#E6F9FF] mb-3">
                {d.title}
              </h3>
              <p className="text-sm text-[#E6F9FF]/70 leading-relaxed">
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
