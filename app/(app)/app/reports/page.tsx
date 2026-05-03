import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, TrendingDown, BarChart3,
  AlertTriangle, CheckCircle2, ArrowRight, ChevronRight,
} from "lucide-react";
import { CHANNEL_LABELS, formatKRW, formatPct } from "@/lib/fruit-utils";

export default async function ReportsPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  // 3개 과일 + 전체 성과 로드
  const fruits = await prisma.fruit.findMany({
    where: {
      workspaceId,
      isActive: true,
      name: { in: ["딸기", "망고", "샤인머스캣"] },
    },
    orderBy: [{ priorityLevel: "desc" }],
    include: {
      performances: true,
      insights: { orderBy: { sourceYear: "desc" }, take: 1 },
      campaigns: {
        orderBy: { year: "desc" },
        take: 3,
        include: { performances: true },
      },
    },
  });

  // 전체 성과 집계
  const allPerfs = fruits.flatMap((f) => f.performances);
  const totalSales = allPerfs.reduce((s, p) => s + p.salesAmount, 0);
  const totalMargin = allPerfs.reduce((s, p) => s + p.marginAmount, 0);
  const avgMarginRate = allPerfs.length ? allPerfs.reduce((s, p) => s + p.marginRate, 0) / allPerfs.length : 0;
  const avgConvRate = allPerfs.length ? allPerfs.reduce((s, p) => s + p.conversionRate, 0) / allPerfs.length : 0;
  const totalCs = allPerfs.reduce((s, p) => s + p.csCount, 0);
  const avgReturnRate = allPerfs.length ? allPerfs.reduce((s, p) => s + p.returnRate, 0) / allPerfs.length : 0;

  // 채널별 집계
  const channelMap: Record<string, { sales: number; margin: number; cs: number; count: number }> = {};
  for (const p of allPerfs) {
    if (!channelMap[p.channel]) channelMap[p.channel] = { sales: 0, margin: 0, cs: 0, count: 0 };
    channelMap[p.channel].sales += p.salesAmount;
    channelMap[p.channel].margin += p.marginAmount;
    channelMap[p.channel].cs += p.csCount;
    channelMap[p.channel].count += 1;
  }
  const channels = Object.entries(channelMap).sort((a, b) => b[1].sales - a[1].sales);

  // 과일별 매출 (막대 비율용)
  const fruitSales = fruits.map((f) => ({
    fruit: f,
    sales: f.performances.reduce((s, p) => s + p.salesAmount, 0),
    margin: f.performances.reduce((s, p) => s + p.marginAmount, 0),
    marginRate: f.performances.length
      ? f.performances.reduce((s, p) => s + p.marginRate, 0) / f.performances.length
      : 0,
    csCount: f.performances.reduce((s, p) => s + p.csCount, 0),
  })).sort((a, b) => b.sales - a.sales);

  const maxSales = Math.max(...fruitSales.map((f) => f.sales), 1);

  // 2026 실행 계획
  const plans: { emoji: string; name: string; year: number; items: string[] }[] = [
    {
      emoji: "🍓", name: "딸기", year: 2026,
      items: [
        "에어캡 내장 박스로 포장 교체 → CS 50% 감소 목표",
        "마켓컬리 선물세트 2종(500g/1kg) 신규 출시",
        "쿠팡 로켓프레시 비중 70%→85% 확대",
        "스마트스토어 상세페이지 신선도 인증 배너 추가",
        "마켓컬리 MD 기획전 입점 협의 (1월 3주차 목표)",
      ],
    },
    {
      emoji: "🍇", name: "샤인머스캣", year: 2026,
      items: [
        "물량 30% 증편 (품절 2회 기회 손실 방지)",
        "5월 이전 산지 조기 계약 완료 (단가 고정)",
        "선물세트 3종 구성 (1kg/2kg/혼합세트)",
        "SSG + 마켓컬리 동시 기획전 론칭",
        "프리미엄 패키지 디자인 교체",
      ],
    },
    {
      emoji: "🥭", name: "망고", year: 2026,
      items: [
        "⚠️ 제주 JM농장 대체 농장 긴급 확보 (현재 지연)",
        "수입 애플망고(태국/필리핀) 단가 비교 병행",
        "소싱 다변화로 가격 변동성 완충",
        "산지 스토리 중심 상세페이지 제작",
        "여름 피크(7~8월) 재고 소진 집중 전략",
      ],
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/app" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">성과 리포트</h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            2025 시즌 결과 → 2026 실행 계획 연결
          </p>
        </div>
        <Link href="/app/calendar" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg bg-white flex items-center gap-1">
          캘린더 보기 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── 2025 KPI 요약 ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          📊 2025 시즌 전체 KPI
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "누적 매출", value: formatKRW(totalSales), sub: "딸기+샤인머스캣", color: "text-gray-900" },
            { label: "누적 마진", value: formatKRW(totalMargin), sub: `마진율 ${avgMarginRate.toFixed(1)}%`, color: "text-green-600" },
            { label: "평균 전환율", value: `${avgConvRate.toFixed(1)}%`, sub: "전채널 평균", color: "text-blue-600" },
            { label: "전체 CS 건수", value: `${totalCs}건`, sub: `반품율 ${avgReturnRate.toFixed(1)}%`, color: totalCs > 30 ? "text-orange-600" : "text-gray-900" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 과일별 매출 바 차트 ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">과일별 매출 순위 (2025)</h2>
        <div className="space-y-4">
          {fruitSales.map(({ fruit, sales, marginRate, csCount }) => (
            <div key={fruit.id}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{fruit.emoji}</span>
                  <Link href={`/app/fruits/${fruit.id}`} className="font-medium text-gray-900 hover:text-green-700">
                    {fruit.name}
                  </Link>
                  {marginRate >= 25 && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      고마진
                    </span>
                  )}
                  {fruit.name === "망고" && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                      2025 데이터 없음
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{formatKRW(sales)}</span>
                  <span className={`font-medium ${marginRate >= 25 ? "text-green-600" : "text-gray-600"}`}>
                    마진 {marginRate.toFixed(1)}%
                  </span>
                  <span>CS {csCount}건</span>
                </div>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${fruit.name === "망고" ? "bg-gray-200" : fruit.name === "샤인머스캣" ? "bg-purple-400" : "bg-green-500"}`}
                  style={{ width: `${(sales / maxSales) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 채널별 성과 집계 ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">채널별 성과 집계 (2025)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium py-2 pr-4">채널</th>
                <th className="text-right text-xs text-gray-400 font-medium py-2 pr-4">매출</th>
                <th className="text-right text-xs text-gray-400 font-medium py-2 pr-4">마진</th>
                <th className="text-right text-xs text-gray-400 font-medium py-2 pr-4">마진율</th>
                <th className="text-right text-xs text-gray-400 font-medium py-2">CS</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(([channel, data]) => (
                <tr key={channel} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {CHANNEL_LABELS[channel] ?? channel}
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                    {formatKRW(data.sales)}
                  </td>
                  <td className="py-3 pr-4 text-right text-green-600 font-semibold">
                    {formatKRW(data.margin)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (data.margin / data.sales * 100) >= 25
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {(data.margin / data.sales * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-500">
                    {data.cs}건
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2025 → 2026 전환 핵심 이슈 ────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          🔄 2025 결과 → 2026 실행 계획
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const fruitData = fruits.find((f) => f.name === plan.name);
            const insight = fruitData?.insights[0];
            return (
              <div key={plan.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* 카드 헤더 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.year} 실행 계획</p>
                    </div>
                  </div>
                </div>

                {/* 2025 한줄 요약 */}
                {insight && (
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 mb-1">2025 핵심 결과</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {insight.summary.split("\n")[0]}
                    </p>
                  </div>
                )}

                {/* 2026 실행 항목 */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">2026 반영 사항</p>
                  <ul className="space-y-1.5">
                    {plan.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {item.startsWith("⚠️") ? (
                          <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-xs leading-relaxed ${item.startsWith("⚠️") ? "text-red-700 font-medium" : "text-gray-700"}`}>
                          {item.replace("⚠️ ", "")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {fruitData && (
                  <div className="px-4 pb-3">
                    <Link
                      href={`/app/fruits/${fruitData.id}`}
                      className="block text-center text-xs text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 rounded-lg py-2 transition-colors"
                    >
                      {plan.name} 상세 보기 →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 채널별 다음 시즌 액션 ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">채널별 2026 전략 포인트</h2>
        <div className="space-y-3">
          {[
            {
              channel: "마켓컬리",
              emoji: "🛒",
              prev: "딸기 6.1% 전환율, 샤인머스캣 27% 마진율 달성",
              next: "딸기 선물세트 2종 신규 + 샤인머스캣 기획전 동시 론칭",
              color: "border-l-purple-400",
            },
            {
              channel: "쿠팡",
              emoji: "🚀",
              prev: "딸기 매출 4,850만원 달성. 포장 CS 14건(61%) 문제",
              next: "에어캡 박스 교체 → CS 감소 목표. 로켓프레시 비중 85%로 확대",
              color: "border-l-orange-400",
            },
            {
              channel: "SSG",
              emoji: "🏪",
              prev: "샤인머스캣 2,800만원 / 마진율 26%. 프리미엄 수요 확인",
              next: "샤인머스캣 프리미엄 선물세트 단독 기획 + 마켓컬리 동시 론칭",
              color: "border-l-red-400",
            },
          ].map((item) => (
            <div key={item.channel} className={`border-l-4 ${item.color} bg-gray-50 rounded-r-lg pl-4 pr-4 py-3`}>
              <div className="flex items-center gap-2 mb-2">
                <span>{item.emoji}</span>
                <span className="font-semibold text-gray-900 text-sm">{item.channel}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">2025 결과</p>
                  <p className="text-xs text-gray-700">{item.prev}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">2026 전략</p>
                  <p className="text-xs text-green-700 font-medium">{item.next}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
