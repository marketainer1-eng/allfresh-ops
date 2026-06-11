"use client";

// app/(app)/app/performance/page.tsx
// 성과분석 — 업로드 → (브라우저)compute → /api/analyze-performance → 결과 렌더.
// ★ raw CSV는 브라우저에서만 파싱되고, 서버/LLM에는 계산된 metrics(PerfRequest)만 전송된다.
// 기존 페이지 패턴(reports/page.tsx, fruits/new/page.tsx) + 카드 스타일 재사용.

import { useState } from "react";
import {
  BarChart3,
  Upload,
  Loader2,
  AlertTriangle,
  Info,
  Target,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { computeMetricsFromFiles } from "@/lib/performanceCompute";
import type {
  Insight,
  Objective,
  PerfRequest,
  PerfResponse,
} from "@/lib/performanceTypes";

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

export default function PerformanceAnalysisPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [businessNote, setBusinessNote] = useState("");
  const [metrics, setMetrics] = useState<PerfRequest | null>(null);
  const [result, setResult] = useState<PerfResponse | null>(null);
  const [computing, setComputing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked]);
    setMetrics(null);
    setResult(null);
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setMetrics(null);
    setResult(null);
  }

  async function handleCompute() {
    if (files.length === 0) {
      setError("CSV 또는 xlsx 파일을 한 개 이상 업로드해주세요.");
      return;
    }
    setComputing(true);
    setError(null);
    setResult(null);
    try {
      const m = await computeMetricsFromFiles(files, {
        period: { start: start || undefined, end: end || undefined },
        businessNote: businessNote || undefined,
      });
      setMetrics(m);
      if (!m.channels?.length) {
        setError("파일에서 채널 지표를 인식하지 못했습니다. 헤더(채널/순매출 등)를 확인해주세요.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "계산 중 오류가 발생했습니다.");
    } finally {
      setComputing(false);
    }
  }

  async function handleAnalyze() {
    if (!metrics) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "분석 요청이 실패했습니다.");
      }
      setResult((await res.json()) as PerfResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  const destChannels = metrics?.channels?.filter((c) => c.role === "destination") ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">성과분석</h1>
          <p className="text-sm text-gray-500">
            채널 데이터를 업로드하면 코드가 지표를 계산하고, AI가 해석만 합니다.
          </p>
        </div>
      </div>

      {/* 1. 업로드 + 기간 */}
      <section className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white bg-brand rounded px-1.5 py-0.5">1</span>
          <h2 className="text-sm font-semibold text-gray-900">데이터 업로드</h2>
        </div>

        <label className="block border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-brand/40 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            className="hidden"
            onChange={onPickFiles}
          />
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            카페24·스마트스토어·카카오 export(CSV/xlsx)를 선택하세요
          </p>
          <p className="text-xs text-gray-400 mt-1">여러 파일을 함께 업로드할 수 있습니다</p>
        </label>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate text-gray-700">{f.name}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                <button
                  onClick={() => removeFile(i)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label="remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">기간 시작</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">기간 종료</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            비즈니스 메모 (선택)
          </label>
          <input
            type="text"
            value={businessNote}
            onChange={(e) => setBusinessNote(e.target.value)}
            placeholder="진행 중 캠페인·제약 등"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleCompute}
          disabled={computing || files.length === 0}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-40"
        >
          {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          지표 계산
        </button>
      </section>

      {/* 2. metrics 미리보기 */}
      {metrics && destChannels.length > 0 && (
        <section className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-brand rounded px-1.5 py-0.5">2</span>
            <h2 className="text-sm font-semibold text-gray-900">계산된 지표(metrics) 미리보기</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Chip label={`시즌: ${metrics.seasonFlag}`} />
            <Chip label={`비교: ${metrics.comparison}`} />
            <Chip label={`블렌디드 ROAS(MER): ${metrics.blendedRoas ?? "미산출"}`} />
            <Chip label={`판매처 ${destChannels.length}개`} />
            <Chip label={`어트리뷰션 ${metrics.attribution?.length ?? 0}건`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3">채널</th>
                  <th className="py-2 pr-3">순매출</th>
                  <th className="py-2 pr-3">AOV</th>
                  <th className="py-2 pr-3">수수료율</th>
                  <th className="py-2 pr-3">원가율</th>
                  <th className="py-2 pr-3">기여이익</th>
                  <th className="py-2 pr-3">광고비</th>
                </tr>
              </thead>
              <tbody>
                {destChannels.map((c) => (
                  <tr key={c.name} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-800">{c.name}</td>
                    <td className="py-2 pr-3">{won(c.netRevenue)}</td>
                    <td className="py-2 pr-3">{won(c.aov)}</td>
                    <td className="py-2 pr-3">{c.feeRate != null ? `${c.feeRate}%` : "-"}</td>
                    <td className="py-2 pr-3">{c.cogsRate != null ? `${c.cogsRate}%` : "-"}</td>
                    <td className="py-2 pr-3">{won(c.contributionProfit)}</td>
                    <td className="py-2 pr-3">{won(c.adCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            매출은 판매처(destination)에만 집계되며, 광고/유입은 어트리뷰션으로만 반영됩니다.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 bg-brand text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-40"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            AI 해석 실행
          </button>
        </section>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. 결과 */}
      {result && (
        <section className="space-y-5">
          {/* Executive Summary */}
          <div className="bg-gray-900 text-white rounded-xl p-6 space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-400">Executive Summary</p>
            {result.executiveSummary.map((line, i) => (
              <p key={i} className="text-sm leading-relaxed">
                <span className="text-gray-500 mr-2">{["현황", "문제", "액션"][i] ?? "•"}</span>
                {line}
              </p>
            ))}
          </div>

          {/* Insights */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">인사이트</h2>
            {result.insights.length === 0 && (
              <p className="text-sm text-gray-400">생성된 인사이트가 없습니다.</p>
            )}
            {result.insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>

          {/* Risks */}
          {result.risks.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" /> 리스크
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-900">
                {result.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Data limits */}
          {result.dataLimits.length > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                <Info className="w-4 h-4" /> 데이터 한계
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500">
                {result.dataLimits.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{label}</span>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">{insight.title}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs bg-brand/10 text-brand rounded-full px-2 py-0.5">
            {OBJECTIVE_LABELS[insight.objective] ?? insight.objective}
          </span>
          <span className={`text-xs rounded-full px-2 py-0.5 ${CONFIDENCE_BADGE[insight.confidence]}`}>
            {insight.confidence}
          </span>
          <span className={`text-xs rounded-full px-2 py-0.5 ${PRIORITY_BADGE[insight.priority]}`}>
            {insight.priority}
          </span>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <Field label="관찰" value={insight.observation} />
        <Field label="해석" value={insight.interpretation} />
        <Field label="실행" value={insight.action} />
        <Field label="검증" value={insight.verification} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs font-semibold text-gray-400 w-8 flex-shrink-0 pt-0.5">{label}</dt>
      <dd className="text-gray-700 leading-relaxed">{value}</dd>
    </div>
  );
}
