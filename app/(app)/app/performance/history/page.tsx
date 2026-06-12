"use client";

// 저장된 성과분석 목록(History). 워크스페이스 단위로 불러온다.

import { useEffect, useState } from "react";
import { BarChart3, Loader2, ChevronRight, History as HistoryIcon } from "lucide-react";

interface Item {
  id: string;
  title: string;
  periodStart: string | null;
  periodEnd: string | null;
  seasonFlag: string | null;
  engine: string | null;
  createdAt: string;
}

const SEASON_LABEL: Record<string, string> = {
  peak: "성수기",
  offpeak: "비수기",
  mixed: "혼합",
};

export default function PerformanceHistoryPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/performance-analyses")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "불러오기 실패");
        return r.json();
      })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
            <HistoryIcon className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">성과분석 History</h1>
            <p className="text-sm text-gray-500">저장된 분석을 다시 열어볼 수 있습니다.</p>
          </div>
        </div>
        <a
          href="/app/performance"
          className="inline-flex items-center gap-2 bg-brand text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <BarChart3 className="w-4 h-4" /> 새 분석
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {items === null && !error && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중…
        </div>
      )}

      {items && items.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500 text-sm">
          아직 저장된 분석이 없습니다. 새 분석을 실행하고 결과를 저장해보세요.
        </div>
      )}

      <div className="space-y-2">
        {(items ?? []).map((it) => (
          <a
            key={it.id}
            href={`/app/performance/history/${it.id}`}
            className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-5 py-4 hover:border-brand/40 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{it.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {[
                  it.periodStart && `${it.periodStart}${it.periodEnd ? `~${it.periodEnd}` : ""}`,
                  it.seasonFlag && (SEASON_LABEL[it.seasonFlag] ?? it.seasonFlag),
                  it.engine && `해석:${it.engine}`,
                  new Date(it.createdAt).toLocaleString("ko-KR"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
