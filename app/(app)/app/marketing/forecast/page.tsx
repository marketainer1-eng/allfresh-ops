"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, Loader2, ArrowLeft, Save, CloudSun, Play, BarChart3, Lightbulb,
} from "lucide-react";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const SEASONS = ["봄", "여름", "가을", "겨울"];
const GRADES = ["특", "상", "중"];
const MODELS = [
  { value: "ensemble", label: "앙상블 (Random Forest)" },
  { value: "linear", label: "선형 회귀 (Linear Regression)" },
];

interface ForecastResult {
  predictedDemand: number;
  confidenceR2: number;
  rmse: number;
  mape: number;
  featureImportance: Record<string, number>;
  modelType: string;
  recommendation: string;
  breakdown?: { factor: string; impact: number; description: string }[];
}

interface FormState {
  productName: string;
  origin: string;
  grade: string;
  salePrice: string;
  wholesalePrice: string;
  discountRate: string;
  avgTemperature: string;
  rainfall: string;
  isHoliday: boolean;
  dayOfWeek: string;
  month: string;
  season: string;
  previousDaySales: string;
  lastWeekSales: string;
  lastYearSales: string;
  modelType: string;
}

const EMPTY: FormState = {
  productName: "",
  origin: "",
  grade: "",
  salePrice: "",
  wholesalePrice: "",
  discountRate: "",
  avgTemperature: "",
  rainfall: "",
  isHoliday: false,
  dayOfWeek: "",
  month: "",
  season: "",
  previousDaySales: "",
  lastWeekSales: "",
  lastYearSales: "",
  modelType: "ensemble",
};

