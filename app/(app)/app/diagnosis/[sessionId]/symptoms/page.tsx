"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { JOURNEY_STEPS, CHANNELS } from "@/lib/utils";

interface Symptom {
  id: string;
  title: string;
  description?: string;
  quote?: string;
  journeyStep: string;
  severity: number;
  frequency: number;
  channel?: string;
  tags: string[];
  businessImpact: number;
  evidenceCount: number;
}

const SCORE_LABELS: Record<number, string> = {
  1: "매우 낮음",
  2: "낮음",
  3: "보통",
  4: "높음",
  5: "매우 높음",
};

const defaultForm = {
  title: "",
  description: "",
  quote: "",
  journeyStep: "consideration",
  severity: 3,
  frequency: 3,
  channel: "",
  businessImpact: 3,
  tags: [] as string[],
};

export default function SymptomsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadSymptoms();
  }, [sessionId]);

  async function loadSymptoms() {
    setIsLoading(true);
    const res = await fetch(`/api/symptoms?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setSymptoms(data);
    }
    setIsLoading(false);
  }

  async function saveSymptom() {
    if (!form.title.trim()) return;
    setIsSaving(true);

    const res = await fetch("/api/symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sessionId }),
    });

    setIsSaving(false);
    if (res.ok) {
      setForm({ ...defaultForm });
      setTagInput("");
      setShowForm(false);
      loadSymptoms();
    }
  }

  async function deleteSymptom(id: string) {
    await fetch(`/api/symptoms/${id}`, { method: "DELETE" });
    loadSymptoms();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/diagnosis/${sessionId}/flow`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">증상 수집</h1>
          <p className="text-gray-500 text-sm mt-0.5">고객 불편 신호를 기록합니다</p>
        </div>
        <Link
          href={`/app/diagnosis/${sessionId}/analysis`}
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          다음: 병목 분석
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {["고객여정", "증상수집", "병목분석"].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${i === 1 ? "bg-brand text-white" : "bg-gray-100"}`}>
              <span className="font-medium">{i + 1}</span>
              <span>{step}</span>
            </div>
            {i < 2 && <ArrowRight className="w-3 h-3" />}
          </div>
        ))}
      </div>

      {/* Symptoms Count */}
      {symptoms.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4 text-brand" />
          <span>총 <strong className="text-gray-900">{symptoms.length}개</strong> 증상 수집됨</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-3">
          {symptoms.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {JOURNEY_STEPS[s.journeyStep] ?? s.journeyStep}
                    </span>
                    {s.channel && (
                      <span className="text-xs text-gray-400">
                        {CHANNELS[s.channel] ?? s.channel}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900">{s.title}</h3>
                  {s.quote && (
                    <blockquote className="mt-2 pl-3 border-l-2 border-gray-200 text-sm text-gray-500 italic">
                      "{s.quote}"
                    </blockquote>
                  )}
                  {s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.tags.map((t) => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right text-xs text-gray-400 space-y-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>심각도</span>
                    <span className="font-medium text-gray-700">{s.severity}/5</span>
                    <span>빈도</span>
                    <span className="font-medium text-gray-700">{s.frequency}/5</span>
                    <span>비즈니스영향</span>
                    <span className="font-medium text-gray-700">{s.businessImpact}/5</span>
                  </div>
                  <button
                    onClick={() => deleteSymptom(s.id)}
                    className="mt-2 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Symptom Form */}
          {showForm ? (
            <div className="bg-white rounded-xl border border-brand/20 p-6 space-y-4">
              <h3 className="font-medium text-gray-900">증상 추가</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">제목 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="예: 모바일 이미지 로딩 지연"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">고객 발언 (인용)</label>
                  <input
                    type="text"
                    value={form.quote}
                    onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
                    placeholder="고객이 직접 말한 내용을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">여정 단계</label>
                  <select
                    value={form.journeyStep}
                    onChange={(e) => setForm((p) => ({ ...p, journeyStep: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  >
                    {Object.entries(JOURNEY_STEPS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">채널</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  >
                    <option value="">선택</option>
                    {Object.entries(CHANNELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                {(["severity", "frequency", "businessImpact"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {field === "severity" ? "심각도" : field === "frequency" ? "빈도" : "비즈니스 영향"}
                      <span className="text-gray-400 ml-1">({SCORE_LABELS[form[field]]})</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={form[field]}
                      onChange={(e) => setForm((p) => ({ ...p, [field]: Number(e.target.value) }))}
                      className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>5</span>
                    </div>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">태그</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
                            setForm((p) => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
                          }
                          setTagInput("");
                        }
                      }}
                      placeholder="Enter로 추가"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {form.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }))}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-red-50 hover:text-red-500"
                        >
                          {t} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setForm({ ...defaultForm }); }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={saveSymptom}
                  disabled={isSaving || !form.title.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  저장
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-brand hover:text-brand transition-colors"
            >
              <Plus className="w-4 h-4" />
              증상 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
