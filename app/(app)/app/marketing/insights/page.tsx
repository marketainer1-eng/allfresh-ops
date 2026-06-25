"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, Target, Sparkles, ChevronRight, Loader2,
  AlertCircle, Calendar, Heart, Package, Zap, Star,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품 과일",
  giftset: "선물세트",
  subscription: "구독 서비스",
};
const CATEGORY_COLORS: Record<string, string> = {
  single: "#10b981",
  giftset: "#f59e0b",
  subscription: "#06b6d4",
};

interface Analysis {
  id: string;
  productName?: string | null;
  category?: string | null;
  targetCustomer?: string | null;
  marketingCopy?: string | null;
  seasonalCampaign?: string | null;
  seoKeywords?: string[] | null;
  hashtags?: string[] | null;
}

interface Forecast {
  id: string;
  analysisId?: string | null;
  productName?: string | null;
  predictedDemand?: number | null;
  confidenceR2?: number | null;
  rmse?: number | null;
  mape?: number | null;
  modelType?: string | null;
  isHoliday?: boolean | null;
  dayOfWeek?: string | null;
  month?: number | null;
  season?: string | null;
  origin?: string | null;
  grade?: string | null;
  recommendation?: string | null;
  createdAt?: string | null;
}

export default function CustomerInsights() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [aRes, fRes] = await Promise.all([
        fetch("/api/marketing/analyses?pageSize=100"),
        fetch("/api/marketing/forecasts"),
      ]);
      const aJson = await aRes.json();
      const fJson = await fRes.json();
      const aList: Analysis[] = aJson?.data || [];
      const fList: Forecast[] = fJson?.data || [];
      setAnalyses(aList);
      setForecasts(fList);
      if (aList.length > 0) setSelectedAnalysisId(aList[0].id);
    } catch (e) {
      console.error(e);
      setError("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const selectedAnalysis = useMemo(
    () => analyses.find((a) => String(a.id) === String(selectedAnalysisId)),
    [analyses, selectedAnalysisId],
  );

  const insights = useMemo(() => {
    if (analyses.length === 0) {
      return { categoryDist: [] as { name: string; value: number; color: string }[], topKeywords: [] as { name: string; value: number }[], topHashtags: [] as { name: string; value: number }[] };
    }
    const categoryCount: Record<string, number> = {};
    const keywordFreq: Record<string, number> = {};
    const hashtagFreq: Record<string, number> = {};
    analyses.forEach((a) => {
      const c = a.category || "unknown";
      categoryCount[c] = (categoryCount[c] || 0) + 1;
      (a.seoKeywords || []).forEach((k) => {
        const key = String(k).trim();
        if (key) keywordFreq[key] = (keywordFreq[key] || 0) + 1;
      });
      (a.hashtags || []).forEach((h) => {
        const key = String(h).trim().replace(/^#/, "");
        if (key) hashtagFreq[key] = (hashtagFreq[key] || 0) + 1;
      });
    });
    return {
      categoryDist: Object.entries(categoryCount).map(([key, value]) => ({
        name: CATEGORY_LABEL[key] || key,
        value,
        color: CATEGORY_COLORS[key] || "#94a3b8",
      })),
      topKeywords: Object.entries(keywordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value })),
      topHashtags: Object.entries(hashtagFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, value]) => ({ name, value })),
    };
  }, [analyses]);

  const findLinkedForecasts = (analysis?: Analysis): Forecast[] => {
    if (!analysis) return [];
    const direct = forecasts.filter((f) => String(f.analysisId) === String(analysis.id));
    if (direct.length > 0) return direct;
    const aName = String(analysis.productName || "").toLowerCase().trim();
    if (!aName) return [];
    return forecasts.filter((f) => {
      const fName = String(f.productName || "").toLowerCase().trim();
      return fName && (fName.includes(aName) || aName.includes(fName));
    });
  };

  const linkedForecasts = useMemo(
    () => findLinkedForecasts(selectedAnalysis),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forecasts, selectedAnalysis],
  );

  const forecastStats = useMemo(() => {
    if (linkedForecasts.length === 0) return null;
    const total = linkedForecasts.reduce((s, f) => s + (Number(f.predictedDemand) || 0), 0);
    const avg = total / linkedForecasts.length;
    const avgR2 = linkedForecasts.reduce((s, f) => s + (Number(f.confidenceR2) || 0), 0) / linkedForecasts.length;
    return {
      count: linkedForecasts.length,
      total: Math.round(total),
      avg: Math.round(avg),
      avgR2: avgR2.toFixed(2),
    };
  }, [linkedForecasts]);

  const categoryTotal = insights.categoryDist.reduce((s, c) => s + c.value, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-6 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  고객 인사이트 & 수요 예측 연동
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  분석 이력에서 고객 니즈를 도출하고, 동일 상품의 수요 예측 결과와 자동 연결합니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/marketing/history"
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                전체 분석 이력
              </Link>
              <Link
                href="/app/marketing/relationship"
                className="text-xs px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 inline-flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                고객 관계 예측
              </Link>
              <Link
                href="/app/marketing/forecast"
                className="text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                새 수요 예측
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} iconBg="bg-purple-100" iconColor="text-purple-600" label="분석 이력" value={analyses.length.toLocaleString()} unit="건" />
          <StatCard icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="수요 예측" value={forecasts.length.toLocaleString()} unit="건" />
          <StatCard icon={Target} iconBg="bg-amber-100" iconColor="text-amber-600" label="고유 키워드" value={insights.topKeywords.length.toLocaleString()} unit="개" />
          <StatCard icon={Star} iconBg="bg-cyan-100" iconColor="text-cyan-600" label="해시태그" value={insights.topHashtags.length.toLocaleString()} unit="개" />
        </div>

        {/* Empty state */}
        {analyses.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 md:p-14 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              아직 분석 이력이 없습니다
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              먼저 새 분석을 생성하면 고객 니즈와 수요 예측이 자동으로 연결됩니다.
            </p>
            <Link
              href="/app/marketing/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
            >
              <Sparkles className="w-4 h-4" />
              새 분석 만들기
            </Link>
          </div>
        )}

        {analyses.length > 0 && (
          <>
            {/* Aggregate insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Category distribution (plain-div stacked bar) */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-600" />
                  카테고리별 고객 니즈 분포
                </h3>
                {insights.categoryDist.length > 0 ? (
                  <div className="py-2">
                    <div className="flex w-full h-5 rounded-full overflow-hidden bg-slate-100 mb-3">
                      {insights.categoryDist.map((c, i) => (
                        <div
                          key={i}
                          style={{ width: `${categoryTotal > 0 ? (c.value / categoryTotal) * 100 : 0}%`, backgroundColor: c.color }}
                          title={`${c.name} ${c.value}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-2">
                      {insights.categoryDist.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-xs text-slate-600 flex-1">{c.name}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                            <div className="h-full rounded-full" style={{ width: `${categoryTotal > 0 ? (c.value / categoryTotal) * 100 : 0}%`, backgroundColor: c.color }} />
                          </div>
                          <span className="font-semibold text-slate-900 text-xs w-6 text-right">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">데이터 없음</p>
                )}
              </div>

              {/* Top keywords */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-600" />
                  고객 니즈 핵심 키워드 TOP 10
                </h3>
                {insights.topKeywords.length > 0 ? (
                  <div className="space-y-1.5">
                    {insights.topKeywords.map((k, i) => {
                      const max = insights.topKeywords[0].value;
                      const pct = max > 0 ? (k.value / max) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-slate-700 truncate flex-shrink-0 w-24">{k.name}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-900 w-6 text-right">{k.value}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">
                    아직 추출된 키워드가 없습니다
                  </p>
                )}
              </div>

              {/* Hashtag cloud */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-cyan-600" />
                  자주 등장하는 해시태그
                </h3>
                {insights.topHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {insights.topHashtags.map((h, i) => {
                      const sizes = ["text-[10px]", "text-xs", "text-sm", "text-base"];
                      const max = insights.topHashtags[0].value;
                      const sizeIdx = Math.min(sizes.length - 1, Math.round((h.value / max) * (sizes.length - 1)));
                      return (
                        <span key={i} className={`${sizes[sizeIdx]} px-2 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-800 font-medium`}>
                          #{h.name}
                          <span className="text-cyan-500 ml-1">×{h.value}</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">
                    아직 추출된 해시태그가 없습니다
                  </p>
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Analysis list */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">
                      분석 이력 ({analyses.length}건)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      클릭해 고객 니즈 + 수요 예측을 확인하세요
                    </p>
                  </div>
                  <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100">
                    {analyses.map((a) => {
                      const active = String(a.id) === String(selectedAnalysisId);
                      const fcCount = findLinkedForecasts(a).length;
                      const cat = a.category || "";
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedAnalysisId(a.id)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            active
                              ? "bg-purple-50 border-l-4 border-purple-500"
                              : "hover:bg-slate-50 border-l-4 border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-sm font-semibold text-slate-900 truncate flex-1">
                              {a.productName || "(이름 없음)"}
                            </div>
                            <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${active ? "text-purple-600" : "text-slate-300"}`} />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                            <span
                              className="px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: `${CATEGORY_COLORS[cat] || "#94a3b8"}22`,
                                color: CATEGORY_COLORS[cat] || "#475569",
                              }}
                            >
                              {CATEGORY_LABEL[cat] || cat}
                            </span>
                            {fcCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                                <TrendingUp className="w-2.5 h-2.5" />
                                예측 {fcCount}건
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected analysis + forecast detail */}
              <div className="lg:col-span-2 space-y-4">
                {selectedAnalysis && (
                  <>
                    {/* Customer needs panel */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                            고객 니즈 분석
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {selectedAnalysis.productName}
                          </h3>
                        </div>
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded flex-shrink-0"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[selectedAnalysis.category || ""] || "#94a3b8"}22`,
                            color: CATEGORY_COLORS[selectedAnalysis.category || ""] || "#475569",
                          }}
                        >
                          {CATEGORY_LABEL[selectedAnalysis.category || ""] || selectedAnalysis.category}
                        </span>
                      </div>

                      {selectedAnalysis.targetCustomer ? (
                        <div className="mb-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            타깃 고객 페르소나
                          </div>
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                            {selectedAnalysis.targetCustomer}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                          아직 타깃 고객 페르소나가 분석되지 않았습니다.
                        </div>
                      )}

                      {selectedAnalysis.marketingCopy && (
                        <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            니즈 기반 마케팅 카피
                          </div>
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                            {selectedAnalysis.marketingCopy}
                          </p>
                        </div>
                      )}

                      {selectedAnalysis.seasonalCampaign && (
                        <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            시즌·캠페인 제안
                          </div>
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                            {selectedAnalysis.seasonalCampaign}
                          </p>
                        </div>
                      )}

                      {Array.isArray(selectedAnalysis.seoKeywords) && selectedAnalysis.seoKeywords.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            SEO 키워드
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedAnalysis.seoKeywords.map((k, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(selectedAnalysis.hashtags) && selectedAnalysis.hashtags.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            해시태그
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedAnalysis.hashtags.map((h, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[11px] font-medium">
                                #{String(h).replace(/^#/, "")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Linked demand forecasts */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            연동 수요 예측 결과
                          </div>
                          <h3 className="text-base font-bold text-slate-900">
                            머신러닝 기반 발주량 분석
                          </h3>
                        </div>
                        <Link
                          href="/app/marketing/forecast"
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3" />
                          새 예측 실행
                        </Link>
                      </div>

                      {linkedForecasts.length === 0 ? (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <TrendingUp className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm text-slate-700 mb-1 font-semibold">
                            아직 연동된 수요 예측이 없습니다
                          </p>
                          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                            이 상품에 대해 수요 예측을 실행하면 고객 니즈 분석과 자동으로 연결됩니다.
                          </p>
                          <Link
                            href="/app/marketing/forecast"
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                          >
                            <Zap className="w-3 h-3" />
                            지금 예측 실행하기
                          </Link>
                        </div>
                      ) : (
                        <>
                          {forecastStats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                              <ForecastStat label="예측 횟수" value={String(forecastStats.count)} unit="건" color="text-purple-600" />
                              <ForecastStat label="총 예측량" value={forecastStats.total.toLocaleString()} unit="단위" color="text-emerald-600" />
                              <ForecastStat label="평균 예측" value={forecastStats.avg.toLocaleString()} unit="단위" color="text-amber-600" />
                              <ForecastStat label="평균 R²" value={forecastStats.avgR2} unit="" color="text-cyan-600" />
                            </div>
                          )}
                          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                            {linkedForecasts.map((f) => (
                              <ForecastCard key={f.id} forecast={f} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== 보조 컴포넌트 ===== */
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl md:text-2xl font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function ForecastStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color}`}>
        {value}
        {unit && <span className="text-[10px] text-slate-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: Forecast }) {
  const f = forecast;
  const date = f.createdAt ? new Date(f.createdAt).toLocaleDateString("ko-KR") : "";
  return (
    <div className="border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-sm font-bold text-slate-900 truncate">{f.productName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
              {f.modelType === "random_forest" ? "Random Forest" : "Linear Regression"}
            </span>
            {f.isHoliday === true && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">명절</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
            {date && <span>{date}</span>}
            {f.dayOfWeek && <span>{f.dayOfWeek}요일</span>}
            {f.month && <span>{f.month}월{f.season ? ` (${f.season})` : ""}</span>}
            {f.origin && <span>{f.origin}</span>}
            {f.grade && <span>{f.grade}등급</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-emerald-600 leading-none">
            {Number(f.predictedDemand || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">단위</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
        <div className="bg-slate-50 rounded px-2 py-1 text-center">
          <span className="text-slate-500">R²</span>
          <span className="ml-1 font-semibold text-slate-900">{Number(f.confidenceR2 || 0).toFixed(2)}</span>
        </div>
        <div className="bg-slate-50 rounded px-2 py-1 text-center">
          <span className="text-slate-500">RMSE</span>
          <span className="ml-1 font-semibold text-slate-900">{Number(f.rmse || 0).toLocaleString()}</span>
        </div>
        <div className="bg-slate-50 rounded px-2 py-1 text-center">
          <span className="text-slate-500">MAPE</span>
          <span className="ml-1 font-semibold text-slate-900">{Number(f.mape || 0).toFixed(1)}%</span>
        </div>
      </div>
      {f.recommendation && (
        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg p-2 leading-relaxed">
          💡 {f.recommendation}
        </div>
      )}
    </div>
  );
}