function numOrUndef(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function ForecastPage() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  }

  function buildPayload() {
    return {
      productName: form.productName.trim(),
      origin: form.origin || undefined,
      grade: form.grade || undefined,
      salePrice: numOrUndef(form.salePrice),
      wholesalePrice: numOrUndef(form.wholesalePrice),
      discountRate: numOrUndef(form.discountRate),
      avgTemperature: numOrUndef(form.avgTemperature),
      rainfall: numOrUndef(form.rainfall),
      isHoliday: form.isHoliday,
      dayOfWeek: form.dayOfWeek || undefined,
      month: numOrUndef(form.month),
      season: form.season || undefined,
      previousDaySales: numOrUndef(form.previousDaySales),
      lastWeekSales: numOrUndef(form.lastWeekSales),
      lastYearSales: numOrUndef(form.lastYearSales),
      modelType: form.modelType || undefined,
    };
  }

  async function autoWeather() {
    setError(null);
    setWeatherLoading(true);
    try {
      const res = await fetch("/api/marketing/kma-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nx: 60, ny: 127 }),
      });
      if (res.status === 503) {
        flash("KMA 키 미설정 — 기온·강수량을 직접 입력해 주세요.");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(data.resultMsg || "날씨 데이터를 받지 못했습니다.");
        return;
      }
      if (data.temperature != null) set("avgTemperature", String(data.temperature));
      if (data.rainfall != null) set("rainfall", String(data.rainfall));
      flash("기상청 실황 데이터를 불러왔습니다.");
    } catch {
      flash("날씨 조회 중 오류가 발생했습니다.");
    } finally {
      setWeatherLoading(false);
    }
  }

  async function runForecast() {
    if (!form.productName.trim()) {
      setError("상품명을 입력하세요.");
      return;
    }
    setError(null);
    setRunning(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/marketing/forecast-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error("예측 요청에 실패했습니다.");
      const data = (await res.json()) as ForecastResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "예측 중 오류가 발생했습니다.");
    } finally {
      setRunning(false);
    }
  }

  async function saveForecast() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildPayload(),
          analysisId: analysisId ?? undefined,
          predictedDemand: result.predictedDemand,
          confidenceR2: result.confidenceR2,
          rmse: result.rmse,
          mape: result.mape,
          featureImportance: result.featureImportance,
          modelType: result.modelType,
          recommendation: result.recommendation,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      setSaved(true);
      flash("예측 결과를 저장했습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand";

  const importance = result
    ? Object.entries(result.featureImportance).sort((a, b) => b[1] - a[1])
    : [];
  const maxImportance = importance.length ? importance[0][1] : 1;

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
          <TrendingUp className="w-6 h-6 text-brand" />
          수요 예측
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          가격·날씨·판매 이력 등 다변수를 입력하면 AI가 일일 수요와 권장 발주를 예측합니다.
        </p>
      </div>

      {notice && (
        <div className="text-sm text-brand bg-brand-muted border border-brand/20 rounded-lg px-3 py-2">
          {notice}
        </div>
      )}

      {/* 입력 폼 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상품명 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.productName}
            onChange={(e) => set("productName", e.target.value)}
            placeholder="예: 성주 꿀 샤인머스캣 2kg"
            className={inputCls}
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">상품 속성</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">원산지</label>
              <select value={form.origin} onChange={(e) => set("origin", e.target.value)} className={inputCls}>
                <option value="">선택</option>
                <option value="국내산">국내산</option>
                <option value="수입산">수입산</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">등급</label>
              <select value={form.grade} onChange={(e) => set("grade", e.target.value)} className={inputCls}>
                <option value="">선택</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">판매가 (원)</label>
              <input type="number" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">도매가 (원)</label>
              <input type="number" value={form.wholesalePrice} onChange={(e) => set("wholesalePrice", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">할인율 (%)</label>
              <input type="number" value={form.discountRate} onChange={(e) => set("discountRate", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">날씨</div>
            <button
              type="button"
              onClick={autoWeather}
              disabled={weatherLoading}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-muted text-brand px-3 py-1.5 rounded-lg hover:bg-brand/10 disabled:opacity-60"
            >
              {weatherLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudSun className="w-3.5 h-3.5" />}
              날씨 자동입력
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">평균 기온 (°C)</label>
              <input type="number" value={form.avgTemperature} onChange={(e) => set("avgTemperature", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">강수량 (mm)</label>
              <input type="number" value={form.rainfall} onChange={(e) => set("rainfall", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">시간 정보</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">요일</label>
              <select value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", e.target.value)} className={inputCls}>
                <option value="">선택</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">월</label>
              <select value={form.month} onChange={(e) => set("month", e.target.value)} className={inputCls}>
                <option value="">선택</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">계절</label>
              <select value={form.season} onChange={(e) => set("season", e.target.value)} className={inputCls}>
                <option value="">선택</option>
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHoliday}
                  onChange={(e) => set("isHoliday", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                />
                명절·공휴일
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">판매 이력</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">전일 판매량</label>
              <input type="number" value={form.previousDaySales} onChange={(e) => set("previousDaySales", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">전주 동요일 판매량</label>
              <input type="number" value={form.lastWeekSales} onChange={(e) => set("lastWeekSales", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">전년 동기 판매량</label>
              <input type="number" value={form.lastYearSales} onChange={(e) => set("lastYearSales", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">예측 모델</label>
          <select value={form.modelType} onChange={(e) => set("modelType", e.target.value)} className={inputCls}>
            {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={runForecast}
            disabled={running}
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {running ? <><Loader2 className="w-4 h-4 animate-spin" /> 예측 중…</> : <><Play className="w-4 h-4" /> 예측 실행</>}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-900">예측 결과</h2>
            <button
              onClick={saveForecast}
              disabled={saving || saved}
              className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중…</> : <><Save className="w-4 h-4" /> {saved ? "저장됨" : "저장"}</>}
            </button>
          </div>

          {/* 예측 수요 */}
          <div className="bg-brand-muted rounded-xl p-6 text-center">
            <div className="text-sm text-brand font-medium mb-1">예상 수요</div>
            <div className="text-4xl font-bold text-brand-dark">
              {result.predictedDemand.toLocaleString()}
              <span className="text-base font-medium text-brand ml-1">단위</span>
            </div>
          </div>

          {/* 지표 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="R² (설명력)" value={result.confidenceR2.toFixed(2)} />
            <MetricCard label="RMSE" value={result.rmse.toLocaleString()} />
            <MetricCard label="MAPE" value={`${result.mape}%`} />
          </div>

          {/* 변수 중요도 */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-3">
              <BarChart3 className="w-4 h-4 text-brand" /> 변수 중요도
            </div>
            <div className="space-y-2.5">
              {importance.map(([name, val]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{name}</span>
                    <span className="font-medium">{Math.round(val * 100)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${Math.round((val / maxImportance) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 권장 발주 */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
              <Lightbulb className="w-4 h-4 text-brand" /> AI 권장 발주
            </div>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-4">
              {result.recommendation}
            </p>
          </div>

          {/* 영향 요인 */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">반영된 영향 요인</div>
              <div className="space-y-2">
                {result.breakdown.map((b, i) => (
                  <div key={i} className="flex gap-3 items-start border border-gray-100 rounded-lg p-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                        b.impact >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {b.impact > 0 ? "+" : ""}{b.impact}%
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{b.factor}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
