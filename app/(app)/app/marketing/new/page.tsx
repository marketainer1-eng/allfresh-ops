"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Apple,
  Gift,
  Repeat,
  FileText,
  Link as LinkIcon,
  Type,
  Upload,
  Loader2,
  Sparkles,
  Check,
  ArrowRight,
  Save,
  AlertCircle,
  Copy,
  Globe,
  Search,
  ExternalLink,
  ChevronDown,
  ShoppingBag,
  Plus,
  Trash2,
  Users,
  Cloud,
  Sun,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CategoryKey = "single" | "giftset" | "subscription";
type InputModeKey = "text" | "url" | "file";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  text: string;
}

interface InputModeDef {
  key: InputModeKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

interface Competitor {
  name: string;
  priceRange: string;
  strengths: string;
}

interface ResearchResult {
  title?: string;
  url?: string;
  snippet?: string;
}
interface MarketResearch {
  summary?: string;
  results?: ResearchResult[];
}

interface WeatherData {
  ok?: boolean;
  baseDate?: string | null;
  baseTime?: string | null;
  temperature?: number | null;
  rainfall?: number | null;
  humidity?: number | null;
  resultMsg?: string | null;
  resultCode?: string | null;
  httpStatus?: number;
}

interface KamisMapping {
  id?: string;
  productName?: string;
  categoryCode?: string;
  categoryName?: string;
  itemCode?: string;
  itemName?: string;
  kindCode?: string;
  kindName?: string;
  rankCode?: string;
}

interface KamisItem {
  itemname?: string;
  item_name?: string;
  productName?: string;
  kindname?: string;
  kind_name?: string;
  countyname?: string;
  county_name?: string;
  regday?: string;
  date?: string;
  price?: string;
  dpr1?: string;
}

interface KamisData {
  ok?: boolean;
  items?: KamisItem[];
  period?: { startday?: string; endday?: string };
  errorMsg?: string | null;
  errorCode?: string | null;
  mapping?: KamisMapping;
}

interface ForecastBreakdown {
  factor: string;
  impact: number;
  description?: string;
}
interface ForecastInputs {
  productName: string;
  wholesalePrice?: number;
  avgTemperature?: number;
  rainfall?: number;
  isHoliday?: boolean;
  dayOfWeek?: string;
  month?: number;
  season?: string;
  modelType?: string;
}
interface ForecastResult {
  predictedDemand: number;
  confidenceR2: number;
  rmse: number;
  mape: number;
  featureImportance: Record<string, number>;
  modelType: string;
  recommendation: string;
  breakdown: ForecastBreakdown[];
}

interface ChannelRec {
  channel: string;
  priority: "high" | "medium" | "low" | string;
  reasoning?: string;
}

interface AnalyzeResult {
  targetCustomer?: string;
  marketingCopy?: string;
  seoKeywords?: string[];
  seasonalCampaign?: string;
  hashtags?: string[];
  pricePositioning?: string;
  differentiation?: string;
  recommendedChannels?: ChannelRec[];
}

interface Notice {
  type: "success" | "error";
  msg: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES: CategoryDef[] = [
  {
    key: "single",
    label: "단품 과일",
    desc: "당도·산지·제철 등 품목 특성을 반영한 정밀 분석",
    icon: Apple,
    color: "#15803D",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  {
    key: "giftset",
    label: "선물세트",
    desc: "명절·기념일·VIP 시장 타깃 마케팅 전략",
    icon: Gift,
    color: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  {
    key: "subscription",
    label: "구독 서비스",
    desc: "신규 가입·리텐션 그로스 마케팅 인사이트",
    icon: Repeat,
    color: "#0E7490",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
  },
];

const INPUT_MODES: InputModeDef[] = [
  { key: "text", label: "텍스트", icon: Type, desc: "자유 입력" },
  { key: "url", label: "URL", icon: LinkIcon, desc: "상세페이지" },
  { key: "file", label: "파일", icon: FileText, desc: "CSV / PDF" },
];

// 기술적 에러 메시지를 사용자 친화적 메시지로 변환
function getFriendlyErrorMessage(err: unknown): { friendly: string; raw: string } {
  const anyErr = err as { data?: { error_message?: string; error?: string }; message?: string } | null;
  const raw = String(anyErr?.data?.error_message || anyErr?.data?.error || anyErr?.message || "");
  if (/Missing required environment variable|OPENAI_API_KEY|PERPLEXITY_API_KEY|ANTHROPIC_API_KEY/i.test(raw)) {
    return {
      friendly:
        "AI 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.",
      raw,
    };
  }
  if (/api[_\s-]?key|unauthorized|401|forbidden|403/i.test(raw)) {
    return { friendly: "AI 서비스 인증에 실패했습니다. 관리자에게 문의해 주세요.", raw };
  }
  if (/network|fetch|timeout|ECONN/i.test(raw)) {
    return { friendly: "네트워크 연결을 확인하고 다시 시도해 주세요.", raw };
  }
  return { friendly: raw || "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", raw };
}

function formatErrorForNotice(err: unknown): string {
  const { friendly, raw } = getFriendlyErrorMessage(err);
  if (process.env.NODE_ENV !== "production" && raw && raw !== friendly) {
    return `${friendly} (dev: ${raw})`;
  }
  return friendly;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MarketingNewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const competitorFileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<CategoryKey>("single");
  const [selfInputMode, setSelfInputMode] = useState<InputModeKey>("text");
  const [competitorInputMode, setCompetitorInputMode] = useState<InputModeKey>("text");

  const [productName, setProductName] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const [competitorInfo, setCompetitorInfo] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorFileName, setCompetitorFileName] = useState("");

  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // URL/파일 추출 진행 상태
  const [extractingSelf, setExtractingSelf] = useState(false);
  const [extractingCompetitor, setExtractingCompetitor] = useState(false);

  // 경쟁사 분석
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "", priceRange: "", strengths: "" },
  ]);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<Notice | null>(null);

