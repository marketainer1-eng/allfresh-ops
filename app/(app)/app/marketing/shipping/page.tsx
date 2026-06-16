"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  type ComponentType,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PipelineSteps from "@/components/app/PipelineSteps";
import {
  Truck,
  Calendar,
  Loader2,
  Check,
  AlertCircle,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Bell,
  Eye,
  Heart,
  ShoppingCart,
  Clock,
  Trash2,
  ArrowLeft,
  type LucideProps,
} from "lucide-react";

// ── 데이터 타입 ──────────────────────────────────────────────
interface Analysis {
  id: string;
  productName: string;
  category: string;
  targetCustomer: string | null;
  marketingCopy: string | null;
  seasonalCampaign: string | null;
}

interface ScheduleItem {
  tempId: string;
  title: string;
  description: string;
  channel: string;
  phase: string;
  daysBefore: number;
  date: string; // ISO
}

type NoticeType = "success" | "error";

// ── 상수 ─────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};

interface PhaseConfig {
  label: string;
  icon: ComponentType<LucideProps>;
  color: string;
  bg: string;
  border: string;
  text: string;
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  preorder: {
    label: "사전 예약",
    icon: ShoppingCart,
    color: "#7C3AED",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  teaser: {
    label: "티저 광고",
    icon: Eye,
    color: "#BE185D",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
  },
  awareness: {
    label: "본격 광고",
    icon: TrendingUp,
    color: "#1D4ED8",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  countdown: {
    label: "카운트다운",
    icon: Bell,
    color: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  launch: {
    label: "출하 D-DAY",
    icon: Truck,
    color: "#15803D",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  retention: {
    label: "리텐션",
    icon: Heart,
    color: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
};

const CHANNEL_OPTIONS = [
  { value: "SNS", label: "SNS" },
  { value: "EDM", label: "이메일/EDM" },
  { value: "BANNER", label: "배너 광고" },
  { value: "BLOG", label: "블로그" },
] as const;

const ALLOWED_CHANNELS = ["SNS", "EDM", "BANNER", "BLOG"];

const channelLabel = (c: string): string => {
  const opt = CHANNEL_OPTIONS.find((o) => o.value === c);
  return opt ? opt.label : c;
};

// ── 날짜 유틸 ────────────────────────────────────────────────
function computeDate(shippingISO: string, daysBefore: number): string {
  const ship = new Date(shippingISO);
  ship.setHours(10, 0, 0, 0);
  const d = new Date(ship);
  d.setDate(d.getDate() - Number(daysBefore || 0));
  return d.toISOString();
}

function computeDaysBefore(dateISO: string, shippingISO: string): number {
  const a = new Date(dateISO);
  const b = new Date(shippingISO);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function computeDDay(
  itemDate: string,
  shippingDate: string,
): { label: string; tone: string } {
  if (!itemDate || !shippingDate) return { label: "-", tone: "text-slate-500" };
  const a = new Date(itemDate);
  const b = new Date(shippingDate);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) {
    return { label: "-", tone: "text-slate-500" };
  }
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { label: "D-DAY", tone: "text-emerald-700" };
  if (diff > 0) return { label: `D-${diff}`, tone: "text-blue-700" };
  return { label: `D+${Math.abs(diff)}`, tone: "text-amber-700" };
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${y}.${m}.${day} (${dayOfWeek})`;
}

// ── 메인 ─────────────────────────────────────────────────────
function ShippingPlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [shippingDate, setShippingDate] = useState("");
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [notification, setNotification] = useState<{
    type: NoticeType;
    msg: string;
  } | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const showNotice = (type: NoticeType, msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true);
    try {
      const res = await fetch("/api/marketing/analyses?pageSize=100");
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      const list: Analysis[] = json?.data || [];
      setAnalyses(list);
      const queryId = searchParams.get("analysisId");
      if (list.length > 0) {
        setSelectedAnalysisId((p) => p || queryId || list[0].id);
      }
    } catch (e) {
      console.error(e);
      showNotice("error", "분석 목록을 불러오지 못했습니다");
    } finally {
      setLoadingAnalyses(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const analysis = analyses.find(
    (a) => String(a.id) === String(selectedAnalysisId),
  );

  const handleGenerate = async () => {
    if (!selectedAnalysisId || !analysis) {
      showNotice("error", "분석 대상을 선택해 주세요");
      return;
    }
    if (!shippingDate) {
      showNotice("error", "과일 출하 시기를 입력해 주세요");
      return;
    }
    setGenerating(true);
    setConfirmed(false);
    try {
      const res = await fetch("/api/marketing/generate-shipping-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: analysis.productName,
          category: analysis.category,
          targetCustomer: analysis.targetCustomer,
          marketingCopy: analysis.marketingCopy,
          seasonalCampaign: analysis.seasonalCampaign,
          shippingDate,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data || !Array.isArray(data.items)) {
        throw new Error(
          data?.error || "일정 추천 결과를 받지 못했습니다",
        );
      }
      const next: ScheduleItem[] = data.items.map(
        (it: Record<string, unknown>, idx: number) => {
          const days = Number(it?.daysBefore);
          const safeDays = isNaN(days) ? 7 : days;
          const ch = String(it?.channel ?? "");
          const ph = String(it?.phase ?? "");
          return {
            tempId: `tmp_${Date.now()}_${idx}`,
            title: String(it?.title || "").slice(0, 80),
            description: String(it?.description || "").slice(0, 200),
            channel: ALLOWED_CHANNELS.includes(ch) ? ch : "SNS",
            phase: PHASE_CONFIG[ph] ? ph : "awareness",
            daysBefore: safeDays,
            date: computeDate(shippingDate, safeDays),
          };
        },
      );
      next.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setItems(next);
      setEditingDateId(null);
      showNotice("success", `${next.length}건의 마케팅 일정이 추천되었습니다`);
    } catch (e) {
      console.error(e);
      showNotice(
        "error",
        e instanceof Error
          ? e.message
          : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setGenerating(false);
    }
  };

  // 드래그-드롭 라이브러리 대신 ▲/▼ 버튼으로 순서 변경
  const handleMove = (index: number, dir: -1 | 1) => {
    if (confirmed) return;
    setItems((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSortByDate = () => {
    if (confirmed) return;
    setItems((prev) =>
      [...prev].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== id));
  };

  const handleUpdateItem = (id: string, patch: Partial<ScheduleItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.tempId === id ? { ...i, ...patch } : i)),
    );
  };

  const handleConfirm = async () => {
    if (items.length === 0 || confirmed) return;
    setConfirming(true);
    try {
      const payload = {
        items: items.map((it) => {
          const phaseConfig = PHASE_CONFIG[it.phase] || PHASE_CONFIG.awareness;
          const startDate = new Date(it.date);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 2);
          return {
            title: it.title,
            description: it.description,
            category: analysis?.category || "single",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: "planned" as const,
            color: phaseConfig.color,
            channel: it.channel,
            analysisId: selectedAnalysisId || null,
          };
        }),
      };
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "캠페인 저장에 실패했습니다");
      }
      const createdCount = Array.isArray(json?.data)
        ? json.data.length
        : items.length;
      setConfirmedCount(createdCount);
      setConfirmed(true);
      if (createdCount === items.length) {
        showNotice(
          "success",
          `${createdCount}건의 캠페인이 마케팅 일정에 등록되었습니다`,
        );
      } else if (createdCount > 0) {
        showNotice(
          "success",
          `${createdCount}/${items.length}건이 등록되었습니다. 일부 항목 저장에 실패했습니다.`,
        );
      } else {
        showNotice("error", "캠페인 저장에 실패했습니다");
      }
    } catch (e) {
      console.error(e);
      showNotice("error", e instanceof Error ? e.message : "캠페인 저장 실패");
    } finally {
      setConfirming(false);
    }
  };

  const goToSchedule = () => router.push("/app/marketing/schedule");

  const stats = (() => {
    if (!shippingDate || items.length === 0) {
      return { total: items.length, pre: 0, dday: 0, post: 0 };
    }
    const ship = new Date(shippingDate);
    ship.setHours(0, 0, 0, 0);
    let pre = 0;
    let dday = 0;
    let post = 0;
    items.forEach((it) => {
      const d = new Date(it.date);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() < ship.getTime()) pre += 1;
      else if (d.getTime() === ship.getTime()) dday += 1;
      else post += 1;
    });
    return { total: items.length, pre, dday, post };
  })();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <PipelineSteps current="shipping" analysisId={selectedAnalysisId || null} />
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border ${
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

      <div className="mb-5">
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          출하 마케팅 일정 추천
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          과일 출하일을 기준으로 사전 예약 · 티저 · 본격 광고 · 카운트다운 · 출하 · 리텐션을 역산해 자동 추천합니다.
        </p>
      </div>

      {/* Setup */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 md:p-5 mb-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-2 block">
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
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>과일 출하 시기 (D-Day)</span>
            </div>
            <DateInput
              value={shippingDate}
              onChange={setShippingDate}
              placeholder="출하일 선택"
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            출하일 기준으로 약 4~6주 전부터 D+7까지 단계별 일정이 생성됩니다.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedAnalysisId || !shippingDate || generating}
            className="inline-flex items-center justify-center gap-2 bg-[#15803D] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>추천 중...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>{items.length > 0 ? "일정 재추천" : "AI 일정 추천"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {generating && items.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100 rounded-2xl p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            출하일 기준으로 마케팅 일정을 역산 중입니다
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            사전 예약 → 티저 → 본격 광고 → 카운트다운 → 출하 → 리텐션 순서로 일정을 추천합니다.
          </p>
        </div>
      )}

      {!generating && items.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 md:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-3 flex items-center justify-center text-emerald-700">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            아직 추천된 일정이 없습니다
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            출하일을 입력하고 &apos;AI 일정 추천&apos; 버튼을 누르면 역산된 선행 마케팅 일정이 자동 생성됩니다.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <StatPill color="#15803D" label="추천 일정" value={`${stats.total}건`} />
                <StatPill color="#1D4ED8" label="출하 전" value={`${stats.pre}건`} />
                <StatPill color="#15803D" label="D-Day" value={`${stats.dday}건`} />
                <StatPill color="#B45309" label="출하 후" value={`${stats.post}건`} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSortByDate}
                  disabled={confirmed}
                  className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-stone-100 transition-colors inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Clock className="w-3 h-3" />
                  날짜순 정렬
                </button>
                {confirmed ? (
                  <button
                    type="button"
                    onClick={goToSchedule}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>일정 보기</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirming || items.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>확정 ({items.length}건)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            {!confirmed ? (
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-stone-100 leading-relaxed flex items-center gap-1.5 flex-wrap">
                <ChevronUp className="w-3 h-3 inline-block" />
                <ChevronDown className="w-3 h-3 inline-block -ml-1" />
                <span>
                  ▲/▼ 버튼으로 순서를 바꾸거나 날짜를 클릭해 일정을 조정한 뒤 &apos;확정&apos; 버튼을 누르세요. 확정 시 마케팅 일정 페이지에 자동 등록됩니다.
                </span>
              </p>
            ) : (
              <div className="mt-3 pt-3 border-t border-emerald-100 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  최종 캘린더가 완성되었습니다. <strong>{confirmedCount}건의 캠페인</strong>이 &apos;마케팅 일정&apos; 페이지에 등록되었습니다. 다시 추천하려면 &apos;AI 일정 재추천&apos; 버튼을 눌러 주세요.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            {items.map((item, index) => (
              <ScheduleRow
                key={item.tempId}
                item={item}
                index={index}
                total={items.length}
                shippingDate={shippingDate}
                editingDate={editingDateId === item.tempId}
                locked={confirmed}
                onMove={handleMove}
                onToggleEditDate={() =>
                  setEditingDateId(
                    editingDateId === item.tempId ? null : item.tempId,
                  )
                }
                onUpdate={(patch) => handleUpdateItem(item.tempId, patch)}
                onDelete={() => handleDeleteItem(item.tempId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatPill({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function ScheduleRow({
  item,
  index,
  total,
  shippingDate,
  editingDate,
  locked,
  onMove,
  onToggleEditDate,
  onUpdate,
  onDelete,
}: {
  item: ScheduleItem;
  index: number;
  total: number;
  shippingDate: string;
  editingDate: boolean;
  locked: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
  onToggleEditDate: () => void;
  onUpdate: (patch: Partial<ScheduleItem>) => void;
  onDelete: () => void;
}) {
  const phase = PHASE_CONFIG[item.phase] || PHASE_CONFIG.awareness;
  const Icon = phase.icon;
  const dDay = computeDDay(item.date, shippingDate);
  return (
    <div className="border-b border-stone-100 last:border-b-0 transition-colors hover:bg-stone-50/40">
      <div className="px-3 md:px-4 py-3.5 flex items-start gap-2">
        <div className="flex flex-col flex-shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={locked || index === 0}
            className={`p-1 rounded ${
              locked
                ? "cursor-not-allowed opacity-30"
                : "text-slate-400 hover:text-slate-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
            }`}
            aria-label="위로 이동"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={locked || index === total - 1}
            className={`p-1 rounded ${
              locked
                ? "cursor-not-allowed opacity-30"
                : "text-slate-400 hover:text-slate-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
            }`}
            aria-label="아래로 이동"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${phase.color}1F`, color: phase.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${phase.bg} ${phase.text} border ${phase.border}`}
            >
              {phase.label}
            </span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {channelLabel(item.channel)}
            </span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className={`text-[10px] font-bold ${dDay.tone}`}>
              {dDay.label}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-900 leading-snug">
            {item.title}
          </div>
          {item.description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onToggleEditDate}
              disabled={locked}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
                locked
                  ? "bg-stone-100 border-stone-200 text-slate-500 cursor-not-allowed"
                  : "bg-white border-stone-300 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {formatDate(item.date)}
            </button>
            <select
              value={item.channel}
              onChange={(e) => onUpdate({ channel: e.target.value })}
              disabled={locked}
              className="px-2 py-1 text-[11px] rounded-md border border-stone-300 bg-white text-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none disabled:bg-stone-100 disabled:cursor-not-allowed"
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {!locked && (
              <button
                type="button"
                onClick={onDelete}
                className="ml-auto p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                aria-label="이 일정 삭제"
                title="이 일정 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingDate && !locked && (
            <div className="mt-2.5 pt-2.5 border-t border-stone-100">
              <CalendarPopover
                value={item.date}
                onChange={(iso) => {
                  const newDate = new Date(iso);
                  newDate.setHours(10, 0, 0, 0);
                  const days = shippingDate
                    ? computeDaysBefore(newDate.toISOString(), shippingDate)
                    : item.daysBefore;
                  onUpdate({
                    date: newDate.toISOString(),
                    daysBefore: days,
                  });
                  onToggleEditDate();
                }}
                onClose={onToggleEditDate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 날짜 입력 (출하일) ───────────────────────────────────────
function DateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white text-left flex items-center justify-between"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-stone-200 rounded-xl shadow-lg p-3">
          <CalendarPopover
            value={value}
            onChange={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function CalendarPopover({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (iso: string) => void;
  onClose?: () => void;
}) {
  const initial = value ? new Date(value) : new Date();
  const [view, setView] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });
  const firstDay = new Date(view.year, view.month, 1);
  const lastDay = new Date(view.year, view.month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const selected = value ? new Date(value) : null;
  const isSelected = (d: number) =>
    !!selected &&
    selected.getFullYear() === view.year &&
    selected.getMonth() === view.month &&
    selected.getDate() === d;
  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === view.year &&
    today.getMonth() === view.month &&
    today.getDate() === d;
  const prevMonth = () => {
    if (view.month === 0) setView({ year: view.year - 1, month: 11 });
    else setView({ ...view, month: view.month - 1 });
  };
  const nextMonth = () => {
    if (view.month === 11) setView({ year: view.year + 1, month: 0 });
    else setView({ ...view, month: view.month + 1 });
  };
  const handlePick = (d: number) => {
    const newDate = new Date(view.year, view.month, d, 10, 0, 0);
    onChange(newDate.toISOString());
  };
  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-sm font-semibold text-slate-900">
          {view.year}년 {view.month + 1}월
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded"
          aria-label="다음 달"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={`text-[10px] font-semibold py-1 ${
              i === 0
                ? "text-red-500"
                : i === 6
                  ? "text-blue-500"
                  : "text-slate-500"
            }`}
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const sel = isSelected(d);
          const tod = isToday(d);
          return (
            <button
              type="button"
              key={d}
              onClick={() => handlePick(d)}
              className={`text-xs rounded h-7 flex items-center justify-center transition-colors ${
                sel
                  ? "bg-emerald-600 text-white font-semibold"
                  : tod
                    ? "bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100"
                    : "text-slate-700 hover:bg-stone-100"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      {onClose && (
        <div className="mt-2 pt-2 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-stone-100"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShippingPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      }
    >
      <ShippingPlannerInner />
    </Suspense>
  );
}
