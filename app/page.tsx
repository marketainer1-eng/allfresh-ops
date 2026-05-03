import Link from "next/link";
import { ArrowRight, CalendarDays, BarChart3, Package2, TrendingUp } from "lucide-react";

const fruits = [
  {
    emoji: "🍓",
    name: "딸기",
    variety: "설향",
    season: "12월~5월 (피크 1~3월)",
    status: "판매 중",
    statusColor: "bg-green-100 text-green-700",
    highlight: "2026 포장 개선 + 선물세트 신규",
    margin: "마진율 20%",
    risk: false,
  },
  {
    emoji: "🍇",
    name: "샤인머스캣",
    variety: "샤인머스캣",
    season: "8월~11월 (피크 9~10월)",
    status: "기획 중",
    statusColor: "bg-purple-100 text-purple-700",
    highlight: "2025 마진율 27% → 2026 물량 30% 증편",
    margin: "마진율 27%",
    risk: false,
  },
  {
    emoji: "🥭",
    name: "망고",
    variety: "애플망고",
    season: "6월~9월 (피크 7~8월)",
    status: "⚠️ 소싱 지연",
    statusColor: "bg-red-100 text-red-700",
    highlight: "제주 농장 계약 지연 — 대체 농장 긴급 탐색",
    margin: "준비 중",
    risk: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OF</span>
            </div>
            <span className="font-bold text-gray-900">올프레쉬 OPS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#fruits" className="hover:text-gray-900">과일 포트폴리오</a>
            <a href="#flow" className="hover:text-gray-900">운영 방식</a>
            <a href="#insight" className="hover:text-gray-900">성과 연결</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
              로그인
            </Link>
            <Link
              href="/app"
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              대시보드 →
            </Link>
          </div>
        </div>
      </header>

      {/* ── 히어로 ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-1.5 rounded-full mb-6">
          🍓 과일 중심 이커머스 운영 플랫폼
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          시즌이 아니라<br />
          <span className="text-green-600">과일 중심</span>으로 운영합니다
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-4 leading-relaxed">
          딸기, 망고, 샤인머스캣 — 과일별로 소싱부터 판매·성과·내년 전략까지
          한 화면에서 이어집니다.
        </p>
        <p className="text-sm text-gray-400 mb-10">
          작년에 포장 불만이 61%였던 딸기는 올해 박스를 바꿨습니다.
          마진율 27%였던 샤인머스캣은 물량을 30% 늘렸습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            <span>🍓🥭🍇</span> 과일 대시보드 보기
          </Link>
          <a
            href="#flow"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            운영 방식 →
          </a>
        </div>
      </section>

      {/* ── 과일 포트폴리오 미리보기 ──────────────────────────────── */}
      <section id="fruits" className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">운영 중인 과일 3종</h2>
            <p className="text-gray-500 text-sm">각 과일의 현재 상태와 이번 시즌 핵심 포인트</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fruits.map((fruit) => (
              <div
                key={fruit.name}
                className={`bg-white rounded-xl border shadow-sm p-5 ${fruit.risk ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{fruit.emoji}</span>
                    <div>
                      <p className="font-bold text-gray-900">{fruit.name}</p>
                      <p className="text-xs text-gray-400">{fruit.variety}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fruit.statusColor}`}>
                    {fruit.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">제철</span>
                    <span>{fruit.season}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">성과</span>
                    <span className="font-medium text-green-700">{fruit.margin}</span>
                  </div>
                </div>
                <div className={`mt-3 px-3 py-2 rounded-lg text-xs leading-relaxed ${fruit.risk ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {fruit.highlight}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium"
            >
              대시보드에서 실시간 현황 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 운영 흐름 5단계 ───────────────────────────────────────── */}
      <section id="flow" className="py-16 max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">과일 하나의 운영 흐름</h2>
          <p className="text-gray-500 text-sm">소싱부터 내년 전략까지, 과일 중심으로 이어집니다</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: "01", icon: "📦", title: "소싱", desc: "산지 계약·리드타임 자동 계산", color: "bg-blue-50 border-blue-100" },
            { step: "02", icon: "💰", title: "가격·콘텐츠", desc: "채널별 판매가·상세페이지", color: "bg-yellow-50 border-yellow-100" },
            { step: "03", icon: "🚀", title: "판매 피크", desc: "기획전·광고·재고 관리", color: "bg-green-50 border-green-100" },
            { step: "04", icon: "📊", title: "성과 기록", desc: "매출·마진·CS·반품 분석", color: "bg-purple-50 border-purple-100" },
            { step: "05", icon: "🔄", title: "내년 연결", desc: "인사이트 → 다음 시즌 반영", color: "bg-orange-50 border-orange-100" },
          ].map((step, i) => (
            <div key={step.step} className="relative">
              <div className={`border rounded-xl p-4 text-center ${step.color}`}>
                <p className="text-xs text-gray-400 mb-1">{step.step}</p>
                <p className="text-2xl mb-2">{step.icon}</p>
                <p className="text-sm font-bold text-gray-900 mb-1">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
              {i < 4 && (
                <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 2025 → 2026 성과 연결 ─────────────────────────────────── */}
      <section id="insight" className="bg-gradient-to-br from-green-50 to-emerald-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">작년 성과가 올해 계획에 반영됩니다</h2>
            <p className="text-gray-500 text-sm">데이터 기반 운영 — 경험이 쌓일수록 더 정확해집니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🍓 딸기 — 2025 → 2026</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-orange-500 text-xs mt-0.5">▶</span>
                  <p className="text-sm text-gray-700">2025: 포장 관련 CS 14건 (전체 61%)</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <p className="text-sm text-green-700 font-medium">2026: 에어캡 내장 박스 교체 진행 중</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-500 text-xs mt-0.5">▶</span>
                  <p className="text-sm text-gray-700">2025: 마켓컬리 선물 수요 댓글 42건 확인</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <p className="text-sm text-green-700 font-medium">2026: 선물세트 2종 신규 출시 예정</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🍇 샤인머스캣 — 2025 → 2026</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-orange-500 text-xs mt-0.5">▶</span>
                  <p className="text-sm text-gray-700">2025: 추석 선물세트 품절 2회 (기회 손실 800만원)</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <p className="text-sm text-green-700 font-medium">2026: 물량 30% 증편 + 5월 조기 소싱</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-500 text-xs mt-0.5">▶</span>
                  <p className="text-sm text-gray-700">2025: SSG 단독 → 마켓컬리 추가 수요 확인</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <p className="text-sm text-green-700 font-medium">2026: SSG + 마켓컬리 동시 기획전 론칭</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              href="/app/reports"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> 전체 성과 리포트 보기
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-3xl mb-4">🍓🥭🍇</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            제철 전에 준비하고<br />시즌 후에 반영합니다
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            지금 딸기는 판매 중이고, 망고는 소싱 지연 상태이며,<br />
            샤인머스캣은 이미 선물세트 기획이 시작됐습니다.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-base"
          >
            대시보드 바로가기 <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── 푸터 ─────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>🍓 올프레쉬 OPS — 과일 중심 이커머스 운영 플랫폼 © 2026</p>
      </footer>
    </div>
  );
}
