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

// ───────────────────────── 스마트스토어 리포트 파서 ─────────────────────────
// 스마트스토어 export는 "리포트 종류별"로 형태가 다르다(상품성과/판매성과/마케팅채널/
// 인구통계/지역/결혼상태). 종류를 헤더로 판별해 하나의 '스마트스토어' 채널로 집계한다.
// 매출=결제금액−환불금액(판매처에만), 어트리뷰션=마케팅채널 기여도추정(매출 합산 X),
// 기여이익=net−원가−수수료−광고비(원가율/수수료율은 입력값), 세그먼트는 요약문으로 환산.

type SSType =
  | "product" // 상품성과
  | "sales" // 판매성과
  | "marketing" // 상품_마케팅채널
  | "demographic" // 상품_인구통계
  | "region" // 상품_지역
  | "marital"; // 상품_고객프로파일_결혼상태

export interface CostAssumptions {
  cogsRate?: number; // 원가율(%) — 파일에 없어 입력값
  feeRate?: number; // 채널 수수료율(%) — 파일에 없어 입력값
  adCost?: number; // 광고비(원) — 있으면 MER·기여이익에 반영
}

function ssKeys(rows: Row[]): string[] {
  return rows.length ? Object.keys(rows[0]) : [];
}
function hasCol(keys: string[], sub: string): boolean {
  return keys.some((k) => k.includes(sub));
}

// 헤더로 리포트 종류 판별(상품성과는 다른 종류와 컬럼이 겹쳐 가장 마지막에 검사).
export function detectSmartStoreType(rows: Row[]): SSType | null {
  const k = ssKeys(rows);
  if (!k.length) return null;
  if (hasCol(k, "날짜") && hasCol(k, "시간대") && hasCol(k, "결제자수")) return "sales";
  if (hasCol(k, "채널그룹") || (hasCol(k, "채널명") && hasCol(k, "기여"))) return "marketing";
  if (hasCol(k, "성별") && hasCol(k, "나이")) return "demographic";
  if (hasCol(k, "지역(대)") || hasCol(k, "지역(소)")) return "region";
  if (hasCol(k, "결혼상태")) return "marital";
  if (hasCol(k, "상품명") && hasCol(k, "결제금액") && hasCol(k, "환불금액")) return "product";
  return null;
}

// 정확 매칭 우선, 없으면 포함 매칭(모바일비율(결제금액) 등 오매칭 방지).
function ssNum(row: Row, name: string): number {
  const keys = Object.keys(row);
  const key = keys.find((x) => x.trim() === name) ?? keys.find((x) => x.includes(name));
  return key ? (toNumber(row[key]) ?? 0) : 0;
}
function ssStr(row: Row, name: string): string | undefined {
  const keys = Object.keys(row);
  const key = keys.find((x) => x.trim() === name) ?? keys.find((x) => x.includes(name));
  if (!key) return undefined;
  const v = row[key];
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

// 결제금액 비중 상위 N개 요약(세그먼트 → 해석용 문장).
function topShareNote(
  rows: Row[],
  label: (r: Row) => string | undefined,
  prefix: string,
  topN = 3,
): string | undefined {
  const map = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    const key = label(r);
    if (!key) continue;
    const amt = ssNum(r, "결제금액");
    if (amt <= 0) continue;
    map.set(key, (map.get(key) ?? 0) + amt);
    total += amt;
  }
  if (total <= 0) return undefined;
  const parts = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k, v]) => `${k} ${Math.round((v / total) * 100)}%`);
  return parts.length ? `${prefix}: ${parts.join(" · ")}` : undefined;
}

interface SSResult {
  channel?: ChannelMetric;
  attribution: AttributionRow[];
  notes: string[];
  period?: { start?: string; end?: string };
}