  // Perplexity 실시간 시장 조사
  const [researchLoading, setResearchLoading] = useState(false);
  const [marketResearch, setMarketResearch] = useState<MarketResearch | null>(null);
  const [researchExpanded, setResearchExpanded] = useState(true);
  const [researchError, setResearchError] = useState<string | null>(null);

  // 기상청 실시간 날씨
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // KAMIS 농산물 시세
  const [kamisLoading, setKamisLoading] = useState(false);
  const [kamisData, setKamisData] = useState<KamisData | null>(null);

  // 수요 예측 (기상청·KAMIS 데이터로 자동 산출)
  const [forecast, setForecast] = useState<{
    result: ForecastResult;
    inputs: ForecastInputs;
  } | null>(null);

  const showNotice = (type: Notice["type"], msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // -------------------------------------------------------------------------
  // 자사 파일 업로드 + 추출
  // -------------------------------------------------------------------------
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setExtractingSelf(true);
    try {
      // 업로드(스토리지) — 미설정(503)이어도 추출은 진행
      try {
        const upForm = new FormData();
        upForm.append("file", f);
        upForm.append("folder", "uploads");
        await fetch("/api/marketing/upload", { method: "POST", body: upForm });
      } catch {
        /* 업로드 실패는 무시(추출이 핵심) */
      }
      const exForm = new FormData();
      exForm.append("file", f);
      const exRes = await fetch("/api/marketing/extract-file", {
        method: "POST",
        body: exForm,
      });
      const data = await exRes.json();
      if (data?.ok && data.text) {
        setProductInfo((prev) =>
          prev?.trim() ? `${prev}\n\n[파일 추출 내용]\n${data.text}` : data.text,
        );
        showNotice("success", `${f.name} 내용을 추출했습니다`);
      } else {
        showNotice("error", data?.error || "파일 내용 추출에 실패했습니다");
      }
    } catch (err) {
      showNotice("error", formatErrorForNotice(err));
    } finally {
      setExtractingSelf(false);
    }
  };

