import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import {
  getCampaignPhase, PHASE_LABELS, PHASE_COLORS, PHASE_BAR_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  TASK_TYPE_LABELS, TASK_TYPE_COLORS, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  SEASON_LABELS, CHANNEL_LABELS, formatKRW, formatPct,
} from "@/lib/fruit-utils";
import { formatDate } from "@/lib/utils";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const campaign = await prisma.fruitCampaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: {
      fruit: {
        include: {
          insights: { orderBy: { sourceYear: "desc" }, take: 2 },
        },
      },
      tasks: { orderBy: { dueDate: "asc" } },
      performances: true,
      insights: { orderBy: { sourceYear: "desc" } },
    },
  });

  if (!campaign) notFound();

  const phase = getCampaignPhase(campaign);
  const now = new Date();
  const delayedTasks = campaign.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  );

  const milestones = [
    { label: "소싱 시작", date: campaign.sourcingStartDate },
    { label: "가격 확정", date: campaign.pricingDueDate },
    { label: "콘텐츠 완료", date: campaign.contentDueDate },
    { label: "판매 시작", date: campaign.launchDate },
    { label: "피크 시작", date: campaign.promoPeakStartDate },
    { label: "피크 종료", date: campaign.promoPeakEndDate },
    { label: "성과 리뷰", date: campaign.reviewDate },
  ].filter((m) => m.date);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/app/campaigns" className="hover:text-brand">캠페인</Link>
          <span>›</span>
          <Link href={`/app/fruits/${campaign.fruitId}`} className="hover:text-brand flex items-center gap-1">
            {campaign.fruit.emoji} {campaign.fruit.name}
          </Link>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/app/campaigns" className="text-gray-400 hover:text-brand">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl">{campaign.fruit.emoji}</span>
                <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
                <span className={`text-sm px-2.5 py-1 rounded-full ${PHASE_COLORS[phase]}`}>
                  {PHASE_LABELS[phase]}
                </span>
                <span className={`text-sm px-2.5 py-1 rounded-full ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </span>
              </div>
              <p className="text-gray-500 mt-1 text-sm">
                {campaign.fruit.name} · {campaign.year}년 {SEASON_LABELS[campaign.season]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 리스크 배너 */}
      {delayedTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">지연 태스크 {delayedTasks.length}건</p>
            {delayedTasks.map((t) => (
              <p key={t.id} className="text-xs text-red-600 mt-1">
                · {t.title} (마감: {formatDate(t.dueDate)})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* 마일스톤 타임라인 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">캠페인 타임라인</h2>
            {/* 진행 바 */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full rounded-full ${PHASE_BAR_COLORS[phase]}`}
                style={{
                  width: {
                    completed: "100%", closing: "90%", peak: "80%", in_season: "65%",
                    marketing: "50%", sourcing: "30%", preparing: "15%", upcoming: "5%", delayed: "40%",
                  }[phase],
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {milestones.map((m, i) => {
                  const isPast = m.date && new Date(m.date) < now;
                  return (
                    <div key={m.label} className="flex items-center gap-4 pl-8 relative">
                      <div className={`absolute left-0 w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                        isPast ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"
                      }`}>
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-xs text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm font-medium ${isPast ? "text-green-700" : "text-gray-700"}`}>
                          {m.label}
                        </span>
                        <span className={`text-sm ${isPast ? "text-green-600" : "text-gray-500"}`}>
                          {formatDate(m.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {campaign.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">메모</p>
                <p className="text-sm text-gray-600 leading-relaxed">{campaign.notes}</p>
              </div>
            )}
          </div>

          {/* 태스크 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              태스크
              <span className="text-xs text-gray-400 font-normal">
                완료 {campaign.tasks.filter((t) => t.status === "done").length}/{campaign.tasks.length}건
              </span>
            </h2>
            {campaign.tasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">태스크가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {campaign.tasks.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "done";
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isOverdue ? "bg-red-50 border border-red-100" : "bg-gray-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        t.status === "done" ? "border-green-500 bg-green-500" : isOverdue ? "border-red-400" : "border-gray-300"
                      }`}>
                        {t.status === "done" && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${TASK_TYPE_COLORS[t.type]}`}>
                            {TASK_TYPE_LABELS[t.type]}
                          </span>
                          <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            {isOverdue && "⚠ "}{formatDate(t.dueDate)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[t.status]}`}>
                        {TASK_STATUS_LABELS[t.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 성과 + 인사이트 */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">채널별 성과</h2>
            {campaign.performances.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">성과 데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {campaign.performances.map((p) => (
                  <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      {CHANNEL_LABELS[p.channel] ?? p.channel}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div>
                        <p className="text-gray-400">매출</p>
                        <p className="font-semibold text-gray-900">{formatKRW(p.salesAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">마진율</p>
                        <p className="font-semibold text-green-700">{formatPct(p.marginRate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">CS</p>
                        <p className="font-semibold text-gray-900">{p.csCount}건</p>
                      </div>
                      <div>
                        <p className="text-gray-400">반품율</p>
                        <p className="font-semibold text-red-600">{formatPct(p.returnRate)}</p>
                      </div>
                    </div>
                    {p.nextAction && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-brand" /> 다음 시즌 액션
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">{p.nextAction}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 과일 인사이트 연결 */}
          {campaign.fruit.insights.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h2 className="font-semibold text-green-800 mb-3 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 연결된 인사이트
              </h2>
              {campaign.fruit.insights.map((ins) => (
                <div key={ins.id} className="text-xs text-green-700 mb-2 last:mb-0">
                  <p className="font-medium mb-1">{ins.sourceYear}년 성과 기반</p>
                  <p className="leading-relaxed">{ins.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
