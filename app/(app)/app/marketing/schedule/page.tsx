"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Loader2,
  Check, AlertCircle, CalendarDays,
} from "lucide-react";

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

const STATUS_LABEL: Record<string, string> = {
  planned: "예정",
  active: "진행중",
  completed: "완료",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  channel: string;
  status: "planned" | "active" | "completed";
  startDate: string; // yyyy-mm-dd
  endDate: string;
  color: string;
}

export default function SchedulePage() {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  const showNotice = (type: "success" | "error", msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    try {
      const res = await fetch(
        `/api/marketing/campaigns?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const json = await res.json();
      setCampaigns(json?.data || []);
    } catch {
      showNotice("error", "일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  // 달력 셀 구성
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getCampaignsForDay = (day: number) => {
    const target = new Date(year, month, day);
    return campaigns.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return target >= start && target <= end;
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  function openCreate(day: number | null) {
    const base = day != null ? toDateInput(new Date(year, month, day).toISOString()) : toDateInput(new Date().toISOString());
    setEditing(null);
    setForm({
      title: "",
      description: "",
      category: "single",
      channel: "SNS",
      status: "planned",
      startDate: base,
      endDate: base,
      color: CHANNEL_COLOR.SNS,
    });
    setShowForm(true);
  }

  function openEdit(c: Campaign) {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description ?? "",
      category: c.category ?? "single",
      channel: c.channel ?? "SNS",
      status: c.status,
      startDate: toDateInput(c.startDate),
      endDate: toDateInput(c.endDate),
      color: c.color ?? CHANNEL_COLOR[c.channel ?? "SNS"] ?? "#15803D",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(null);
  }

  async function handleSubmit() {
    if (!form || !form.title.trim()) return;
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      channel: form.channel || null,
      status: form.status,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      color: form.color || null,
    };
    try {
      const res = editing
        ? await fetch(`/api/marketing/campaigns/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/marketing/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      showNotice("success", editing ? "일정이 수정되었습니다." : "일정이 추가되었습니다.");
      closeForm();
      load();
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm("이 캠페인을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${editing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      showNotice("success", "삭제되었습니다.");
      closeForm();
      load();
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  const updateForm = (patch: Partial<FormState>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {notice && (
        <div
          className={`fixed top-20 right-4 z-[60] max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border ${
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand" />
            마케팅 일정
          </h1>
          <p className="text-sm text-gray-500 mt-1">캠페인 일정을 한눈에 보고 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> 캠페인 추가
        </button>
      </div>

      {/* 캘린더 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 min-w-[120px] text-center">
              {year}년 {month + 1}월
            </h2>
            <button
              type="button"
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              setCurrent(new Date(d.getFullYear(), d.getMonth(), 1));
            }}
            className="text-xs font-semibold text-brand bg-brand-muted px-3 py-1.5 rounded-lg hover:opacity-80"
          >
            오늘
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-gray-300">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`px-2 py-2.5 text-xs font-semibold text-center ${
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-600"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const weekIdx = idx % 7;
                const dayCampaigns = day ? getCampaignsForDay(day) : [];
                return (
                  <div
                    key={idx}
                    onClick={() => day && openCreate(day)}
                    className={`min-h-[80px] md:min-h-[110px] border-b border-r border-gray-100 p-1.5 md:p-2 ${
                      day ? "cursor-pointer hover:bg-brand-muted/30" : "bg-gray-50/30"
                    } ${weekIdx === 6 ? "border-r-0" : ""}`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-xs font-semibold mb-1 ${
                            isToday(day)
                              ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white"
                              : weekIdx === 0
                                ? "text-red-500"
                                : weekIdx === 6
                                  ? "text-blue-500"
                                  : "text-gray-700"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayCampaigns.slice(0, 3).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(c);
                              }}
                              className="w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate text-white font-medium hover:opacity-90"
                              style={{
                                backgroundColor:
                                  c.color || CHANNEL_COLOR[c.channel ?? "SNS"] || "#15803D",
                              }}
                            >
                              {c.title}
                            </button>
                          ))}
                          {dayCampaigns.length > 3 && (
                            <div className="text-[10px] text-gray-500 px-1">
                              +{dayCampaigns.length - 3}개
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

      {/* 모달 */}
      {showForm && form && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? "캠페인 수정" : "캠페인 추가"}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="제목" required>
                <input
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="캠페인 제목"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </Field>
              <Field label="설명">
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={3}
                  placeholder="캠페인 내용·채널·목표 등"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="시작일">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateForm({ startDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </Field>
                <Field label="종료일">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateForm({ endDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </Field>
              </div>
              <Field label="카테고리">
                <input
                  value={form.category}
                  onChange={(e) => updateForm({ category: e.target.value })}
                  placeholder="예: single / giftset / subscription"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="채널">
                  <select
                    value={form.channel}
                    onChange={(e) =>
                      updateForm({
                        channel: e.target.value,
                        color: CHANNEL_COLOR[e.target.value] ?? form.color,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
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
                      updateForm({ status: e.target.value as FormState["status"] })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  >
                    {Object.entries(STATUS_LABEL).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="색상">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => updateForm({ color: e.target.value })}
                    className="h-9 w-14 rounded border border-gray-200 cursor-pointer bg-white"
                  />
                  <span className="text-xs text-gray-500">
                    {editing
                      ? `${formatDate(editing.startDate)} – ${formatDate(editing.endDate)}`
                      : "캘린더 칩에 사용됩니다."}
                  </span>
                </div>
              </Field>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center">
              <div>
                {editing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg disabled:opacity-60"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    삭제
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-sm text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!form.title.trim() || submitting}
                  className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "수정" : "추가"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
