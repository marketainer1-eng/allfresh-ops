"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PipelineSteps from "@/components/app/PipelineSteps";
import {
  Zap,
  Loader2,
  Check,
  AlertCircle,
  Target,
  Calendar,
  Youtube,
  Instagram,
  BookOpen,
  MessageCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Analysis {
  id: string;
  productName: string;
  category: string;
  targetCustomer?: string | null;
  marketingCopy?: string | null;
  seasonalCampaign?: string | null;
  hashtags?: string[] | null;
}

interface StrategyItem {
  id: string;
  framework: string;
  category: string;
  content: string;
  isSelected: boolean;
  assignee: string;
}

interface ExecutionTask {
  id: string;
  title: string;
  description: string;
  channel: string;
  priority: string;
  recommendedDate: string;
  assignee: string;
  status: string;
}

interface ContentPlan {
  id: string;
  channel: string;
  title: string;
  description: string;
  keyPoints: string[] | null;
  hashtags: string[] | null;
  executionTasks?: ExecutionTask[];
}

type Notice = { type: "success" | "error"; msg: string } | null;

// ---------------------------------------------------------------------------
// Constants (faithful to original)
// ---------------------------------------------------------------------------
const TEAM_MEMBERS = [
  "김지영 (마케팅 팀장)",
  "박서준 (콘텐츠 PM)",
  "이하늘 (퍼포먼스 마케터)",
  "최유진 (브랜드 디자이너)",
  "정민호 (데이터 분석가)",
];

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};

interface ChannelConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  text: string;
}

