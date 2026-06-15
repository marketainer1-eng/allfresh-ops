"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Target, Loader2, Sparkles, Check, Users, ArrowRight, AlertCircle,
} from "lucide-react";

interface Analysis {
  id: string;
  productName: string;
  category: string;
  productInfo: string | null;
  targetCustomer: string | null;
  marketingCopy: string | null;
  seasonalCampaign: string | null;
}

interface StrategyItem {
  id: string;
  analysisId: string;
  framework: string;
  category: string;
  content: string;
  isSelected: boolean;
  assignee: string;
}

interface StrategyResult {
  swot: { strength: string[]; weakness: string[]; opportunity: string[]; threat: string[] };
  pest: { political: string[]; economic: string[]; social: string[]; technological: string[] };
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};

const SWOT_CATEGORIES = [
  { key: "strength", label: "강점 (Strengths)", badge: "bg-emerald-100 text-emerald-700" },
  { key: "weakness", label: "약점 (Weaknesses)", badge: "bg-red-100 text-red-700" },
  { key: "opportunity", label: "기회 (Opportunities)", badge: "bg-blue-100 text-blue-700" },
  { key: "threat", label: "위협 (Threats)", badge: "bg-amber-100 text-amber-700" },
];
const PEST_CATEGORIES = [
  { key: "political", label: "정치 (Political)", badge: "bg-purple-100 text-purple-700" },
  { key: "economic", label: "경제 (Economic)", badge: "bg-cyan-100 text-cyan-700" },
  { key: "social", label: "사회 (Social)", badge: "bg-pink-100 text-pink-700" },
  { key: "technological", label: "기술 (Technological)", badge: "bg-emerald-100 text-emerald-700" },
];

const TEAM_MEMBERS = [
  "김지영 (마케팅 팀장)",
  "박서준 (콘텐츠 PM)",
  "이하늘 (퍼포먼스 마케터)",
  "최유진 (브랜드 디자이너)",
  "정민호 (데이터 분석가)",
];

