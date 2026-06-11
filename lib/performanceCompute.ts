// lib/performanceCompute.ts
// ★ 계산은 코드 — 업로드된 CSV/xlsx를 "브라우저에서" 파싱해 metrics(PerfRequest)로 환산한다.
//   결과 metrics만 /api/analyze-performance로 POST한다. raw CSV는 서버/LLM에 보내지 않는다.
// 매핑 근거: INTEGRATION.md §3 (카페24 CSV 컬럼 → metrics), §4 (시즌·통합 가드).
// 핵심 규칙:
//   - 매출(netRevenue)은 판매처(role='destination')에만. 어트리뷰션은 role='ad'로 기여만.
//   - 기여이익 = 순매출 − 원가 − 채널수수료 − 광고비 − 할인/포인트.
//   - blendedRoas(MER) = Σ(판매처 순매출) ÷ Σ(광고비).
//
// 입력 파일은 한 행이 한 채널인 "정리된(tidy)" CSV/xlsx를 1차 지원한다.
// (자사몰/스마트스토어/카카오 원시 export는 형태가 제각각이라, compute는 헤더 별칭 매칭으로
//  최대한 수용하되, 매핑 안 된 컬럼은 무시한다. 정확도의 90%는 이 매핑 단계에서 결정된다.)

import type {
  AttributionRow,
  ChannelMetric,
  ChannelRole,
  PerfRequest,
  SeasonFlag,
} from "@/lib/performanceTypes";

// ───────────────────────── 파일 → 행 파싱 (브라우저) ─────────────────────────
export type Row = Record<string, unknown>;

export async function parseFileToRows(file: File): Promise<Row[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const first = wb.SheetNames[0];
    if (!first) return [];
    const ws = wb.Sheets[first];
    return XLSX.utils.sheet_to_json<Row>(ws, { defval: null });
  }
  // CSV (기본)
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  const parsed = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return (parsed.data ?? []).filter((r) => r && typeof r === "object");
}

// ───────────────────────── 값 정규화 ─────────────────────────
// "1,234,000원", "₩1234000", "12.5%", "  3000 " 등을 숫자로.
export function toNumber(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const s = String(v).replace(/[,₩\s%원]/g, "").trim();
  if (s === "" || s === "-") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

// 헤더 별칭 매칭: 후보 키워드가 컬럼명에 "포함"되면 그 값을 채택.
function pick(row: Row, aliases: string[]): unknown {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const a = alias.toLowerCase();
    const hit = keys.find((k) => k.toLowerCase().includes(a));
    if (hit != null) return row[hit];
  }
  return undefined;
}

function pickNumber(row: Row, aliases: string[]): number | undefined {
  return toNumber(pick(row, aliases));
}

