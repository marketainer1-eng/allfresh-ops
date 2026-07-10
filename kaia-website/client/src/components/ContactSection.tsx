/*
 * Design: Tech Corporate Dark - Contact Section
 * - Light background
 * - Contact info, address, phone, email, Google Map, and partner logos
 * - Mobile: single column, smaller cards, reduced map height
 */

import { Building2, MapPin, Globe, Phone, Mail, Clock, Navigation } from "lucide-react";

const partners = [
  { name: "명지대학교", url: null },
  { name: "SQREEM", url: null },
  { name: "한국쇼핑몰협회", url: null },
  { name: "한국버티컬AI협회", url: null },
  { name: "걸스유니버스", url: null },
  { name: "GBK엔터테인먼트", url: "https://girlsuniverse.kr/" },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-16 sm:py-24 bg-[#F5F7F9]">
      <div className="container px-5 sm:px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0A1829] text-center mb-3 sm:mb-4">
          Contact
        </h2>
        <p className="text-center text-[#707D8F] text-sm mb-10 sm:mb-16 max-w-xl mx-auto">
          AI에이전트협회에 문의하시거나 방문해 주세요
        </p>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-10 max-w-5xl mx-auto mb-10 sm:mb-16">
          {/* Left: Contact Info Cards */}
          <div className="space-y-3 sm:space-y-5">
            {/* Organization */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#12CAE2]/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#12CAE2]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[#707D8F] mb-0.5 sm:mb-1 font-medium uppercase tracking-wider">협회명</p>
                  <p className="text-[#0A1829] font-semibold text-sm sm:text-base">AI에이전트협회</p>
                  <p className="text-xs sm:text-sm text-[#707D8F]">Korea AI Agent Association (KAIA)</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#4ADE80]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#4ADE80]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[#707D8F] mb-0.5 sm:mb-1 font-medium uppercase tracking-wider">협회 주소</p>
                  <p className="text-[#0A1829] font-semibold text-sm sm:text-base">서울특별시 강남구 잠원동 10-65</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Navigation className="w-3 h-3 text-[#707D8F]" />
                    <p className="text-xs sm:text-sm text-[#707D8F]">3호선 신사역 도보 7분</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#C4BFFF]/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B83FF]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[#707D8F] mb-0.5 sm:mb-1 font-medium uppercase tracking-wider">연락처</p>
                  <a href="tel:02-1661-7537" className="text-[#0A1829] font-semibold text-sm sm:text-base hover:text-[#12CAE2] transition-colors">
                    02-1661-7537
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-[#707D8F]" />
                    <p className="text-xs sm:text-sm text-[#707D8F]">평일 09:00 – 18:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#ED93B1]/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#ED93B1]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[#707D8F] mb-0.5 sm:mb-1 font-medium uppercase tracking-wider">이메일</p>
                  <a href="mailto:hkspmh@naver.com" className="text-[#0A1829] font-semibold text-sm sm:text-base hover:text-[#12CAE2] transition-colors">
                    hkspmh@naver.com
                  </a>
                  <p className="text-xs sm:text-sm text-[#707D8F] mt-1">문의 및 제휴 관련 연락</p>
                </div>
              </div>
            </div>

            {/* Website */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#12CAE2]/10 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#12CAE2]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[#707D8F] mb-0.5 sm:mb-1 font-medium uppercase tracking-wider">웹사이트</p>
                  <a
                    href="http://aiagent.io.kr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#12CAE2] font-semibold text-sm sm:text-base hover:underline"
                  >
                    aiagent.io.kr
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Google Map */}
          <div className="flex flex-col gap-3 sm:gap-5">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex-1 min-h-[280px] sm:min-h-[400px]">
              <iframe
                title="AI에이전트협회 위치"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.8!2d127.0195!3d37.5185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca1e78a4e1b1d%3A0x0!2z7ISc7Jq47Yq567OE7IucIOqwleuCqOq1rCDsnqDsm5Drj5kgMTAtNjU!5e0!3m2!1sko!2skr!4v1700000000000!5m2!1sko!2skr"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "280px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="bg-[#0A1829] rounded-xl p-4 sm:p-5 text-center">
              <p className="text-[#12CAE2] font-bold text-xs sm:text-sm mb-1">오시는 길</p>
              <p className="text-[#E6F9FF]/70 text-xs sm:text-sm">
                3호선 신사역 하차 → 도보 7분
              </p>
            </div>
          </div>
        </div>

        {/* Partners */}
        <div className="border-t border-gray-200 pt-8 sm:pt-12">
          <p className="text-center text-xs sm:text-sm text-[#707D8F] mb-4 sm:mb-6 font-medium uppercase tracking-wider">Partners</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {partners.map((p) => (
              p.url ? (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-[#0A1829] border border-gray-200 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 bg-white shadow-sm hover:shadow-md hover:border-[#12CAE2]/30 transition-all duration-300 hover:text-[#12CAE2]"
                >
                  {p.name}
                </a>
              ) : (
                <span
                  key={p.name}
                  className="text-xs sm:text-sm text-[#0A1829] border border-gray-200 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 bg-white shadow-sm hover:shadow-md hover:border-[#12CAE2]/30 transition-all duration-300"
                >
                  {p.name}
                </span>
              )
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