export default function StrategyPage() {
  const searchParams = useSearchParams();
  const incomingId = searchParams.get("analysisId");

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [items, setItems] = useState<StrategyItem[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load analyses once.
  useEffect(() => {
    (async () => {
      setLoadingAnalyses(true);
      try {
        const res = await fetch("/api/marketing/analyses?pageSize=100");
        const json = await res.json();
        const list: Analysis[] = json.data || [];
        setAnalyses(list);
        if (list.length > 0) {
          const exists = incomingId && list.some((a) => a.id === incomingId);
          setSelectedId(exists ? incomingId! : list[0].id);
        }
      } catch {
        setError("분석 목록을 불러오지 못했습니다.");
      } finally {
        setLoadingAnalyses(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadItems = useCallback(async (analysisId: string) => {
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/marketing/strategy-items?analysisId=${analysisId}`);
      const json = await res.json();
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setError("전략 항목을 불러오지 못했습니다.");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadItems(selectedId);
    else setItems([]);
  }, [selectedId, loadItems]);

  const selectedAnalysis = analyses.find((a) => a.id === selectedId) || null;

  async function handleGenerate() {
    if (!selectedAnalysis) {
      setError("분석 대상을 먼저 선택해 주세요.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/marketing/analyze-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: selectedAnalysis.productName,
          category: selectedAnalysis.category,
          targetCustomer: selectedAnalysis.targetCustomer,
          marketingCopy: selectedAnalysis.marketingCopy,
          seasonalCampaign: selectedAnalysis.seasonalCampaign,
          productInfo: selectedAnalysis.productInfo,
        }),
      });
      if (!res.ok) throw new Error("전략 분석 요청에 실패했습니다.");
      const data = (await res.json()) as StrategyResult;
      if (!data?.swot || !data?.pest) throw new Error("전략 분석 결과를 받지 못했습니다.");

      const flat: { framework: "swot" | "pest"; category: string; content: string }[] = [];
      (["strength", "weakness", "opportunity", "threat"] as const).forEach((cat) => {
        (data.swot[cat] || []).forEach((content) =>
          flat.push({ framework: "swot", category: cat, content: String(content) }),
        );
      });
      (["political", "economic", "social", "technological"] as const).forEach((cat) => {
        (data.pest[cat] || []).forEach((content) =>
          flat.push({ framework: "pest", category: cat, content: String(content) }),
        );
      });

      const saveRes = await fetch("/api/marketing/strategy-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: selectedId, items: flat }),
      });
      if (!saveRes.ok) throw new Error("전략 항목 저장에 실패했습니다.");
      const saved = (await saveRes.json()) as StrategyItem[];
      setItems(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "전략 생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function patchItem(id: string, patch: Partial<StrategyItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    fetch(`/api/marketing/strategy-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => setError("저장에 실패했습니다."));
  }

  const swotItems = items.filter((i) => i.framework === "swot");
  const pestItems = items.filter((i) => i.framework === "pest");
  const selectedCount = items.filter((i) => i.isSelected).length;
  const assignedCount = items.filter((i) => i.isSelected && i.assignee.trim()).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-brand" />
            전략 분석
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            SWOT · PEST 분석으로 실행 항목을 선정하고 담당자를 배정하세요.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!selectedId || generating}
          className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 분석 중…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {items.length > 0 ? "AI 전략 재생성" : "AI 전략 생성"}</>
          )}
        </button>
      </div>

      {/* Analysis selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">분석 대상</label>
          {loadingAnalyses ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중…
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              저장된 분석이 없습니다.{" "}
              <Link href="/app/marketing/new" className="text-brand font-medium">
                새 분석 생성하기 →
              </Link>
            </div>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.productName} ({CATEGORY_LABEL[a.category] || a.category})
                </option>
              ))}
            </select>
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
              <span>전체 <b className="text-gray-900">{items.length}</b>건</span>
              <span>실행 선택 <b className="text-gray-900">{selectedCount}</b>건</span>
              <span>담당자 배정 <b className="text-gray-900">{assignedCount}</b>건</span>
            </div>
            {selectedCount > 0 ? (
              <Link
                href={`/app/marketing/content?analysisId=${selectedId}`}
                className="inline-flex items-center gap-1.5 bg-brand-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                다음: 콘텐츠 기획 <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                다음: 콘텐츠 기획 <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* States */}
      {loadingItems && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : !loadingItems && items.length === 0 && selectedId && !generating ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Target className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            아직 전략 분석이 생성되지 않았습니다
          </h3>
          <p className="text-sm text-gray-500">
            상단의 'AI 전략 생성' 버튼을 눌러 SWOT · PEST 분석을 자동 생성하세요.
          </p>
        </div>
      ) : null}

      {generating && items.length === 0 && (
        <div className="bg-brand-muted rounded-xl border border-gray-100 p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-brand" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            AI가 SWOT · PEST 분석을 생성 중입니다
          </h3>
          <p className="text-sm text-gray-600">상품 데이터를 바탕으로 전략 인사이트를 도출하고 있어요.</p>
        </div>
      )}

      {/* SWOT */}
      {swotItems.length > 0 && (
        <Section title="SWOT 분석" subtitle="강점 · 약점 · 기회 · 위협">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SWOT_CATEGORIES.map((c) => (
              <CategoryCard
                key={c.key}
                config={c}
                items={swotItems.filter((i) => i.category === c.key)}
                onPatch={patchItem}
              />
            ))}
          </div>
        </Section>
      )}

      {/* PEST */}
      {pestItems.length > 0 && (
        <Section title="PEST 분석" subtitle="정치 · 경제 · 사회 · 기술 환경">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PEST_CATEGORIES.map((c) => (
              <CategoryCard
                key={c.key}
                config={c}
                items={pestItems.filter((i) => i.category === c.key)}
                onPatch={patchItem}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function CategoryCard({ config, items, onPatch }: {
  config: { key: string; label: string; badge: string };
  items: StrategyItem[];
  onPatch: (id: string, patch: Partial<StrategyItem>) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badge}`}>
          {config.label}
        </span>
        <span className="ml-auto text-xs text-gray-400 font-medium">{items.length}건</span>
      </div>
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="text-xs text-gray-400 py-3 text-center">항목 없음</div>
        ) : (
          items.map((item) => (
            <StrategyRow key={item.id} item={item} onPatch={onPatch} />
          ))
        )}
      </div>
    </div>
  );
}

function StrategyRow({ item, onPatch }: {
  item: StrategyItem;
  onPatch: (id: string, patch: Partial<StrategyItem>) => void;
}) {
  const [draft, setDraft] = useState(item.assignee || "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(item.assignee || "");
  }, [item.id, item.assignee]);

  function onAssigneeChange(v: string) {
    setDraft(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onPatch(item.id, { assignee: v }), 500);
  }

  const isPredefined = TEAM_MEMBERS.includes(draft);

  return (
    <div
      className={`rounded-lg p-3 border transition-colors ${
        item.isSelected ? "border-brand/40 bg-brand-muted/40" : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onPatch(item.id, { isSelected: !item.isSelected })}
          className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
            item.isSelected
              ? "border-brand bg-brand text-white"
              : "border-gray-300 bg-white hover:border-brand"
          }`}
          aria-label="실행 항목 선택"
        >
          {item.isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>
        <p
          className={`flex-1 text-sm leading-relaxed ${
            item.isSelected ? "text-gray-900 font-medium" : "text-gray-700"
          }`}
        >
          {item.content}
        </p>
      </div>

      {item.isSelected && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 ml-7">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={isPredefined ? draft : draft ? "__custom__" : ""}
              onChange={(e) => {
                if (e.target.value === "__custom__") onAssigneeChange(" ");
                else onAssigneeChange(e.target.value);
              }}
              className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand/30"
            >
              <option value="">담당자 미배정</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="__custom__">+ 직접 입력</option>
            </select>
            {!isPredefined && draft && (
              <input
                value={draft}
                onChange={(e) => onAssigneeChange(e.target.value)}
                placeholder="담당자 직접 입력"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
