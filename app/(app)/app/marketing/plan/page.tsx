"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  Target,
  FileText,
  CalendarClock,
  TrendingUp,
  ShoppingBag,
  Printer,
  ArrowLeft,
} from "lucide-react";
import PipelineSteps from "@/components/app/PipelineSteps";

interface ChannelRec {
  channel: string;
  priority: string;
  reasoning?: string;
}
interface StrategyItem {
  id: string;
  framework: string;
  category: string;
  content: string;
  isSelected: boolean;
}
interface ContentPlan {
  id: string;
  channel: string;
  title: string;
  description: string;
  keyPoints?: string[] | null;
  hashtags?: string[] | null;
}
interface ExecutionTask {
  id: string;
  title: string;
  channel: string;
  priority: string;
  recommendedDate: string;
}
interface Campaign {
  id: string;
  title: string;
  channel?: string | null;
  startDate: string;
  endDate: string;
  status: string;
}
interface Forecast {
  id: string;
  predictedDemand?: number | null;
  recommendation?: string | null;
}
interface FullAnalysis {
  id: string;
  productName: string;
  category: string;
  targetCustomer: string | null;
  marketingCopy: string | null;
  seasonalCampaign: string | null;
  pricePositioning: string | null;
  differentiation: string | null;
  recommendedChannels: ChannelRec[] | null;
  createdAt: string;
  strategyItems?: StrategyItem[];
  contentPlans?: ContentPlan[];
  executionTasks?: ExecutionTask[];
  campaigns?: Campaign[];
  forecasts?: Forecast[];
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품 과일",
  giftset: "선물세트",
  subscription: "구독 서비스",
};
const SWOT_LABEL: Record<string, string> = {
  strength: "강점(S)",
  weakness: "약점(W)",
  opportunity: "기회(O)",
  threat: "위협(T)",
  political: "정치(P)",
  economic: "경제(E)",
  social: "사회(S)",
  technological: "기술(T)",
};

function fmtDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function PlanInner() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/analyses/${id}`);
      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.error || "분석을 불러오지 못했습니다");
      setAnalysis(json as FullAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (analysisId) load(analysisId);
  }, [analysisId, load]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <PipelineSteps current="plan" analysisId={analysisId} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            마케팅 플랜
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            분석 → 전략 → 콘텐츠 → 일정을 한 장으로 종합한 최종 실행 플랜입니다.
          </p>
        </div>
        {analysis && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-50"
          >
            <Printer className="w-4 h-4" /> 인쇄 / PDF
          </button>
        )}
      </div>

      {!analysisId && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
          <p className="text-sm text-slate-600 mb-3">
            플랜으로 종합할 분석을 먼저 선택해 주세요.
          </p>
          <Link
            href="/app/marketing/history"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166534]"
          >
            <ArrowLeft className="w-4 h-4" /> 분석 이력에서 선택
          </Link>
        </div>
      )}

      {analysisId && loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-16 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> 플랜을 종합하는 중...
        </div>
      )}

      {analysisId && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {analysis && !loading && (
        <div className="space-y-5">
          {/* 헤더 카드 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-slate-500">
              {CATEGORY_LABEL[analysis.category] || analysis.category} · {fmtDate(analysis.createdAt)}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">{analysis.productName}</h2>
            {analysis.targetCustomer && (
              <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                {analysis.targetCustomer}
              </p>
            )}
            {analysis.marketingCopy && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900 whitespace-pre-wrap">
                {analysis.marketingCopy}
              </div>
            )}
          </div>

          {/* 수요 신호 */}
          {analysis.forecasts && analysis.forecasts[0]?.predictedDemand != null && (
            <PlanSection icon={TrendingUp} title="수요 신호">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] text-violet-700 font-semibold">예상 수요 지수</div>
                  <div className="text-2xl font-bold text-violet-800">
                    {Math.round(analysis.forecasts[0].predictedDemand as number).toLocaleString()}
                  </div>
                </div>
                {analysis.forecasts[0].recommendation && (
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">
                    {analysis.forecasts[0].recommendation}
                  </p>
                )}
              </div>
            </PlanSection>
          )}

          {/* 전략 */}
          {analysis.strategyItems && analysis.strategyItems.length > 0 && (
            <PlanSection icon={Target} title="핵심 전략">
              <div className="grid sm:grid-cols-2 gap-2">
                {[...analysis.strategyItems]
                  .sort((a, b) => Number(b.isSelected) - Number(a.isSelected))
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg border p-3 text-sm ${
                        s.isSelected
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-stone-200 bg-stone-50/50"
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        {SWOT_LABEL[s.category] || s.category}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{s.content}</p>
                    </div>
                  ))}
              </div>
            </PlanSection>
          )}

          {/* 콘텐츠 */}
          {analysis.contentPlans && analysis.contentPlans.length > 0 && (
            <PlanSection icon={FileText} title="콘텐츠 기획">
              <div className="space-y-2">
                {analysis.contentPlans.map((c) => (
                  <div key={c.id} className="rounded-lg border border-stone-200 bg-white p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-slate-600">
                        {c.channel}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{c.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                    {c.hashtags && c.hashtags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.hashtags.map((h, i) => (
                          <span key={i} className="text-[10px] text-emerald-700">
                            #{String(h).replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PlanSection>
          )}

          {/* 실행 일정 */}
          {analysis.executionTasks && analysis.executionTasks.length > 0 && (
            <PlanSection icon={CalendarClock} title="실행 일정">
              <div className="space-y-1.5">
                {analysis.executionTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0">
                      {fmtDate(t.recommendedDate)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-slate-500 flex-shrink-0">
                      {t.channel}
                    </span>
                    <span className="text-slate-800 flex-1 min-w-0 truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            </PlanSection>
          )}

          {/* 캠페인 */}
          {analysis.campaigns && analysis.campaigns.length > 0 && (
            <PlanSection icon={CalendarClock} title="등록된 캠페인">
              <div className="space-y-1.5">
                {analysis.campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="text-xs font-semibold text-slate-500 flex-shrink-0">
                      {fmtDate(c.startDate)} ~ {fmtDate(c.endDate)}
                    </span>
                    {c.channel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-slate-500 flex-shrink-0">
                        {c.channel}
                      </span>
                    )}
                    <span className="text-slate-800 flex-1 min-w-0 truncate">{c.title}</span>
                  </div>
                ))}
              </div>
            </PlanSection>
          )}

          {/* 판매 채널 */}
          {analysis.recommendedChannels && analysis.recommendedChannels.length > 0 && (
            <PlanSection icon={ShoppingBag} title="추천 판매 채널">
              <div className="flex flex-wrap gap-1.5">
                {analysis.recommendedChannels.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-xs font-medium border border-stone-200 bg-white text-slate-700"
                  >
                    {c.channel}
                  </span>
                ))}
              </div>
            </PlanSection>
          )}
        </div>
      )}
    </div>
  );
}

function PlanSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-emerald-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-sm text-slate-400 py-16 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
        </div>
      }
    >
      <PlanInner />
    </Suspense>
  );
}
