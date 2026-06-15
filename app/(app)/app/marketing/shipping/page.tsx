"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Truck, Loader2, ArrowLeft, Zap, Check, AlertCircle,
  ChevronUp, ChevronDown, Trash2, Calendar,
} from "lucide-react";

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

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};

const PHASE_LABEL: Record<string, string> = {
  preorder: "사전 예약",
  teaser: "티저 광고",
  awareness: "본격 광고",
  countdown: "카운트다운",
  launch: "출하 D-DAY",
  retention: "리텐션",
};

const CHANNEL_LABEL: Record<string, string> = {
  SNS: "SNS",
  EDM: "이메일/EDM",
  BANNER: "배너 광고",
  BLOG: "블로그",
};

const CHANNEL_COLOR: Record<string, string> = {
  SNS: "#22c55e",
  EDM: "#3b82f6",
  BANNER: "#f59e0b",
  BLOG: "#8b5cf6",
};

const ALLOWED_CHANNELS = ["SNS", "EDM", "BANNER", "BLOG"];

function computeDate(shippingISO: string, daysBefore: number): string {
  const ship = new Date(shippingISO);
  ship.setHours(10, 0, 0, 0);
  const d = new Date(ship);
  d.setDate(d.getDate() - Number(daysBefore || 0));
  return d.toISOString();
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${y}.${m}.${day} (${dow})`;
}

function computeDDay(itemDate: string, shippingDate: string) {
  if (!itemDate || !shippingDate) return { label: "-", tone: "text-gray-500" };
  const a = new Date(itemDate);
  const b = new Date(shippingDate);
  if (isNaN(a.getTime()) || isNaN(b.getTime()))
    return { label: "-", tone: "text-gray-500" };
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (diff === 0) return { label: "D-DAY", tone: "text-green-700" };
  if (diff > 0) return { label: `D-${diff}`, tone: "text-blue-700" };
  return { label: `D+${Math.abs(diff)}`, tone: "text-amber-700" };
}

function ShippingPlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [shippingDate, setShippingDate] = useState("");
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showNotice = (type: "success" | "error", msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  };

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true);
    try {
      const res = await fetch("/api/marketing/analyses?pageSize=100");
      const json = await res.json();
      const list: Analysis[] = json?.data || [];
      setAnalyses(list);
      const queryId = searchParams.get("analysisId");
      setSelectedId((prev) => prev || queryId || (list[0]?.id ?? ""));
    } catch {
      showNotice("error", "분석 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingAnalyses(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const analysis = analyses.find((a) => a.id === selectedId);

  async function handleGenerate() {
    if (!analysis) {
      showNotice("error", "분석 대상을 선택해 주세요.");
      return;
    }
    if (!shippingDate) {
      showNotice("error", "출하 예정일을 입력해 주세요.");
      return;
    }
    setGenerating(true);
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
      if (!res.ok) throw new Error("일정 추천에 실패했습니다.");
      const data = await res.json();
      if (!data || !Array.isArray(data.items))
        throw new Error("일정 추천 결과를 받지 못했습니다.");
      const next: ScheduleItem[] = data.items.map((it: any, idx: number) => {
        const days = Number(it?.daysBefore);
        const safeDays = isNaN(days) ? 7 : days;
        return {
          tempId: `tmp_${Date.now()}_${idx}`,
          title: String(it?.title || "").slice(0, 80),
          description: String(it?.description || "").slice(0, 200),
          channel: ALLOWED_CHANNELS.includes(it?.channel) ? it.channel : "SNS",
          phase: PHASE_LABEL[it?.phase] ? it.phase : "awareness",
          daysBefore: safeDays,
          date: computeDate(shippingDate, safeDays),
        };
      });
      next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setItems(next);
      showNotice("success", `${next.length}건의 마케팅 일정이 추천되었습니다.`);
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function sortByDate() {
    setItems((prev) =>
      [...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    );
  }

  function remove(tempId: string) {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  }

  async function handleConfirm() {
    if (items.length === 0) return;
    setConfirming(true);
    try {
      const payload = {
        items: items.map((it) => ({
          title: it.title,
          description: it.description,
          channel: it.channel,
          startDate: it.date,
          endDate: new Date(shippingDate).toISOString(),
          status: "planned",
          analysisId: selectedId || null,
          color: CHANNEL_COLOR[it.channel] ?? "#15803D",
          category: analysis?.category ?? null,
        })),
      };
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("캠페인 저장에 실패했습니다.");
      showNotice("success", `${items.length}건의 캠페인이 등록되었습니다.`);
      router.push("/app/marketing/schedule");
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "저장 실패");
      setConfirming(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {notice && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border ${
            notice.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-start gap-2">
            {notice.type === "success" ? (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{notice.msg}</span>
          </div>
        </div>
      )}

      <div>
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-brand" />
          출하 마케팅 일정 추천
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          출하 예정일을 기준으로 사전 예약 · 티저 · 본격 광고 · 카운트다운 · 출하 · 리텐션을 역산해 자동 추천합니다.
        </p>
      </div>

      {/* 설정 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  새 분석 만들기 →
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
                    {a.productName} ({CATEGORY_LABEL[a.category] ?? a.category})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-brand" />
              출하 예정일 (D-Day)
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-xs text-gray-500">
            출하일 기준으로 약 4~6주 전부터 D+7까지 단계별 일정이 생성됩니다.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedId || !shippingDate || generating}
            className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 추천 중…</>
            ) : (
              <><Zap className="w-4 h-4" /> {items.length > 0 ? "AI 일정 재추천" : "AI 출하 일정 생성"}</>
            )}
          </button>
        </div>
      </div>

      {/* 빈 상태 */}
      {!generating && items.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-muted mx-auto mb-3 flex items-center justify-center text-brand">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">아직 추천된 일정이 없습니다</h3>
          <p className="text-sm text-gray-500">
            출하 예정일을 입력하고 'AI 출하 일정 생성'을 누르면 역산된 선행 마케팅 일정이 자동 생성됩니다.
          </p>
        </div>
      )}

      {/* 결과 목록 */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              추천 일정 <span className="font-semibold text-gray-900">{items.length}건</span>
              <span className="text-gray-400 ml-1">· ▲▼ 버튼으로 순서를 조정하세요.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={sortByDate}
                className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-md hover:bg-gray-100"
              >
                <Calendar className="w-3 h-3" /> 날짜순 정렬
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || items.length === 0}
                className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
              >
                {confirming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중…</>
                ) : (
                  <><Check className="w-4 h-4" /> 캠페인으로 확정 ({items.length}건)</>
                )}
              </button>
            </div>
          </div>

          <ol>
            {items.map((item, index) => {
              const dDay = computeDDay(item.date, shippingDate);
              const color = CHANNEL_COLOR[item.channel] ?? "#15803D";
              return (
                <li
                  key={item.tempId}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors"
                >
                  <div className="px-3 md:px-6 py-3.5 flex items-start gap-3">
                    <div className="flex flex-col flex-shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="위로 이동"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="아래로 이동"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium tabular-nums">
                          {formatDate(item.date)}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className={`text-xs font-bold ${dDay.tone}`}>{dDay.label}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {PHASE_LABEL[item.phase] ?? item.phase}
                        </span>
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {CHANNEL_LABEL[item.channel] ?? item.channel}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 leading-snug">
                        {item.title}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.tempId)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="이 일정 삭제"
                      title="이 일정 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
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
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      }
    >
      <ShippingPlannerInner />
    </Suspense>
  );
}
