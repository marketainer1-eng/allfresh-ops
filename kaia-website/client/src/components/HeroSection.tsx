/*
 * Design: Tech Corporate Dark
 * - Full-screen hero with AI video background
 * - Dark navy overlay with cyan accent text
 * - Centered content with CTA button
 * - Mobile: smaller fonts, tighter spacing
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

const VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/ai-network-bg_08bfe318.mp4";
const FALLBACK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/hero-brain-network-n65JDqDqKKGgrnX7oHzTaP.webp";

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay blocked - fallback image will show
      });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fallback Background Image (shows while video loads) */}
      <div className="absolute inset-0">
        <img
          src={FALLBACK_IMG}
          alt="AI neural network background"
          className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-0" : "opacity-100"}`}
        />
      </div>

      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-[#0A1829]/60" />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1829] via-transparent to-[#0A1829]/30" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 sm:px-4">
        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-gradient mb-3 sm:mb-4 tracking-tight">
          KAIA
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl font-black text-gradient mb-6 sm:mb-8">
          AI에이전트협회
        </p>
        <div className="relative pl-4 sm:pl-5 border-l-2 border-[#12CAE2]/50 inline-block text-left mb-6 sm:mb-8">
          <p className="text-base sm:text-xl md:text-2xl text-[#E6F9FF] font-medium leading-relaxed">
            AI 에이전트,
            <br />
            이제 당신의 비즈니스에 일하게 하세요
          </p>
        </div>
        <p className="text-[#E6F9FF]/50 text-xs sm:text-sm mb-6 sm:mb-8">
          Korea AI Agent Association · 2026
        </p>
        <Link
          href="/about"
          className="inline-block px-6 sm:px-8 py-3 border border-[#4ADE80] text-[#4ADE80] text-sm font-medium rounded hover:bg-[#4ADE80]/10 transition-all duration-300"
        >
          자세히 알아보기
        </Link>
      </div>

      {/* Bottom link */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
        <a
          href="http://aiagent.io.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#12CAE2]/60 text-xs hover:text-[#12CAE2] transition-colors"
        >
          aiagent.io.kr
        </a>
      </div>
    </section>
  );
}
