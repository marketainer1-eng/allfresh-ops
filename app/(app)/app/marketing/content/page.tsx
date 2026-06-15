"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles, Loader2, Target, ChevronDown, ChevronUp, Users, Calendar,
  Clock, AlertCircle, Youtube, Instagram, BookOpen, MessageCircle, Award,
} from "lucide-react";

interface Analysis {
  id: string;
  productName: string;
  category: string;
  targetCustomer: string | null;
  marketingCopy: string | null;
  seasonalCampaign: string | null;
  hashtags: string[] | null;
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
  keyPoints: string[];
  hashtags: string[];
  executionTasks?: ExecutionTask[];
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};

const CHANNEL_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; badge: string; chip: string }
> = {
  youtube_shorts: { label: "유튜브 쇼츠", icon: Youtube, badge: "bg-red-100 text-red-700", chip: "bg-red-50 text-red-600" },
  instagram_reels: { label: "인스타그램 릴스", icon: Instagram, badge: "bg-pink-100 text-pink-700", chip: "bg-pink-50 text-pink-600" },
  instagram_feed: { label: "인스타그램 피드", icon: Instagram, badge: "bg-purple-100 text-purple-700", chip: "bg-purple-50 text-purple-600" },
  naver_blog: { label: "네이버 블로그", icon: BookOpen, badge: "bg-emerald-100 text-emerald-700", chip: "bg-emerald-50 text-emerald-600" },
  detail_copy: { label: "상세페이지 카피", icon: MessageCircle, badge: "bg-blue-100 text-blue-700", chip: "bg-blue-50 text-blue-600" },
  promotion: { label: "프로모션 이벤트", icon: Award, badge: "bg-amber-100 text-amber-700", chip: "bg-amber-50 text-amber-600" },
};

const CHANNEL_ORDER = [
  "youtube_shorts", "instagram_reels", "instagram_feed", "naver_blog", "detail_copy", "promotion",
];

const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  high: { label: "높음", badge: "bg-red-100 text-red-700" },
  medium: { label: "보통", badge: "bg-amber-100 text-amber-700" },
  low: { label: "낮음", badge: "bg-gray-100 text-gray-600" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "대기" },
  { value: "in_progress", label: "진행 중" },
  { value: "done", label: "완료" },
];

const TEAM_MEMBERS = [
  "김지영 (마케팅 팀장)",
  "박서준 (콘텐츠 PM)",
  "이하늘 (퍼포먼스 마케터)",
  "최유진 (브랜드 디자이너)",
  "정민호 (데이터 분석가)",
];

function channelConfig(ch: string) {
  return CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.detail_copy;
}

