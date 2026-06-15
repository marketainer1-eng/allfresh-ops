"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Loader2, ArrowLeft, Save, Tag, Target,
  Megaphone, Hash, TrendingUp, Award, Store,
} from "lucide-react";

const CATEGORIES = [
  { value: "single", label: "단품 과일", desc: "산지직송 신선 과일 단품", emoji: "🍓" },
  { value: "giftset", label: "선물세트", desc: "명절·기념일 프리미엄 선물", emoji: "🎁" },
  { value: "subscription", label: "구독 상품", desc: "정기배송 과일 구독", emoji: "📦" },
];

interface ChannelRec {
  channel: string;
  priority: string;
  reasoning: string;
}
interface AnalyzeResult {
  targetCustomer: string;
  marketingCopy: string;
  seoKeywords: string[];
  seasonalCampaign: string;
  hashtags: string[];
  pricePositioning: string;
  differentiation: string;
  recommendedChannels: ChannelRec[];
}

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export default function MarketingNewPage() {
  const router = useRouter();
  const [category, setCategory] = useState("single");
  const [productName, setProductName] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [attrs, setAttrs] = useState({
    fruitType: "", sweetness: "", origin: "", season: "", storage: "", grade: "",
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const setAttr = (k: keyof typeof attrs, v: string) =>
    setAttrs((a) => ({ ...a, [k]: v }));

  async function runAnalysis() {
    if (!productName.trim()) {
      setError("상품명을 입력하세요.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch("/api/marketing/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          inputMode: "text",
          productName: productName.trim(),
          productInfo: productInfo.trim(),
          attributes: attrs,
        }),
      });
      if (!res.ok) throw new Error("분석 요청에 실패했습니다.");
      const data = (await res.json()) as AnalyzeResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAnalysis() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          category,
          inputMode: "text",
          productInfo: productInfo.trim(),
          attributes: attrs,
          ...result,
          status: "completed",
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      const saved = await res.json();
      router.push(`/app/marketing/history?focus=${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/app/marketing"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand" />
            새 마케팅 분석
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            상품 정보를 입력하면 AI가 타깃·카피·SEO·채널 전략을 도출합니다.
          </p>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상품 유형</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  category === c.value
                    ? "border-brand bg-brand-muted"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-xl mb-1">{c.emoji}</div>
                <div className="text-sm font-semibold text-gray-900">{c.label}</div>
                <div className="text-xs text-gray-500">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 상품명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상품명 <span className="text-red-500">*</span>
          </label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="예: 성주 꿀 샤인머스캣 2kg"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>

        {/* 상품 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상품 설명 / 구성
          </label>
          <textarea
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            rows={3}
            placeholder="상품 특징, 구성, 산지, 보관법 등 자유롭게 입력하세요."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
          />
        </div>

        {/* 속성 (단품일 때 강조, 모두 선택값) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상세 속성 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { k: "fruitType", ph: "과일 종류 (예: 샤인머스켓)" },
              { k: "sweetness", ph: "당도 (예: 18 Brix)" },
              { k: "origin", ph: "산지 (예: 경북 성주)" },
              { k: "season", ph: "제철 (예: 9~10월)" },
              { k: "storage", ph: "보관법 (예: 냉장)" },
              { k: "grade", ph: "등급 (예: 특)" },
            ].map((f) => (
              <input
                key={f.k}
                value={attrs[f.k as keyof typeof attrs]}
                onChange={(e) => setAttr(f.k as keyof typeof attrs, e.target.value)}
                placeholder={f.ph}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> AI 분석 중…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> AI 분석 실행</>
            )}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-900">분석 결과</h2>
            <button
              onClick={saveAnalysis}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중…</>
              ) : (
                <><Save className="w-4 h-4" /> 분석 저장</>
              )}
            </button>
          </div>

          <ResultBlock icon={Target} title="타깃 고객">
            <p className="text-sm text-gray-700 leading-relaxed">{result.targetCustomer}</p>
          </ResultBlock>

          <ResultBlock icon={Megaphone} title="마케팅 카피">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {result.marketingCopy}
            </p>
          </ResultBlock>

          <div className="grid md:grid-cols-2 gap-5">
            <ResultBlock icon={Tag} title="SEO 키워드">
              <div className="flex flex-wrap gap-1.5">
                {result.seoKeywords?.map((k, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {k}
                  </span>
                ))}
              </div>
            </ResultBlock>
            <ResultBlock icon={Hash} title="해시태그">
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags?.map((k, i) => (
                  <span key={i} className="text-xs bg-brand-muted text-brand px-2 py-1 rounded">
                    {k}
                  </span>
                ))}
              </div>
            </ResultBlock>
          </div>

          <ResultBlock icon={Sparkles} title="시즌 캠페인">
            <p className="text-sm text-gray-700 leading-relaxed">{result.seasonalCampaign}</p>
          </ResultBlock>

          <div className="grid md:grid-cols-2 gap-5">
            <ResultBlock icon={TrendingUp} title="가격 포지셔닝">
              <p className="text-sm text-gray-700 leading-relaxed">{result.pricePositioning}</p>
            </ResultBlock>
            <ResultBlock icon={Award} title="차별점">
              <p className="text-sm text-gray-700 leading-relaxed">{result.differentiation}</p>
            </ResultBlock>
          </div>

          <ResultBlock icon={Store} title="추천 판매 채널">
            <div className="space-y-2">
              {result.recommendedChannels?.map((c, i) => (
                <div key={i} className="flex gap-3 items-start border border-gray-100 rounded-lg p-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                      PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.low
                    }`}
                  >
                    {c.priority}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.channel}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{c.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </ResultBlock>
        </div>
      )}
    </div>
  );
}

function ResultBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
        <Icon className="w-4 h-4 text-brand" />
        {title}
      </div>
      {children}
    </div>
  );
}