function pickString(row: Row, aliases: string[]): string | undefined {
  const v = pick(row, aliases);
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

// ───────────────────────── 채널 role 추론 ─────────────────────────
// 판매처(매출 발생) vs 광고/유입(비용·기여). 명시 role 컬럼 우선, 없으면 채널명 휴리스틱.
const AD_HINTS = [
  "광고",
  "ads",
  "ad",
  "gfa",
  "검색광고",
  "쇼핑검색",
  "메타",
  "페이스북",
  "facebook",
  "instagram",
  "구글",
  "google",
  "유튜브",
  "youtube",
  "어트리뷰션",
  "attribution",
];

function inferRole(name: string, explicit?: string): ChannelRole {
  const e = (explicit ?? "").toLowerCase();
  if (e.includes("destination") || e.includes("판매") || e.includes("sell")) {
    return "destination";
  }
  if (e.includes("ad") || e.includes("광고") || e.includes("attribution")) {
    return "ad";
  }
  const n = name.toLowerCase();
  return AD_HINTS.some((h) => n.includes(h)) ? "ad" : "destination";
}

// ───────────────────────── 행 → ChannelMetric / AttributionRow ─────────────────────────
function rowToChannel(row: Row): { channel?: ChannelMetric; attribution?: AttributionRow } {
  const name = pickString(row, ["채널", "channel", "판매처", "매체", "유입"]) ?? "미지정";
  const explicitRole = pickString(row, ["role", "구분", "유형"]);
  const role = inferRole(name, explicitRole);

  // 어트리뷰션(광고/유입) — 기여매출만, netRevenue로 합산 금지
  if (role === "ad") {
    const contributionRevenue = pickNumber(row, [
      "기여매출",
      "기여 매출",
      "contribution",
      "전환매출",
      "conv",
    ]);
    const adCost = pickNumber(row, ["광고비", "비용", "adcost", "cost", "spend"]);
    const attribution: AttributionRow = {
      channel: name,
      contributionRevenue,
      model: pickString(row, ["모델", "model", "기준"]),
    };
    // 광고채널의 광고비는 별도 채널행으로도 보존(블렌디드 ROAS 분모용)
    const channel: ChannelMetric | undefined =
      adCost != null
        ? { name, role: "ad", adCost, note: "광고/유입 채널(비용·기여)" }
        : undefined;
    return { channel, attribution };
  }

  // 판매처(destination)
  const netRevenue = pickNumber(row, [
    "순매출",
    "net",
    "결제금액",
    "결제합계",
    "매출액",
    "매출",
    "revenue",
    "order_amount",
    "결제완료금액",
  ]);
  const orders = pickNumber(row, ["주문수", "주문건수", "건수", "orders", "order_count"]);
  const refundRate = normalizeRate(pickNumber(row, ["환불률", "반품률", "refund"]));
  const feeRate = normalizeRate(pickNumber(row, ["수수료율", "수수료", "fee"]));
  const cogsRate = normalizeRate(pickNumber(row, ["원가율", "원가", "cogs", "cost_rate"]));
  const adCost = pickNumber(row, ["광고비", "adcost", "ad_spend"]);
  const discount = pickNumber(row, ["할인", "쿠폰", "적립", "포인트", "discount", "point"]);
  let contributionProfit = pickNumber(row, ["기여이익", "공헌이익", "contribution_profit"]);

  // AOV: 명시값 없으면 순매출 ÷ 주문수
  let aov = pickNumber(row, ["객단가", "aov", "avg_order"]);
  if (aov == null && netRevenue != null && orders) aov = Math.round(netRevenue / orders);

  // 기여이익 미제공 시 계산: 순매출 − 원가 − 채널수수료 − 광고비 − 할인/포인트
  if (contributionProfit == null && netRevenue != null) {
    const cogs = cogsRate != null ? netRevenue * cogsRate : 0;
    const fee = feeRate != null ? netRevenue * feeRate : 0;
    const hasCostInput =
      cogsRate != null || feeRate != null || adCost != null || discount != null;
    if (hasCostInput) {
      contributionProfit = Math.round(
        netRevenue - cogs - fee - (adCost ?? 0) - (discount ?? 0),
      );
    }
  }
  const contributionMargin =
    contributionProfit != null && netRevenue
      ? Math.round((contributionProfit / netRevenue) * 1000) / 10
      : undefined;

  const channel: ChannelMetric = {
    name,
    role: "destination",
    netRevenue,
    orders,
    aov,
    refundRate,
    feeRate: feeRate != null ? Math.round(feeRate * 1000) / 10 : undefined, // %로 저장
    cogsRate: cogsRate != null ? Math.round(cogsRate * 1000) / 10 : undefined,
    contributionProfit,
    contributionMargin,
    adCost,
    reportedRoas: pickNumber(row, ["roas"]),
    newBuyerRatio: normalizeRate(pickNumber(row, ["신규", "newbuyer", "new_ratio"]), true),
    repurchaseRate: normalizeRate(pickNumber(row, ["재구매", "repurchase", "retention"]), true),
  };
  return { channel };
}

// 비율 정규화: 12.5(%) 또는 0.125 둘 다 받아 0~1 소수로. asPercent=true면 %값으로 반환.
function normalizeRate(v: number | undefined, asPercent = false): number | undefined {
  if (v == null) return undefined;
  const frac = v > 1 ? v / 100 : v;
  return asPercent ? Math.round(frac * 1000) / 10 : frac;
}

// ───────────────────────── 시즌 플래그 ─────────────────────────
// 명절(설 1~2월 / 추석 9~10월) 포함이면 peak, 그 외 비수기는 offpeak, 섞이면 mixed.
export function deriveSeasonFlag(start?: string, end?: string): SeasonFlag {
  const months = monthsInRange(start, end);
  if (months.length === 0) return "mixed";
  const isPeak = (m: number) => m === 1 || m === 2 || m === 9 || m === 10;
  const peak = months.some(isPeak);
  const off = months.some((m) => !isPeak(m));
  if (peak && off) return "mixed";
  return peak ? "peak" : "offpeak";
}

function monthsInRange(start?: string, end?: string): number[] {
  if (!start) return [];
  const s = new Date(start);
  const e = end ? new Date(end) : s;
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return [];
  const out: number[] = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), 1);
  while (cur <= e && out.length < 24) {
    out.push(cur.getMonth() + 1);
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

// ───────────────────────── 메인: 파일들 → PerfRequest ─────────────────────────
export interface ComputeOptions {
  period?: { start?: string; end?: string };
  comparison?: PerfRequest["comparison"];
  objectives?: PerfRequest["objectives"];
  skuMappingPresent?: boolean;
  businessNote?: string;
}

export async function computeMetricsFromFiles(
  files: File[],
  opts: ComputeOptions = {},
): Promise<PerfRequest> {
  const channelsByName = new Map<string, ChannelMetric>();
  const attribution: AttributionRow[] = [];

  for (const file of files) {
    const rows = await parseFileToRows(file);
    for (const row of rows) {
      const { channel, attribution: attr } = rowToChannel(row);
      if (attr && (attr.contributionRevenue != null || attr.model)) {
        attribution.push(attr);
      }
      if (channel) {
        // 같은 채널이 여러 행/파일로 들어오면 합산(수치형) — 마지막 비율값은 유지
        const prev = channelsByName.get(channel.name);
        channelsByName.set(channel.name, prev ? mergeChannel(prev, channel) : channel);
      }
    }
  }

  const channels = Array.from(channelsByName.values());

  // blendedRoas(MER) = Σ(판매처 순매출) ÷ Σ(광고비)
  const totalNet = channels
    .filter((c) => c.role === "destination")
    .reduce((s, c) => s + (c.netRevenue ?? 0), 0);
  const totalAd = channels.reduce((s, c) => s + (c.adCost ?? 0), 0);
  const blendedRoas =
    totalAd > 0 ? Math.round((totalNet / totalAd) * 100) / 100 : undefined;

  return {
    period: opts.period,
    seasonFlag: deriveSeasonFlag(opts.period?.start, opts.period?.end),
    comparison: opts.comparison ?? "YoY",
    objectives: opts.objectives ?? ["diagnosis", "acquisition", "retention"],
    channels,
    attribution,
    blendedRoas,
    skuMappingPresent: opts.skuMappingPresent ?? false,
    businessNote: opts.businessNote,
  };
}

function mergeChannel(a: ChannelMetric, b: ChannelMetric): ChannelMetric {
  const sum = (x?: number, y?: number) =>
    x == null && y == null ? undefined : (x ?? 0) + (y ?? 0);
  return {
    ...a,
    netRevenue: sum(a.netRevenue, b.netRevenue),
    orders: sum(a.orders, b.orders),
    adCost: sum(a.adCost, b.adCost),
    contributionProfit: sum(a.contributionProfit, b.contributionProfit),
    // 비율·AOV·기타 단일값은 b가 있으면 b 우선, 없으면 a 유지
    aov: b.aov ?? a.aov,
    refundRate: b.refundRate ?? a.refundRate,
    feeRate: b.feeRate ?? a.feeRate,
    cogsRate: b.cogsRate ?? a.cogsRate,
    contributionMargin: b.contributionMargin ?? a.contributionMargin,
    newBuyerRatio: b.newBuyerRatio ?? a.newBuyerRatio,
    repurchaseRate: b.repurchaseRate ?? a.repurchaseRate,
    reportedRoas: b.reportedRoas ?? a.reportedRoas,
  };
}
