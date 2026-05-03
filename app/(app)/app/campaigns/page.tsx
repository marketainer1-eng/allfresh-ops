import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Zap } from "lucide-react";
import {
  getCampaignPhase, PHASE_LABELS, PHASE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  SEASON_LABELS, hasDelayedTasks,
} from "@/lib/fruit-utils";
import { formatDate } from "@/lib/utils";

export default async function CampaignsPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const campaigns = await prisma.fruitCampaign.findMany({
    where: { workspaceId },
    orderBy: [{ year: "desc" }, { launchDate: "asc" }],
    include: {
      fruit: { select: { id: true, name: true, emoji: true, category: true } },
      tasks: { orderBy: { dueDate: "asc" } },
      performances: true,
      _count: { select: { tasks: true, performances: true, insights: true } },
    },
  });

  const grouped = campaigns.reduce<Record<number, typeof campaigns>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = [];
    acc[c.year].push(c);
    return acc;
  }, {});

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand" />
            캠페인 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            과일별 시즌 캠페인 전체 목록. 총 {campaigns.length}건.
          </p>
        </div>
      </div>

      {years.map((year) => (
        <div key={year}>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{year}년</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {grouped[year].map((c) => {
              const phase = getCampaignPhase(c);
              const isRisk = hasDelayedTasks(c.tasks);
              const totalSales = c.performances.reduce((s, p) => s + p.salesAmount, 0);

              return (
                <Link
                  key={c.id}
                  href={`/app/campaigns/${c.id}`}
                  className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all group ${
                    isRisk ? "border-red-200" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.fruit.emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-brand">
                          {c.fruit.name} — {SEASON_LABELS[c.season]}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.title}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${PHASE_COLORS[phase]}`}>
                        {PHASE_LABELS[phase]}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${CAMPAIGN_STATUS_COLORS[c.status]}`}>
                        {CAMPAIGN_STATUS_LABELS[c.status]}
                      </span>
                    </div>
                  </div>

                  {/* 마일스톤 요약 */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    {[
                      { label: "소싱", date: c.sourcingStartDate },
                      { label: "런칭", date: c.launchDate },
                      { label: "리뷰", date: c.reviewDate },
                    ].map((m) => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-gray-400">{m.label}</p>
                        <p className="font-medium text-gray-700">{formatDate(m.date)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex gap-3">
                      <span>태스크 {c._count.tasks}</span>
                      {totalSales > 0 && (
                        <span>매출 {(totalSales / 10000).toFixed(0)}만원</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isRisk && (
                        <span className="flex items-center gap-0.5 text-red-500">
                          <AlertTriangle className="w-3 h-3" /> 리스크
                        </span>
                      )}
                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-brand" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {campaigns.length === 0 && (
        <div className="text-center py-24 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-gray-500 text-lg font-medium mb-2">등록된 캠페인이 없습니다</p>
          <p className="text-gray-400 text-sm">과일 상세 페이지에서 캠페인을 추가하세요.</p>
        </div>
      )}
    </div>
  );
}
