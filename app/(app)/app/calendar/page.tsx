import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getCampaignPhase, PHASE_LABELS, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS, hasDelayedTasks } from "@/lib/fruit-utils";

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

// 월 기반 바 위치·너비 계산 (1월=0%, 12월=100%)
function barStyle(startMonth: number, endMonth: number, crossYear = false): { left: string; width: string } {
  const total = 12;
  let s = startMonth - 1;
  let e = endMonth - 1;
  if (crossYear && e < s) e += 12; // 연도 걸치는 경우
  const left = (s / total) * 100;
  const width = Math.max(((e - s + 1) / total) * 100, 4);
  return {
    left: `${Math.min(left, 100)}%`,
    width: `${Math.min(width, 100 - Math.min(left, 100))}%`,
  };
}

// 날짜 → 월 비율 (연간 바에서 정확한 위치)
function dateToPercent(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  return ((month * 30 + day) / 365) * 100;
}

export default async function CalendarPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentPct = dateToPercent(now);

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
        take: 2,
        include: {
          tasks: { orderBy: { dueDate: "asc" }, take: 5 },
        },
      },
      tasks: {
        where: { status: { notIn: ["done"] }, dueDate: { lt: now } },
        take: 5,
      },
    },
  });

  // 과일별 현재 단계 계산
  const fruitData = fruits.map((fruit) => {
    const currentCampaign = fruit.campaigns[0] ?? null;
    const phase = currentCampaign ? getCampaignPhase(currentCampaign) : null;
    const isRisk = hasDelayedTasks(fruit.tasks);
    return { fruit, currentCampaign, phase, isRisk };
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/app" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">과일 연간 운영 캘린더</h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            딸기 · 망고 · 샤인머스캣 — 소싱~판매~리뷰 전 구간 타임라인
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
          현재: <strong className="text-blue-700">{now.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</strong>
        </div>
      </div>

      {/* ── 범례 ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: "bg-blue-200", label: "소싱 기간" },
          { color: "bg-yellow-200", label: "가격·콘텐츠 준비" },
          { color: "bg-green-400", label: "판매 피크" },
          { color: "bg-green-200", label: "시즌 운영" },
          { color: "bg-gray-200", label: "리뷰·정산" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-3 rounded ${item.color}`} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-red-500 rounded" />
          <span className="text-gray-600">현재 시점</span>
        </div>
      </div>

      {/* ── 연간 타임라인 Gantt ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 월 헤더 */}
        <div className="flex border-b border-gray-100">
          <div className="w-44 flex-shrink-0 px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
            과일
          </div>
          <div className="flex-1 relative grid grid-cols-12 border-l border-gray-100">
            {MONTHS.map((m, i) => (
              <div
                key={m}
                className={`text-center py-3 text-xs font-medium border-r border-gray-100 last:border-0 ${
                  i + 1 === currentMonth ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-400"
                }`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* 과일별 행 */}
        {fruitData.map(({ fruit, currentCampaign, phase, isRisk }) => (
          <div key={fruit.id} className={`flex border-b border-gray-50 last:border-0 ${isRisk ? "bg-red-50/30" : ""}`}>
            {/* 과일 라벨 */}
            <div className="w-44 flex-shrink-0 px-4 py-4 bg-gray-50/50 border-r border-gray-100">
              <Link href={`/app/fruits/${fruit.id}`} className="flex items-center gap-2 group">
                <span className="text-xl">{fruit.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">{fruit.name}</p>
                  <p className="text-xs text-gray-400">{fruit.variety}</p>
                </div>
              </Link>
              {isRisk && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" /> 지연 리스크
                </div>
              )}
              {currentCampaign && (
                <p className="text-xs mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${CAMPAIGN_STATUS_COLORS[currentCampaign.status]}`}>
                    {CAMPAIGN_STATUS_LABELS[currentCampaign.status]}
                  </span>
                </p>
              )}
            </div>

            {/* 타임라인 영역 */}
            <div className="flex-1 relative border-l border-gray-100 py-3" style={{ minHeight: "80px" }}>
              {/* 현재 시점 선 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 opacity-70"
                style={{ left: `${currentPct}%` }}
              />

              {/* 월 격자선 */}
              {Array.from({ length: 11 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-gray-100"
                  style={{ left: `${((i + 1) / 12) * 100}%` }}
                />
              ))}

              {/* 제철 시즌 바 (연한 초록) */}
              {(() => {
                const cross = fruit.seasonStartMonth > fruit.seasonEndMonth;
                const style = barStyle(fruit.seasonStartMonth, cross ? 12 : fruit.seasonEndMonth);
                return (
                  <div
                    className="absolute h-4 rounded bg-green-100 border border-green-200"
                    style={{ top: "8px", ...style }}
                    title={`제철: ${fruit.seasonStartMonth}월~${fruit.seasonEndMonth}월`}
                  >
                    <span className="text-xs text-green-700 px-1 leading-4 truncate block">제철</span>
                  </div>
                );
              })()}

              {/* 피크 시즌 바 (진한 초록) */}
              {(() => {
                const style = barStyle(fruit.peakStartMonth, fruit.peakEndMonth);
                return (
                  <div
                    className="absolute h-4 rounded bg-green-400 border border-green-500"
                    style={{ top: "8px", ...style, zIndex: 2 }}
                    title={`피크: ${fruit.peakStartMonth}월~${fruit.peakEndMonth}월`}
                  >
                    <span className="text-xs text-white px-1 leading-4 font-medium truncate block">피크</span>
                  </div>
                );
              })()}

              {/* 캠페인 마일스톤 바들 */}
              {currentCampaign && (() => {
                const c = currentCampaign;
                const bars = [];

                // 소싱 구간
                if (c.sourcingStartDate && c.pricingDueDate) {
                  const s = new Date(c.sourcingStartDate);
                  const e = new Date(c.pricingDueDate);
                  const left = dateToPercent(s);
                  const width = Math.max(dateToPercent(e) - left, 3);
                  bars.push(
                    <div
                      key="sourcing"
                      className="absolute h-4 rounded bg-blue-200 border border-blue-300"
                      style={{ top: "30px", left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, zIndex: 2 }}
                      title="소싱 기간"
                    >
                      <span className="text-xs text-blue-800 px-1 leading-4 truncate block">소싱</span>
                    </div>
                  );
                }

                // 콘텐츠·마케팅 준비
                if (c.pricingDueDate && c.contentDueDate) {
                  const s = new Date(c.pricingDueDate);
                  const e = new Date(c.contentDueDate);
                  const left = dateToPercent(s);
                  const width = Math.max(dateToPercent(e) - left, 3);
                  bars.push(
                    <div
                      key="content"
                      className="absolute h-4 rounded bg-yellow-200 border border-yellow-300"
                      style={{ top: "30px", left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, zIndex: 3 }}
                      title="가격·콘텐츠 준비"
                    >
                      <span className="text-xs text-yellow-800 px-1 leading-4 truncate block">준비</span>
                    </div>
                  );
                }

                // 판매 피크 구간
                if (c.promoPeakStartDate && c.promoPeakEndDate) {
                  const s = new Date(c.promoPeakStartDate);
                  const e = new Date(c.promoPeakEndDate);
                  const left = Math.max(0, dateToPercent(s));
                  const right = Math.min(100, dateToPercent(e));
                  const width = Math.max(right - left, 3);
                  bars.push(
                    <div
                      key="peak"
                      className="absolute h-4 rounded bg-green-400 border border-green-500"
                      style={{ top: "30px", left: `${left}%`, width: `${width}%`, zIndex: 4 }}
                      title="판매 피크"
                    >
                      <span className="text-xs text-white px-1 leading-4 font-semibold truncate block">판매 피크</span>
                    </div>
                  );
                }

                // 리뷰 점
                if (c.reviewDate) {
                  const rv = new Date(c.reviewDate);
                  const left = dateToPercent(rv);
                  bars.push(
                    <div
                      key="review"
                      className="absolute w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow"
                      style={{ top: "33px", left: `${left}%`, transform: "translateX(-50%)", zIndex: 5 }}
                      title="리뷰 일정"
                    />
                  );
                }

                return bars;
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* ── 과일별 현재 단계 상세 카드 ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {fruitData.map(({ fruit, currentCampaign, phase, isRisk }) => {
          const milestones = currentCampaign ? [
            { label: "소싱 시작", date: currentCampaign.sourcingStartDate, done: currentCampaign.sourcingStartDate ? new Date(currentCampaign.sourcingStartDate) < now : false },
            { label: "가격 확정", date: currentCampaign.pricingDueDate, done: currentCampaign.pricingDueDate ? new Date(currentCampaign.pricingDueDate) < now : false },
            { label: "콘텐츠 완료", date: currentCampaign.contentDueDate, done: currentCampaign.contentDueDate ? new Date(currentCampaign.contentDueDate) < now : false },
            { label: "판매 시작", date: currentCampaign.launchDate, done: currentCampaign.launchDate ? new Date(currentCampaign.launchDate) < now : false },
            { label: "피크 시작", date: currentCampaign.promoPeakStartDate, done: currentCampaign.promoPeakStartDate ? new Date(currentCampaign.promoPeakStartDate) < now : false },
            { label: "피크 종료", date: currentCampaign.promoPeakEndDate, done: currentCampaign.promoPeakEndDate ? new Date(currentCampaign.promoPeakEndDate) < now : false },
            { label: "리뷰·정산", date: currentCampaign.reviewDate, done: currentCampaign.reviewDate ? new Date(currentCampaign.reviewDate) < now : false },
          ] : [];

          return (
            <div key={fruit.id} className={`bg-white rounded-xl border shadow-sm p-5 ${isRisk ? "border-red-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{fruit.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{fruit.name}</h3>
                    <p className="text-xs text-gray-400">{fruit.variety}</p>
                  </div>
                </div>
                {isRisk && (
                  <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> 지연
                  </span>
                )}
              </div>

              {currentCampaign && (
                <div className="mb-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-700 mb-0.5">{currentCampaign.title}</p>
                  <p className="text-gray-400">{currentCampaign.year}년 · {currentCampaign.notes?.slice(0, 60)}...</p>
                </div>
              )}

              {/* 마일스톤 체크리스트 */}
              <div className="space-y-1.5">
                {milestones.map((m, i) => {
                  if (!m.date) return null;
                  const isCurrent = !m.done && milestones.slice(0, i).every(prev => prev.done);
                  return (
                    <div key={m.label} className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                      isCurrent ? "bg-blue-50 border border-blue-100" : ""
                    }`}>
                      {m.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-pulse" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                      )}
                      <span className={`flex-1 ${m.done ? "text-gray-400 line-through" : isCurrent ? "text-blue-700 font-semibold" : "text-gray-600"}`}>
                        {m.label}
                      </span>
                      <span className="text-gray-400">
                        {new Date(m.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                href={`/app/fruits/${fruit.id}`}
                className="mt-3 block text-center text-xs text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 rounded-lg py-2 transition-colors"
              >
                {fruit.name} 상세 보기 →
              </Link>
            </div>
          );
        })}
      </div>

    </div>
  );
}
