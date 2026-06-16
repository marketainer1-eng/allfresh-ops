"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Analysis {
  id: string;
  productName: string;
  category: string;
  status: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품 과일",
  giftset: "선물세트",
  subscription: "구독 서비스",
};
const CATEGORY_COLOR: Record<string, string> = {
  single: "#15803D",
  giftset: "#B45309",
  subscription: "#0E7490",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  processing: "진행중",
  completed: "완료",
  failed: "실패",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-stone-100 text-stone-600",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export default function Home() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch("/api/marketing/analyses?page=1&pageSize=100"),
        fetch("/api/marketing/campaigns"),
      ]);
      const aJson = await aRes.json();
      const cJson = await cRes.json();
      setAnalyses((aJson?.data as Analysis[]) || []);
      setCampaigns((cJson?.data as Campaign[]) || []);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const total = analyses.length;
  const now = new Date();
  const thisMonth = analyses.filter((a) => {
    const d = new Date(a.createdAt || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const activeCampaigns = campaigns.filter((c) => {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    return start <= now && end >= now;
  }).length;
  const processing = analyses.filter(
    (a) => a.status === "processing" || a.status === "pending",
  ).length;

  // Category distribution
  const categoryData = (["single", "giftset", "subscription"] as const).map((key) => ({
    name: CATEGORY_LABEL[key],
    value: analyses.filter((a) => a.category === key).length,
    color: CATEGORY_COLOR[key],
  }));
  const categoryTotal = categoryData.reduce((s, d) => s + d.value, 0);

  // Last 6 months bar chart
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = `${d.getMonth() + 1}월`;
    const count = analyses.filter((a) => {
      const created = new Date(a.createdAt || 0);
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
    }).length;
    return { month: label, count };
  });
  const maxMonthly = Math.max(1, ...monthlyData.map((m) => m.count));

  const recentAnalyses = analyses.slice(0, 5);
  const upcomingCampaigns = campaigns
    .filter((c) => new Date(c.endDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100/60 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-emerald-200/60 mb-3">
              <Sparkles className="w-3 h-3" />
              <span>이른 새벽, 신선한 분석을 시작하세요</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              안녕하세요, 올프레쉬 마케팅팀
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              오늘 진행 중인 캠페인 {activeCampaigns}건, 이번 달 분석 {thisMonth}건이 있습니다.
            </p>
          </div>
          <button
            onClick={() => router.push("/app/marketing/new")}
            className="inline-flex items-center justify-center gap-2 bg-[#15803D] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#166534] transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>새 분석 시작하기</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard icon={Package} label="총 분석 건수" value={total} unit="건" color="emerald" />
        <StatCard icon={TrendingUp} label="이번 달 분석" value={thisMonth} unit="건" color="amber" />
        <StatCard icon={CalendarIcon} label="진행중 캠페인" value={activeCampaigns} unit="건" color="blue" />
        <StatCard icon={Clock} label="대기/진행중" value={processing} unit="건" color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">카테고리별 분석 분포</h3>
          </div>
          {total === 0 ? (
            <EmptyMini text="아직 분석 데이터가 없습니다" />
          ) : (
            <div className="h-[260px] flex flex-col justify-center gap-4">
              {/* Donut substitute: stacked horizontal bars + legend */}
              <div className="flex h-4 w-full rounded-full overflow-hidden bg-stone-100">
                {categoryData.map((entry) =>
                  entry.value > 0 ? (
                    <div
                      key={entry.name}
                      style={{
                        width: `${(entry.value / Math.max(1, categoryTotal)) * 100}%`,
                        backgroundColor: entry.color,
                      }}
                      title={`${entry.name} ${entry.value}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="space-y-3">
                {categoryData.map((entry) => {
                  const pct = categoryTotal > 0 ? Math.round((entry.value / categoryTotal) * 100) : 0;
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}
                        </span>
                        <span className="font-medium text-slate-700">
                          {entry.value}건 · {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${categoryTotal > 0 ? (entry.value / categoryTotal) * 100 : 0}%`,
                            backgroundColor: entry.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">최근 6개월 분석 추이</h3>
          </div>
          <div className="h-[260px] flex items-end justify-between gap-3 pt-4">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <span className="text-xs font-medium text-slate-700">{m.count}</span>
                <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-[#15803D] transition-all"
                    style={{
                      height: `${(m.count / maxMonthly) * 100}%`,
                      minHeight: m.count > 0 ? "8px" : "2px",
                      backgroundColor: m.count > 0 ? "#15803D" : "#e7e5e4",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 md:p-6 pb-4">
            <h3 className="text-base font-semibold text-slate-900">최근 분석 이력</h3>
            <Link
              href="/app/marketing/history"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
            >
              전체 보기
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentAnalyses.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">아직 분석 이력이 없습니다</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentAnalyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/app/marketing/history?focus=${a.id}`}
                  className="flex items-center gap-3 px-5 md:px-6 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                    {a.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.thumbnailUrl}
                        alt={a.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{a.productName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: CATEGORY_COLOR[a.category] }}
                      >
                        {CATEGORY_LABEL[a.category]}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      STATUS_STYLE[a.status] || STATUS_STYLE.pending
                    }`}
                  >
                    {STATUS_LABEL[a.status] || "대기"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 md:p-6 pb-4">
            <h3 className="text-base font-semibold text-slate-900">예정된 캠페인</h3>
            <Link
              href="/app/marketing/schedule"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
            >
              일정
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingCampaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">예정된 캠페인이 없습니다</div>
          ) : (
            <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-3">
              {upcomingCampaigns.map((c) => (
                <div
                  key={c.id}
                  className="border border-stone-200 rounded-xl p-3 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: c.color || "#15803D" }}
                    />
                    <div className="text-sm font-medium text-slate-900 leading-snug">{c.title}</div>
                  </div>
                  <div className="text-xs text-slate-500 ml-4">
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
  color: "emerald" | "amber" | "blue" | "orange";
}) {
  const colorMap = {
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
    amber: { bg: "bg-amber-100", text: "text-amber-700" },
    blue: { bg: "bg-blue-100", text: "text-blue-700" },
    orange: { bg: "bg-orange-100", text: "text-orange-700" },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center ${c.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl md:text-3xl font-bold text-slate-900 font-mono">{value}</span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">{text}</div>
  );
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
