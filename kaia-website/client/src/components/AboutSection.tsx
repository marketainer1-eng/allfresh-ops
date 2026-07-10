/*
 * Design: Tech Corporate Dark - About Us Section
 * - Light background with stats and info cards
 * - Mobile: single column, adjusted spacing
 */

import { Building2, Users, Briefcase, Globe } from "lucide-react";

const stats = [
  { value: "18년+", label: "업계 경험" },
  { value: "5대", label: "플랫폼 역할" },
  { value: "9개", label: "사업 영역" },
];

const cards = [
  {
    icon: Building2,
    title: "2026년 설립",
    desc: "대한민국 AI 에이전트 대표 협회",
  },
  {
    icon: Users,
    title: "회원사 네트워크",
    desc: "초기 핵심 회원사 모집 중",
  },
  {
    icon: Briefcase,
    title: "(주)넥서스그룹 운영",
    desc: "18년 업계 인프라 및 노하우 보유",
  },
  {
    icon: Globe,
    title: "글로벌 생태계 구축",
    desc: "KVAIA(한국버티컬AI협회) 공동 운영",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-[#F5F7F9] overflow-hidden">
      <div className="container px-5 sm:px-4">
        {/* Top area: text + image */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12 sm:mb-16">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0A1829] mb-4 sm:mb-6">
              About Us
            </h2>
            <div className="w-16 h-1 bg-[#12CAE2] mb-4 sm:mb-6" />
            <p className="text-[#0A1829]/80 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
              <strong className="text-[#0A1829]">AI에이전트협회(KAIA)</strong>는
              AI 기술의 발전이 단순한 관심과 정보 차원에 머무르지 않고,
              개인의 업무 역량, 조직의 생산성, 기업의 경쟁력, 산업의 성장으로 이어질 수 있도록
              사람과 기술, 기업과 시장을 연결하는 전문 협회입니다.
            </p>
            <div className="flex gap-6 sm:gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl sm:text-3xl font-black text-gradient">{s.value}</p>
                  <p className="text-xs text-[#707D8F] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#12CAE2]/20 via-transparent to-[#3B82F6]/10 rounded-2xl blur-xl" />
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/about-network-FpcmPoj62BmAtgYko6pk4e.webp"
              alt="AI 네트워크 시각화"
              className="relative rounded-2xl w-full object-cover shadow-lg"
            />
          </div>
        </div>

        {/* Bottom cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow border border-[#E6F9FF]/50"
            >
              <card.icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#12CAE2] mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-lg font-bold text-[#0A1829] mb-1 sm:mb-2">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#707D8F]">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* 설립 배경 */}
        <div className="mt-12 sm:mt-20 bg-[#102741] rounded-2xl p-6 sm:p-8 md:p-12">
          <h3 className="text-xl sm:text-2xl font-black text-[#E6F9FF] mb-3 sm:mb-4">설립 배경</h3>
          <p className="text-[#E6F9FF]/70 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
            AI가 빠르게 확산되는 시대이지만, 기술의 가능성과 현장의 실행 사이에는
            큰 간극이 존재합니다. AI에이전트협회는 이 간극을 줄이기 위해 설립되었습니다.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              "AI는 알고 있는 사람이 아니라, 활용하는 사람이 경쟁력을 갖는다.",
              "AI는 기술이 아니라 실행 구조로 들어와야 진짜 가치가 생긴다.",
              "개인의 역량, 기업의 도입, 시장의 변화는 연결되어야 한다.",
              "교육, 자격, 네트워크, 사업 협력이 하나의 흐름으로 이어져야 한다.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[#12CAE2] mt-1 shrink-0">→</span>
                <p className="text-[#E6F9FF]/80 text-xs sm:text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