  const handleCompetitorFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCompetitorFileName(f.name);
    setExtractingCompetitor(true);
    try {
      try {
        const upForm = new FormData();
        upForm.append("file", f);
        upForm.append("folder", "uploads");
        await fetch("/api/marketing/upload", { method: "POST", body: upForm });
      } catch {
        /* 무시 */
      }
      const exForm = new FormData();
      exForm.append("file", f);
      const exRes = await fetch("/api/marketing/extract-file", {
        method: "POST",
        body: exForm,
      });
      const data = await exRes.json();
      if (data?.ok && data.text) {
        setCompetitorInfo((prev) =>
          prev?.trim() ? `${prev}\n\n[파일 추출 내용]\n${data.text}` : data.text,
        );
        showNotice("success", `${f.name} 내용을 추출했습니다`);
      } else {
        showNotice("error", data?.error || "파일 내용 추출에 실패했습니다");
      }
    } catch (err) {
      showNotice("error", formatErrorForNotice(err));
    } finally {
      setExtractingCompetitor(false);
    }
  };

  // -------------------------------------------------------------------------
  // URL 추출
  // -------------------------------------------------------------------------
  const handleExtractUrl = async () => {
    if (!sourceUrl.trim()) {
      showNotice("error", "먼저 URL을 입력해 주세요");
      return;
    }
    setExtractingSelf(true);
    try {
      const res = await fetch("/api/marketing/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl.trim() }),
      });
      const data = await res.json();
      if (data?.ok && data.text) {
        const merged = [data.title ? `[${data.title}]` : "", data.text]
          .filter(Boolean)
          .join("\n");
        setProductInfo((prev) =>
          prev?.trim() ? `${prev}\n\n[URL 추출 내용]\n${merged}` : merged,
        );
        showNotice("success", "URL 내용을 추출했습니다");
      } else {
        showNotice("error", data?.error || "URL 내용 추출에 실패했습니다");
      }
    } catch (err) {
      showNotice("error", formatErrorForNotice(err));
    } finally {
      setExtractingSelf(false);
    }
  };

  const handleExtractCompetitorUrl = async () => {
    if (!competitorUrl.trim()) {
      showNotice("error", "먼저 경쟁사 URL을 입력해 주세요");
      return;
    }
    setExtractingCompetitor(true);
    try {
      const res = await fetch("/api/marketing/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: competitorUrl.trim() }),
      });
      const data = await res.json();
      if (data?.ok && data.text) {
        const merged = [data.title ? `[${data.title}]` : "", data.text]
          .filter(Boolean)
          .join("\n");
        setCompetitorInfo((prev) =>
          prev?.trim() ? `${prev}\n\n[URL 추출 내용]\n${merged}` : merged,
        );
        showNotice("success", "경쟁사 URL 내용을 추출했습니다");
      } else {
        showNotice("error", data?.error || "URL 내용 추출에 실패했습니다");
      }
    } catch (err) {
      showNotice("error", formatErrorForNotice(err));
    } finally {
      setExtractingCompetitor(false);
    }
  };

  // -------------------------------------------------------------------------
  // 대표 이미지 업로드
  // -------------------------------------------------------------------------
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingThumb(true);
    try {
      const form = new FormData();
      form.append("file", f);
      form.append("folder", "images");
      const res = await fetch("/api/marketing/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data?.ok && data.url) {
        setThumbnailUrl(data.url);
        showNotice("success", "이미지 업로드 완료");
      } else {
        showNotice("error", data?.error || "이미지 업로드 실패");
      }
    } catch {
      showNotice("error", "이미지 업로드 중 오류가 발생했습니다");
    } finally {
      setUploadingThumb(false);
    }
  };

  const canAnalyze = () => {
    if (!productName.trim()) return false;
    if (selfInputMode === "text" && !productInfo.trim()) return false;
    if (selfInputMode === "url" && !sourceUrl.trim()) return false;
    if (selfInputMode === "file" && !fileName) return false;
    return true;
  };

  // -------------------------------------------------------------------------
  // Perplexity 시장 조사
  // -------------------------------------------------------------------------
  const handleMarketResearch = async () => {
    if (!productName.trim()) {
      showNotice("error", "먼저 상품명을 입력해 주세요");
      return;
    }
    setResearchLoading(true);
    setMarketResearch(null);
    setResearchError(null);
    try {
      const currentYear = new Date().getFullYear();
      const name = productName.trim();
      let query: string;
      if (category === "single") {
        query = `${name} 최신 시세 산지 직송 가격 소비자 트렌드 경쟁상품 ${currentYear}`;
      } else if (category === "giftset") {
        query = `${name} 명절 선물세트 가격대 인기 브랜드 최신 트렌드 ${currentYear}`;
      } else {
        query = `${name} 과일 구독 정기배송 경쟁사 비교 최신 ${currentYear}`;
      }
      const res = await fetch("/api/marketing/perplexity-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: "search", maxResults: 6 }),
      });
      const data = await res.json();
      // 503(키 미설정) 또는 5xx 실패 → 격리해서 안내, 분석은 계속 진행 가능
      if (!res.ok || data?.error) {
        setResearchError(
          res.status === 503
            ? "시장조사가 설정되지 않았습니다. 키 추가 시 이용 가능합니다. (분석은 계속 진행됩니다)"
            : "시장조사에 실패했습니다. 잠시 후 다시 시도해 주세요. (분석은 계속 진행됩니다)",
        );
        return;
      }
      setMarketResearch({
        summary: data.summary || "",
        results: Array.isArray(data.results) ? data.results : [],
      });
      setResearchExpanded(true);
      showNotice("success", "실시간 시장 조사가 완료되었습니다");
    } catch {
      setResearchError(
        "시장조사에 실패했습니다. 잠시 후 다시 시도해 주세요. (분석은 계속 진행됩니다)",
      );
    } finally {
      setResearchLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 기상청 날씨 — collector(데이터 반환) + 버튼 핸들러(상태/알림)
  // -------------------------------------------------------------------------
  const collectWeather = async (): Promise<WeatherData | null> => {
    try {
      const res = await fetch("/api/marketing/kma-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nx: 60, ny: 127 }),
      });
      const data: WeatherData & { error?: string } = await res.json();
      // 503(키 미설정)/ok:false → weatherError로만 격리(결과 패널 영향 없음)
      if (!res.ok || data?.ok === false) {
        const is401 =
          res.status === 401 ||
          data?.httpStatus === 401 ||
          /\b401\b|unauthorized|인증|api[_\s-]?key|설정되지/i.test(
            String(data?.error || data?.resultMsg || ""),
          );
        setWeatherError(
          res.status === 503
            ? "기상청 날씨가 설정되지 않았습니다. 인증키 추가 시 이용 가능합니다."
            : is401
              ? "기상청 날씨 데이터를 가져오지 못했습니다. 인증키를 확인해 주세요. (HTTP 401)"
              : "기상청 날씨 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return null;
      }
      return data;
    } catch {
      setWeatherError(
        "기상청 날씨 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return null;
    }
  };

  const handleFetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherData(null);
    setWeatherError(null);
    const data = await collectWeather();
    if (data) {
      setWeatherData(data);
      setWeatherError(null);
      showNotice("success", "기상청 실시간 데이터가 수신되었습니다");
    }
    setWeatherLoading(false);
  };

  // -------------------------------------------------------------------------
  // KAMIS 시세 — collector(데이터 반환) + 버튼 핸들러(상태/알림)
  // -------------------------------------------------------------------------
  const collectKamis = async (
    opts?: { silent?: boolean },
  ): Promise<KamisData | null> => {
    if (!productName.trim()) {
      if (!opts?.silent) showNotice("error", "먼저 상품명을 입력해 주세요");
      return null;
    }
    try {
      const mRes = await fetch("/api/marketing/kamis-mappings");
      const mJson = await mRes.json();
      const mList: KamisMapping[] = Array.isArray(mJson?.data) ? mJson.data : [];
      const mapping = mList.find(
        (m) => String(m.productName || "").trim() === productName.trim(),
      );
      if (!mapping) {
        if (!opts?.silent) {
          throw new Error(
            "해당 상품의 KAMIS 매핑이 없습니다. 데이터 설정 메뉴에서 먼저 매핑해 주세요",
          );
        }
        return null;
      }
      const res = await fetch("/api/marketing/kamis-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryCode: mapping.categoryCode,
          itemCode: mapping.itemCode,
          kindCode: mapping.kindCode,
          rankCode: mapping.rankCode,
        }),
      });
      const data: KamisData & { error?: string } = await res.json();
      if (!res.ok || data?.ok === false) {
        const detail =
          data?.errorMsg || data?.error || `code: ${data?.errorCode || "unknown"}`;
        if (!opts?.silent) throw new Error(`KAMIS 응답 오류 — ${detail}`);
        return null;
      }
      return { ...data, mapping };
    } catch (err) {
      if (!opts?.silent) showNotice("error", formatErrorForNotice(err));
      return null;
    }
  };

  const handleFetchKamis = async () => {
    setKamisLoading(true);
    setKamisData(null);
    const data = await collectKamis();
    if (data) {
      setKamisData(data);
      showNotice("success", `KAMIS 시세 ${data.items?.length || 0}건 수신`);
    }
    setKamisLoading(false);
  };

  // -------------------------------------------------------------------------
  // 수요 예측 — 기상청·KAMIS·날짜로 입력을 구성해 자체 모델 호출
  // -------------------------------------------------------------------------
  const deriveForecastInputs = (
    wx: WeatherData | null,
    kx: KamisData | null,
  ): ForecastInputs => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
    const season =
      month === 12 || month <= 2 ? "겨울" : month <= 5 ? "봄" : month <= 8 ? "여름" : "가을";
    // KAMIS 시세 평균 → 도매가 근사치
    let wholesalePrice: number | undefined;
    const prices = (kx?.items || [])
      .map((it) => Number(String(it.price ?? it.dpr1 ?? "").replace(/[^0-9.]/g, "")))
      .filter((n) => n > 0);
    if (prices.length > 0) {
      wholesalePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }
    return {
      productName: productName.trim(),
      avgTemperature: wx?.temperature ?? undefined,
      rainfall: wx?.rainfall ?? undefined,
      wholesalePrice,
      isHoliday: false,
      dayOfWeek,
      month,
      season,
      modelType: "auto",
    };
  };

  const collectForecast = async (
    wx: WeatherData | null,
    kx: KamisData | null,
  ): Promise<{ result: ForecastResult; inputs: ForecastInputs } | null> => {
    const inputs = deriveForecastInputs(wx, kx);
    try {
      const res = await fetch("/api/marketing/forecast-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (!res.ok || data?.error) return null;
      return { result: data as ForecastResult, inputs };
    } catch {
      return null;
    }
  };

  // -------------------------------------------------------------------------
  // 경쟁사 (텍스트 모드)
  // -------------------------------------------------------------------------
  const addCompetitor = () => {
    if (competitors.length >= 5) return;
    setCompetitors([...competitors, { name: "", priceRange: "", strengths: "" }]);
  };
  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };
  const updateCompetitor = (index: number, field: keyof Competitor, value: string) => {
    const next = [...competitors];
    next[index] = { ...next[index], [field]: value };
    setCompetitors(next);
  };

  // -------------------------------------------------------------------------
  // AI 분석
  // -------------------------------------------------------------------------
  const handleAnalyze = async () => {
    if (!canAnalyze()) {
      showNotice("error", "필수 정보를 입력해 주세요");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setForecast(null);
    setWeatherError(null);
    try {
      // 1) 기상청·KAMIS 자동 수집 (이미 조회돼 있으면 재사용, 없으면 조용히 수집)
      const wx = weatherData ?? (await collectWeather());
      if (wx && !weatherData) setWeatherData(wx);
      const kx = kamisData ?? (await collectKamis({ silent: true }));
      if (kx && !kamisData) setKamisData(kx);

      // 2) 수요 예측 (날씨·KAMIS 시세·날짜 기반 자체 모델)
      const fc = await collectForecast(wx, kx);
      if (fc) setForecast(fc);

      // 3) AI 분석 (날씨·KAMIS·수요예측을 함께 전달)
      const payload = {
        category,
        inputMode: selfInputMode,
        productName: productName.trim(),
        productInfo: productInfo.trim(),
        sourceUrl: sourceUrl.trim(),
        fileName,
        attributes: {},
        competitorInputMode,
        competitorInfo: competitorInfo.trim(),
        competitorUrl: competitorUrl.trim(),
        competitorFileName,
        competitors: competitors.filter((c) => c.name && c.name.trim()),
        marketResearch: marketResearch
          ? {
              summary: marketResearch.summary || "",
              results: (marketResearch.results || []).slice(0, 5),
            }
          : null,
        weather: wx
          ? {
              baseDate: wx.baseDate,
              baseTime: wx.baseTime,
              temperature: wx.temperature,
              rainfall: wx.rainfall,
              humidity: wx.humidity,
            }
          : null,
        kamisPrices: kx
          ? {
              mapping: kx.mapping
                ? {
                    productName: kx.mapping.productName,
                    categoryName: kx.mapping.categoryName,
                    itemName: kx.mapping.itemName,
                    kindName: kx.mapping.kindName,
                  }
                : null,
              period: kx.period,
              items: (kx.items || []).slice(0, 10),
            }
          : null,
        demandForecast: fc
          ? {
              predictedDemand: fc.result.predictedDemand,
              recommendation: fc.result.recommendation,
              topFactors: (fc.result.breakdown || [])
                .slice(0, 3)
                .map((b) => ({ factor: b.factor, impact: b.impact })),
            }
          : null,
      };
      const res = await fetch("/api/marketing/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "분석에 실패했습니다");
      }
      setResult(data as AnalyzeResult);
      showNotice("success", "AI 분석이 완료되었습니다");
    } catch (err) {
      showNotice("error", formatErrorForNotice(err));
    } finally {
      setAnalyzing(false);
    }
  };

  // -------------------------------------------------------------------------
  // 저장
  // -------------------------------------------------------------------------
  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const payload = {
        productName: productName.trim(),
        category,
        inputMode: selfInputMode,
        productInfo: productInfo.trim(),
        sourceUrl: sourceUrl.trim(),
        fileName,
        attributes: {},
        targetCustomer: result.targetCustomer || "",
        marketingCopy: result.marketingCopy || "",
        seoKeywords: result.seoKeywords || [],
        seasonalCampaign: result.seasonalCampaign || "",
        hashtags: result.hashtags || [],
        pricePositioning: result.pricePositioning || "",
        differentiation: result.differentiation || "",
        recommendedChannels: result.recommendedChannels || [],
        thumbnailUrl: thumbnailUrl || "",
        competitorInfo: competitorInfo.trim(),
        competitorUrl: competitorUrl.trim(),
        competitors: competitors.filter((c) => c.name && c.name.trim()),
        marketResearch: marketResearch
          ? {
              summary: marketResearch.summary || "",
              results: (marketResearch.results || []).slice(0, 5),
            }
          : null,
        weather: weatherData
          ? {
              baseDate: weatherData.baseDate,
              baseTime: weatherData.baseTime,
              temperature: weatherData.temperature,
              rainfall: weatherData.rainfall,
              humidity: weatherData.humidity,
            }
          : null,
        kamisPrices: kamisData
          ? {
              mapping: kamisData.mapping
                ? {
                    productName: kamisData.mapping.productName,
                    categoryName: kamisData.mapping.categoryName,
                    itemName: kamisData.mapping.itemName,
                    kindName: kamisData.mapping.kindName,
                  }
                : null,
              period: kamisData.period,
              items: (kamisData.items || []).slice(0, 10),
            }
          : null,
        status: "completed",
      };
      const res = await fetch("/api/marketing/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      if (!res.ok || created?.error) {
        throw new Error(created?.error || "저장에 실패했습니다");
      }
      const newId = created?.id;

      // 수요 예측을 분석에 연결해 저장 (실패해도 분석 저장은 유지)
      if (newId && forecast) {
        try {
          await fetch("/api/marketing/forecasts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              analysisId: newId,
              productName: forecast.inputs.productName || productName.trim(),
              wholesalePrice: forecast.inputs.wholesalePrice,
              avgTemperature: forecast.inputs.avgTemperature,
              rainfall: forecast.inputs.rainfall,
              isHoliday: forecast.inputs.isHoliday ?? false,
              dayOfWeek: forecast.inputs.dayOfWeek,
              month: forecast.inputs.month,
              season: forecast.inputs.season,
              modelType: forecast.inputs.modelType,
              predictedDemand: forecast.result.predictedDemand,
              confidenceR2: forecast.result.confidenceR2,
              rmse: forecast.result.rmse,
              mape: forecast.result.mape,
              featureImportance: forecast.result.featureImportance,
              recommendation: forecast.result.recommendation,
            }),
          });
        } catch {
          /* 수요예측 저장 실패는 무시 */
        }
      }

      showNotice("success", "분석 결과가 저장되었습니다");
      setTimeout(() => {
        router.push(newId ? `/app/marketing/history?focus=${newId}` : "/app/marketing/history");
      }, 800);
    } catch (err) {
      showNotice("error", `저장 실패: ${formatErrorForNotice(err)}`);
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => showNotice("success", "복사되었습니다"),
      () => showNotice("error", "복사 실패"),
    );
  };

  const currentCat = CATEGORIES.find((c) => c.key === category);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-start gap-2">
            {notification.type === "success" ? (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          새 분석 만들기
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          카테고리에 맞는 전용 프롬프트로 AI 마케팅 인사이트를 받아보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-6">
        {/* Left: Form */}
        <div className="xl:col-span-3 space-y-4 md:space-y-5">
          {/* Step 1: Category */}
          <Section step="01" title="카테고리 선택" desc="분석 대상의 종류를 선택해 주세요">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      active
                        ? `${c.bg} ${c.border} shadow-sm`
                        : "bg-white border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 ${
                        active ? "bg-white" : c.bg
                      } ${c.text}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {c.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Step 2: Self Analysis */}
          <Section
            step="02"
            title="자사 분석"
            desc="입력 방식을 선택하고 자사 상품 정보를 입력해 주세요"
          >
            <div className="space-y-4" role="form" aria-label="자사 분석 입력">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  입력 방식
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {INPUT_MODES.map((m) => {
                    const Icon = m.icon;
                    const active = selfInputMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelfInputMode(m.key)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-slate-700 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="예) 샤인머스캣 1kg (경북 김천산)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Mode-specific input */}
              {selfInputMode === "text" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    상품 설명 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    rows={5}
                    placeholder="상품의 특징, 구성, 포인트를 자유롭게 입력해 주세요."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
                  />
                </div>
              )}

              {selfInputMode === "url" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    상세페이지 URL <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://allfresh.example.com/products/..."
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleExtractUrl}
                      disabled={!sourceUrl.trim() || extractingSelf}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {extractingSelf ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>가져오기</span>
                    </button>
                  </div>
                  <textarea
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    rows={3}
                    placeholder="(선택) 추가 설명이 있다면 입력해 주세요. 가져오기를 누르면 페이지 내용이 채워집니다."
                    className="mt-2 w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
                  />
                </div>
              )}

              {selfInputMode === "file" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    파일 업로드 (CSV / PDF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extractingSelf}
                    className="w-full border-2 border-dashed border-stone-300 hover:border-emerald-400 rounded-xl p-6 text-center transition-colors group disabled:opacity-60"
                  >
                    {extractingSelf ? (
                      <Loader2 className="w-5 h-5 mx-auto text-emerald-500 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-5 h-5 mx-auto text-stone-400 group-hover:text-emerald-500 mb-2" />
                    )}
                    <div className="text-sm font-medium text-slate-700">
                      {extractingSelf
                        ? "파일 내용 추출 중..."
                        : fileName || "파일을 선택하거나 드래그하세요"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">CSV · PDF · 최대 10MB</div>
                  </button>
                  <textarea
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    rows={3}
                    placeholder="(선택) 파일에 대한 보충 설명"
                    className="mt-2 w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
                  />
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  대표 이미지 (선택)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-stone-300 hover:border-emerald-400 cursor-pointer flex items-center justify-center bg-stone-50 overflow-hidden transition-colors">
                    {thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailUrl}
                        alt="썸네일"
                        className="w-full h-full object-cover"
                      />
                    ) : uploadingThumb ? (
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-stone-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="flex-1 text-xs text-slate-500 leading-relaxed">
                    {thumbnailUrl ? (
                      <span className="text-emerald-700">✓ 이미지가 업로드되었습니다</span>
                    ) : (
                      <>업로드된 이미지는 분석 카드 썸네일로 사용됩니다.</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Step 3: 경쟁사 분석 */}
          <Section
            step="03"
            title="경쟁사 분석"
            desc="입력 방식(텍스트·URL·파일)을 선택해 경쟁사 정보를 넣으세요. URL·파일과 함께 경쟁사를 직접 추가할 수도 있습니다."
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  입력 방식
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {INPUT_MODES.map((m) => {
                    const Icon = m.icon;
                    const active = competitorInputMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setCompetitorInputMode(m.key)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-slate-700 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {competitorInputMode === "url" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    경쟁사 상세페이지 URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={competitorUrl}
                      onChange={(e) => setCompetitorUrl(e.target.value)}
                      placeholder="https://competitor.example.com/products/..."
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleExtractCompetitorUrl}
                      disabled={!competitorUrl.trim() || extractingCompetitor}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {extractingCompetitor ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>가져오기</span>
                    </button>
                  </div>
                  <textarea
                    value={competitorInfo}
                    onChange={(e) => setCompetitorInfo(e.target.value)}
                    rows={3}
                    placeholder="(선택) 경쟁사에 대한 추가 설명을 입력해 주세요"
                    className="mt-2 w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
                  />
                </div>
              )}

              {competitorInputMode === "file" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    경쟁사 정보 파일 업로드 (CSV / PDF)
                  </label>
                  <input
                    ref={competitorFileInputRef}
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleCompetitorFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => competitorFileInputRef.current?.click()}
                    disabled={extractingCompetitor}
                    className="w-full border-2 border-dashed border-stone-300 hover:border-emerald-400 rounded-xl p-6 text-center transition-colors group disabled:opacity-60"
                  >
                    {extractingCompetitor ? (
                      <Loader2 className="w-5 h-5 mx-auto text-emerald-500 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-5 h-5 mx-auto text-stone-400 group-hover:text-emerald-500 mb-2" />
                    )}
                    <div className="text-sm font-medium text-slate-700">
                      {extractingCompetitor
                        ? "파일 내용 추출 중..."
                        : competitorFileName || "파일을 선택하거나 드래그하세요"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">CSV · PDF · 최대 10MB</div>
                  </button>
                  <textarea
                    value={competitorInfo}
                    onChange={(e) => setCompetitorInfo(e.target.value)}
                    rows={3}
                    placeholder="(선택) 파일에 대한 보충 설명"
                    className="mt-2 w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
                  />
                </div>
              )}

              {/* 경쟁사 직접 입력 — 모든 입력 방식(텍스트·URL·파일)에서 추가 가능 */}
              <div className="space-y-3">
                {competitorInputMode !== "text" && (
                  <div className="pt-3 border-t border-stone-100">
                    <span className="text-xs font-semibold text-slate-700">
                      경쟁사 직접 추가 <span className="text-slate-400 font-normal">(선택)</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      URL·파일과 함께, 직접 입력한 경쟁사 정보도 AI 분석에 반영됩니다.
                    </p>
                  </div>
                )}
                {competitors.map((c, i) => (
                  <div
                    key={i}
                    className="bg-stone-50 border border-stone-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        경쟁사 #{i + 1}
                      </span>
                      {competitors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCompetitor(i)}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                          aria-label="경쟁사 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <AttrField
                        label="경쟁사 상품명"
                        placeholder="예) A브랜드 샤인머스켓 1kg"
                        value={c.name}
                        onChange={(v) => updateCompetitor(i, "name", v)}
                      />
                      <AttrField
                        label="가격대"
                        placeholder="예) 25,000원 ~ 35,000원"
                        value={c.priceRange}
                        onChange={(v) => updateCompetitor(i, "priceRange", v)}
                      />
                      <div className="sm:col-span-2">
                        <AttrField
                          label="강점·차별점"
                          placeholder="예) 무료배송, 산지직송, 단독 패키지 디자인"
                          value={c.strengths}
                          onChange={(v) => updateCompetitor(i, "strengths", v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {competitors.length < 5 && (
                  <button
                    type="button"
                    onClick={addCompetitor}
                    className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>경쟁사 추가</span>
                  </button>
                )}
              </div>
            </div>
          </Section>

          {/* Step 4: 실시간 시장 조사 (Perplexity + 기상청 + KAMIS) */}
          <Section
            step="04"
            title="실시간 시장 조사 · 수요 예측"
            desc="AI 분석 실행 시 기상청·KAMIS 시세를 자동 수집하고 수요 예측까지 함께 산출해 분석에 반영합니다. 아래에서 미리 조회할 수도 있습니다."
          >
            <div className="space-y-5">
              {/* Perplexity */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5" />
                  Perplexity 시장 검색
                </div>
                <button
                  type="button"
                  onClick={handleMarketResearch}
                  disabled={!productName.trim() || researchLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {researchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>퍼플렉시티가 시장을 조사 중...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>
                        {marketResearch ? "시장 조사 다시 실행" : "실시간 시장 조사 실행"}
                      </span>
                      <Search className="w-4 h-4" />
                    </>
                  )}
                </button>
                {researchError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="break-words flex-1">{researchError}</span>
                  </div>
                )}
                {marketResearch && (
                  <div className="border border-emerald-200 rounded-xl bg-emerald-50/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setResearchExpanded((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Perplexity 검색 결과 ({(marketResearch.results || []).length}건)
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          researchExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {researchExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-2 max-h-80 overflow-y-auto">
                        {(marketResearch.results || []).length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-4">
                            관련 검색 결과를 찾지 못했습니다
                          </div>
                        )}
                        {(marketResearch.results || []).map((r, i) => (
                          <a
                            key={i}
                            href={r.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white border border-stone-200 rounded-lg p-3 hover:border-emerald-300 hover:shadow-sm transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-700">
                                {r.title || "(제목 없음)"}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            </div>
                            {r.snippet && (
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-1.5">
                                {r.snippet}
                              </p>
                            )}
                            {r.url && (
                              <div className="text-[10px] text-emerald-700 truncate">
                                {r.url}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 기상청 실시간 날씨 */}
              <div className="space-y-3 pt-5 border-t border-stone-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                  <Cloud className="w-3.5 h-3.5" />
                  기상청 실시간 날씨
                </div>
                <button
                  type="button"
                  onClick={handleFetchWeather}
                  disabled={weatherLoading}
                  className={`w-full inline-flex items-center justify-center gap-2 bg-white border-2 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    weatherError
                      ? "border-red-400 text-red-700 hover:bg-red-50"
                      : "border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300"
                  }`}
                  aria-invalid={!!weatherError}
                  aria-describedby={weatherError ? "weather-error" : undefined}
                >
                  {weatherLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>기상청 데이터 조회 중...</span>
                    </>
                  ) : weatherError ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>기상청 데이터 다시 조회</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>
                        {weatherData ? "기상청 데이터 다시 조회" : "기상청 실시간 날씨 조회"}
                      </span>
                    </>
                  )}
                </button>
                {weatherError && (
                  <div
                    id="weather-error"
                    role="alert"
                    aria-live="polite"
                    className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 flex items-start gap-2"
                  >
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="break-words flex-1">{weatherError}</span>
                    <button
                      type="button"
                      onClick={() => handleFetchWeather()}
                      className="text-xs underline text-red-600 hover:text-red-800 ml-auto whitespace-nowrap"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                {weatherData && (
                  <div className="border border-cyan-200 rounded-xl bg-cyan-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-800 font-semibold">
                      <Cloud className="w-3 h-3" />
                      <span>
                        실황 기준{" "}
                        {weatherData.baseDate
                          ? `${weatherData.baseDate.slice(4, 6)}.${weatherData.baseDate.slice(6, 8)}`
                          : "-"}{" "}
                        {weatherData.baseTime
                          ? `${weatherData.baseTime.slice(0, 2)}시`
                          : ""}{" "}
                        (서울 종로구)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <WeatherStat
                        icon={Sun}
                        iconColor="text-amber-500"
                        label="기온"
                        value={
                          weatherData.temperature != null
                            ? `${weatherData.temperature}°C`
                            : "-"
                        }
                      />
                      <WeatherStat
                        icon={Cloud}
                        iconColor="text-cyan-500"
                        label="강수량"
                        value={
                          weatherData.rainfall != null
                            ? `${weatherData.rainfall}mm`
                            : "-"
                        }
                      />
                      <WeatherStat
                        icon={Cloud}
                        iconColor="text-slate-500"
                        label="습도"
                        value={
                          weatherData.humidity != null
                            ? `${weatherData.humidity}%`
                            : "-"
                        }
                      />
                    </div>
                    <div className="text-[11px] text-cyan-800 flex items-center gap-1.5 pt-1 border-t border-cyan-200/60">
                      <Sparkles className="w-3 h-3" />
                      <span>날씨 데이터는 AI 시즌·캠페인 분석에 자동 반영됩니다</span>
                    </div>
                  </div>
                )}
              </div>

              {/* KAMIS 농산물 시세 */}
              <div className="space-y-3 pt-5 border-t border-stone-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  KAMIS 농산물 시세
                </div>
                <button
                  type="button"
                  onClick={handleFetchKamis}
                  disabled={!productName.trim() || kamisLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {kamisLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>KAMIS 시세 조회 중...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {kamisData ? "KAMIS 시세 다시 조회" : "KAMIS 농산물 시세 조회"}
                      </span>
                    </>
                  )}
                </button>
                {kamisData && (
                  <div className="border border-amber-200 rounded-xl bg-amber-50/40 overflow-hidden">
                    <div className="px-4 py-2.5 text-xs font-semibold text-amber-800 flex items-center justify-between bg-amber-100/40">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {kamisData.mapping?.itemName || "품목"}
                          {kamisData.mapping?.kindName ? ` · ${kamisData.mapping.kindName}` : ""}{" "}
                          ({(kamisData.items || []).length}건)
                        </span>
                      </span>
                      {kamisData.period?.startday && kamisData.period?.endday && (
                        <span className="text-[10px] text-amber-700 flex-shrink-0 ml-2">
                          {kamisData.period.startday} ~ {kamisData.period.endday}
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-3 space-y-1.5 max-h-64 overflow-y-auto">
                      {(kamisData.items || []).length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-2">
                          해당 기간의 시세 데이터가 없습니다
                        </div>
                      ) : (
                        (kamisData.items || []).slice(0, 10).map((it, i) => {
                          const price = it.price || it.dpr1 || "";
                          const numPrice = Number(
                            String(price).replace(/[^0-9.-]/g, ""),
                          );
                          return (
                            <div
                              key={i}
                              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">
                                  {it.itemname || it.item_name || it.productName || "품목"}
                                  {(it.kindname || it.kind_name) &&
                                    ` · ${it.kindname || it.kind_name}`}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {it.regday || it.date || ""}{" "}
                                  {it.countyname || it.county_name || ""}
                                </div>
                              </div>
                              <div className="font-bold text-amber-700 whitespace-nowrap">
                                {numPrice ? numPrice.toLocaleString() : price || "-"}
                                <span className="text-[10px] text-slate-500 ml-0.5">원</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="px-4 py-2 bg-amber-100/40 border-t border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>실시간 시세는 AI 가격 포지셔닝 분석에 자동 반영됩니다</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 수요 예측 (기상청·KAMIS 기반 자동 산출) */}
              <div className="space-y-3 pt-5 border-t border-stone-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  수요 예측
                </div>
                {forecast ? (
                  <div className="border border-violet-200 rounded-xl bg-violet-50/40 p-4 space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-violet-700 font-semibold">
                          예상 수요 지수
                        </div>
                        <div className="text-2xl font-bold text-violet-800 leading-tight">
                          {Math.round(forecast.result.predictedDemand).toLocaleString()}
                        </div>
                      </div>
                      {forecast.result.confidenceR2 > 0 && (
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">모델 신뢰도(R²)</div>
                          <div className="text-sm font-bold text-violet-700">
                            {forecast.result.confidenceR2.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                    {(forecast.result.breakdown || []).length > 0 && (
                      <div className="space-y-1.5">
                        {forecast.result.breakdown.slice(0, 4).map((b, i) => {
                          const pos = b.impact >= 0;
                          return (
                            <div key={i} className="text-[11px]">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-slate-700 truncate">{b.factor}</span>
                                <span
                                  className={`font-semibold ${pos ? "text-emerald-700" : "text-red-600"}`}
                                >
                                  {pos ? "+" : ""}
                                  {b.impact}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pos ? "bg-emerald-500" : "bg-red-400"}`}
                                  style={{
                                    width: `${Math.min(100, Math.abs(b.impact))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {forecast.result.recommendation && (
                      <div className="text-[11px] text-violet-900 bg-white/70 rounded-lg p-2.5 leading-relaxed flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-violet-600" />
                        <span>{forecast.result.recommendation}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/30 p-3 text-[11px] text-violet-700 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      AI 분석을 실행하면 기상청 날씨와 KAMIS 시세를 활용해 수요를 예측하고
                      발주·프로모션 전략을 함께 제안합니다.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Analyze button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze() || analyzing}
              className="inline-flex items-center gap-2 bg-[#15803D] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI가 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>AI 분석 시작</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="xl:col-span-2">
          <div className="xl:sticky xl:top-4">
            <ResultPanel
              loading={analyzing}
              result={result}
              forecast={forecast?.result ?? null}
              currentCat={currentCat}
              onSave={handleSave}
              saving={saving}
              onCopy={handleCopy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Section({
  step,
  title,
  desc,
  children,
}: {
  step: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-stone-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function AttrField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
      />
    </div>
  );
}

function WeatherStat({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-cyan-100 rounded-lg p-2.5 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${iconColor}`} />
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ResultPanel({
  loading,
  result,
  forecast,
  currentCat,
  onSave,
  saving,
  onCopy,
}: {
  loading: boolean;
  result: AnalyzeResult | null;
  forecast: ForecastResult | null;
  currentCat?: CategoryDef;
  onSave: () => void;
  saving: boolean;
  onCopy: (text: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"marketing" | "sales">("marketing");

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-emerald-700 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">AI가 분석 중입니다</h3>
        <p className="text-sm text-slate-600 text-center leading-relaxed">
          카테고리 전용 프롬프트로 인사이트를 도출하고 있어요.
          <br />
          잠시만 기다려 주세요.
        </p>
        <div className="mt-6 w-full max-w-xs space-y-2">
          {["타깃 페르소나 생성 중", "마케팅 카피 도출 중", "SEO 키워드 추출 중"].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-slate-600 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg"
            >
              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border border-dashed border-stone-300 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">분석 결과 대기 중</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          왼쪽에서 카테고리와 정보를 입력한 뒤
          <br />
          AI 분석 시작 버튼을 눌러주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentCat?.color }}
          />
          <h3 className="text-sm font-semibold text-slate-900">AI 분석 결과</h3>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-[#15803D] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#166534] disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>저장</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-lg" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "marketing"}
          onClick={() => setActiveTab("marketing")}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === "marketing"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          마케팅
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sales"}
          onClick={() => setActiveTab("sales")}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === "sales"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          판매전략
        </button>
      </div>

      {activeTab === "marketing" && (
        <div className="space-y-5">
          <ResultBlock label="타깃 고객 페르소나" content={result.targetCustomer} onCopy={onCopy} />
          <ResultBlock label="마케팅 카피" content={result.marketingCopy} onCopy={onCopy} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                SEO 키워드
              </h4>
              <button
                type="button"
                onClick={() => onCopy((result.seoKeywords || []).join(", "))}
                className="text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> 복사
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(result.seoKeywords || []).map((k, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-100"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
          <ResultBlock label="제철·시즌 캠페인 제안" content={result.seasonalCampaign} onCopy={onCopy} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                추천 해시태그
              </h4>
              <button
                type="button"
                onClick={() => onCopy((result.hashtags || []).join(" "))}
                className="text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> 복사
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(result.hashtags || []).map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-100"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sales" && (
        <div className="space-y-5">
          <ResultBlock label="가격 포지셔닝 제안" content={result.pricePositioning} onCopy={onCopy} />
          <ResultBlock label="경쟁상품 대비 차별점" content={result.differentiation} onCopy={onCopy} />
          {forecast && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                수요 예측 · 발주 제안
              </h4>
              <div className="border border-violet-200 rounded-xl bg-violet-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-violet-700 font-semibold">
                    예상 수요 지수
                  </span>
                  <span className="text-lg font-bold text-violet-800">
                    {Math.round(forecast.predictedDemand).toLocaleString()}
                  </span>
                </div>
                {forecast.recommendation && (
                  <p className="text-[11px] text-violet-900 leading-relaxed">
                    {forecast.recommendation}
                  </p>
                )}
                {(forecast.breakdown || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {forecast.breakdown.slice(0, 4).map((b, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                          b.impact >= 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}
                      >
                        {b.factor} {b.impact >= 0 ? "+" : ""}
                        {b.impact}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <ChannelRecommendations channels={result.recommendedChannels || []} onCopy={onCopy} />
        </div>
      )}
    </div>
  );
}

function ResultBlock({
  label,
  content,
  onCopy,
}: {
  label: string;
  content?: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</h4>
        <button
          type="button"
          onClick={() => onCopy(content || "")}
          className="text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1"
        >
          <Copy className="w-3 h-3" /> 복사
        </button>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed bg-stone-50 rounded-lg p-3 whitespace-pre-line">
        {content || "-"}
      </p>
    </div>
  );
}

function ChannelRecommendations({
  channels,
  onCopy,
}: {
  channels: ChannelRec[];
  onCopy: (text: string) => void;
}) {
  const priorityStyle: Record<string, { label: string; cls: string }> = {
    high: { label: "최우선", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    medium: { label: "권장", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    low: { label: "보조", cls: "bg-stone-100 text-stone-700 border-stone-200" },
  };

  if (!channels || channels.length === 0) {
    return (
      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          추천 판매 채널
        </h4>
        <p className="text-sm text-slate-500 bg-stone-50 rounded-lg p-3">
          채널 추천 데이터가 없습니다.
        </p>
      </div>
    );
  }

  const allText = channels
    .map(
      (c) =>
        `[${c.channel}] (${priorityStyle[c.priority]?.label || c.priority || "권장"}) ${
          c.reasoning || ""
        }`,
    )
    .join("\n");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          추천 판매 채널
        </h4>
        <button
          type="button"
          onClick={() => onCopy(allText)}
          className="text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1"
        >
          <Copy className="w-3 h-3" /> 복사
        </button>
      </div>
      <div className="space-y-2">
        {channels.map((c, i) => {
          const p = priorityStyle[c.priority] || priorityStyle.medium;
          return (
            <div key={i} className="bg-stone-50 rounded-lg p-3 border border-stone-100">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.channel}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${p.cls}`}
                >
                  {p.label}
                </span>
              </div>
              {c.reasoning && (
                <p className="text-xs text-slate-600 leading-relaxed">{c.reasoning}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
