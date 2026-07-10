/*
 * Design: Tech Corporate Dark - Business Area Section
 * - Light background with 9 business area cards (3x3 grid)
 * - Mobile: 1-col cards, smaller banner, tighter spacing
 */

import {
  Monitor,
  Award,
  Building,
  Crown,
  Mic,
  BookOpen,
  Network,
  Globe,
  ShoppingBag,
} from "lucide-react";

const areas = [
  {
    icon: Monitor,
    title: "AI에이전트 실무 교육",
    core: true,
    items: [
      "기획·자동화·협업·분석 등 업무 중심 교육",
      "ChatGPT 에이전트 활용 워크숍",
      "기초 자동화 도구(n8n) 입문",
    ],
  },
  {
    icon: Award,
    title: "자격과정 & 인증",
    core: false,
    items: [
      "AI 활용 역량 자격과정 운영",
      "AI 비즈니스 컨설턴트 인증",
      "우수기업 인증 프로그램",
    ],
  },
  {
    icon: Building,
    title: "기업 맞춤형 컨설팅",
    core: false,
    items: [
      "업종·조직 특성에 맞춘 AI 도입",
      "워크숍 및 조직 활용 프로그램",
      "AI 도입 전략 수립 지원",
    ],
  },
  {
    icon: Crown,
    title: "최고위과정 & 리더십",
    core: true,
    items: [
      "C-Level 전략적 AI 리더십 과정",
      "AI 에이전트 최고위 과정 (AMP)",
      "의사결정자 실행력 확장 프로그램",
    ],
  },
  {
    icon: Mic,
    title: "세미나·포럼·네트워킹",
    core: false,
    items: [
      "최신 트렌드 및 도입 사례 공유",
      "KAIA 컨퍼런스 및 네트워킹 행사",
      "산업별 전문가 포럼",
    ],
  },
  {
    icon: BookOpen,
    title: "연구 & 콘텐츠",
    core: false,
    items: [
      "산업별 AI 적용 사례 연구",
      "AI에이전트타임스 미디어 운영",
      "월간 산업 동향 리포트 발행",
    ],
  },
  {
    icon: Network,
    title: "생태계 구축",
    core: false,
    items: ["기업·기관 네트워킹", "커뮤니티 운영", "비즈니스 매칭"],
  },
  {
    icon: Globe,
    title: "글로벌 유통 & 코리아 엔트리",
    core: false,
    items: [
      "글로벌 총판 파트너십",
      "해외 기업 한국 진출 지원",
      "K-패션 브랜드 연계",
    ],
  },
  {
    icon: ShoppingBag,
    title: "AI 커머스 & 브랜드",
    core: false,
    items: [
      "AI 기반 이커머스 전략 수립",
      "브랜드 마케팅 자동화",
      "소비자 데이터 분석",
    ],
  },
];

export default function BusinessSection() {
  return (
    <section id="business" className="py-16 sm:py-24 bg-[#F5F7F9]">
      <div className="container px-5 sm:px-4">
        {/* Banner */}
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden mb-10 sm:mb-16 h-36 sm:h-48 md:h-64">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/business-banner-hwxwavowckvDH6ywLPBfF2.webp"
            alt="비즈니스 기술 시각화"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1829]/80 to-transparent flex items-end p-5 sm:p-8">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#E6F9FF]">
              Business Area
            </h2>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {areas.map((area) => (
            <div
              key={area.title}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 relative"
            >
              {area.core && (
                <span className="absolute top-3 sm:top-4 right-3 sm:right-4 text-[10px] sm:text-xs font-bold text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 sm:py-1 rounded">
                  CORE
                </span>
              )}
              <area.icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#12CAE2] mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-bold text-[#0A1829] mb-3 sm:mb-4">
                {area.title}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {area.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12CAE2] mt-1.5 sm:mt-2 shrink-0" />
                    <span className="text-xs sm:text-sm text-[#707D8F]">{item}</span>
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
