import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, Plus } from "lucide-react";
import {
  getCampaignPhase, getFruitSeasonPhase,
  PHASE_LABELS, PHASE_COLORS, PHASE_BAR_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  hasDelayedTasks, formatKRW,
} from "@/lib/fruit-utils";
import { formatDate } from "@/lib/utils";

export default async function FruitsPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const fruits = await prisma.fruit.findMany({
    where: { workspaceId, name: { in: ["딸기", "망고", "샤인머스캣"] } },
    orderBy: [{ priorityLevel: "desc" }, { seasonStartMonth: "asc" }],
    include: {
      campaigns: {
        orderBy: { year: "desc" },
        take: 2,
        include: {
          tasks: { orderBy: { dueDate: "asc" } },
          performances: true,
        },
      },
      tasks: { orderBy: { dueDate: "asc" } },
      performances: { orderBy: { createdAt: "desc" }, take: 1 },
      insights: { orderBy: { sourceYear: "desc" }, take: 1 },
      _count: { select: { campaigns: true, tasks: true } },
    },
  });

  const fruitsWithPhase = fruits.map((f) => {
    const latestCampaign = f.campaigns[0];
    const phase = latestCampaign
      ? getCampaignPhase(latestCampaign)
      : getFruitSeasonPhase(f);
    const isRisk = hasDelayedTasks(f.tasks);
    const pendingTasks = f.tasks.filter((t) => t.status !== "done");
    const latestPerf = f.performances[0];
    return { ...f, phase, isRisk, pendingTasks, latestPerf, latestCampaign };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand" />
            과일 포트폴리오
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            과일별 제철 일정, 캠페인, 성과를 관리합니다. 총 {fruits.length}종.
          </p>
        </div>
        <Link
          href="/app/fruits/new"
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          과일 추가
        </Link>
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <span className="text-xs text-gray-500 font-medium self-center">필터:</span>
        {[
          { label: "전체", href: "/app/fruits" },
          { label: "판매 중", href: "/app/fruits?phase=in_season" },
          { label: "준비 중", href: "/app/fruits?phase=preparing" },
          { label: "리스크", href: "/app/fruits?risk=true" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-brand hover:text-brand transition-colors"
          >
            {f.label}
          </Link>
        ))}
        <div className="flex-1" />
        <Link href="/app/calendar" className="text-xs text-brand hover:underline self-center">
          캘린더 보기 →
        </Link>
      </div>

      {/* 과일 카드 목록 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fruitsWithPhase.map((f) => (
          <div
            key={f.id}
            className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
              f.isRisk ? "border-red-200" : "border-gray-100"
            }`}
          >
            {/* 카드 상단 */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{f.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{f.name}</h3>
                    <p className="text-sm text-gray-500">{f.variety ?? f.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${PHASE_COLORS[f.phase]}`}>
                    {PHASE_LABELS[f.phase]}
                  </span>
                  {f.isRisk && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 지연 리스크
                    </span>
                  )}
                </div>
              </div>

              {/* 제철 Gantt 미니 */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>제철: {f.seasonStartMonth}월 ~ {f.seasonEndMonth}월</span>
                  <span>피크: {f.peakStartMonth}~{f.peakEndMonth}월</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full relative overflow-hidden">
                  {/* 제철 */}
                  {(() => {
                    const sStart = f.seasonStartMonth <= f.seasonEndMonth
                      ? ((f.seasonStartMonth - 1) / 12) * 100
                      : 0;
                    const sWidth = f.seasonStartMonth <= f.seasonEndMonth
                      ? ((f.seasonEndMonth - f.seasonStartMonth + 1) / 12) * 100
                      : 100;
                    return (
                      <div
                        className="absolute h-full bg-green-200"
                        style={{ left: `${sStart}%`, width: `${sWidth}%` }}
                      />
                    );
                  })()}
                  {/* 피크 */}
                  {(() => {
                    const pStart = f.peakStartMonth <= f.peakEndMonth
                      ? ((f.peakStartMonth - 1) / 12) * 100
                      : 0;
                    const pWidth = f.peakStartMonth <= f.peakEndMonth
                      ? ((f.peakEndMonth - f.peakStartMonth + 1) / 12) * 100
                      : 50;
                    return (
                      <div
                        className="absolute h-full bg-green-500"
                        style={{ left: `${pStart}%`, width: `${pWidth}%` }}
                      />
                    );
                  })()}
                  {/* 현재 월 마커 */}
                  <div
                    className="absolute h-full w-0.5 bg-brand z-10"
                    style={{ left: `${((new Date().getMonth()) / 12) * 100}%` }}
                  />
                </div>
              </div>

              {/* 성과 요약 */}
              {f.latestPerf && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "매출", value: formatKRW(f.latestPerf.salesAmount) },
                    { label: "마진율", value: `${f.latestPerf.marginRate.toFixed(1)}%` },
                    { label: "전환율", value: `${f.latestPerf.conversionRate.toFixed(1)}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">{stat.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 태스크 요약 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  대기 태스크{" "}
                  <span className={`font-semibold ${f.isRisk ? "text-red-600" : "text-gray-900"}`}>
                    {f.pendingTasks.length}건
                  </span>
                </span>
                <span>캠페인 {f._count.campaigns}개</span>
              </div>
            </div>

            {/* 최근 캠페인 */}
            {f.latestCampaign && (
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      {f.latestCampaign.year}년 최신 캠페인
                    </p>
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
                      {f.latestCampaign.title}
                    </p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${CAMPAIGN_STATUS_COLORS[f.latestCampaign.status]}`}>
                    {CAMPAIGN_STATUS_LABELS[f.latestCampaign.status]}
                  </span>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-gray-100 px-5 py-3">
              <Link
                href={`/app/fruits/${f.id}`}
                className="flex items-center justify-center gap-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
              >
                상세 보기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {fruits.length === 0 && (
        <div className="text-center py-24 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-4">🍓</p>
          <p className="text-gray-500 text-lg font-medium mb-2">등록된 과일이 없습니다</p>
          <p className="text-gray-400 text-sm mb-6">첫 번째 과일 포트폴리오를 추가해보세요.</p>
          <Link
            href="/app/fruits/new"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-brand-dark"
          >
            <Plus className="w-4 h-4" /> 과일 추가
          </Link>
        </div>
      )}
    </div>
  );
}
