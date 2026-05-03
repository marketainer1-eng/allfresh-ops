"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Trash2, Loader2 } from "lucide-react";
import { JOURNEY_STEPS } from "@/lib/utils";

interface CustomerFlow {
  id: string;
  stepOrder: number;
  stepName: string;
  stepType: string;
  channel?: string;
  description?: string;
  expectedAction?: string;
}

const JOURNEY_STEP_OPTIONS = Object.entries(JOURNEY_STEPS);

export default function FlowPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [flows, setFlows] = useState<CustomerFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    stepName: "",
    stepType: "discovery",
    channel: "",
    description: "",
    expectedAction: "",
  });

  useEffect(() => {
    loadFlows();
  }, [sessionId]);

  async function loadFlows() {
    setIsLoading(true);
    const res = await fetch(`/api/customer-flows?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setFlows(data);
    }
    setIsLoading(false);
  }

  async function saveFlow() {
    if (!form.stepName.trim()) return;
    setIsSaving(true);

    const res = await fetch("/api/customer-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sessionId,
        stepOrder: flows.length + 1,
      }),
    });

    setIsSaving(false);
    if (res.ok) {
      setForm({ stepName: "", stepType: "discovery", channel: "", description: "", expectedAction: "" });
      setShowForm(false);
      loadFlows();
    }
  }

  async function deleteFlow(id: string) {
    await fetch(`/api/customer-flows/${id}`, { method: "DELETE" });
    loadFlows();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/projects"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">고객 여정 맵</h1>
          <p className="text-gray-500 text-sm mt-0.5">고객이 거치는 단계별 흐름을 작성합니다</p>
        </div>
        <Link
          href={`/app/diagnosis/${sessionId}/symptoms`}
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          다음: 증상 수집
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Steps Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400 overflow-x-auto pb-2">
        {["고객여정", "증상수집", "병목분석"].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${i === 0 ? "bg-brand text-white" : "bg-gray-100"}`}>
              <span className="font-medium">{i + 1}</span>
              <span>{step}</span>
            </div>
            {i < 2 && <ArrowRight className="w-3 h-3" />}
          </div>
        ))}
      </div>

      {/* Flows List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((flow, idx) => (
            <div key={flow.id} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {JOURNEY_STEPS[flow.stepType] ?? flow.stepType}
                  </span>
                  {flow.channel && (
                    <span className="text-xs text-gray-400">{flow.channel}</span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900">{flow.stepName}</h3>
                {flow.description && (
                  <p className="text-sm text-gray-500 mt-1">{flow.description}</p>
                )}
              </div>
              <button
                onClick={() => deleteFlow(flow.id)}
                className="flex-shrink-0 p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add Step Form */}
          {showForm ? (
            <div className="bg-white rounded-xl border border-brand/20 p-5 space-y-4">
              <h3 className="font-medium text-gray-900">새 단계 추가</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">단계 이름 *</label>
                  <input
                    type="text"
                    value={form.stepName}
                    onChange={(e) => setForm((p) => ({ ...p, stepName: e.target.value }))}
                    placeholder="예: 상품 상세 조회"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">여정 단계</label>
                  <select
                    value={form.stepType}
                    onChange={(e) => setForm((p) => ({ ...p, stepType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  >
                    {JOURNEY_STEP_OPTIONS.map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">채널</label>
                  <input
                    type="text"
                    value={form.channel}
                    onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
                    placeholder="예: smartstore"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="단계 설명"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={saveFlow}
                  disabled={isSaving || !form.stepName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  추가
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-brand hover:text-brand transition-colors"
            >
              <Plus className="w-4 h-4" />
              단계 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
