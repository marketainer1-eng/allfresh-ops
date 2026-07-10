/*
 * Design: Tech Corporate Dark - Role Section
 * - Light background with 5 colored cards
 * - Each card has pastel background, icon, title, description
 */

import { Monitor, Building, Award, Handshake, Crown } from "lucide-react";

const roles = [
  {
    icon: Monitor,
    title: "실무 역량 플랫폼",
    desc: "개인과 실무자가 AI에이전트를 이해하고 활용하여 업무 생산성과 성과를 높일 수 있도록 돕습니다.",
    bg: "bg-[#E6F9FF]",
    iconColor: "text-[#12CAE2]",
  },
  {
    icon: Building,
    title: "기업 도입 플랫폼",
    desc: "기업과 기관이 AI를 실제로 도입하고 안착시킬 수 있도록 교육, 컨설팅, 사례 공유, 협업 기회를 제공합니다.",
    bg: "bg-[#E6FFE6]",
    iconColor: "text-[#4ADE80]",
  },
  {
    icon: Award,
    title: "전문성 인증 플랫폼",
    desc: "자격과정과 체계적인 교육을 통해 AI 활용 역량을 구조화하고 전문성의 기준을 제시합니다.",
    bg: "bg-[#F0E6FF]",
    iconColor: "text-[#A855F7]",
  },
  {
    icon: Handshake,
    title: "산업 협력 플랫폼",
    desc: "AI 관련 기업, 실무자, 교육기관, 전문가를 연결하여 더 큰 협업과 사업 기회를 만들어갑니다.",
    bg: "bg-[#FFF9E6]",
    iconColor: "text-[#F59E0B]",
  },
  {
    icon: Crown,
    title: "리더십 플랫폼",
    desc: "AI 시대를 준비하는 경영자, 임원, 리더를 위한 최고위과정과 전략형 프로그램을 운영합니다.",
    bg: "bg-[#FFE6F0]",
    iconColor: "text-[#EC4899]",
  },
];

export default function RoleSection() {
  return (
    <section className="py-24 bg-[#F5F7F9]">
      <div className="container">
        <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-3">
          ROLE OF KAIA
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-[#0A1829] text-center mb-16">
          협회의 5대 역할
        </h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {roles.slice(0, 2).map((role) => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-6">
          {roles.slice(2).map((role) => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RoleCard({
  icon: Icon,
  title,
  desc,
  bg,
  iconColor,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  bg: string;
  iconColor: string;
}) {
  return (
    <div
      className={`${bg} rounded-2xl p-8 hover:shadow-lg transition-all duration-300 relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#12CAE2]/5 to-transparent" />
      <Icon className={`w-10 h-10 ${iconColor} mb-4`} />
      <h3 className="text-lg font-bold text-[#0A1829] mb-3">{title}</h3>
      <p className="text-sm text-[#0A1829]/70 leading-relaxed">{desc}</p>
    </div>
  );
}
