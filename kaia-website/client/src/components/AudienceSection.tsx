/*
 * Design: Tech Corporate Dark - Target Audience Section
 * - Dark navy background
 * - 4 audience cards with icons
 */

import { Users, Cpu, Briefcase, Lightbulb } from "lucide-react";

const audiences = [
  {
    icon: Users,
    text: "AI 활용 역량을 키우고 싶은 직장인과 실무자",
  },
  {
    icon: Cpu,
    text: "AI 기반 교육과 자격 체계를 구축하고자 하는 전문가",
  },
  {
    icon: Briefcase,
    text: "미래 시장과 새로운 직무를 준비하는 경영자와 파트너",
  },
  {
    icon: Lightbulb,
    text: "AI를 실질적 기회로 전환하고자 하는 창업가와 전문인력",
  },
];

export default function AudienceSection() {
  return (
    <section className="py-24 bg-[#102741] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#12CAE2]/5 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-3">
          TARGET AUDIENCE
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-4">
          Who We Serve
        </h2>
        <p className="text-center text-[#E6F9FF]/60 text-sm mb-16 max-w-2xl mx-auto">
          AI에이전트협회는 AI 시대를 준비하는 다양한 주체들과 함께합니다.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {audiences.map((a, i) => (
            <div
              key={i}
              className="glass-card px-6 py-5 flex items-center gap-4 hover:border-[#12CAE2]/30 transition-all duration-300"
            >
              <a.icon className="w-6 h-6 text-[#12CAE2] shrink-0" />
              <span className="text-sm text-[#E6F9FF]/80">{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
