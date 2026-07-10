/*
 * Design: Tech Corporate Dark - Footer
 * - Dark background with KAIA logo image, address, and copyright
 * - Mobile: stacked layout with proper spacing
 */

import { MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="py-8 sm:py-10 bg-[#0A1829] border-t border-[#12CAE2]/10">
      <div className="container px-5 sm:px-4">
        {/* Top row: Logo + Address */}
        <div className="flex flex-col gap-5 sm:gap-6 md:flex-row md:items-start md:justify-between mb-6 sm:mb-8">
          <Link href="/" className="flex items-center">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/kaia-logo-transparent_286ae696.png"
              alt="KAIA AI에이전트협회"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#12CAE2] mt-0.5 shrink-0" />
            <div className="text-sm text-[#E6F9FF]/60 leading-relaxed">
              <p className="text-[#E6F9FF]/80 font-medium mb-1">협회 주소</p>
              <p>서울특별시 강남구 잠원동 10-65</p>
              <p className="text-[#E6F9FF]/40">3호선 신사역 도보 7분</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#12CAE2]/10 mb-4 sm:mb-6" />

        {/* Management notice */}
        <p className="text-xs text-[#E6F9FF]/50 mb-4 sm:mb-5">
          (에이아이(AI))에이전트협회는 주식회사 넥서스그룹에서 운영관리합니다.
        </p>

        {/* Bottom row: Copyright */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs text-[#E6F9FF]/40">
            &copy; 2026 AI에이전트협회. All rights reserved.
          </span>
          <a
            href="http://aiagent.io.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#12CAE2]/50 hover:text-[#12CAE2] transition-colors"
          >
            aiagent.io.kr
          </a>
        </div>
      </div>
    </footer>
  );
}
