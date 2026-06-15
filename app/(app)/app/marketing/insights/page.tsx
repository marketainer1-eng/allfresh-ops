"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Lightbulb, Loader2, ArrowLeft, Tag, Hash, TrendingUp, PieChart,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Analysis {
  id: string;
  productName: string;
  category: string;
  seoKeywords: string[] | null;
  hashtags: string[] | null;
  createdAt: string;
}

interface Forecast {
  id: string;
  productName: string;
  predictedDemand: number | null;
  createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};
const CATEGORY_COLOR: Record<string, string> = {
  single: "bg-green-500",
  giftset: "bg-purple-500",
  subscription: "bg-blue-500",
};

export default function InsightsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [aRes, fRes] = await Promise.all([
          fetch("/api/marketing/analyses?pageSize=100"),
          fetch("/api/marketing/forecasts"),
        ]);
        const aJson = await aRes.json();
        const fJson = await fRes.json();
        setAnalyses(aJson.data ?? []);
        setForecasts(fJson.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    analyses.forEach((a) => {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => ({ cat, n, pct: Math.round((n / max) * 100) }));
  }, [analyses]);

  const topKeywords = useMemo(() => {
    const counts: Record<string, number> = {};
    analyses.forEach((a) => {
      (a.seoKeywords ?? []).forEach((k) => {
        const key = k.trim();
        if (key) counts[key] = (counts[key] ?? 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [analyses]);

  const topHashtags = useMemo(() => {
    const counts: Record<string, number> = {};
    analyses.forEach((a) => {
      (a.hashtags ?? []).forEach((h) => {
        const key = h.trim();
        if (key) counts[key] = (counts[key] ?? 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [analyses]);

  const recentForecasts = useMemo(
    () => [...forecasts].slice(0, 10),
    [forecasts],
  );

  const maxKeywordCount = topKeywords.length ? topKeywords[0][1] : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-brand" />
          고객 인사이트
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          저장된 분석 {analyses.length}건과 수요 예측 {forecasts.length}건을 집계한 통합 인사이트입니다.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* 카테고리 분포 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-4">
              <PieChart className="w-4 h-4 text-brand" /> 카테고리 분포
            </div>
            {categoryDist.length === 0 ? (
              <p className="text-sm text-gray-400">데이터가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {categoryDist.map(({ cat, n, pct }) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{CATEGORY_LABEL[cat] ?? cat}</span>
                      <span className="font-medium">{n}건</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CATEGORY_COLOR[cat] ?? "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* SEO 키워드 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-4">
                <Tag className="w-4 h-4 text-brand" /> 상위 SEO 키워드 (Top 15)
              </div>
              {topKeywords.length === 0 ? (
                <p className="text-sm text-gray-400">키워드 데이터가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {topKeywords.map(([kw, n]) => (
                    <div key={kw} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-40 truncate flex-shrink-0">{kw}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full"
                          style={{ width: `${Math.round((n / maxKeywordCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 해시태그 클라우드 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-4">
                <Hash className="w-4 h-4 text-brand" /> 해시태그 클라우드
              </div>
              {topHashtags.length === 0 ? (
                <p className="text-sm text-gray-400">해시태그 데이터가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topHashtags.map(([h, n]) => (
                    <span
                      key={h}
                      className="text-xs bg-brand-muted text-brand px-2.5 py-1 rounded-full"
                      style={{ fontSize: `${0.7 + Math.min(n, 5) * 0.08}rem` }}
                    >
                      {h}
                      {n > 1 && <span className="text-brand/60 ml-1">×{n}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 최근 수요 예측 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-4">
              <TrendingUp className="w-4 h-4 text-brand" /> 최근 수요 예측
            </div>
            {recentForecasts.length === 0 ? (
              <p className="text-sm text-gray-400">
                저장된 예측이 없습니다.{" "}
                <Link href="/app/marketing/forecast" className="text-brand font-medium">
                  수요 예측 실행하기 →
                </Link>
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentForecasts.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.productName}</p>
                      <p className="text-xs text-gray-400">{formatDate(f.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="text-base font-bold text-brand-dark">
                        {f.predictedDemand != null ? f.predictedDemand.toLocaleString() : "-"}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">단위</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
