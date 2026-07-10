/*
 * Design: Tech Corporate Dark - Member Benefits Section
 * - Dark navy background
 * - 6 benefit cards with star icons (3x2 grid)
 */

import { Star } from "lucide-react";

const benefits = [
  "연 2회 KAIA 컨퍼런스 및 네트워킹 행사 초청",
  "AI 에이전트 도입 표준 가이드라인 선행 공유",
  "월간 AI 정책 및 산업 동향 리포트",
  "AI에이전트타임스 프리미엄 콘텐츠 제공",
  "협회 주관 자격증 및 교육 프로그램 우선권/할인",
  "회원사 디렉토리 등재 및 협회 채널 홍보 지원",
];

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-[#102741] relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-3">
          MEMBER BENEFITS
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-16">
          회원 혜택
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="glass-card px-6 py-5 flex items-center gap-3 hover:border-[#12CAE2]/30 transition-all duration-300"
            >
              <Star className="w-5 h-5 text-[#4ADE80] shrink-0" />
              <span className="text-sm text-[#E6F9FF]/80">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
