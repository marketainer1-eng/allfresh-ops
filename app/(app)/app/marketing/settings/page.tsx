"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Edit, Save, X, Loader2, Check, AlertCircle, Apple, Gift,
  Repeat, Database, Sparkles, Code, ArrowLeft,
} from "lucide-react";

interface Template {
  id: string;
  category: string;
  name: string;
  description?: string | null;
  content: string;
  variables?: string[] | null;
}

interface Notification {
  type: "success" | "error";
  msg: string;
}

const CATEGORY_INFO: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  single: { label: "단품 과일", icon: Apple, color: "#15803D", bg: "bg-emerald-50" },
  giftset: { label: "선물세트", icon: Gift, color: "#B45309", bg: "bg-amber-50" },
  subscription: { label: "구독 서비스", icon: Repeat, color: "#0E7490", bg: "bg-cyan-50" },
};

export default function Settings() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotice = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/prompt-templates");
      const json = await res.json();
      setTemplates(json?.data || []);
    } catch {
      showNotice("error", "프롬프트 템플릿을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: { name: string; content: string; description: string; variables: string[] }) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/marketing/prompt-templates/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("저장 실패");
      showNotice("success", "템플릿이 수정되었습니다");
      setEditing(null);
      loadTemplates();
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "저장 실패");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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

      <div className="mb-6">
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">설정</h2>
        <p className="text-sm text-slate-600 mt-1">
          프롬프트 템플릿과 시스템 설정을 관리합니다.
        </p>
      </div>

      {/* Prompt Templates */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="p-5 md:p-6 border-b border-stone-100">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h3 className="text-base font-semibold text-slate-900">AI 프롬프트 템플릿</h3>
          </div>
          <p className="text-xs text-slate-500">
            카테고리별 분석에 사용되는 프롬프트를 자유롭게 수정할 수 있습니다.
          </p>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">등록된 템플릿이 없습니다</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {templates.map((t) => {
              const info = CATEGORY_INFO[t.category] || {
                label: t.category,
                icon: FileText,
                color: "#475569",
                bg: "bg-stone-100",
              };
              const Icon = info.icon;
              return (
                <div key={t.id} className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${info.bg} flex items-center justify-center`} style={{ color: info.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{info.label}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                  </div>
                  {t.description && (
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{t.description}</p>
                  )}
                  <div className="bg-stone-50 border border-stone-100 rounded-lg p-3 max-h-32 overflow-hidden relative">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed line-clamp-5">
                      {t.content}
                    </pre>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-stone-50 to-transparent" />
                  </div>
                  {t.variables && t.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {t.variables.map((v, i) => (
                        <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                          {`{${v}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900">시스템 정보</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow label="데이터 저장" value="SQL 영구 저장 (Supabase 호환)" status="active" />
          <InfoRow label="AI 분석 엔진" value="Edge Function · 카테고리별 프롬프트" status="active" />
          <InfoRow label="다중 입력" value="텍스트 · URL · CSV / PDF" status="active" />
          <InfoRow label="자동 일정 등록" value="분석 → 캠페인 일정 연동" status="active" />
        </div>
        <div className="mt-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex items-start gap-2">
            <Code className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>저장 로직 안정화 완료</strong>
              <br />
              데모 단계의 localStorage 폴백을 제거하고, 모든 분석·캠페인 데이터를 SQL DB에 영구
              저장합니다. 저장 실패 시 사용자에게 토스트로 즉시 알림이 표시됩니다.
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <PromptEditModal template={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}

function InfoRow({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-800 mt-0.5">{value}</div>
      </div>
      {status === "active" && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          정상
        </div>
      )}
    </div>
  );
}

function PromptEditModal({
  template,
  onClose,
  onSave,
}: {
  template: Template;
  onClose: () => void;
  onSave: (data: { name: string; content: string; description: string; variables: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState(template.name || "");
  const [content, setContent] = useState(template.content || "");
  const [description, setDescription] = useState(template.description || "");
  const [varsInput, setVarsInput] = useState((template.variables || []).join(", "));
  const [submitting, setSubmitting] = useState(false);

  const variables = varsInput
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), content: content.trim(), description: description.trim(), variables });
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
        className="bg-white w-full md:max-w-2xl max-h-[90vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        role="form"
        aria-label="프롬프트 수정"
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h3 className="text-base font-semibold text-slate-900">프롬프트 수정</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-slate-500" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">템플릿명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">프롬프트 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-mono leading-relaxed resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              사용 가능 변수 <span className="text-slate-400 font-normal">(쉼표로 구분)</span>
            </label>
            <input
              type="text"
              value={varsInput}
              onChange={(e) => setVarsInput(e.target.value)}
              placeholder="productName, productInfo"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
            />
            {variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {variables.map((v, i) => (
                  <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                    {`{${v}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-stone-200 p-4 flex justify-end items-center gap-2 flex-shrink-0">
          <button type="button" onClick={onClose} className="bg-stone-100 hover:bg-stone-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold">
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || !content.trim() || submitting}
            className="bg-[#15803D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#166534] disabled:opacity-50 inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>
  );
}
