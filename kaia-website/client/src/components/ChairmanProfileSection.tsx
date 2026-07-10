/*
 * Design: Tech Corporate Dark - Chairman Profile Section
 * - Dark navy background with gradient accents
 * - Professional executive profile with timeline
 * - Mobile: stacked layout, smaller fonts, tighter spacing
 */

import { Calendar, Building2, GraduationCap, Newspaper } from "lucide-react";

const CHAIRMAN_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/chairman-profile_1cff0806.jpg";

const timeline = [
  {
    year: "2026",
    events: [
      "AI에이전트협회(KAIA) 공식 설립",
      "AI에이전트타임즈 미디어 설립",
      "(주)넥서스그룹 법인 설립",
    ],
  },
  {
    year: "2025",
    events: [
      "명지대학교 테크노아트대학원 AI 이커머스학과 석사과정 설립",
      "AI 미디어 커머스 연구소 설립 · 한국버티컬AI협회 · 크리에이터커머스협회 설립",
    ],
  },
  {
    year: "2022",
    events: [
      "한국쇼핑몰협회 설립 · 원격평생교육원 설립 · 평생바우처 카드 사용 기관 승인",
    ],
  },
  {
    year: "2020",
    events: [
      "주식회사 비즈온에듀 설립 · 쿠팡 업무 제휴 · 롯데온 인강 업무",
    ],
  },
  {
    year: "2013",
    events: [
      "카페24 교육센터 제휴 · 온라인마케팅전문가그룹 에잇데이 설립",
    ],
  },
  {
    year: "2005",
    events: [
      "온라인 판매 사업 시작 — 이커머스 현장 실무의 출발",
    ],
  },
];

export default function ChairmanProfileSection() {
  return (
    <section className="py-16 sm:py-24 bg-[#0D1F35] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#12CAE2]/3 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-[#3B82F6]/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-5 sm:px-4">
        {/* Section header */}
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
          LEADERSHIP
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#E6F9FF] text-center mb-10 sm:mb-16">
          경영진 소개
        </h2>

        <div className="max-w-5xl mx-auto">
          {/* Profile card */}
          <div className="glass-card p-5 sm:p-8 md:p-12 mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6 sm:gap-8">
              {/* Left: Photo & Name & titles */}
              <div className="md:w-2/5">
                {/* Profile Photo */}
                <div className="mb-4 sm:mb-6 flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-[#12CAE2]/30 shadow-lg shadow-[#12CAE2]/10">
                      <img
                        src={CHAIRMAN_PHOTO}
                        alt="고아라 협회장"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    {/* Decorative accent */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-[#12CAE2]/10 rounded-lg border border-[#12CAE2]/20" />
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#E6F9FF] mb-2 sm:mb-3">
                  고아라 <span className="text-[#12CAE2]">협회장</span>
                </h3>

                <div className="space-y-2 mb-4 sm:mb-6">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-[#12CAE2] mt-0.5 shrink-0" />
                    <p className="text-[#E6F9FF]/70 text-xs sm:text-sm">
                      AI에이전트협회(KAIA) 협회장
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-[#12CAE2] mt-0.5 shrink-0" />
                    <p className="text-[#E6F9FF]/70 text-xs sm:text-sm">
                      한국버티컬AI협회 · 크리에이터커머스협회 협회장
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Newspaper className="w-4 h-4 text-[#12CAE2] mt-0.5 shrink-0" />
                    <p className="text-[#E6F9FF]/70 text-xs sm:text-sm">
                      AI에이전트타임즈 · (주)넥서스그룹 대표
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-[#4ADE80] mt-0.5 shrink-0" />
                    <p className="text-[#E6F9FF]/70 text-xs sm:text-sm">
                      명지대 테크노아트대학원 주임교수
                    </p>
                  </div>
                </div>

                <div className="inline-block bg-[#12CAE2]/10 border border-[#12CAE2]/20 rounded-lg px-3 sm:px-4 py-2">
                  <p className="text-[#12CAE2] text-xs sm:text-sm font-medium">
                    AI 에이전트 생태계 설계자
                  </p>
                </div>
              </div>

              {/* Right: Greeting */}
              <div className="md:w-3/5">
                <div className="text-3xl sm:text-4xl text-[#12CAE2]/30 mb-1 sm:mb-2">"</div>
                <h4 className="text-base sm:text-lg font-bold text-[#E6F9FF] mb-4 sm:mb-5">대표 인사말</h4>
                <div className="space-y-3 sm:space-y-4 text-[#E6F9FF]/70 text-xs sm:text-sm leading-relaxed">
                  <p>
                    우리는 지금 기술의 발전을 넘어, 일하는 방식과 산업의 구조
                    자체가 바뀌는 시대를 지나고 있습니다. AI는 더 이상 일부
                    전문가만의 영역이 아닙니다.
                  </p>
                  <p>
                    AI에이전트협회(KAIA)는 AI를 단순히 소개하거나 유행처럼
                    소비하는 데 그치지 않고, AI를 실제 업무·조직·산업·시장의
                    변화로 연결하는 실무 중심의 플랫폼이 되고자 합니다.
                  </p>
                  <p>
                    앞으로 AI 시대에는 누가 더 많은 정보를 아느냐보다, 누가 더
                    빠르게 활용하고 연결하느냐가 중요해질 것입니다.
                    교육·자격·연구·네트워크·최고위과정·산업 협력을 통해 AI
                    시대의 새로운 실행 생태계를 함께 만들어가겠습니다.
                  </p>
                </div>
                <p className="text-[#12CAE2] text-xs sm:text-sm font-medium mt-4 sm:mt-6">
                  — 고아라, AI에이전트협회 협회장
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-5 sm:p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <Calendar className="w-5 h-5 text-[#12CAE2]" />
              <h4 className="text-base sm:text-lg font-bold text-[#E6F9FF]">주요 연혁</h4>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#12CAE2]/20" />

              <div className="space-y-5 sm:space-y-6">
                {timeline.map((item, i) => (
                  <div key={item.year} className="relative pl-7 sm:pl-8">
                    {/* Dot */}
                    <div
                      className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                        i === 0
                          ? "border-[#4ADE80] bg-[#4ADE80]/20"
                          : "border-[#12CAE2] bg-[#12CAE2]/10"
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                      <span className="text-[#12CAE2] text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 w-12">
                        {item.year}
                      </span>
                      <div className="space-y-1">
                        {item.events.map((event, j) => (
                          <p
                            key={j}
                            className="text-[#E6F9FF]/70 text-xs sm:text-sm leading-relaxed"
                          >
                            {event}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
