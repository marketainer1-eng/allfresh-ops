import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, TrendingDown, BarChart3, ChevronRight,
  Package2, Zap, Star, TriangleAlert,
} from "lucide-react";
import {
  getCampaignPhase, getFruitSeasonPhase,
  PHASE_LABELS, PHASE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  TASK_TYPE_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  CHANNEL_LABELS,
  formatKRW, formatPct, hasDelayedTasks,
} from "@/lib/fruit-utils";
import { formatDate } from "@/lib/utils";

export default async function FruitDetailPage({ params }: { params: { fruitId: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const fruit = await prisma.fruit.findFirst({
    where: { id: params.fruitId, workspaceId },
    include: {
      campaigns: {
        orderBy: { year: "desc" },
        include: {
          tasks: { orderBy: { dueDate: "asc" } },
          performances: true,
          insights: { orderBy: { sourceYear: "desc" } },
        },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { campaign: { select: { title: true, year: true } } },
      },
      performances: true,
      insights: { orderBy: { sourceYear: "desc" } },
    },
  });

  if (!fruit) notFound();

  const now = new Date();

  // 캠페인 분류
  const currentCampaign = fruit.campaigns.find(
    (c) => c.status === "active" || c.status === "planned"
  ) ?? fruit.campaigns[0] ?? null;
  const prevCampaign = fruit.campaigns.find(
    (c) => c.status === "completed" && c !== currentCampaign
  ) ?? null;

  const phase = currentCampaign
    ? getCampaignPhase(currentCampaign)
    : getFruitSeasonPhase(fruit);
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const phaseColor = PHASE_COLORS[phase] ?? "bg-gray-100 text-gray-600";

  // 지연 태스크
  const delayedTasks = fruit.tasks.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now
  );
  const isRisk = delayedTasks.length > 0;

  // 현재 캠페인 태스크
  const currentTasks = fruit.tasks.filter(
    (t) => t.campaignId === currentCampaign?.id
  );
  const doneTasks = currentTasks.filter((t) => t.status === "done");

  // 이전 시즌 성과
  const prevPerfs = prevCampaign?.performances ?? [];
  const currentPerfs = currentCampaign?.performances ?? [];

  // 최신 인사이트
  const latestInsight = fruit.insights[0] ?? null;

  // 마일스톤
  const milestones = currentCampaign
    ? [
        { label: "소싱 시작", date: currentCampaign.sourcingStartDate },
        { label: "가격 확정", date: currentCampaign.pricingDueDate },
        { label: "콘텐츠 완료", date: currentCampaign.contentDueDate },
        { label: "판매 시작", date: currentCampaign.launchDate },
        { label: "피크 시작", date: currentCampaign.promoPeakStartDate },
        { label: "피크 종료", date: currentCampaign.promoPeakEndDate },
        { label: "리뷰·정산", date: currentCampaign.reviewDate },
      ].filter((m) => !!m.date)
    : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link href="/app" className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl">{fruit.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{fruit.name}</h1>
                <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${phaseColor}`}>
                  {phaseLabel}
                </span>
                {isRisk && (
                  <span className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> 지연 리스크
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{fruit.variety} · {fruit.category} · 제철 {fruit.seasonStartMonth}월~{fruit.seasonEndMonth}월</p>
            </div>
          </div>
          {fruit.description && (
            <p className="text-sm text-gray-600 ml-14 leading-relaxed">{fruit.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/app/calendar" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg bg-white">
            캘린더 보기
          </Link>
          <Link href={`/app/fruits/${fruit.id}/edit`} className="text-xs text-white px-3 py-1.5 bg-green-600 rounded-lg hover:bg-green-700">
            편집
          </Link>
        </div>
      </div>

      {/* ── 지연 리스크 알림 ───────────────────────────────────────── */}
      {isRisk && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-800">지금 바로 처리해야 합니다</h2>
          </div>
          <div className="space-y-2">
            {delayedTasks.map((task) => {
              const daysPast = Math.floor((now.getTime() - new Date(task.dueDate!).getTime()) / 86400000);
              return (
                <div key={task.id} className="bg-white rounded-lg px-4 py-3 border border-red-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                      {task.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-red-600 font-bold">{daysPast}일 초과</p>
                      <p className="text-xs text-gray-400">{formatDate(task.dueDate!)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2025 문제 → 2026 반영 스토리 ─────────────────────────── */}
      {latestInsight && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-amber-900">
              {latestInsight.sourceYear} 성과 → {latestInsight.sourceYear + 1} 반영 포인트
            </h2>
            {latestInsight.linkedToNextCampaign && (
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium ml-auto">
                올해 캠페인 반영됨
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 작년 결과 */}
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                📊 {latestInsight.sourceYear} 결과
              </p>
              <div className="space-y-1">
                {latestInsight.summary.split("\n").map((line, i) => (
                  <p key={i} className="text-xs text-gray-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
            {/* 올해 반영 */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                ✅ {latestInsight.sourceYear + 1} 반영 액션
              </p>
              <div className="space-y-1">
                {latestInsight.recommendation.split("\n").map((line, i) => (
                  <p key={i} className={`text-xs leading-relaxed ${line.startsWith("→ [반드시") ? "text-red-700 font-medium" : "text-gray-700"}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 현재 캠페인 일정 ───────────────────────────────────────── */}
      {currentCampaign && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">{currentCampaign.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[currentCampaign.status]}`}>
                  {CAMPAIGN_STATUS_LABELS[currentCampaign.status]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColor}`}>
                  현재: {phaseLabel}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">완료 태스크</p>
              <p className="text-lg font-bold text-gray-900">{doneTasks.length}/{currentTasks.length}</p>
            </div>
          </div>

          {currentCampaign.notes && (
            <div className="bg-blue-50 rounded-lg px-4 py-2 mb-4 text-xs text-blue-800 leading-relaxed">
              📌 {currentCampaign.notes}
            </div>
          )}

          {/* 진행률 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>소싱 시작 {currentCampaign.sourcingStartDate ? formatDate(currentCampaign.sourcingStartDate) : "-"}</span>
              <span>리뷰 {currentCampaign.reviewDate ? formatDate(currentCampaign.reviewDate) : "-"}</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              {(() => {
                const start = currentCampaign.sourcingStartDate ? new Date(currentCampaign.sourcingStartDate).getTime() : now.getTime();
                const end = currentCampaign.reviewDate ? new Date(currentCampaign.reviewDate).getTime() : now.getTime() + 86400000 * 365;
                const total = end - start;
                const elapsed = Math.min(Math.max(now.getTime() - start, 0), total);
                const pct = (elapsed / total) * 100;
                return <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />;
              })()}
            </div>
          </div>

          {/* 마일스톤 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {milestones.map((m) => {
              const isPast = m.date && new Date(m.date) < now;
              return (
                <div
                  key={m.label}
                  className={`rounded-lg px-3 py-2 text-center ${isPast ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"}`}
                >
                  <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                  <p className={`text-xs font-semibold ${isPast ? "text-green-700" : "text-gray-700"}`}>
                    {m.date ? formatDate(m.date) : "-"}
                  </p>
                  {isPast && <CheckCircle2 className="w-3 h-3 text-green-500 mx-auto mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 채널별 가격·마진 성과 ─────────────────────────────────── */}
      {prevPerfs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">채널별 성과 ({prevCampaign?.year ?? "이전 시즌"})</h2>
          <p className="text-xs text-gray-400 mb-4">이 데이터가 올해 가격·물량 전략에 반영됩니다</p>
          <div className="space-y-3">
            {prevPerfs.map((perf) => (
              <div key={perf.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {CHANNEL_LABELS[perf.channel] ?? perf.channel}
                    </span>
                    {perf.marginRate >= 25 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        고마진
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-gray-400">매출</p>
                    <p className="text-sm font-bold text-gray-900">{formatKRW(perf.salesAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">마진율</p>
                    <p className={`text-sm font-bold ${perf.marginRate >= 25 ? "text-green-600" : "text-gray-900"}`}>
                      {perf.marginRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">전환율</p>
                    <p className="text-sm font-bold text-gray-900">{perf.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">CS 건수</p>
                    <p className={`text-sm font-bold ${perf.csCount > 15 ? "text-orange-600" : "text-gray-900"}`}>
                      {perf.csCount}건
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">반품율</p>
                    <p className={`text-sm font-bold ${perf.returnRate > 2 ? "text-orange-600" : "text-gray-900"}`}>
                      {perf.returnRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {perf.reviewSummary && (
                  <div className="bg-gray-50 rounded px-3 py-2 text-xs text-gray-600 mb-1 leading-relaxed">
                    <span className="text-gray-400 font-medium">리뷰 요약 </span>{perf.reviewSummary}
                  </div>
                )}
                {perf.nextAction && (
                  <div className="bg-blue-50 rounded px-3 py-2 text-xs text-blue-700 leading-relaxed">
                    <span className="font-medium">→ 올해 반영 </span>{perf.nextAction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 주요 태스크 ─────────────────────────────────────────────── */}
      {currentTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">주요 태스크</h2>
            <span className="text-xs text-gray-400">완료 {doneTasks.length}/{currentTasks.length}</span>
          </div>
          <div className="space-y-2">
            {currentTasks.map((task) => {
              const isPast = task.dueDate && new Date(task.dueDate) < now;
              const isOverdue = isPast && task.status !== "done";
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
                    isOverdue
                      ? "bg-red-50 border-red-200"
                      : task.status === "done"
                      ? "bg-gray-50 border-gray-100"
                      : task.status === "in_progress"
                      ? "bg-blue-50 border-blue-100"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {task.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : task.status === "in_progress" ? (
                      <Clock className="w-4 h-4 text-blue-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {task.title}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${TASK_STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {TASK_STATUS_LABELS[task.status] ?? task.status}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {TASK_TYPE_LABELS[task.type] ?? task.type}
                      </span>
                    </div>
                    {task.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.notes}</p>
                    )}
                    {task.dueDate && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                        마감 {formatDate(task.dueDate)}
                        {isOverdue && " · ⚠️ 기한 초과"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 이전 시즌 요약 (있을 때만) ────────────────────────────── */}
      {prevCampaign && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            {prevCampaign.year} 시즌 요약 (완료)
          </h2>
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-sm text-gray-600 leading-relaxed">
            {prevCampaign.notes}
          </div>
          {prevCampaign.performances.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {prevCampaign.performances.slice(0, 3).map((p) => (
                <div key={p.id} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{CHANNEL_LABELS[p.channel] ?? p.channel}</p>
                  <p className="text-sm font-bold text-gray-900">{formatKRW(p.salesAmount)}</p>
                  <p className="text-xs text-green-600 font-medium">마진 {p.marginRate.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 링크 하단 ─────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Link
          href="/app/reports"
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          <BarChart3 className="w-4 h-4" /> 성과 리포트 보기
        </Link>
        <Link
          href="/app/calendar"
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          연간 캘린더 보기
        </Link>
      </div>

    </div>
  );
}
