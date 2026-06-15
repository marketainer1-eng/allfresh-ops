import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Megaphone, Sparkles, History, ArrowRight, Tag, Gift, Package, CalendarDays,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const CATEGORY_META: Record<string, { label: string; icon: typeof Tag; color: string }> = {
  single: { label: "단품", icon: Package, color: "text-green-600 bg-green-50" },
  giftset: { label: "선물세트", icon: Gift, color: "text-purple-600 bg-purple-50" },
  subscription: { label: "구독", icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
};

export default async function MarketingDashboardPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId as string | undefined;

  const [total, grouped, recent, upcoming] = await Promise.all([
    prisma.analysis.count({ where: { workspaceId } }),
    prisma.analysis.groupBy({
      by: ["category"],
      where: { workspaceId },
      _count: { _all: true },
    }),
    prisma.analysis.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.marketingCampaign.findMany({
      where: { workspaceId, endDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
  ]);

  const countByCat: Record<string, number> = {};
  for (const g of grouped) countByCat[g.category] = g._count._all;
  const maxCat = Math.max(1, ...Object.values(countByCat));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand" />
            마케팅 대시보드
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            AI 마케팅 분석 현황과 다가오는 캠페인을 한눈에 봅니다.
          </p>
        </div>
        <Link
          href="/app/marketing/new"
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          새 분석
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="총 분석" value={total} icon={Sparkles} />
        {(["single", "giftset", "subscription"] as const).map((c) => {
          const m = CATEGORY_META[c];
          return <KpiCard key={c} label={m.label} value={countByCat[c] ?? 0} icon={m.icon} />;
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 카테고리 분포 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">카테고리 분포</h2>
          {total === 0 ? (
            <p className="text-sm text-gray-400">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {(["single", "giftset", "subscription"] as const).map((c) => {
                const m = CATEGORY_META[c];
                const n = countByCat[c] ?? 0;
                return (
                  <div key={c}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{m.label}</span>
                      <span className="font-medium">{n}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${(n / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 최근 분석 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">최근 분석</h2>
            <Link
              href="/app/marketing/history"
              className="text-xs text-brand font-medium inline-flex items-center gap-0.5"
            >
              전체 보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <History className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">아직 분석이 없습니다.</p>
              <Link href="/app/marketing/new" className="text-sm text-brand font-medium mt-1 inline-block">
                첫 분석 시작 →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((a) => {
                const m = CATEGORY_META[a.category];
                return (
                  <Link
                    key={a.id}
                    href={`/app/marketing/history?focus=${a.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                  >
                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${m?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {m?.label ?? a.category}
                    </span>
                    <span className="text-sm text-gray-900 font-medium flex-1 truncate">
                      {a.productName}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(a.createdAt)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 다가오는 캠페인 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">다가오는 캠페인</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">
            예정된 마케팅 캠페인이 없습니다. (출하/일정 기능은 다음 단계에서 제공됩니다.)
          </p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: c.color ?? "#22c55e" }}
                />
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">{c.title}</span>
                <span className="text-xs text-gray-400">
                  {formatDate(c.startDate)} ~ {formatDate(c.endDate)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{label}</p>
        <Icon className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