const CHANNEL_CONFIG: Record<string, ChannelConfig> = {
  youtube_shorts: {
    label: "유튜브 쇼츠",
    icon: Youtube,
    color: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  instagram_reels: {
    label: "인스타그램 릴스",
    icon: Instagram,
    color: "#BE185D",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
  },
  instagram_feed: {
    label: "인스타그램 피드",
    icon: Instagram,
    color: "#7C3AED",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  naver_blog: {
    label: "네이버 블로그",
    icon: BookOpen,
    color: "#15803D",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  detail_copy: {
    label: "상세페이지 카피",
    icon: MessageCircle,
    color: "#1D4ED8",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  promotion: {
    label: "프로모션 이벤트",
    icon: Award,
    color: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
};

interface PriorityConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  high: { label: "높음", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "#B91C1C" },
  medium: { label: "보통", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "#B45309" },
  low: { label: "낮음", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "#475569" },
};

const STATUS_CONFIG: Record<string, { label: string }> = {
  pending: { label: "대기" },
  in_progress: { label: "진행 중" },
  done: { label: "완료" },
};

const CHANNEL_ORDER = [
  "youtube_shorts",
  "instagram_reels",
  "instagram_feed",
  "naver_blog",
  "detail_copy",
  "promotion",
];

function channelConfig(ch: string): ChannelConfig {
  return CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.detail_copy;
}

// 기술적 에러 메시지를 사용자 친화적 메시지로 변환
function getFriendlyErrorMessage(err: unknown): { friendly: string; raw: string } {
  const raw = String(
    (err as { data?: { error_message?: string } })?.data?.error_message ||
      (err as Error)?.message ||
      "",
  );
  if (/Missing required environment variable|OPENAI_API_KEY|PERPLEXITY_API_KEY/i.test(raw)) {
    return {
      friendly:
        "AI 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.",
      raw,
    };
  }
  if (/api[_\s-]?key|unauthorized|401|forbidden|403/i.test(raw)) {
    return { friendly: "AI 서비스 인증에 실패했습니다. 관리자에게 문의해 주세요.", raw };
  }
  if (/network|fetch|timeout|ECONN/i.test(raw)) {
    return { friendly: "네트워크 연결을 확인하고 다시 시도해 주세요.", raw };
  }
  return { friendly: raw || "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", raw };
}

function formatErrorForNotice(err: unknown): string {
  const { friendly, raw } = getFriendlyErrorMessage(err);
  if (process.env.NODE_ENV === "development" && raw && raw !== friendly) {
    return `${friendly} (dev: ${raw})`;
  }
  return friendly;
}

// ---------------------------------------------------------------------------
// Page (Suspense wrapper for useSearchParams)
// ---------------------------------------------------------------------------
export default function ContentPlannerPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ContentPlanner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-400 py-10">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>불러오는 중...</span>
      </div>
    </div>
  );
}

function ContentPlanner() {
  const searchParams = useSearchParams();
  const incomingAnalysisId = searchParams.get("analysisId");

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    incomingAnalysisId || null,
  );
  const [additionalContext, setAdditionalContext] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyItem[]>([]);
  const [contentPlans, setContentPlans] = useState<ContentPlan[]>([]);
  const [executionTasks, setExecutionTasks] = useState<ExecutionTask[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState<Notice>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const showNotice = useCallback((type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const loadStrategyAndPlans = useCallback(
    async (analysisId: string) => {
      setLoadingData(true);
      try {
        const [stratRes, plansRes] = await Promise.all([
          fetch(`/api/marketing/strategy-items?analysisId=${analysisId}`),
          fetch(`/api/marketing/content-plans?analysisId=${analysisId}`),
        ]);
        if (!stratRes.ok || !plansRes.ok) throw new Error("데이터를 불러오지 못했습니다");
        const strategyItems = (await stratRes.json()) as StrategyItem[];
        const plans = (await plansRes.json()) as ContentPlan[];
        const selected = (Array.isArray(strategyItems) ? strategyItems : []).filter(
          (s) => s.isSelected,
        );
        setSelectedStrategies(selected);
        const planList = Array.isArray(plans) ? plans : [];
        setContentPlans(planList);
        // ExecutionTasks are nested inside content-plans (API include).
        setExecutionTasks(planList.flatMap((p) => p.executionTasks || []));
      } catch (e) {
        console.error(e);
        showNotice("error", "데이터를 불러오지 못했습니다");
      } finally {
        setLoadingData(false);
      }
    },
    [showNotice],
  );

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true);
    try {
      const res = await fetch("/api/marketing/analyses?pageSize=100");
      if (!res.ok) throw new Error("분석 목록을 불러오지 못했습니다");
      const json = await res.json();
      const list: Analysis[] = json?.data || [];
      setAnalyses(list);
      if (list.length > 0) {
        setSelectedAnalysisId((prev) => {
          if (prev) {
            const exists = list.some((a) => String(a.id) === String(prev));
            return exists ? prev : list[0].id;
          }
          return list[0].id;
        });
      }
    } catch (e) {
      console.error(e);
      showNotice("error", "분석 목록을 불러오지 못했습니다");
    } finally {
      setLoadingAnalyses(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  useEffect(() => {
    if (selectedAnalysisId) {
      loadStrategyAndPlans(selectedAnalysisId);
    } else {
      setSelectedStrategies([]);
      setContentPlans([]);
      setExecutionTasks([]);
    }
  }, [selectedAnalysisId, loadStrategyAndPlans]);

  const analysis = analyses.find((a) => String(a.id) === String(selectedAnalysisId));

  const handleGenerate = async () => {
    if (!selectedAnalysisId || !analysis) {
      showNotice("error", "분석 대상을 선택해 주세요");
      return;
    }
    if (selectedStrategies.length === 0) {
      showNotice("error", "먼저 전략 분석에서 실행할 항목을 선택해 주세요");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/marketing/generate-content-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: analysis.productName,
          category: analysis.category,
          targetCustomer: analysis.targetCustomer,
          marketingCopy: analysis.marketingCopy,
          seasonalCampaign: analysis.seasonalCampaign,
          hashtags: analysis.hashtags || [],
          selectedStrategies: selectedStrategies.map((s) => ({
            framework: s.framework,
            category: s.category,
            content: s.content,
            assignee: s.assignee || "",
          })),
          additionalContext: additionalContext.trim(),
        }),
      });
      if (!res.ok) {
        let msg = "콘텐츠 생성 요청에 실패했습니다";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = await res.json();
      if (
        !data ||
        !Array.isArray(data.contentPlans) ||
        !Array.isArray(data.executionTasks)
      ) {
        throw new Error("콘텐츠 기획 결과를 받지 못했습니다");
      }

      // Persist ContentPlans + ExecutionTasks in one clean-regenerate POST.
      // The route deletes existing plans/tasks for this analysis, then links
      // each task to its plan via `contentPlanChannel`.
      const saveRes = await fetch("/api/marketing/content-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: selectedAnalysisId,
          contentPlans: data.contentPlans.map(
            (p: { channel?: string; title?: string; description?: string; keyPoints?: unknown; hashtags?: unknown }) => ({
              channel: String(p.channel || "detail_copy"),
              title: String(p.title || ""),
              description: String(p.description || ""),
              keyPoints: Array.isArray(p.keyPoints) ? p.keyPoints.map(String) : [],
              hashtags: Array.isArray(p.hashtags) ? p.hashtags.map(String) : [],
            }),
          ),
          executionTasks: data.executionTasks.map(
            (t: {
              channel?: string;
              title?: string;
              description?: string;
              priority?: string;
              recommendedDate?: string;
              assignee?: string;
            }) => {
              const channel = String(t.channel || "detail_copy");
              return {
                title: String(t.title || ""),
                description: String(t.description || ""),
                channel,
                priority: ["high", "medium", "low"].includes(String(t.priority))
                  ? String(t.priority)
                  : "medium",
                recommendedDate: t.recommendedDate || new Date().toISOString(),
                assignee: String(t.assignee || ""),
                contentPlanChannel: channel,
              };
            },
          ),
        }),
      });
      if (!saveRes.ok) throw new Error("콘텐츠 저장에 실패했습니다");

      await loadStrategyAndPlans(selectedAnalysisId);
      showNotice("success", "채널별 콘텐츠 기획안과 실행 플랜이 생성되었습니다");
    } catch (e) {
      console.error(e);
      showNotice("error", formatErrorForNotice(e));
    } finally {
      setGenerating(false);
    }
  };

  const updateTask = async (id: string, patch: Partial<ExecutionTask>) => {
    setExecutionTasks((prev) =>
      prev.map((t) => (String(t.id) === String(id) ? { ...t, ...patch } : t)),
    );
    try {
      const res = await fetch(`/api/marketing/execution-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("저장 실패");
    } catch (e) {
      console.error(e);
      showNotice("error", "저장에 실패했습니다");
      if (selectedAnalysisId) loadStrategyAndPlans(selectedAnalysisId);
    }
  };

  const sortedTasks = [...executionTasks].sort((a, b) => {
    const da = new Date(a.recommendedDate || 0).getTime();
    const db = new Date(b.recommendedDate || 0).getTime();
    return da - db;
  });

  const taskStats = {
    total: executionTasks.length,
    high: executionTasks.filter((t) => t.priority === "high").length,
    assigned: executionTasks.filter((t) => t.assignee && String(t.assignee).trim()).length,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <PipelineSteps current="content" analysisId={selectedAnalysisId} />
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-start gap-2">
            {notification.type === "success" ? (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            콘텐츠 기획 &amp; 실행 플랜
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            확정된 전략을 채널별 콘텐츠로 자동 변환하고, AI 우선순위로 캘린더 일정을 추천합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedAnalysisId || generating || selectedStrategies.length === 0}
          className="inline-flex items-center justify-center gap-2 bg-[#15803D] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>{contentPlans.length > 0 ? "재생성" : "AI 콘텐츠·실행 플랜 생성"}</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Selector + Strategy Summary */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 md:p-5 mb-5 shadow-sm">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          분석 대상
        </label>
        {loadingAnalyses ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>불러오는 중...</span>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-sm text-slate-500 py-2">
            저장된 분석이 없습니다. 먼저 새 분석을 생성해 주세요.
          </div>
        ) : (
          <select
            value={selectedAnalysisId || ""}
            onChange={(e) => setSelectedAnalysisId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
          >
            {analyses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.productName} ({CATEGORY_LABEL[a.category] || a.category})
              </option>
            ))}
          </select>
        )}

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            추가 데이터 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={3}
            placeholder="콘텐츠 기획에 반영할 데이터를 자유롭게 입력하세요 (예: 톤앤매너, 필수 메시지, 행사·프로모션 정보, 레퍼런스 등). 입력한 내용은 채널별 콘텐츠 생성에 함께 반영됩니다."
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
          />
        </div>

        {/* Selected strategies preview */}
        {selectedAnalysisId && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                확정된 전략 ({selectedStrategies.length}건)
              </h4>
            </div>
            {selectedStrategies.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
                전략 분석 페이지에서 실행할 SWOT/PEST 항목을 먼저 체크해 주세요. 선택된 전략을 기반으로 채널별 콘텐츠가 생성됩니다.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedStrategies.slice(0, 8).map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-xs text-emerald-800"
                    title={s.content}
                  >
                    <span className="font-semibold">
                      {s.framework === "swot" ? "SWOT" : "PEST"}
                    </span>
                    <span className="text-emerald-600">·</span>
                    <span className="max-w-[14ch] truncate">{s.content}</span>
                  </span>
                ))}
                {selectedStrategies.length > 8 && (
                  <span className="text-xs text-slate-500 px-1">
                    외 {selectedStrategies.length - 8}건
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {executionTasks.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-stone-100 text-xs">
            <StatPill color="#15803D" label="실행 작업" value={`${taskStats.total}건`} />
            <StatPill color="#B91C1C" label="우선순위 높음" value={`${taskStats.high}건`} />
            <StatPill color="#1D4ED8" label="담당자 배정" value={`${taskStats.assigned}건`} />
            <StatPill color="#7C3AED" label="콘텐츠 기획안" value={`${contentPlans.length}건`} />
          </div>
        )}
      </div>

      {/* Empty / Loading */}
      {loadingData && contentPlans.length === 0 && !generating && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">데이터를 불러오는 중...</p>
        </div>
      )}

      {!loadingData && contentPlans.length === 0 && selectedAnalysisId && !generating && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 md:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-3 flex items-center justify-center text-emerald-700">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            아직 콘텐츠 기획안이 없습니다
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            확정된 전략을 기반으로 5개 채널 + 프로모션 이벤트 기획안과 우선순위 기반 실행 플랜을 자동 생성합니다.
          </p>
        </div>
      )}

      {generating && contentPlans.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100 rounded-2xl p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            AI가 콘텐츠 기획안과 실행 플랜을 생성 중입니다
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            채널별 컨셉 도출 → 우선순위 판단 → 캘린더 일정 1차 추천 단계가 진행됩니다.
          </p>
        </div>
      )}

      {/* Content Plans */}
      {contentPlans.length > 0 && (
        <Section
          title="채널별 콘텐츠 기획안"
          subtitle="유튜브 쇼츠 · 인스타 릴스/피드 · 네이버 블로그 · 상세페이지 카피 · 프로모션 이벤트"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {CHANNEL_ORDER.map((ch) => {
              const plan = contentPlans.find((p) => p.channel === ch);
              if (!plan) return null;
              return (
                <ContentPlanCard
                  key={plan.id}
                  plan={plan}
                  expanded={expandedPlanId === plan.id}
                  onToggle={() =>
                    setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)
                  }
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Execution Plan Timeline */}
      {executionTasks.length > 0 && (
        <Section
          title="실행 플랜 · AI 추천 일정"
          subtitle="우선순위와 채널 의존성을 고려해 캘린더 일정을 1차로 추천했습니다. 담당자는 자유롭게 변경할 수 있어요."
        >
          <ExecutionTimeline tasks={sortedTasks} onUpdateTask={updateTask} />
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatPill({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h3 className="text-base md:text-lg font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ContentPlanCard({
  plan,
  expanded,
  onToggle,
}: {
  plan: ContentPlan;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = channelConfig(plan.channel);
  const Icon = config.icon;
  const keyPoints = Array.isArray(plan.keyPoints) ? plan.keyPoints : [];
  const hashtags = Array.isArray(plan.hashtags) ? plan.hashtags : [];
  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 md:p-5 hover:bg-white/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ color: config.color }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${config.text}`}>
                {config.label}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
              {plan.title}
            </h4>
            {!expanded && plan.description && (
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-slate-400 mt-0.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="overflow-hidden">
          <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3">
            {plan.description && (
              <p className="text-sm text-slate-700 leading-relaxed bg-white/70 rounded-lg p-3">
                {plan.description}
              </p>
            )}
            {keyPoints.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  핵심 포인트
                </div>
                <ul className="space-y-1.5">
                  {keyPoints.map((kp, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white/80 border border-stone-200 rounded text-[11px] font-medium text-slate-600"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutionTimeline({
  tasks,
  onUpdateTask,
}: {
  tasks: ExecutionTask[];
  onUpdateTask: (id: string, patch: Partial<ExecutionTask>) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups: Record<string, { label: string; items: ExecutionTask[] }> = {};
  tasks.forEach((t) => {
    const d = new Date(t.recommendedDate);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let key: string;
    let label: string;
    if (diffDays < 0) {
      key = "past";
      label = "지난 일정";
    } else if (diffDays <= 7) {
      key = "this_week";
      label = "이번 주 (D-7 이내)";
    } else if (diffDays <= 14) {
      key = "next_week";
      label = "다음 주 (D-8 ~ D-14)";
    } else if (diffDays <= 30) {
      key = "this_month";
      label = "이번 달 (D-15 ~ D-30)";
    } else {
      key = "later";
      label = "이후 일정 (D-31 ~)";
    }
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(t);
  });

  const order = ["past", "this_week", "next_week", "this_month", "later"];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {order.map((key, gi) => {
        const group = groups[key];
        if (!group) return null;
        return (
          <div key={key} className={gi > 0 ? "border-t border-stone-100" : ""}>
            <div className="px-4 md:px-5 py-2.5 bg-stone-50/70 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">{group.label}</span>
              <span className="text-xs text-slate-400">· {group.items.length}건</span>
            </div>
            <div className="divide-y divide-stone-100">
              {group.items.map((t) => (
                <TaskRow key={t.id} task={t} onUpdate={onUpdateTask} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  onUpdate,
}: {
  task: ExecutionTask;
  onUpdate: (id: string, patch: Partial<ExecutionTask>) => void;
}) {
  const channel = channelConfig(task.channel);
  const Icon = channel.icon;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const dateLabel = formatTaskDate(task.recommendedDate);
  const currentAssignee = task.assignee || "";
  const isPredefined = TEAM_MEMBERS.includes(currentAssignee);
  const startInCustom = !!currentAssignee && !isPredefined;
  const [mode, setMode] = useState<"select" | "custom">(startInCustom ? "custom" : "select");
  const [draft, setDraft] = useState(currentAssignee);

  useEffect(() => {
    const a = task.assignee || "";
    setDraft(a);
    setMode(a && !TEAM_MEMBERS.includes(a) ? "custom" : "select");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const handleSelectChange = (value: string) => {
    if (value === "__custom__") {
      setMode("custom");
      setDraft("");
      return;
    }
    onUpdate(task.id, { assignee: value });
  };

  const handleCustomBlur = () => {
    onUpdate(task.id, { assignee: draft.trim() });
  };

  return (
    <div className="px-4 md:px-5 py-3.5 hover:bg-stone-50/40 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${channel.color}15`, color: channel.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: priority.dot }}
              />
              {priority.label}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {channel.label}
            </span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Calendar className="w-3 h-3" />
              {dateLabel}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-900 leading-snug">
            {task.title}
          </div>
          {task.description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {mode === "custom" ? (
              <div className="flex-1 max-w-xs">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={handleCustomBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="담당자 직접 입력"
                  className="w-full px-2.5 py-1 text-xs rounded-md border border-stone-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none"
                />
              </div>
            ) : (
              <select
                value={currentAssignee}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="max-w-xs px-2.5 py-1 text-xs rounded-md border border-stone-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none bg-white"
              >
                <option value="">담당자 미배정</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__custom__">+ 직접 입력</option>
              </select>
            )}
            {/* 상태 편집 — 백엔드 execution-tasks PATCH(status) 지원 */}
            <select
              value={task.status || "pending"}
              onChange={(e) => onUpdate(task.id, { status: e.target.value })}
              className="px-2.5 py-1 text-xs rounded-md border border-stone-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none bg-white"
            >
              {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                <option key={value} value={value}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTaskDate(s: string): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  if (diff === 0) return `${dateStr} (오늘)`;
  if (diff === 1) return `${dateStr} (내일)`;
  if (diff === -1) return `${dateStr} (어제)`;
  if (diff > 0) return `${dateStr} (D-${diff})`;
  return `${dateStr} (${Math.abs(diff)}일 전)`;
}
