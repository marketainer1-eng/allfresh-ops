"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PipelineSteps from "@/components/app/PipelineSteps";
import {
  Target,
  Users,
  Check,
  X,
  Loader2,
  Zap,
  AlertCircle,
  Save,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Analysis {
  id: string;
  productName: string;
  category: string;
  productInfo?: string | null;
  targetCustomer?: string | null;
  marketingCopy?: string | null;
  seasonalCampaign?: string | null;
}

interface StrategyItem {
  id: string;
  analysisId: string;
  framework: string; // swot | pest
  category: string;
  content: string;
  isSelected: boolean;
  assignee: string;
}

interface StrategyResult {
  swot: {
    strength: string[];
    weakness: string[];
    opportunity: string[];
    threat: string[];
  };
  pest: {
    political: string[];
    economic: string[];
    social: string[];
    technological: string[];
  };
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

interface CategoryConfig {
  key: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const SWOT_CATEGORIES: CategoryConfig[] = [
  { key: "strength", label: "강점 (Strengths)", color: "#15803D", bg: "bg-emerald-50", border: "border-emerald-200" },
  { key: "weakness", label: "약점 (Weaknesses)", color: "#B91C1C", bg: "bg-red-50", border: "border-red-200" },
  { key: "opportunity", label: "기회 (Opportunities)", color: "#1D4ED8", bg: "bg-blue-50", border: "border-blue-200" },
  { key: "threat", label: "위협 (Threats)", color: "#B45309", bg: "bg-amber-50", border: "border-amber-200" },
];

const PEST_CATEGORIES: CategoryConfig[] = [
  { key: "political", label: "정치 (Political)", color: "#7C3AED", bg: "bg-purple-50", border: "border-purple-200" },
  { key: "economic", label: "경제 (Economic)", color: "#0E7490", bg: "bg-cyan-50", border: "border-cyan-200" },
  { key: "social", label: "사회 (Social)", color: "#BE185D", bg: "bg-pink-50", border: "border-pink-200" },
  { key: "technological", label: "기술 (Technological)", color: "#15803D", bg: "bg-emerald-50", border: "border-emerald-200" },
];

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
export default function StrategyDashboardPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <StrategyDashboard />
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

function StrategyDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const incomingAnalysisId = searchParams.get("analysisId");

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    incomingAnalysisId || null,
  );
  const [additionalContext, setAdditionalContext] = useState("");
  const [items, setItems] = useState<StrategyItem[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<Notice>(null);

  const showNotice = useCallback((type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const loadStrategyItems = useCallback(
    async (analysisId: string) => {
      setLoadingItems(true);
      try {
        const res = await fetch(
          `/api/marketing/strategy-items?analysisId=${analysisId}`,
        );
        if (!res.ok) throw new Error("전략 항목을 불러오지 못했습니다");
        const data = (await res.json()) as StrategyItem[];
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        showNotice("error", "전략 항목을 불러오지 못했습니다");
      } finally {
        setLoadingItems(false);
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
            // Validate incoming id exists in the list; otherwise fall back to first
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
      loadStrategyItems(selectedAnalysisId);
    } else {
      setItems([]);
    }
  }, [selectedAnalysisId, loadStrategyItems]);

  const handleGenerate = async () => {
    if (!selectedAnalysisId) {
      showNotice("error", "분석 대상을 먼저 선택해 주세요");
      return;
    }
    const analysis = analyses.find(
      (a) => String(a.id) === String(selectedAnalysisId),
    );
    if (!analysis) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/marketing/analyze-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: analysis.productName,
          category: analysis.category,
          targetCustomer: analysis.targetCustomer,
          marketingCopy: analysis.marketingCopy,
          seasonalCampaign: analysis.seasonalCampaign,
          productInfo: analysis.productInfo,
          additionalContext: additionalContext.trim(),
        }),
      });
      if (!res.ok) {
        let msg = "전략 분석 요청에 실패했습니다";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as StrategyResult;
      if (!data || !data.swot || !data.pest) {
        throw new Error("전략 분석 결과를 받지 못했습니다");
      }

      // Build a flat list of new items. The bulk POST replaces all existing
      // StrategyItems for this analysis (clean regenerate, fresh & unselected).
      const flat: { framework: "swot" | "pest"; category: string; content: string }[] = [];
      (["strength", "weakness", "opportunity", "threat"] as const).forEach((cat) => {
        (data.swot[cat] || []).forEach((content) => {
          flat.push({ framework: "swot", category: cat, content: String(content) });
        });
      });
      (["political", "economic", "social", "technological"] as const).forEach((cat) => {
        (data.pest[cat] || []).forEach((content) => {
          flat.push({ framework: "pest", category: cat, content: String(content) });
        });
      });

      const saveRes = await fetch("/api/marketing/strategy-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: selectedAnalysisId, items: flat }),
      });
      if (!saveRes.ok) throw new Error("전략 항목 저장에 실패했습니다");
      const saved = (await saveRes.json()) as StrategyItem[];
      setItems(Array.isArray(saved) ? saved : []);
      showNotice("success", "SWOT · PEST 분석이 생성되었습니다");
    } catch (e) {
      console.error(e);
      showNotice("error", formatErrorForNotice(e));
    } finally {
      setGenerating(false);
    }
  };

  const updateItem = async (id: string, patch: Partial<StrategyItem>) => {
    setItems((prev) =>
      prev.map((i) => (String(i.id) === String(id) ? { ...i, ...patch } : i)),
    );
    try {
      const res = await fetch(`/api/marketing/strategy-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("저장 실패");
    } catch (e) {
      console.error(e);
      showNotice("error", "저장에 실패했습니다");
      if (selectedAnalysisId) loadStrategyItems(selectedAnalysisId);
    }
  };

  const handleToggle = (item: StrategyItem) => {
    updateItem(item.id, { isSelected: !item.isSelected });
  };

  const handleAssignee = (item: StrategyItem, assignee: string) => {
    updateItem(item.id, { assignee });
  };

  const handleSaveAndProceed = async () => {
    if (!selectedAnalysisId) return;
    const selectedItems = items.filter((i) => i.isSelected);
    if (selectedItems.length === 0) {
      showNotice("error", "콘텐츠 기획에 포함할 항목을 먼저 선택해 주세요");
      return;
    }
    setSaving(true);
    try {
      const expectedSelected = selectedItems.length;

      // 1차 저장: 토글 중 발생한 개별 API 업데이트의 누락을 방지하기 위해
      // 모든 항목을 강제 재저장한다.
      const saveAllItems = async (): Promise<number> => {
        const results = await Promise.all(
          items.map((item) =>
            fetch(`/api/marketing/strategy-items/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                isSelected: item.isSelected,
                assignee: item.assignee || "",
              }),
            })
              .then((r) => r.ok)
              .catch((err) => {
                console.error("StrategyItem save failed:", item.id, err);
                return false;
              }),
          ),
        );
        return results.filter((r) => r === false).length;
      };

      // DB 검증: 콘텐츠 기획 페이지가 동일한 쿼리로 데이터를 불러오기 때문에
      // 같은 쿼리로 다시 읽어 실제 반영 여부를 확인한다.
      const verifySavedCount = async (): Promise<number> => {
        try {
          const res = await fetch(
            `/api/marketing/strategy-items?analysisId=${selectedAnalysisId}`,
          );
          if (!res.ok) return -1;
          const arr = (await res.json()) as StrategyItem[];
          return (Array.isArray(arr) ? arr : []).filter((s) => s.isSelected).length;
        } catch (err) {
          console.error("verify failed:", err);
          return -1;
        }
      };

      const failed = await saveAllItems();
      if (failed > 0 && failed === items.length) {
        showNotice("error", "저장에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      // 백엔드 반영이 살짝 지연되는 경우를 대비해 한 번 더 재저장·재검증한다.
      let savedSelected = await verifySavedCount();
      if (savedSelected !== -1 && savedSelected < expectedSelected) {
        await new Promise((r) => setTimeout(r, 400));
        await saveAllItems();
        savedSelected = await verifySavedCount();
      }

      if (savedSelected === 0) {
        showNotice(
          "error",
          "저장은 완료됐지만 콘텐츠 기획에 표시할 항목이 없습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      const finalCount = savedSelected > 0 ? savedSelected : expectedSelected;
      showNotice("success", `${finalCount}건의 실행 항목이 저장되었습니다`);

      // 검증이 끝났으므로 곧바로 이동한다.
      router.push(`/app/marketing/content?analysisId=${selectedAnalysisId}`);
    } catch (e) {
      console.error(e);
      showNotice("error", "저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const swotItems = items.filter((i) => i.framework === "swot");
  const pestItems = items.filter((i) => i.framework === "pest");
  const selectedCount = items.filter((i) => i.isSelected).length;
  const assignedCount = items.filter(
    (i) => i.isSelected && i.assignee && String(i.assignee).trim(),
  ).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <PipelineSteps current="strategy" analysisId={selectedAnalysisId} />
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
            전략 분석 대시보드
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            SWOT · PEST 분석으로 실행 항목을 선정하고 담당자를 배정하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedAnalysisId || generating}
          className="inline-flex items-center justify-center gap-2 bg-[#15803D] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>분석 중...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>{items.length > 0 ? "전략 재생성" : "AI 전략 분석"}</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Selector + Stats */}
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
            placeholder="전략 분석에 반영할 데이터를 자유롭게 입력하세요 (예: 자사 강점·약점, 경쟁 상황, 최근 시장 이슈, 내부 메모 등). 입력한 내용은 SWOT·PEST 생성에 함께 반영됩니다."
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
          />
        </div>

        {items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <StatPill color="#15803D" label="전체 항목" value={`${items.length}건`} />
              <StatPill color="#B45309" label="실행 선택" value={`${selectedCount}건`} />
              <StatPill color="#1D4ED8" label="담당자 배정" value={`${assignedCount}건`} />
            </div>
            <button
              type="button"
              onClick={handleSaveAndProceed}
              disabled={selectedCount === 0 || saving}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>선택 저장 · 콘텐츠 기획</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Empty / Loading states */}
      {loadingItems && items.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">전략 항목을 불러오는 중...</p>
        </div>
      )}

      {!loadingItems && items.length === 0 && selectedAnalysisId && !generating && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 md:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-3 flex items-center justify-center text-emerald-700">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            아직 전략 분석이 생성되지 않았습니다
          </h3>
          <p className="text-sm text-slate-500">
            상단의 &apos;AI 전략 분석&apos; 버튼을 눌러 SWOT · PEST 분석을 자동 생성하세요.
          </p>
        </div>
      )}

      {generating && items.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100 rounded-2xl p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            AI가 SWOT · PEST 분석을 생성 중입니다
          </h3>
          <p className="text-sm text-slate-600">
            상품 데이터를 바탕으로 전략 인사이트를 도출하고 있어요.
          </p>
        </div>
      )}

      {/* SWOT */}
      {swotItems.length > 0 && (
        <Section title="SWOT 분석" subtitle="강점 · 약점 · 기회 · 위협">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {SWOT_CATEGORIES.map((c) => (
              <CategoryCard
                key={c.key}
                config={c}
                items={swotItems.filter((i) => i.category === c.key)}
                onToggle={handleToggle}
                onAssignee={handleAssignee}
              />
            ))}
          </div>
        </Section>
      )}

      {/* PEST */}
      {pestItems.length > 0 && (
        <Section title="PEST 분석" subtitle="정치 · 경제 · 사회 · 기술 환경">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {PEST_CATEGORIES.map((c) => (
              <CategoryCard
                key={c.key}
                config={c}
                items={pestItems.filter((i) => i.category === c.key)}
                onToggle={handleToggle}
                onAssignee={handleAssignee}
              />
            ))}
          </div>
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

function CategoryCard({
  config,
  items,
  onToggle,
  onAssignee,
}: {
  config: CategoryConfig;
  items: StrategyItem[];
  onToggle: (item: StrategyItem) => void;
  onAssignee: (item: StrategyItem, assignee: string) => void;
}) {
  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-4 md:p-5`}>
      <div
        className="flex items-center gap-2 mb-3 pb-3 border-b"
        style={{ borderColor: `${config.color}33` }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <h4 className="text-sm font-bold text-slate-900">{config.label}</h4>
        <span className="ml-auto text-xs text-slate-500 font-medium">
          {items.length}건
        </span>
      </div>
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center">항목 없음</div>
        ) : (
          items.map((item) => (
            <StrategyRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onAssignee={onAssignee}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StrategyRow({
  item,
  onToggle,
  onAssignee,
}: {
  item: StrategyItem;
  onToggle: (item: StrategyItem) => void;
  onAssignee: (item: StrategyItem, assignee: string) => void;
}) {
  const isSelected = item.isSelected;
  const currentAssignee = item.assignee || "";
  const isPredefined = TEAM_MEMBERS.includes(currentAssignee);
  const startInCustom = !!currentAssignee && !isPredefined;
  const [mode, setMode] = useState<"select" | "custom">(startInCustom ? "custom" : "select");
  const [draft, setDraft] = useState(currentAssignee);

  useEffect(() => {
    const a = item.assignee || "";
    setDraft(a);
    setMode(a && !TEAM_MEMBERS.includes(a) ? "custom" : "select");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const handleSelectChange = (value: string) => {
    if (value === "__custom__") {
      setMode("custom");
      setDraft("");
      return;
    }
    onAssignee(item, value);
  };

  const handleCustomBlur = () => {
    onAssignee(item, draft.trim());
  };

  const cancelCustom = () => {
    setMode("select");
    setDraft("");
    onAssignee(item, "");
  };

  return (
    <div
      className={`bg-white rounded-lg p-3 border transition-colors ${
        isSelected ? "border-emerald-300 shadow-sm" : "border-stone-100"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onToggle(item)}
          className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-stone-300 bg-white hover:border-emerald-400"
          }`}
          aria-label="실행 항목 선택"
        >
          {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>
        <p
          className={`flex-1 text-sm leading-relaxed ${
            isSelected ? "text-slate-900 font-medium" : "text-slate-700"
          }`}
        >
          {item.content}
        </p>
      </div>

      {isSelected && (
        <div className="overflow-hidden">
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 ml-7">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {mode === "custom" ? (
                <div className="flex-1 flex items-center gap-1.5">
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
                    placeholder="담당자 이름 직접 입력"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-stone-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={cancelCustom}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    aria-label="목록에서 선택"
                    title="목록에서 선택"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={currentAssignee}
                  onChange={(e) => handleSelectChange(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-stone-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none bg-white"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
