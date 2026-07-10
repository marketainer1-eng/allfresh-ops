/*
 * Design: Tech Corporate Dark - COO Profile Section
 * - Dark navy background
 * - Professional executive profile layout
 * - Mobile: stacked layout, smaller fonts, tighter spacing
 */

import { Briefcase, Award, Globe, TrendingUp } from "lucide-react";

const COO_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/coo-profile_7b5d7dca.png";

const careers = [
  {
    company: "(주)이퀼리브리엄",
    role: "대표이사",
    period: "2023 – 현재",
    desc: "마케팅 컨설팅, 비즈니스 전략 코칭, 브랜드 리브랜딩",
  },
  {
    company: "iProspect / Dentsu",
    role: "General Manager · Head of Solutions (상무)",
    period: "2020 – 2022",
    desc: "50개 브랜드 연간 성장 전략 설계, 퍼포먼스 마케팅 조직 운영",
  },
  {
    company: "Dentsu Korea",
    role: "Head of Solutions · 전략국장",
    period: "2016 – 2020",
    desc: "신규 해외 솔루션 국내 첫 도입, 뉴비즈니스 총괄",
  },
  {
    company: "Vizeum Korea",
    role: "General Manager (지사장)",
    period: "2018 – 2019",
    desc: "BMW, MINI, BURBERRY, IKEA 미디어 전략 총괄",
  },
  {
    company: "Carat / Vizeum Korea",
    role: "전략 디렉터 · 커뮤니케이션 플래너",
    period: "2006 – 2015",
    desc: "LVMH, BMW, IKEA, 20세기 FOX 등 글로벌 미디어 전략 리드",
  },
];

export default function CooProfileSection() {
  return (
    <section className="py-16 sm:py-24 bg-[#0A1829] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-[#12CAE2]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3B82F6]/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-5 sm:px-4">
        {/* Profile card */}
        <div className="max-w-5xl mx-auto">
          {/* Top: Name, title, quote */}
          <div className="glass-card p-5 sm:p-8 md:p-12 mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6 sm:gap-8">
              {/* Left: Photo & Name & title info */}
              <div className="md:w-1/3">
                {/* Profile Photo */}
                <div className="mb-4 sm:mb-6 flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-[#12CAE2]/30 shadow-lg shadow-[#12CAE2]/10">
                      <img
                        src={COO_PHOTO}
                        alt="최인후 COO"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    {/* Decorative accent */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-[#4ADE80]/10 rounded-lg border border-[#4ADE80]/20" />
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#E6F9FF] mb-2">
                  최인후 <span className="text-[#12CAE2]">COO</span>
                </h3>
                <p className="text-[#E6F9FF]/60 text-xs sm:text-sm mb-1">
                  최고운영책임자 · Chief Operating Officer
                </p>
                <p className="text-[#12CAE2] text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                  글로벌 마케팅 · 전략 경력 약 20년
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#12CAE2]" />
                    <span className="text-xs text-[#E6F9FF]/60">글로벌 경험</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#4ADE80]" />
                    <span className="text-xs text-[#E6F9FF]/60">50+ 브랜드</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#12CAE2]" />
                    <span className="text-xs text-[#E6F9FF]/60">20년 경력</span>
                  </div>
                </div>
              </div>

              {/* Right: Introduction */}
              <div className="md:w-2/3">
                <div className="text-3xl sm:text-4xl text-[#12CAE2]/30 mb-1 sm:mb-2">"</div>
                <p className="text-[#E6F9FF]/90 text-base sm:text-lg font-medium italic mb-4 sm:mb-6">
                  전략은 현장에서 완성된다.
                </p>
                <div className="space-y-3 sm:space-y-4 text-[#E6F9FF]/70 text-xs sm:text-sm leading-relaxed">
                  <p>
                    최인후 COO는 Dentsu, iProspect, Vizeum 등 글로벌 마케팅
                    그룹에서 약 20년간 전략 총괄을 역임한 전문가입니다. BMW, LVMH,
                    IKEA, BURBERRY를 비롯한 50개 이상의 글로벌 브랜드 성장 전략을
                    직접 설계하고, 대규모 퍼포먼스 마케팅 조직을 이끌며 현장에서
                    전략을 완성해 왔습니다.
                  </p>
                  <p>
                    그 경험을 바탕으로 이제 AI 시대의 새로운 무대에 서 있습니다.
                    AI에이전트협회 COO로서 협회의 운영 전반과 사업 기획을
                    총괄하며, AI가 대기업만의 기술이 아닌 모든 사업자의 실질적인
                    운영 도구가 되는 환경을 만드는 일에 집중합니다. 기획부터
                    실행까지, 협회의 모든 운영을 책임집니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Career timeline */}
          <div className="glass-card p-5 sm:p-8 md:p-12 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <Briefcase className="w-5 h-5 text-[#12CAE2]" />
              <h4 className="text-base sm:text-lg font-bold text-[#E6F9FF]">주요 경력</h4>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#12CAE2]/20" />

              <div className="space-y-5 sm:space-y-6">
                {careers.map((career, i) => (
                  <div key={i} className="relative pl-7 sm:pl-8">
                    {/* Dot */}
                    <div
                      className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                        i === 0
                          ? "border-[#4ADE80] bg-[#4ADE80]/20"
                          : "border-[#12CAE2] bg-[#12CAE2]/10"
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <h5 className="text-[#E6F9FF] font-bold text-xs sm:text-sm">
                          {career.company}{" "}
                          <span className="text-[#E6F9FF]/50 font-normal">
                            — {career.role}
                          </span>
                        </h5>
                        <p className="text-[#E6F9FF]/60 text-xs mt-1">
                          {career.desc}
                        </p>
                      </div>
                      <span className="text-[#12CAE2] text-xs font-medium whitespace-nowrap shrink-0">
                        {career.period}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom quote */}
          <div className="glass-card p-5 sm:p-8 md:p-10 text-center border-[#12CAE2]/20">
            <p className="text-[#E6F9FF]/90 text-sm sm:text-base leading-relaxed">
              AI 에이전트는 이제 특정 기업만의 기술이 아닙니다.
              <br className="hidden sm:block" />
              <span className="text-[#12CAE2] font-medium">
                최인후 COO는 1인 사업자부터 중소기업까지, 누구나 AI를 실질적인
                운영 도구로 쓸 수 있는 환경을 만드는 데 협회의 모든 역량을
                집중합니다.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
