import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, BarChart3, CalendarDays,
  CheckCircle2, Clock, TrendingUp, Zap, ChevronRight,
  Package2, Target, TriangleAlert,
} from "lucide-react";
import {
  getCampaignPhase, getFruitSeasonPhase,
  PHASE_LABELS, PHASE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  TASK_TYPE_LABELS, formatKRW, formatPct, hasDelayedTasks,
} from "@/lib/fruit-utils";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;
  const now = new Date();

  // ── 3개 과일만 집중 로드 (딸기·망고·샤인머스캣)
  const fruits = await prisma.fruit.findMany({
    where: {
      workspaceId,
      isActive: true,
      name: { in: ["딸기", "망고", "샤인머스캣"] },
    },
    orderBy: [{ priorityLevel: "desc" }, { name: "asc" }],
    include: {
      campaigns: {
        orderBy: { year: "desc" },
        take: 3,
        include: {
          tasks: { orderBy: { dueDate: "asc" } },
          performances: true,
        },
      },
      tasks: {
        where: { status: { in: ["pending", "in_progress", "delayed"] } },
        orderBy: { dueDate: "asc" },
        take: 10,
      },
      insights: { orderBy: { sourceYear: "desc" }, take: 1 },
      _count: { select: { campaigns: true } },
    },
  });

  // 지연 태스크 (과일 3종 한정)
  const delayedTasks = await prisma.fruitTask.findMany({
    where: {
      workspaceId,
      status: { notIn: ["done"] },
      dueDate: { lt: now },
      fruit: { name: { in: ["딸기", "망고", "샤인머스캣"] } },
    },
    include: { fruit: { select: { name: true, emoji: true } } },
    orderBy: { dueDate: "asc" },
  });

  // 다음 30일 이내 마감 태스크
  const soon = new Date(now.getTime() + 30 * 86400000);
  const upcomingTasks = await prisma.fruitTask.findMany({
    where: {
      workspaceId,
      status: { notIn: ["done"] },
      dueDate: { gte: now, lte: soon },
      fruit: { name: { in: ["딸기", "망고", "샤인머스캣"] } },
    },
    include: { fruit: { select: { name: true, emoji: true } } },
    orderBy: { dueDate: "asc" },
    take: 8,
  });

  // 성과 집계
  const allPerfs = await prisma.fruitPerformance.findMany({
    where: {
      workspaceId,
      fruit: { name: { in: ["딸기", "망고", "샤인머스캣"] } },
    },
  });
  const totalSales = allPerfs.reduce((s, p) => s + p.salesAmount, 0);
  const totalMargin = allPerfs.reduce((s, p) => s + p.marginAmount, 0);
  const avgMarginRate = allPerfs.length
    ? allPerfs.reduce((s, p) => s + p.marginRate, 0) / allPerfs.length
    : 0;

  // 과일별 데이터 가공
  const fruitData = fruits.map((fruit) => {
    const latestCampaign = fruit.campaigns[0] ?? null;
    const prevCampaign = fruit.campaigns[1] ?? null;
    const phase = latestCampaign
      ? getCampaignPhase(latestCampaign)
      : getFruitSeasonPhase(fruit);
    const isRisk = hasDelayedTasks(fruit.tasks);
    const pendingCount = fruit.tasks.filter((t) => t.status !== "done").length;
    const latestPerf = latestCampaign?.performances?.[0] ?? null;
    const prevPerf = prevCampaign?.performances?.[0] ?? null;

    // 다음 액션 (가장 급한 pending/in_progress 태스크)
    const nextTask = fruit.tasks.find((t) => t.status !== "done");

    return { fruit, latestCampaign, prevCampaign, phase, isRisk, pendingCount, latestPerf, prevPerf, nextTask };
  });

  // 지금 집중해야 할 과일 정렬 (리스크 > active > 나머지)
  const sorted = [...fruitData].sort((a, b) => {
    if (a.isRisk && !b.isRisk) return -1;
    if (!a.isRisk && b.isRisk) return 1;
    if (a.latestCampaign?.status === "active" && b.latestCampaign?.status !== "active") return -1;
    if (a.latestCampaign?.status !== "active" && b.latestCampaign?.status === "active") return 1;
    return 0;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🍓🥭🍇</span>
            <h1 className="text-2xl font-bold text-gray-900">과일 포트폴리오 현황</h1>
          </div>
          <p className="text-gray-500 text-sm">
            딸기 · 망고 · 샤인머스캣 — {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 기준
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/calendar" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <CalendarDays className="w-4 h-4" /> 연간 캘린더
          </Link>
          <Link href="/app/reports" className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700">
            <BarChart3 className="w-4 h-4" /> 성과 리포트
          </Link>
        </div>
      </div>

      {/* ── KPI 요약 카드 ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">2025 시즌 누적 매출</p>
          <p className="text-2xl font-bold text-gray-900">{formatKRW(totalSales)}</p>
          <p className="text-xs text-green-600 mt-1">딸기+샤인머스캣 합산</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">평균 마진율</p>
          <p className="text-2xl font-bold text-gray-900">{avgMarginRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">채널 전체 평균</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">진행 중 캠페인</p>
          <p className="text-2xl font-bold text-gray-900">
            {fruits.filter(f => f.campaigns.some(c => c.status === "active" || c.status === "planned")).length}개
          </p>
          <p className="text-xs text-blue-600 mt-1">딸기 active · 망고·샤인 planned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">지연 태스크</p>
          <p className={`text-2xl font-bold ${delayedTasks.length > 0 ? "text-red-600" : "text-gray-900"}`}>
            {delayedTasks.length}건
          </p>
          <p className="text-xs text-red-500 mt-1">
            {delayedTasks.length > 0 ? "즉시 확인 필요" : "지연 없음"}
          </p>
        </div>
      </div>

      {/* ── 지연 리스크 알림 (있을 때만) ──────────────────────────── */}
      {delayedTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-800">지연 리스크 — 즉시 확인 필요</h2>
          </div>
          <div className="space-y-2">
            {delayedTasks.map((task) => {
              const daysPast = Math.floor((now.getTime() - new Date(task.dueDate!).getTime()) / 86400000);
              return (
                <div key={task.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{task.fruit.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-red-500">
                        마감 {formatDate(task.dueDate!)} — <strong>{daysPast}일 초과</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {task.fruit.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3개 과일 메인 카드 ─────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-green-600" />
          지금 집중해야 할 과일
          <span className="text-xs font-normal text-gray-400 ml-1">리스크·active 순 정렬</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {sorted.map(({ fruit, latestCampaign, phase, isRisk, pendingCount, latestPerf, nextTask }) => {
            const phaseLabel = PHASE_LABELS[phase] ?? phase;
            const phaseColor = PHASE_COLORS[phase] ?? "bg-gray-100 text-gray-600";
            const statusColor = latestCampaign ? CAMPAIGN_STATUS_COLORS[latestCampaign.status] : "bg-gray-100 text-gray-600";
            const statusLabel = latestCampaign ? CAMPAIGN_STATUS_LABELS[latestCampaign.status] : "-";

            return (
              <Link
                key={fruit.id}
                href={`/app/fruits/${fruit.id}`}
                className={`block bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                  isRisk ? "border-red-300 ring-1 ring-red-200" : "border-gray-100"
                }`}
              >
                {/* 카드 헤더 */}
                <div className={`rounded-t-xl px-5 py-4 ${isRisk ? "bg-red-50" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{fruit.emoji}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{fruit.name}</h3>
                        <p className="text-xs text-gray-500">{fruit.variety}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColor}`}>
                        {phaseLabel}
                      </span>
                      {isRisk && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" /> 지연 리스크
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 카드 바디 */}
                <div className="px-5 py-4 space-y-3">
                  {/* 캠페인 상태 */}
                  {latestCampaign && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">현재 캠페인</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <span className="text-xs text-gray-600 truncate max-w-[120px]">{latestCampaign.title}</span>
                      </div>
                    </div>
                  )}

                  {/* 최신 성과 */}
                  {latestPerf && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400 mb-1">2025 채널 성과</p>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{formatKRW(latestPerf.salesAmount)}</p>
                          <p className="text-xs text-gray-400">매출</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${latestPerf.marginRate >= 25 ? "text-green-600" : "text-gray-900"}`}>
                            {latestPerf.marginRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">마진율</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{latestPerf.conversionRate.toFixed(1)}%</p>
                          <p className="text-xs text-gray-400">전환율</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 다음 액션 */}
                  {nextTask && (
                    <div className={`rounded-lg px-3 py-2 ${
                      isRisk && new Date(nextTask.dueDate!) < now
                        ? "bg-red-50 border border-red-100"
                        : "bg-blue-50 border border-blue-100"
                    }`}>
                      <p className="text-xs text-gray-400 mb-0.5">다음 액션</p>
                      <p className={`text-xs font-medium leading-snug ${
                        isRisk && new Date(nextTask.dueDate!) < now ? "text-red-700" : "text-blue-700"
                      }`}>
                        {nextTask.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        마감 {formatDate(nextTask.dueDate!)}
                        {new Date(nextTask.dueDate!) < now && (
                          <span className="text-red-500 font-medium"> · 기한 초과</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* 태스크 카운트 */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">
                      진행 중 태스크 <span className="font-semibold text-gray-700">{pendingCount}건</span>
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      상세 보기 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 다음 30일 주요 일정 ─────────────────────────────────────── */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              다음 30일 주요 일정
            </h2>
            <Link href="/app/calendar" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              캘린더 전체 보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task) => {
              const daysLeft = Math.ceil((new Date(task.dueDate!).getTime() - now.getTime()) / 86400000);
              return (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-base w-6 text-center">{task.fruit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.fruit.name} · {formatDate(task.dueDate!)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                    daysLeft <= 7 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    D-{daysLeft}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2025 인사이트 → 2026 반영 요약 ───────────────────────── */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-green-900">2025 성과 → 2026 반영 포인트</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sorted.map(({ fruit, latestPerf }) => {
            const insight = fruit.insights[0];
            if (!insight) return null;
            const recLines = insight.recommendation.split("\n").slice(0, 2);
            return (
              <div key={fruit.id} className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{fruit.emoji}</span>
                  <span className="font-medium text-gray-900 text-sm">{fruit.name}</span>
                  {latestPerf && (
                    <span className="ml-auto text-xs font-bold text-green-700">
                      마진 {latestPerf.marginRate.toFixed(0)}%
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {recLines.map((line, i) => (
                    <li key={i} className="text-xs text-gray-600 leading-relaxed">{line}</li>
                  ))}
                </ul>
                <Link
                  href={`/app/fruits/${fruit.id}`}
                  className="mt-2 text-xs text-green-700 hover:underline flex items-center gap-1"
                >
                  전체 인사이트 보기 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
