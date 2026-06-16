"use client";

import { useState, useEffect, useCallback } from "react";
import PipelineSteps from "@/components/app/PipelineSteps";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar as CalIcon,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

// ── 데이터 타입 ──────────────────────────────────────────────
interface Campaign {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
  color: string | null;
  channel: string | null;
  analysisId: string | null;
}

interface Analysis {
  id: string;
  productName: string;
}

type NoticeType = "success" | "error";

// ── 상수 ─────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};

const CATEGORY_COLOR: Record<string, string> = {
  single: "#15803D",
  giftset: "#B45309",
  subscription: "#0E7490",
};

const CHANNEL_LABEL: Record<string, string> = {
  SNS: "SNS",
  EDM: "이메일",
  BANNER: "배너",
  BLOG: "블로그",
};

const STATUS_LABEL: Record<string, string> = {
  planned: "예정",
  active: "진행중",
  completed: "완료",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// ── 메인 ─────────────────────────────────────────────────────
export default function SchedulePage() {
  const [current, setCurrent] = useState(new Date());
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: NoticeType;
    msg: string;
  } | null>(null);

  const showNotice = (type: NoticeType, msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/campaigns");
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setCampaigns(json?.data || []);
    } catch (e) {
      console.error(e);
      showNotice("error", "일정을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getCampaignsForDate = (day: number | null): Campaign[] => {
    if (!day) return [];
    const target = new Date(year, month, day);
    return campaigns.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return target >= start && target <= end;
    });
  };

  const goPrev = () => setCurrent(new Date(year, month - 1, 1));
  const goNext = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => setCurrent(new Date());

  const handleNew = (date: string | null) => {
    setEditing(null);
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setShowForm(true);
  };

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      const res = editing
        ? await fetch(`/api/marketing/campaigns/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/marketing/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "저장 실패");
      }
      showNotice("success", editing ? "일정이 수정되었습니다" : "일정이 추가되었습니다");
      setShowForm(false);
      setEditing(null);
      loadCampaigns();
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "저장 실패");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 캠페인을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제 실패");
      showNotice("success", "삭제되었습니다");
      setShowForm(false);
      setEditing(null);
      loadCampaigns();
    } catch {
      showNotice("error", "삭제 실패");
    }
  };

  const today = new Date();
  const isToday = (day: number | null) =>
    !!day &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const monthCampaigns = campaigns.filter((c) => {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    return (
      (start.getFullYear() === year && start.getMonth() === month) ||
      (end.getFullYear() === year && end.getMonth() === month) ||
      (start <= new Date(year, month, 1) && end >= new Date(year, month + 1, 0))
    );
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <PipelineSteps current="schedule" analysisId={null} />
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-[60] max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border ${
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
            마케팅 일정
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            캠페인 일정을 한 눈에 보고 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleNew(null)}
          className="inline-flex items-center justify-center gap-2 bg-[#15803D] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#166534] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>캠페인 추가</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs">
        <span className="text-slate-500 font-medium">카테고리</span>
        {Object.entries(CATEGORY_LABEL).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CATEGORY_COLOR[k] }}
            />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-100">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="p-2 rounded-lg hover:bg-stone-100 text-slate-600"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-base md:text-lg font-semibold text-slate-900 min-w-[120px] text-center">
              {year}년 {month + 1}월
            </h3>
            <button
              type="button"
              onClick={goNext}
              className="p-2 rounded-lg hover:bg-stone-100 text-slate-600"
              aria-label="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
          >
            오늘
          </button>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div>
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`px-2 py-2.5 text-xs font-semibold text-center ${
                    i === 0
                      ? "text-red-500"
                      : i === 6
                        ? "text-blue-500"
                        : "text-slate-600"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const dayCampaigns = getCampaignsForDate(day);
                const weekIdx = idx % 7;
                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] md:min-h-[110px] border-b border-r border-stone-100 p-1.5 md:p-2 ${
                      day ? "cursor-pointer hover:bg-emerald-50/30" : "bg-stone-50/30"
                    } ${weekIdx === 6 ? "border-r-0" : ""}`}
                    onClick={() =>
                      day && handleNew(new Date(year, month, day).toISOString())
                    }
                  >
                    {day && (
                      <>
                        <div
                          className={`text-xs font-semibold mb-1 ${
                            isToday(day)
                              ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#15803D] text-white"
                              : weekIdx === 0
                                ? "text-red-500"
                                : weekIdx === 6
                                  ? "text-blue-500"
                                  : "text-slate-700"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayCampaigns.slice(0, 2).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(c);
                              }}
                              className="w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate text-white font-medium hover:opacity-90"
                              style={{
                                backgroundColor:
                                  c.color ||
                                  CATEGORY_COLOR[c.category ?? "single"] ||
                                  "#15803D",
                              }}
                            >
                              {c.title}
                            </button>
                          ))}
                          {dayCampaigns.length > 2 && (
                            <div className="text-[10px] text-slate-500 px-1">
                              +{dayCampaigns.length - 2}개
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Month Campaign List */}
      <div className="mt-5 bg-white border border-stone-200 rounded-2xl shadow-sm p-5 md:p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          {month + 1}월 캠페인 ({monthCampaigns.length}건)
        </h3>
        {monthCampaigns.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            이번 달 등록된 캠페인이 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {monthCampaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleEdit(c)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 border border-stone-100 transition-colors"
              >
                <span
                  className="w-1 h-10 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      c.color || CATEGORY_COLOR[c.category ?? "single"] || "#15803D",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {c.title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        c.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.status === "completed"
                            ? "bg-stone-100 text-stone-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {STATUS_LABEL[c.status] || "예정"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    {c.channel && (
                      <span className="ml-2 text-slate-400">
                        · {CHANNEL_LABEL[c.channel] || c.channel}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <CampaignForm
          campaign={editing}
          initialDate={selectedDate}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
          onDelete={editing ? () => handleDelete(editing.id) : null}
        />
      )}
    </div>
  );
}

