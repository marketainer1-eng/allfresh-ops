"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp, Cloud, Calendar, CreditCard, Package,
  Loader2, Zap, AlertCircle, Check, Save, Clock,
  Sun, Star, RefreshCw,
} from "lucide-react";

const ORIGIN_OPTIONS = ["국내산", "수입산"];
const GRADE_OPTIONS = ["특", "상", "중"];
const DAY_OPTIONS = ["월", "화", "수", "목", "금", "토", "일"];
const MODEL_OPTIONS = [
  { value: "random_forest", label: "랜덤 포레스트", desc: "비선형 복합 패턴 + 변수 중요도 분석", recommended: true },
  { value: "linear_regression", label: "다중 선형 회귀", desc: "빠른 학습, 변수별 영향력 명료", recommended: false },
];

function getSeason(month: number): string {
  if ([3, 4, 5].includes(month)) return "봄";
  if ([6, 7, 8].includes(month)) return "여름";
  if ([9, 10, 11].includes(month)) return "가을";
  return "겨울";
}

const COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444"];

interface BreakdownItem {
  factor: string;
  impact: number;
  description: string;
}

interface ForecastResult {
  predictedDemand: number;
  confidenceR2: number;
  rmse: number;
  mape: number;
  featureImportance: Record<string, number>;
  modelType: string;
  recommendation: string;
  breakdown?: BreakdownItem[];
}

interface FormState {
  productName: string;
  origin: string;
  grade: string;
  salePrice: number;
  wholesalePrice: number;
  discountRate: number;
  avgTemperature: number;
  rainfall: number;
  isHoliday: boolean;
  dayOfWeek: string;
  month: number;
  season: string;
  previousDaySales: number;
  lastWeekSales: number;
  lastYearSales: number;
  modelType: string;
}

interface RecentForecast {
  id: string;
  productName: string;
  dayOfWeek?: string | null;
  month?: number | null;
  modelType?: string | null;
  predictedDemand?: number | null;
}

interface WeatherInfo {
  baseDate?: string | null;
  baseTime?: string | null;
  temperature?: number | null;
  rainfall?: number | null;
  humidity?: number | null;
}

export default function ForecastPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <DemandForecastPage />
    </Suspense>
  );
}

