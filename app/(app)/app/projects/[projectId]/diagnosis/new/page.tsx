"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewDiagnosisPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    objective: "",
    periodStart: "",
    periodEnd: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("세션 제목을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/diagnosis-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId }),
    });

    setIsLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "세션 생성에 실패했습니다.");
      return;
    }

    const session = await res.json();
    router.push(`/app/diagnosis/${session.id}/flow`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/projects/${projectId}`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 진단 세션</h1>
          <p className="text-gray-500 text-sm mt-0.5">고객 여정 진단을 시작합니다</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              세션 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="예: 스마트스토어 구매 전환 분석 - 2025 Q1"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              진단 목표
            </label>
            <textarea
              value={form.objective}
              onChange={(e) => setForm((prev) => ({ ...prev, objective: e.target.value }))}
              placeholder="이번 진단을 통해 무엇을 파악하고 싶으신가요?"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                분석 기간 시작
              </label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm((prev) => ({ ...prev, periodStart: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                분석 기간 종료
              </label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, periodEnd: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/app/projects/${projectId}`}
              className="flex-1 text-center px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              세션 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