export default function ContentPage() {
  const searchParams = useSearchParams();
  const incomingId = searchParams.get("analysisId");

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyItem[]>([]);
  const [contentPlans, setContentPlans] = useState<ContentPlan[]>([]);
  const [executionTasks, setExecutionTasks] = useState<ExecutionTask[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const loadData = useCallback(async (analysisId: string) => {
    setLoadingData(true);
    try {
      const [stratRes, plansRes] = await Promise.all([
        fetch(`/api/marketing/strategy-items?analysisId=${analysisId}`),
        fetch(`/api/marketing/content-plans?analysisId=${analysisId}`),
      ]);
      const strat = (await stratRes.json()) as StrategyItem[];
      const plans = (await plansRes.json()) as ContentPlan[];
      setSelectedStrategies(Array.isArray(strat) ? strat.filter((s) => s.isSelected) : []);
      setContentPlans(Array.isArray(plans) ? plans : []);
      setExecutionTasks(
        Array.isArray(plans) ? plans.flatMap((p) => p.executionTasks || []) : [],
      );
    } catch {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadData(selectedId);
    else {
      setSelectedStrategies([]);
      setContentPlans([]);
      setExecutionTasks([]);
    }
  }, [selectedId, loadData]);

  const selectedAnalysis = analyses.find((a) => a.id === selectedId) || null;

  async function handleGenerate() {
    if (!selectedAnalysis) {
      setError("분석 대상을 선택해 주세요.");
      return;
    }
    if (selectedStrategies.length === 0) {
      setError("먼저 전략 분석에서 실행할 항목을 선택해 주세요.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/marketing/generate-content-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: selectedAnalysis.productName,
          category: selectedAnalysis.category,
          targetCustomer: selectedAnalysis.targetCustomer,
          marketingCopy: selectedAnalysis.marketingCopy,
          seasonalCampaign: selectedAnalysis.seasonalCampaign,
          hashtags: selectedAnalysis.hashtags || [],
          selectedStrategies: selectedStrategies.map((s) => ({
            framework: s.framework,
            category: s.category,
            content: s.content,
            assignee: s.assignee || "",
          })),
        }),
      });
      if (!res.ok) throw new Error("콘텐츠 생성 요청에 실패했습니다.");
      const data = await res.json();
      if (!Array.isArray(data.contentPlans) || !Array.isArray(data.executionTasks)) {
        throw new Error("콘텐츠 기획 결과를 받지 못했습니다.");
      }

      const saveRes = await fetch("/api/marketing/content-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: selectedId,
          contentPlans: data.contentPlans,
          executionTasks: data.executionTasks.map((t: ExecutionTask & { channel: string }) => ({
            ...t,
            contentPlanChannel: t.channel,
          })),
        }),
      });
      if (!saveRes.ok) throw new Error("콘텐츠 저장에 실패했습니다.");
      await loadData(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "콘텐츠 생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function patchTask(id: string, patch: Partial<ExecutionTask>) {
    setExecutionTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    fetch(`/api/marketing/execution-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => setError("저장에 실패했습니다."));
  }

  const sortedTasks = [...executionTasks].sort(
    (a, b) =>
      new Date(a.recommendedDate || 0).getTime() - new Date(b.recommendedDate || 0).getTime(),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand" />
            콘텐츠 기획
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            확정된 전략을 채널별 콘텐츠로 변환하고, 우선순위 기반 실행 일정을 추천합니다.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!selectedId || generating || selectedStrategies.length === 0}
          className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {contentPlans.length > 0 ? "콘텐츠 재생성" : "콘텐츠 생성"}</>
          )}
        </button>
      </div>

      {/* Analysis selector + strategy chips */}
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

        {selectedId && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-brand" />
              확정된 전략 ({selectedStrategies.length}건)
            </h4>
            {selectedStrategies.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
                전략 분석 페이지에서 실행할 SWOT/PEST 항목을 먼저 선택해 주세요.{" "}
                <Link
                  href={`/app/marketing/strategy?analysisId=${selectedId}`}
                  className="font-semibold underline"
                >
                  전략 분석으로 이동 →
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedStrategies.slice(0, 10).map((s) => (
                  <span
                    key={s.id}
                    title={s.content}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-muted text-brand rounded-md text-xs"
                  >
                    <span className="font-semibold">{s.framework === "swot" ? "SWOT" : "PEST"}</span>
                    <span>·</span>
                    <span className="max-w-[16ch] truncate">{s.content}</span>
                  </span>
                ))}
                {selectedStrategies.length > 10 && (
                  <span className="text-xs text-gray-500 px-1">
                    외 {selectedStrategies.length - 10}건
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {loadingData && contentPlans.length === 0 && !generating ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : !loadingData && contentPlans.length === 0 && selectedId && !generating ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">아직 콘텐츠 기획안이 없습니다</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            확정된 전략을 기반으로 채널별 기획안과 우선순위 기반 실행 플랜을 자동 생성합니다.
          </p>
        </div>
      ) : null}

      {generating && contentPlans.length === 0 && (
        <div className="bg-brand-muted rounded-xl border border-gray-100 p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-brand" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            AI가 콘텐츠 기획안과 실행 플랜을 생성 중입니다
          </h3>
          <p className="text-sm text-gray-600">채널별 컨셉 도출 → 우선순위 판단 → 일정 추천이 진행됩니다.</p>
        </div>
      )}

      {/* Content plans */}
      {contentPlans.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">채널별 콘텐츠 기획안</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              유튜브 쇼츠 · 인스타 릴스/피드 · 네이버 블로그 · 상세페이지 카피 · 프로모션
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHANNEL_ORDER.map((ch) => {
              const plan = contentPlans.find((p) => p.channel === ch);
              if (!plan) return null;
              return (
                <ContentPlanCard
                  key={plan.id}
                  plan={plan}
                  expanded={expandedId === plan.id}
                  onToggle={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Execution timeline */}
      {executionTasks.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">실행 플랜 · AI 추천 일정</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              우선순위와 채널 의존성을 고려해 일정을 추천했습니다. 담당자와 상태는 자유롭게 변경할 수 있어요.
            </p>
          </div>
          <ExecutionTimeline tasks={sortedTasks} onPatch={patchTask} />
        </div>
      )}
    </div>
  );
}

function ContentPlanCard({ plan, expanded, onToggle }: {
  plan: ContentPlan; expanded: boolean; onToggle: () => void;
}) {
  const config = channelConfig(plan.channel);
  const Icon = config.icon;
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-5 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.chip}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badge}`}>
              {config.label}
            </span>
            <h4 className="text-sm font-bold text-gray-900 mt-1 leading-snug">{plan.title}</h4>
            {!expanded && plan.description && (
              <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-gray-400 mt-0.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {plan.description && (
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
              {plan.description}
            </p>
          )}
          {plan.keyPoints?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1.5">핵심 포인트</div>
              <ul className="space-y-1.5">
                {plan.keyPoints.map((kp, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-brand" />
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plan.hashtags.map((h, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExecutionTimeline({ tasks, onPatch }: {
  tasks: ExecutionTask[];
  onPatch: (id: string, patch: Partial<ExecutionTask>) => void;
}) {
  // Group by calendar date.
  const groups: { key: string; label: string; items: ExecutionTask[] }[] = [];
  const byKey: Record<string, { key: string; label: string; items: ExecutionTask[] }> = {};
  tasks.forEach((t) => {
    const d = new Date(t.recommendedDate);
    const key = isNaN(d.getTime()) ? "미정" : d.toISOString().slice(0, 10);
    const label = isNaN(d.getTime())
      ? "일정 미정"
      : d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    if (!byKey[key]) {
      byKey[key] = { key, label, items: [] };
      groups.push(byKey[key]);
    }
    byKey[key].items.push(t);
  });

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {groups.map((group, gi) => (
        <div key={group.key} className={gi > 0 ? "border-t border-gray-100" : ""}>
          <div className="px-5 py-2.5 bg-gray-50 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-700">{group.label}</span>
            <span className="text-xs text-gray-400">· {group.items.length}건</span>
          </div>
          <div className="divide-y divide-gray-100">
            {group.items.map((t) => (
              <TaskRow key={t.id} task={t} onPatch={onPatch} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskRow({ task, onPatch }: {
  task: ExecutionTask;
  onPatch: (id: string, patch: Partial<ExecutionTask>) => void;
}) {
  const config = channelConfig(task.channel);
  const Icon = config.icon;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const [draft, setDraft] = useState(task.assignee || "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setDraft(task.assignee || "");
  }, [task.id, task.assignee]);

  function onAssigneeChange(v: string) {
    setDraft(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onPatch(task.id, { assignee: v }), 500);
  }

  const isPredefined = TEAM_MEMBERS.includes(draft);
  const dateLabel = (() => {
    const d = new Date(task.recommendedDate);
    if (isNaN(d.getTime())) return "-";
    return `${d.getMonth() + 1}/${d.getDate()}`;
  })();

  return (
    <div className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.chip}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priority.badge}`}>
              {priority.label}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">{config.label}</span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium">
              <Calendar className="w-3 h-3" /> {dateLabel}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</div>
          {task.description && (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={isPredefined ? draft : draft ? "__custom__" : ""}
              onChange={(e) => {
                if (e.target.value === "__custom__") onAssigneeChange(" ");
                else onAssigneeChange(e.target.value);
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand/30"
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
                className="px-2.5 py-1 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
            )}
            <select
              value={task.status}
              onChange={(e) => onPatch(task.id, { status: e.target.value })}
              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
