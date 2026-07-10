/*
 * Design: Tech Corporate Dark - Vision & Mission Section
 * - Dark navy background with AI video
 * - Vision, Mission, Core Values
 * - Mobile: single column, smaller fonts, tighter spacing
 */

import { useEffect, useRef, useState } from "react";
import { Zap, Link2, Shield, TrendingUp } from "lucide-react";

const VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/vision-ai-bg_9ba92a5c.mp4";
const FALLBACK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/vision-network-gy9qVMaRWh2YnWC2h6PbHi.webp";

const missions = [
  "AI에이전트 활용 실무 인재 양성",
  "기업의 AI 실무 적용 지원",
  "AI 활용 전문 네트워크 구축",
  "자격·교육·최고위과정을 통한 전문성 정립",
  "지속 가능한 AI 실행 생태계 조성",
];

const coreValues = [
  {
    icon: Zap,
    en: "Practical",
    ko: "실행",
    desc: "이론보다 실행을 중시합니다. AI는 아는 것보다 실제로 활용되는 것이 더 중요합니다.",
  },
  {
    icon: Link2,
    en: "Connectivity",
    ko: "연결",
    desc: "사람과 기술, 개인과 기업, 교육과 산업을 연결합니다.",
  },
  {
    icon: Shield,
    en: "Credibility",
    ko: "신뢰",
    desc: "신뢰할 수 있는 교육, 자격, 콘텐츠, 네트워크를 통해 AI 활용의 기준을 만들어갑니다.",
  },
  {
    icon: TrendingUp,
    en: "Growth",
    ko: "성장",
    desc: "지속 가능한 성장 구조를 지향합니다. 개인, 기업, 산업이 함께 성장하는 기반을 만듭니다.",
  },
];

export default function VisionSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <section id="vision" className="py-16 sm:py-24 bg-[#102741] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#12CAE2]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-5 sm:px-4">
        {/* Vision & Mission header */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12 sm:mb-20">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#E6F9FF] mb-3 sm:mb-4">
              Vision & Mission
            </h2>
            <div className="w-16 h-1 bg-[#12CAE2] mb-6 sm:mb-8" />

            <p className="text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
              VISION
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#E6F9FF] leading-relaxed mb-8 sm:mb-10">
              AI 시대의 새로운 실행력과 성장 구조를 설계하는 대표 협회
            </p>

            <p className="text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
              MISSION
            </p>
            <div className="space-y-2 sm:space-y-3">
              {missions.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#12CAE2]/20 text-[#12CAE2] text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-[#E6F9FF]/80 text-xs sm:text-sm">{m}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Video replacing the image */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
              {/* Fallback image */}
              <img
                src={FALLBACK_IMG}
                alt="AI 에코시스템 시각화"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-0" : "opacity-100"}`}
              />
              {/* Video */}
              <video
                ref={videoRef}
                src={VIDEO_URL}
                muted
                loop
                playsInline
                autoPlay
                onLoadedData={() => setVideoLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
              />
              {/* Subtle overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#102741]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-12 sm:mb-20">
          <p className="text-center text-sm font-bold text-[#4ADE80] tracking-widest uppercase mb-2 sm:mb-3">
            CORE VALUES
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-[#E6F9FF] text-center mb-8 sm:mb-12">
            핵심 가치
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
            {coreValues.map((v) => (
              <div
                key={v.en}
                className="glass-card p-4 sm:p-8 hover:border-[#12CAE2]/30 transition-all duration-300"
              >
                <v.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#12CAE2] mb-3 sm:mb-4" />
                <h4 className="text-sm sm:text-lg font-bold text-[#E6F9FF] mb-1">
                  {v.en}
                </h4>
                <p className="text-[#12CAE2] text-xs mb-2 sm:mb-3">{v.ko}</p>
                <p className="text-[#E6F9FF]/70 text-xs sm:text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