function buildSmartStore(
  reports: { type: SSType; rows: Row[] }[],
  a: CostAssumptions,
): SSResult {
  const rowsOf = (t: SSType) =>
    reports.filter((r) => r.type === t).flatMap((r) => r.rows);
  const productRows = rowsOf("product");
  const salesRows = rowsOf("sales");
  const mktRows = rowsOf("marketing");

  const attribution: AttributionRow[] = [];
  const notes: string[] = [];
  let channel: ChannelMetric | undefined;
  let period: { start?: string; end?: string } | undefined;

  // ── 상품성과 → 채널 집계 + topSkus ──────────────────────────────────────────
  if (productRows.length) {
    let gross = 0,
      refund = 0,
      orders = 0;
    const skus = new Map<
      string,
      { name: string; gross: number; refund: number; orders: number }
    >();
    for (const row of productRows) {
      const name = ssStr(row, "상품명") ?? "(미상)";
      const g = ssNum(row, "결제금액");
      const rf = ssNum(row, "환불금액");
      const od = ssNum(row, "결제수");
      gross += g;
      refund += rf;
      orders += od;
      const cur = skus.get(name) ?? { name, gross: 0, refund: 0, orders: 0 };
      cur.gross += g;
      cur.refund += rf;
      cur.orders += od;
      skus.set(name, cur);
    }
    const net = gross - refund;
    const cogsRate = a.cogsRate;
    const feeRate = a.feeRate;
    const adCost = a.adCost ?? 0;
    const hasCost = cogsRate != null || feeRate != null;
    const cp = (n: number, g: number) =>
      Math.round(n - n * ((cogsRate ?? 0) / 100) - g * ((feeRate ?? 0) / 100));
    const contributionProfit = hasCost ? cp(net, gross) - adCost : undefined;

    const topSkus = [...skus.values()]
      .map((s) => ({
        name: s.name,
        netRevenue: s.gross - s.refund,
        orders: s.orders,
        refundRate: s.gross ? Math.round((s.refund / s.gross) * 1000) / 10 : undefined,
        contributionProfit: hasCost ? cp(s.gross - s.refund, s.gross) : undefined,
      }))
      .sort((x, y) => y.netRevenue - x.netRevenue)
      .slice(0, 8);

    channel = {
      name: "스마트스토어",
      role: "destination",
      netRevenue: net,
      orders,
      aov: orders ? Math.round(gross / orders) : undefined,
      refundRate: gross ? Math.round((refund / gross) * 1000) / 10 : undefined,
      feeRate: feeRate,
      cogsRate: cogsRate,
      contributionProfit,
      contributionMargin:
        contributionProfit != null && net
          ? Math.round((contributionProfit / net) * 1000) / 10
          : undefined,
      adCost: adCost || undefined,
      topSkus,
      note: hasCost
        ? "기여이익=결제금액−환불−원가−수수료−광고비(원가율·수수료율은 입력 가정값)"
        : "원가율·수수료율 미입력 → 기여이익 미산출(매출·환불만)",
    };
  }

  // ── 판매성과 → 기간(날짜 min~max) + 요일/시간 패턴 ──────────────────────────
  if (salesRows.length) {
    const dates = salesRows
      .map((r) => ssStr(r, "날짜"))
      .filter((d): d is string => !!d)
      .sort();
    if (dates.length) period = { start: dates[0], end: dates[dates.length - 1] };

    const byDow = new Map<string, number>();
    const byHour = new Map<string, number>();
    for (const r of salesRows) {
      const amt = ssNum(r, "결제금액");
      const dow = ssStr(r, "요일");
      const hour = ssStr(r, "시간대");
      if (dow) byDow.set(dow, (byDow.get(dow) ?? 0) + amt);
      if (hour) byHour.set(hour, (byHour.get(hour) ?? 0) + amt);
    }
    const top = (m: Map<string, number>) =>
      [...m.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
    const tD = top(byDow);
    const tH = top(byHour);
    if (tD || tH)
      notes.push(
        `매출 집중: ${[tD && `${tD}요일`, tH].filter(Boolean).join(" · ")}`,
      );
  }

  // ── 마케팅채널 → 어트리뷰션(기여도추정, 매출 합산 금지) ─────────────────────
  if (mktRows.length) {
    const map = new Map<string, number>();
    for (const row of mktRows) {
      const ch = ssStr(row, "채널명") ?? ssStr(row, "채널그룹") ?? "(미식별)";
      map.set(ch, (map.get(ch) ?? 0) + ssNum(row, "결제금액"));
    }
    for (const [ch, amt] of [...map.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 8)) {
      if (amt <= 0) continue;
      attribution.push({
        channel: ch === "(알수없음)" ? "(미식별 유입)" : ch,
        contributionRevenue: Math.round(amt),
        model: "스마트스토어 14일 기여도추정",
      });
    }
  }

  // ── 세그먼트 → 요약문(결혼상태/인구통계/지역) ──────────────────────────────
  const marital = rowsOf("marital");
  if (marital.length) {
    const n = topShareNote(marital, (r) => ssStr(r, "결혼상태"), "결혼상태(결제금액)", 2);
    if (n) notes.push(`${n} — 선물수요 신호`);
  }
  const demo = rowsOf("demographic");
  if (demo.length) {
    const n = topShareNote(
      demo,
      (r) => {
        const g = ssStr(r, "성별");
        const age = ssStr(r, "나이");
        return g && age ? `${g} ${age}` : (g ?? age);
      },
      "주 구매층",
      3,
    );
    if (n) notes.push(n);
  }
  const region = rowsOf("region");
  if (region.length) {
    const n = topShareNote(region, (r) => ssStr(r, "지역(대)"), "상위 지역", 3);
    if (n) notes.push(n);
  }

  return { channel, attribution, notes, period };
}

// ───────────────────────── 메인: 파일들 → PerfRequest ─────────────────────────
export interface ComputeOptions {
  period?: { start?: string; end?: string };
  comparison?: PerfRequest["comparison"];
  objectives?: PerfRequest["objectives"];
  skuMappingPresent?: boolean;
  businessNote?: string;
  // 기여이익·MER 계산용 가정값(파일에 없는 원가율/수수료율/광고비). 스마트스토어 경로에서 사용.
  assumptions?: CostAssumptions;
}

export async function computeMetricsFromFiles(
  files: File[],
  opts: ComputeOptions = {},
): Promise<PerfRequest> {
  // 1) 파일 파싱 + 스마트스토어 리포트 종류 판별
  const parsed: { type: SSType | null; rows: Row[] }[] = [];
  for (const file of files) {
    const rows = await parseFileToRows(file);
    parsed.push({ type: detectSmartStoreType(rows), rows });
  }

  const channelsByName = new Map<string, ChannelMetric>();
  const attribution: AttributionRow[] = [];
  const segmentNotes: string[] = [];
  let derivedPeriod: { start?: string; end?: string } | undefined;

  // 2) 스마트스토어 리포트가 있으면 전용 경로로 '스마트스토어' 채널 집계
  const ssReports = parsed
    .filter((p): p is { type: SSType; rows: Row[] } => p.type != null);
  if (ssReports.length) {
    const ss = buildSmartStore(ssReports, opts.assumptions ?? {});
    if (ss.channel) channelsByName.set(ss.channel.name, ss.channel);
    attribution.push(...ss.attribution);
    segmentNotes.push(...ss.notes);
    derivedPeriod = ss.period;
  }

  // 3) 스마트스토어가 아닌 파일은 기존 tidy(행=채널) 매칭으로 수용(카페24 등)
  for (const { type, rows } of parsed) {
    if (type) continue;
    for (const row of rows) {
      const { channel, attribution: attr } = rowToChannel(row);
      if (attr && (attr.contributionRevenue != null || attr.model)) attribution.push(attr);
      if (channel) {
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

  const period = opts.period?.start ? opts.period : derivedPeriod;
  const businessNote = [opts.businessNote, ...segmentNotes]
    .filter((s): s is string => !!s && s.trim() !== "")
    .join(" / ") || undefined;

  return {
    period,
    seasonFlag: deriveSeasonFlag(period?.start, period?.end),
    comparison: opts.comparison ?? "YoY",
    objectives: opts.objectives ?? ["diagnosis", "acquisition", "retention"],
    channels,
    attribution,
    blendedRoas,
    skuMappingPresent: opts.skuMappingPresent ?? false,
    businessNote,
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
