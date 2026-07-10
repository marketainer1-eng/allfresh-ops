/*
 * Design: Tech Corporate Dark - Partners Section
 * - Dark background with partner cards linking to external sites
 */

import { ExternalLink, GraduationCap, Globe, ShoppingBag, Sparkles, Star, Music } from "lucide-react";

const partners = [
  {
    name: "명지대학교 AI 이커머스학과",
    url: "https://gsit.mju.ac.kr/gsit/11025/subview.do",
    description: "명지대학교 테크노아트대학원 AI 이커머스학과 석사과정",
    icon: GraduationCap,
    color: "#12CAE2",
    bgColor: "rgba(18, 202, 226, 0.1)",
  },
  {
    name: "SQREEM",
    url: "https://one.sqreemtech.com/",
    description: "AI 기반 글로벌 데이터 인텔리전스 플랫폼",
    icon: Globe,
    color: "#4ADE80",
    bgColor: "rgba(74, 222, 128, 0.1)",
  },
  {
    name: "한국쇼핑몰협회",
    url: "http://hkspmh.or.kr/",
    description: "이커머스 산업 발전을 위한 전문 협회",
    icon: ShoppingBag,
    color: "#8B83FF",
    bgColor: "rgba(139, 131, 255, 0.1)",
  },
  {
    name: "한국버티컬AI협회",
    url: null,
    description: "버티컬 AI 산업 발전을 위한 전문 협회",
    icon: Sparkles,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
  {
    name: "걸스유니버스",
    url: null,
    description: "차세대 여성 엔터테인먼트 플랫폼",
    icon: Star,
    color: "#ED93B1",
    bgColor: "rgba(237, 147, 177, 0.1)",
  },
  {
    name: "GBK엔터테인먼트",
    url: "https://girlsuniverse.kr/",
    description: "엔터테인먼트 및 콘텐츠 전문 기업",
    icon: Music,
    color: "#E879F9",
    bgColor: "rgba(232, 121, 249, 0.1)",
  },
];

export default function PartnersSection() {
  return (
    <section id="partners" className="py-24 bg-[#0B1D33]">
      <div className="container">
        <p className="text-sm tracking-[0.3em] text-[#12CAE2] text-center mb-3 font-medium uppercase">
          Partners
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-4">
          협력사
        </h2>
        <p className="text-center text-[#E6F9FF]/50 mb-16 max-w-xl mx-auto">
          AI에이전트협회와 함께 AI 생태계를 구축하는 파트너사입니다
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {partners.map((partner) => {
            const Icon = partner.icon;
            return (
              partner.url ? (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="glass-card rounded-2xl p-5 sm:p-8 h-full border border-[#12CAE2]/10 hover:border-[#12CAE2]/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_8px_32px_rgba(18,202,226,0.15)]">
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: partner.bgColor }}
                  >
                    <Icon className="w-7 h-7" style={{ color: partner.color }} />
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#12CAE2] transition-colors">
                    {partner.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#E6F9FF]/50 mb-6 leading-relaxed">
                    {partner.description}
                  </p>

                  {/* Link indicator */}
                  <div className="flex items-center gap-2 text-[#12CAE2]/60 group-hover:text-[#12CAE2] transition-colors">
                    <span className="text-sm font-medium">사이트 방문</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
              ) : (
              <div key={partner.name} className="group block">
                <div className="glass-card rounded-2xl p-5 sm:p-8 h-full border border-[#12CAE2]/10">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: partner.bgColor }}
                  >
                    <Icon className="w-7 h-7" style={{ color: partner.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-[#E6F9FF]/50 mb-6 leading-relaxed">
                    {partner.description}
                  </p>
                </div>
              </div>
              )
            );
          })}
        </div>
      </div>
    </section>
  );
}
