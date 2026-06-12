"use client";

// 저장된 성과분석 단건 재열람. 계산된 metrics + 해석(insights)을 그대로 렌더.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import type { Insight, Objective, PerfRequest, PerfResponse } from "@/lib/performanceTypes";

interface SavedAnalysis {
  id: string;
  title: string;
  periodStart: string | null;
  periodEnd: string | null;
  seasonFlag: string | null;
  engine: string | null;
  request: PerfRequest;
  result: PerfResponse;
  createdAt: string;
}

const OBJECTIVE_LABELS: Record<Objective, string> = {
  diagnosis: "진단",
  acquisition: "신규",
  retention: "리텐션",
};
const PRIORITY_BADGE: Record<Insight["priority"], string> = {
  높음: "bg-red-100 text-red-700",
  중간: "bg-yellow-100 text-yellow-700",
  낮음: "bg-gray-100 text-gray-600",
};
const CONFIDENCE_BADGE: Record<Insight["confidence"], string> = {
  확정: "bg-green-100 text-green-700",
  유력: "bg-blue-100 text-blue-700",
  가설: "bg-gray-100 text-gray-600",
};
const won = (n?: number) => (n == null ? "-" : `${n.toLocaleString()}원`);

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<SavedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/performance-analyses/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "불러오기 실패");
        return r.json();
      })
      .then(setItem)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"));
  }, [params?.id]);

  if (error)
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        <a href="/app/performance/history" className="text-sm text-brand hover:underline mt-3 inline-block">← History</a>
      </div>
    );
  if (!item)
    return (
      <div className="max-w-3xl mx-auto flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중…
      </div>
    );

  const dest = (item.request.channels ?? []).filter((c) => c.role === "destination");
  const r = item.result;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <a href="/app/performance/history" className="text-sm text-brand hover:underline">← History</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{item.title}</h1>
        <p className="text-sm text-gray-500">
          {[
            item.periodStart && `${item.periodStart}${item.periodEnd ? `~${item.periodEnd}` : ""}`,
            item.seasonFlag,
            item.engine && `해석:${item.engine}`,
            new Date(item.createdAt).toLocaleString("ko-KR"),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* 계산된 지표 */}
      {dest.length > 0 && (
        <section className="bg-white border border-gray-100 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">계산된 지표(metrics)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3">채널</th>
                  <th className="py-2 pr-3">순매출</th>
                  <th className="py-2 pr-3">AOV</th>
                  <th className="py-2 pr-3">환불률</th>
                  <th className="py-2 pr-3">기여이익</th>
                </tr>
              </thead>
              <tbody>
                {dest.map((c) => (
                  <tr key={c.name} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-800">{c.name}</td>
                    <td className="py-2 pr-3">{won(c.netRevenue)}</td>
                    <td className="py-2 pr-3">{won(c.aov)}</td>
                    <td className="py-2 pr-3">{c.refundRate != null ? `${c.refundRate}%` : "-"}</td>
                    <td className="py-2 pr-3">{won(c.contributionProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {item.request.businessNote && (
            <p className="text-xs text-gray-400">메모/세그먼트: {item.request.businessNote}</p>
          )}
        </section>
      )}

      {/* Executive Summary */}
      <div className="bg-gray-900 text-white rounded-xl p-6 space-y-2">
        <p className="text-xs uppercase tracking-wider text-gray-400">Executive Summary</p>
        {r.executiveSummary.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed">
            <span className="text-gray-500 mr-2">{["현황", "문제", "액션"][i] ?? "•"}</span>
            {line}
          </p>
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">인사이트</h2>
        {r.insights.map((ins, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">{ins.title}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs bg-brand/10 text-brand rounded-full px-2 py-0.5">
                  {OBJECTIVE_LABELS[ins.objective] ?? ins.objective}
                </span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${CONFIDENCE_BADGE[ins.confidence]}`}>
                  {ins.confidence}
                </span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${PRIORITY_BADGE[ins.priority]}`}>
                  {ins.priority}
                </span>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              {(
                [
                  ["관찰", ins.observation],
                  ["해석", ins.interpretation],
                  ["실행", ins.action],
                  ["검증", ins.verification],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <dt className="text-xs font-semibold text-gray-400 w-8 flex-shrink-0 pt-0.5">{label}</dt>
                  <dd className="text-gray-700 leading-relaxed">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Risks */}
      {r.risks.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" /> 리스크
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-amber-900">
            {r.risks.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Data limits */}
      {r.dataLimits.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
            <Info className="w-4 h-4" /> 데이터 한계
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500">
            {r.dataLimits.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