// ── 캠페인 입력 폼 ───────────────────────────────────────────
interface FormState {
  title: string;
  description: string;
  category: string;
  startDate: string; // yyyy-mm-dd
  endDate: string;
  status: "planned" | "active" | "completed";
  color: string;
  channel: string;
  analysisId: string | null;
}

function CampaignForm({
  campaign,
  initialDate,
  onClose,
  onSave,
  onDelete,
}: {
  campaign: Campaign | null;
  initialDate: string | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void> | void;
  onDelete: (() => void) | null;
}) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const initial = campaign || {
    title: "",
    description: "",
    category: "single",
    startDate: initialDate || new Date().toISOString(),
    endDate: initialDate || new Date().toISOString(),
    status: "planned" as const,
    color: "#15803D",
    channel: "SNS",
    analysisId: null,
  };

  const [form, setForm] = useState<FormState>({
    title: initial.title || "",
    description: initial.description || "",
    category: initial.category || "single",
    startDate: toDateInput(initial.startDate),
    endDate: toDateInput(initial.endDate),
    status: initial.status || "planned",
    color: initial.color || CATEGORY_COLOR[initial.category || "single"],
    channel: initial.channel || "SNS",
    analysisId: initial.analysisId || null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/marketing/analyses?pageSize=100")
      .then((res) => res.json())
      .then((json) => setAnalyses(json?.data || []))
      .catch(() => {});
  }, []);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        status: form.status,
        color: form.color || CATEGORY_COLOR[form.category],
        channel: form.channel,
        analysisId: form.analysisId || null,
      };
      await onSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-lg max-h-[90vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        role="form"
        aria-label="캠페인 입력"
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h3 className="text-base font-semibold text-slate-900">
            {campaign ? "캠페인 수정" : "캠페인 추가"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 text-slate-500"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="제목" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="캠페인 제목"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
            />
          </Field>
          <Field label="설명">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="캠페인 내용·채널·목표 등"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일">
              <DateInput
                value={form.startDate}
                onChange={(v) => update("startDate", v)}
              />
            </Field>
            <Field label="종료일">
              <DateInput
                value={form.endDate}
                onChange={(v) => update("endDate", v)}
              />
            </Field>
          </div>
          <Field label="카테고리">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_LABEL).map(([k, label]) => {
                const active = form.category === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      update("category", k);
                      update("color", CATEGORY_COLOR[k]);
                    }}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? "border-transparent text-white"
                        : "bg-white text-slate-700 border-stone-200 hover:border-stone-300"
                    }`}
                    style={active ? { backgroundColor: CATEGORY_COLOR[k] } : {}}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="채널">
              <select
                value={form.channel}
                onChange={(e) => update("channel", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
              >
                {Object.entries(CHANNEL_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="상태">
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as FormState["status"])
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
              >
                <option value="planned">예정</option>
                <option value="active">진행중</option>
                <option value="completed">완료</option>
              </select>
            </Field>
          </div>
          <Field label="연결된 분석 (선택)">
            <select
              value={form.analysisId || ""}
              onChange={(e) =>
                update("analysisId", e.target.value ? e.target.value : null)
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
            >
              <option value="">연결 안 함</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.productName}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="border-t border-stone-200 p-4 flex justify-between items-center flex-shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>삭제</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-100 hover:bg-stone-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.title.trim() || submitting}
              className="bg-[#15803D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#166534] disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{campaign ? "수정" : "추가"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── 날짜 입력 + 커스텀 달력 ──────────────────────────────────
function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = value ? formatDate(value) : "날짜 선택";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white hover:border-stone-400 outline-none text-sm text-left flex items-center justify-between"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {display}
        </span>
        <CalIcon className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 top-full mt-1.5 left-0 right-0 md:right-auto md:min-w-[280px] bg-white rounded-xl shadow-xl border border-stone-200 p-3">
            <DatePicker
              value={value}
              onChange={(v) => {
                onChange(v);
                setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [view, setView] = useState(value ? new Date(value) : new Date());
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startW = firstDay.getDay();
  const days = lastDay.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startW; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const selected = value ? new Date(value) : null;
  const isSel = (d: number) =>
    !!selected &&
    selected.getFullYear() === year &&
    selected.getMonth() === month &&
    selected.getDate() === d;
  const handlePick = (d: number) => {
    const newDate = new Date(year, month, d);
    onChange(toDateInput(newDate.toISOString()));
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="p-1.5 rounded hover:bg-stone-100"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-900">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="p-1.5 rounded hover:bg-stone-100"
          aria-label="다음 달"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-slate-500 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => d && handlePick(d)}
            disabled={!d}
            className={`aspect-square text-xs rounded-md transition-colors ${
              !d
                ? "cursor-default"
                : isSel(d)
                  ? "bg-[#15803D] text-white font-semibold"
                  : "hover:bg-emerald-50 text-slate-700"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 날짜 유틸 ────────────────────────────────────────────────
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
