"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings, Loader2, ArrowLeft, Save, X, Pencil, FileText,
} from "lucide-react";

interface Template {
  id: string;
  category: string;
  name: string;
  description: string | null;
  content: string;
  variables: string[] | null;
  updatedAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품 과일",
  giftset: "선물세트",
  subscription: "구독 상품",
};
const CATEGORY_BADGE: Record<string, string> = {
  single: "bg-green-100 text-green-700",
  giftset: "bg-purple-100 text-purple-700",
  subscription: "bg-blue-100 text-blue-700",
};

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/prompt-templates");
      const json = await res.json();
      setTemplates(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onSaved(updated: Template) {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditing(null);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand" />
          설정 · 프롬프트 템플릿
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI 분석에 사용되는 카테고리별 프롬프트 템플릿을 편집할 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        CATEGORY_BADGE[t.category] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {CATEGORY_LABEL[t.category] ?? t.category}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{t.name}</h3>
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-500">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(t)}
                  className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:bg-brand-muted px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" /> 편집
                </button>
              </div>

              <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 mt-3 whitespace-pre-wrap font-sans line-clamp-4 max-h-32 overflow-hidden">
                {t.content}
              </pre>

              {t.variables && t.variables.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-3">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  {t.variables.map((v) => (
                    <span key={v} className="text-xs bg-brand-muted text-brand px-2 py-0.5 rounded font-mono">
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function EditModal({
  template,
  onClose,
  onSaved,
}: {
  template: Template;
  onClose: () => void;
  onSaved: (t: Template) => void;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [content, setContent] = useState(template.content);
  const [varsInput, setVarsInput] = useState((template.variables ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variables = varsInput
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  async function save() {
    if (!name.trim()) {
      setError("이름을 입력하세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/prompt-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          content,
          variables,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      const updated = (await res.json()) as Template;
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                CATEGORY_BADGE[template.category] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {CATEGORY_LABEL[template.category] ?? template.category}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-1">템플릿 편집</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">설명</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">프롬프트 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              변수 <span className="text-gray-400 font-normal">(쉼표로 구분)</span>
            </label>
            <input
              value={varsInput}
              onChange={(e) => setVarsInput(e.target.value)}
              placeholder="productName, productInfo"
              className={inputCls}
            />
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {variables.map((v) => (
                  <span key={v} className="text-xs bg-brand-muted text-brand px-2 py-0.5 rounded font-mono">
                    {`{${v}}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg">
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
