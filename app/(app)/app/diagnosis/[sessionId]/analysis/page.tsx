"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, Loader2, Zap, Trophy, AlertCircle } from "lucide-react";
import { JOURNEY_STEPS } from "@/lib/utils";

const TOTAL_MAX_SCORE = 70;

interface Bottleneck {
  id: string;
  rank: number;
  journeyStep: string;
  label: string;
  totalScore: number;
  severityScore: number;
  frequencyScore: number;
  evidenceScore: number;
  businessImpactScore: number;
  symptomIds: string[];
  symptomCount: number;
  tags: string[];
  description: string;
}

export default function AnalysisPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBottlenecks();
  }, [sessionId]);

  async function loadBottlenecks() {
    setIsLoading(true);
    const res = await fetch(`/api/bottlenecks?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setBottlenecks(data);
    }
    setIsLoading(false);
  }

  async function runAnalysis() {
    setIsAnalyzing(true);
    setMessage(null);

    const res = await fetch("/api/bottlenecks/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    setIsAnalyzing(false);

    if (res.ok) {
      const data = await res.json();
      setBottlenecks(data.bottlenecks);
      setMessage(`분석 완료! ${data.bottlenecks.length}개 병목이 도출되었습니다.`);
    } else {
      const data = await res.json();
      setMessage(data.error ?? "분석에 실패했습니다.");
    }
  }

  async function generateTickets(bottleneckId: string) {
    const res = await fetch("/api/ticket-drafts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, bottleneckId }),
    });
    if (res.ok) {
      setMessage("티켓이 생성되었습니다!");
    }
  }

  const SCORE_MAX = 70;

  const RANK_COLORS = [
    "bg-amber-500",
    "bg-gray-400",
    "bg-amber-700",
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/diagnosis/${sessionId}/symptoms`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">병목 분석</h1>
          <p className="text-gray-500 text-sm mt-0.5">수집된 증상에서 핵심 병목을 도출합니다</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {isAnalyzing ? "분석 중..." : "분석 실행"}
        </button>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {["고객여정", "증상수집", "병목분석"].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${i === 2 ? "bg-brand text-white" : "bg-gray-100"}`}>
              <span className="font-medium">{i + 1}</span>
              <span>{step}</span>
            </div>
            {i < 2 && <span>→</span>}
          </div>
        ))}
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : bottlenecks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 분석 결과가 없습니다</h3>
          <p className="text-gray-500 text-sm mb-6">
            증상을 3개 이상 수집한 후 "분석 실행" 버튼을 눌러주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bottlenecks.map((bn, idx) => {
            const pct = Math.round((bn.totalScore / SCORE_MAX) * 100);
            return (
              <div key={bn.id} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex-shrink-0 w-10 h-10 ${RANK_COLORS[idx] ?? "bg-gray-300"} text-white rounded-full flex items-center justify-center`}>
                    {idx === 0 ? <Trophy className="w-5 h-5" /> : <span className="font-bold">#{bn.rank}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {JOURNEY_STEPS[bn.journeyStep] ?? bn.journeyStep}
                      </span>
                      <span className="text-xs text-gray-400">증상 {bn.symptomCount ?? bn.symptomIds?.length ?? 0}개</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{bn.label}</h3>
                    {bn.description && (
                      <p className="text-sm text-gray-500 mt-1">{bn.description}</p>
                    )}
                    {bn.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bn.tags.map((t) => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-brand">{bn.totalScore}</div>
                    <div className="text-xs text-gray-400">/ {SCORE_MAX}점</div>
                  </div>
                </div>

                {/* Score bars */}
                <div className="space-y-2 mb-4">
                  {[
                    { label: "심각도", score: bn.severityScore, max: 25 },
                    { label: "빈도", score: bn.frequencyScore, max: 20 },
                    { label: "증거", score: bn.evidenceScore, max: 15 },
                    { label: "비즈니스 영향", score: bn.businessImpactScore, max: 10 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-xs text-gray-500 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-brand h-2 rounded-full transition-all"
                          style={{ width: `${Math.round((item.score / item.max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-14 text-right">
                        {item.score}/{item.max}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => generateTickets(bn.id)}
                  className="inline-flex items-center gap-2 text-sm border border-brand text-brand px-4 py-2 rounded-lg hover:bg-brand hover:text-white transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  개선 티켓 생성
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