function DemandForecastPage() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");

  const today = new Date();
  const todayDay = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()];
  const currentMonth = today.getMonth() + 1;

  const [form, setForm] = useState<FormState>({
    productName: "",
    origin: "국내산",
    grade: "상",
    salePrice: 10000,
    wholesalePrice: 7000,
    discountRate: 0,
    avgTemperature: 20,
    rainfall: 0,
    isHoliday: false,
    dayOfWeek: todayDay,
    month: currentMonth,
    season: getSeason(currentMonth),
    previousDaySales: 100,
    lastWeekSales: 110,
    lastYearSales: 120,
    modelType: "random_forest",
  });
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [recentForecasts, setRecentForecasts] = useState<RecentForecast[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    loadRecentForecasts();
  }, []);

  const handleFetchWeather = async () => {
    setWeatherLoading(true);
    setError("");
    try {
      const res = await fetch("/api/marketing/kma-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nx: 60, ny: 127 }),
      });
      if (res.status === 503) {
        setError("기상청 API 키가 설정되지 않았습니다. 기온·강수량을 직접 입력해 주세요.");
        return;
      }
      const data = await res.json();
      if (!data || data.ok === false) {
        throw new Error(data?.resultMsg || "기상청 데이터를 가져오지 못했습니다.");
      }
      setForm((prev) => ({
        ...prev,
        avgTemperature: typeof data.temperature === "number" ? data.temperature : prev.avgTemperature,
        rainfall: typeof data.rainfall === "number" ? data.rainfall : prev.rainfall,
      }));
      setSaved(false);
      setWeatherInfo({
        baseDate: data.baseDate,
        baseTime: data.baseTime,
        temperature: data.temperature,
        rainfall: data.rainfall,
        humidity: data.humidity,
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "기상청 데이터 조회 중 오류가 발생했습니다.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadRecentForecasts = async () => {
    try {
      const res = await fetch("/api/marketing/forecasts");
      const json = await res.json();
      const list: RecentForecast[] = json?.data || [];
      setRecentForecasts(list.slice(0, 5));
    } catch (e) {
      console.error("최근 이력 로드 실패:", e);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "month") next.season = getSeason(Number(value));
      return next;
    });
    setSaved(false);
  };

  const handleForecast = async () => {
    if (!form.productName.trim()) {
      setError("과일 품목명을 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/marketing/forecast-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("예측 요청에 실패했습니다.");
      const data = (await res.json()) as ForecastResult;
      if (!data || typeof data.predictedDemand !== "number") {
        throw new Error("예측 결과를 받지 못했습니다.");
      }
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "예측 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
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
      loadRecentForecasts();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSaved(false);
    setError("");
  };

  const importanceData = result
    ? Object.entries(result.featureImportance || {})
        .map(([name, value]) => ({ name, value: Math.round(Number(value) * 100) }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">과일 수요 예측</h1>
                <p className="text-sm text-slate-500 mt-0.5">머신러닝 기반 일별·품목별 수요 예측 + 발주 최적화</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <Star className="w-3.5 h-3.5" />
              회귀 모델 · R² · RMSE · MAPE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* === 입력 폼 === */}
          <div className="lg:col-span-3 space-y-5" role="form" aria-label="수요 예측 입력 폼">
            {/* 상품 정보 */}
            <FormCard icon={Package} iconColor="text-emerald-600" title="상품 정보">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <Label>과일 품목명 <span className="text-rose-500">*</span></Label>
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) => updateField("productName", e.target.value)}
                    placeholder="예: 사과, 배, 귤, 수박, 샤인머스캣"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                  />
                </div>
                <div>
                  <Label>원산지</Label>
                  <Select value={form.origin} onChange={(v) => updateField("origin", v)} options={ORIGIN_OPTIONS} ringColor="emerald" />
                </div>
                <div>
                  <Label>등급</Label>
                  <Select
                    value={form.grade}
                    onChange={(v) => updateField("grade", v)}
                    options={GRADE_OPTIONS}
                    formatLabel={(g) => `${g}등급`}
                    ringColor="emerald"
                  />
                </div>
              </div>
            </FormCard>

            {/* 가격 정보 */}
            <FormCard icon={CreditCard} iconColor="text-amber-600" title="가격 정보">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>판매가 (원)</Label>
                  <NumberInput value={form.salePrice} onChange={(v) => updateField("salePrice", v)} ringColor="amber" />
                </div>
                <div>
                  <Label>도매시세 (원)</Label>
                  <NumberInput value={form.wholesalePrice} onChange={(v) => updateField("wholesalePrice", v)} ringColor="amber" />
                </div>
                <div>
                  <Label>할인율 (%)</Label>
                  <NumberInput value={form.discountRate} onChange={(v) => updateField("discountRate", v)} min={0} max={70} ringColor="amber" />
                </div>
              </div>
              {form.salePrice > 0 && form.wholesalePrice > 0 && (
                <div className="mt-3 text-xs text-slate-500 px-3 py-2 rounded-lg bg-amber-50">
                  마진율: <span className="font-semibold text-amber-700">{(((form.salePrice - form.wholesalePrice) / form.salePrice) * 100).toFixed(1)}%</span>
                </div>
              )}
            </FormCard>

            {/* 시간 정보 */}
            <FormCard icon={Calendar} iconColor="text-violet-600" title="시간 정보">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>요일</Label>
                  <Select
                    value={form.dayOfWeek}
                    onChange={(v) => updateField("dayOfWeek", v)}
                    options={DAY_OPTIONS}
                    formatLabel={(d) => `${d}요일`}
                    ringColor="violet"
                  />
                </div>
                <div>
                  <Label>월</Label>
                  <select
                    value={form.month}
                    onChange={(e) => updateField("month", Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}월 ({getSeason(m)})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer w-full transition-all ${form.isHoliday ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <input
                      type="checkbox"
                      checked={form.isHoliday}
                      onChange={(e) => updateField("isHoliday", e.target.checked)}
                      className="w-4 h-4 accent-violet-600"
                    />
                    <span className="text-sm font-medium text-slate-700">공휴일·명절</span>
                  </label>
                </div>
              </div>
            </FormCard>

            {/* 날씨 정보 */}
            <FormCard icon={Cloud} iconColor="text-cyan-600" title="날씨 정보">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <p className="text-xs text-slate-500">기상청 단기실황(서울 종로구) 자동 입력</p>
                <button
                  type="button"
                  onClick={handleFetchWeather}
                  disabled={weatherLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {weatherLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      조회 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      기상청 자동 입력
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    <Sun className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                    평균 기온 (°C)
                  </Label>
                  <NumberInput value={form.avgTemperature} onChange={(v) => updateField("avgTemperature", v)} min={-20} max={40} ringColor="cyan" />
                </div>
                <div>
                  <Label>
                    <Cloud className="w-3.5 h-3.5 inline mr-1 text-cyan-500" />
                    강수량 (mm)
                  </Label>
                  <NumberInput value={form.rainfall} onChange={(v) => updateField("rainfall", v)} min={0} ringColor="cyan" />
                </div>
              </div>
              {weatherInfo && (
                <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-cyan-50 text-cyan-800 flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    실황 기준 {weatherInfo.baseDate?.slice(4, 6)}.{weatherInfo.baseDate?.slice(6, 8)} {weatherInfo.baseTime?.slice(0, 2)}시 ·
                    기온 <span className="font-semibold">{weatherInfo.temperature ?? "-"}°C</span> ·
                    강수량 <span className="font-semibold">{weatherInfo.rainfall ?? 0}mm</span>
                    {weatherInfo.humidity != null && <> · 습도 {weatherInfo.humidity}%</>}
                  </span>
                </div>
              )}
            </FormCard>

            {/* 판매 이력 */}
            <FormCard icon={Clock} iconColor="text-rose-600" title="판매 이력" badge="최강 변수">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>전일 판매량</Label>
                  <NumberInput value={form.previousDaySales} onChange={(v) => updateField("previousDaySales", v)} min={0} ringColor="rose" />
                </div>
                <div>
                  <Label>지난주 동요일</Label>
                  <NumberInput value={form.lastWeekSales} onChange={(v) => updateField("lastWeekSales", v)} min={0} ringColor="rose" />
                </div>
                <div>
                  <Label>작년 같은 시기</Label>
                  <NumberInput value={form.lastYearSales} onChange={(v) => updateField("lastYearSales", v)} min={0} ringColor="rose" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                💡 판매 이력은 추세와 계절성을 동시에 반영하는 가장 강력한 예측 변수입니다.
              </p>
            </FormCard>

            {/* 모델 선택 */}
            <FormCard icon={Star} iconColor="text-indigo-600" title="예측 모델">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField("modelType", opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.modelType === opt.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{opt.label}</span>
                        {opt.recommended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">권장</span>
                        )}
                      </div>
                      {form.modelType === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </FormCard>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleForecast}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    예측 중...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    수요 예측 실행
                  </>
                )}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  초기화
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* === 결과 패널 === */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <div className="space-y-4">
                {/* 예측값 카드 */}
                <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-90">예측 판매량</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-75 font-bold">
                      {result.modelType === "random_forest" ? "Random Forest" : "Linear Regression"}
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    {Number(result.predictedDemand).toLocaleString()}
                    <span className="text-lg ml-1 opacity-75">단위</span>
                  </div>
                  <div className="text-xs opacity-85">
                    {form.productName || "상품"} · {form.dayOfWeek}요일 · {form.month}월 ({form.season})
                  </div>
                </div>

                {/* 정확도 지표 */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard label="R²" value={Number(result.confidenceR2).toFixed(2)} color="text-emerald-600" />
                  <MetricCard label="RMSE" value={String(result.rmse)} color="text-amber-600" />
                  <MetricCard label="MAPE" value={`${result.mape}%`} color="text-rose-600" />
                </div>

                {/* 변수 중요도 (plain divs) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-indigo-600" />
                    변수 중요도
                  </h3>
                  <div className="space-y-2.5">
                    {importanceData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-32 flex-shrink-0 text-right truncate">{d.name}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md"
                            style={{ width: `${Math.min(100, (d.value / 40) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 w-9 text-right flex-shrink-0">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 영향 요인 */}
                {result.breakdown && result.breakdown.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">영향 요인 분석</h3>
                    <div className="space-y-2">
                      {result.breakdown.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50">
                          <span className={`text-sm font-bold flex-shrink-0 min-w-[42px] text-center px-1.5 py-0.5 rounded ${b.impact >= 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}>
                            {b.impact >= 0 ? "+" : ""}{b.impact}%
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">{b.factor}</div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{b.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 권장 */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                  <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    AI 발주 권장
                  </h3>
                  <p className="text-sm text-amber-900 leading-relaxed">{result.recommendation}</p>
                </div>

                {/* 저장 버튼 */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || saved}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    saved
                      ? "bg-emerald-100 text-emerald-700 cursor-default"
                      : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  }`}
                >
                  {saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      저장 완료
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      예측 결과 저장
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">예측 대기 중</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  상품·가격·시간·날씨·판매 이력을 입력한 뒤<br />
                  &quot;수요 예측 실행&quot; 버튼을 눌러 주세요.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <FeatureChip>🌡️ 날씨 보정</FeatureChip>
                  <FeatureChip>🎉 명절 효과</FeatureChip>
                  <FeatureChip>💰 가격 탄력성</FeatureChip>
                  <FeatureChip>📊 추세·계절성</FeatureChip>
                </div>
              </div>
            )}

            {/* 최근 예측 이력 */}
            {recentForecasts.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">최근 예측 이력</h3>
                <div className="space-y-1.5">
                  {recentForecasts.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">{f.productName}</div>
                        <div className="text-xs text-slate-500">
                          {f.dayOfWeek}요일 · {f.month}월 · {f.modelType === "random_forest" ? "RF" : "LR"}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-2">
                        {Number(f.predictedDemand || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== 보조 컴포넌트 ===== */
function FormCard({
  icon: Icon,
  iconColor,
  title,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {badge && <span className="text-xs text-rose-600 font-semibold px-2 py-0.5 rounded bg-rose-50">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>;
}

function Select({
  value,
  onChange,
  options,
  formatLabel,
  ringColor = "emerald",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  formatLabel?: (o: string) => string;
  ringColor?: string;
}) {
  const ringClass: Record<string, string> = {
    emerald: "focus:ring-emerald-500",
    violet: "focus:ring-violet-500",
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 ${ringClass[ringColor] || "focus:ring-emerald-500"} text-slate-900 bg-white`}
    >
      {options.map((o) => (
        <option key={o} value={o}>{formatLabel ? formatLabel(o) : o}</option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  ringColor = "emerald",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  ringColor?: string;
}) {
  const ringClass: Record<string, string> = {
    emerald: "focus:ring-emerald-500",
    amber: "focus:ring-amber-500",
    cyan: "focus:ring-cyan-500",
    rose: "focus:ring-rose-500",
  };
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 ${ringClass[ringColor] || "focus:ring-emerald-500"} text-slate-900`}
    />
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function FeatureChip({ children }: { children: React.ReactNode }) {
  return <div className="p-2 rounded-lg bg-slate-50 text-slate-600">{children}</div>;
}
