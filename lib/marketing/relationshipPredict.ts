// 고객 관계 예측(누가·언제·또 살까) — 순수 계산 로직.
// 주문 라인 데이터를 받아 고객 프로필·RFM·명절 재구매 패턴·세그먼트·재구매 점수·
// 다음 구매 시점을 산출한다. 브라우저에서 실행되어 PII는 서버로 전송되지 않는다.

export type OrderRow = Record<string, unknown>;

export interface CustomerProfile {
  nameMasked: string;
  phoneMasked: string;
  orders: number;
  firstDate: string;
  lastDate: string;
  recencyDays: number;
  total: number;
  aov: number;
  dominantSeason: "추석" | "설" | "평시" | null;
  channels: string[];
  segment: string;
  score: number;
  reasons: string[];
}

export interface SegmentSummary {
  key: string;
  label: string;
  count: number;
  share: number;
  desc: string;
  action: string;
  tone: "good" | "warn" | "info" | "neutral";
}

export interface NextPurchase {
  season: "추석" | "설";
  dateLabel: string;
  count: number;
}

export interface RelationshipResult {
  totalOrders: number;
  datedOrders: number;
  totalCustomers: number;
  phoneBasedCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  oneTimeRate: number;
  periodStart: string | null;
  periodEnd: string | null;
  channelMix: { name: string; count: number }[];
  freqDist: { label: string; count: number }[];
  segments: SegmentSummary[];
  scoreTiers: { label: string; count: number; tone: "good" | "warn" | "info" | "neutral" }[];
  nextPurchase: NextPurchase[];
  topCustomers: CustomerProfile[];
  dataLimits: string[];
}

// ── 컬럼 별칭 매핑 ──────────────────────────────────────────────
const ALIASES: Record<string, string[]> = {
  orderer: ["주문자", "주문자명", "구매자", "구매자명", "주문고객", "buyer", "customer"],
  phone: ["전화번호", "주문자전화", "주문자연락처", "연락처", "휴대폰", "phone", "tel"],
  orderDate: ["주문날짜", "주문일자", "주문일", "발주일자", "결제일", "주문일시", "date", "orderdate"],
  price: ["판매가", "결제금액", "주문금액", "금액", "총주문금액", "amount", "price"],
  product: ["제품명", "상품명", "품명", "product", "productname"],
  channel: ["쇼핑몰", "채널", "판매처", "판매채널", "마켓", "store", "channel"],
};

function norm(s: string): string {
  return String(s).replace(/\s|_|-/g, "").toLowerCase();
}

function resolveColumns(headers: string[]): Record<string, string | null> {
  const normMap = new Map(headers.map((h) => [norm(h), h]));
  const out: Record<string, string | null> = {};
  for (const [key, names] of Object.entries(ALIASES)) {
    let found: string | null = null;
    for (const n of names) {
      const hit = normMap.get(norm(n));
      if (hit) {
        found = hit;
        break;
      }
    }
    // 부분 일치 폴백
    if (!found) {
      for (const h of headers) {
        if (names.some((n) => norm(h).includes(norm(n)))) {
          found = h;
          break;
        }
      }
    }
    out[key] = found;
  }
  return out;
}

// ── 값 파서 ────────────────────────────────────────────────────
function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // Excel 직렬값 (1899-12-30 기준)
    if (v > 20000 && v < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  const s = String(v).trim().replace(/\./g, "-").replace(/\//g, "-");
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parsePrice(v: unknown): number {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function normPhone(v: unknown): string {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d : "";
}

function seasonOf(month: number): "추석" | "설" | "평시" {
  if (month === 8 || month === 9) return "추석";
  if (month === 12 || month === 1 || month === 2) return "설";
  return "평시";
}

function maskName(name: string): string {
  const t = name.trim();
  if (!t) return "(미상)";
  if (t.length <= 1) return t + "*";
  if (t.length === 2) return t[0] + "*";
  return t[0] + "*".repeat(t.length - 2) + t[t.length - 1];
}

function maskPhone(phone: string): string {
  if (!phone) return "—";
  const last4 = phone.slice(-4);
  const head = phone.length >= 10 ? phone.slice(0, 3) : phone.slice(0, 2);
  return `${head}-****-${last4}`;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Acc {
  name: string;
  phone: string;
  dates: Date[];
  total: number;
  channels: Set<string>;
  seasonYears: { 추석: Set<number>; 설: Set<number> };
}

// ── 메인 ───────────────────────────────────────────────────────
export function computeRelationship(rows: OrderRow[], now: Date = new Date()): RelationshipResult {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const col = resolveColumns(headers);

  const buyers = new Map<string, Acc>();
  let datedOrders = 0;
  const channelCount = new Map<string, number>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const row of rows) {
    const name = String((col.orderer ? row[col.orderer] : "") ?? "").trim();
    const phone = normPhone(col.phone ? row[col.phone] : "");
    const key = phone || (name ? "N:" + name : "");
    if (!key) continue;

    const d = parseDate(col.orderDate ? row[col.orderDate] : null);
    const price = parsePrice(col.price ? row[col.price] : 0);
    const channel = String((col.channel ? row[col.channel] : "") ?? "").trim() || "미상";
    channelCount.set(channel, (channelCount.get(channel) ?? 0) + 1);

    let acc = buyers.get(key);
    if (!acc) {
      acc = {
        name,
        phone,
        dates: [],
        total: 0,
        channels: new Set(),
        seasonYears: { 추석: new Set(), 설: new Set() },
      };
      buyers.set(key, acc);
    }
    if (!acc.name && name) acc.name = name;
    if (!acc.phone && phone) acc.phone = phone;
    acc.channels.add(channel);
    acc.total += price;
    if (d) {
      acc.dates.push(d);
      datedOrders++;
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
      const s = seasonOf(d.getMonth() + 1);
      if (s !== "평시") acc.seasonYears[s].add(d.getFullYear());
    }
  }

  const profiles: CustomerProfile[] = [];
  const freq: Record<number, number> = {};
  const seg: Record<string, number> = {};
  const tiers: Record<string, number> = {};
  let phoneBased = 0;
  const nextChu = { count: 0 };
  const nextSeol = { count: 0 };

  for (const acc of buyers.values()) {
    if (acc.dates.length === 0) continue;
    if (acc.phone) phoneBased++;
    acc.dates.sort((a, b) => a.getTime() - b.getTime());
    const n = acc.dates.length;
    const first = acc.dates[0];
    const last = acc.dates[n - 1];
    const recency = Math.floor((now.getTime() - last.getTime()) / 86400000);
    const aov = acc.total / n;
    const holidayLoyal =
      acc.seasonYears.추석.size >= 2 || acc.seasonYears.설.size >= 2;
    const chu = acc.seasonYears.추석.size;
    const seol = acc.seasonYears.설.size;
    const dominantSeason: "추석" | "설" | "평시" | null =
      chu === 0 && seol === 0 ? "평시" : chu >= seol ? "추석" : "설";

    // 또 살까 점수 (설명 가능 휴리스틱)
    const reasons: string[] = [];
    let score = 0;
    const fpt = Math.min(n, 5) * 12;
    score += fpt;
    reasons.push(`구매 ${n}회(+${fpt})`);
    if (recency <= 400) {
      score += 25;
      reasons.push("최근 1년 내 구매(+25)");
    } else if (recency <= 800) {
      score += 10;
      reasons.push("최근 2년 내 구매(+10)");
    } else {
      reasons.push("2년+ 미구매(+0)");
    }
    if (holidayLoyal) {
      score += 15;
      reasons.push("명절 반복 구매(+15)");
    }
    score = Math.min(100, score);

    // 세그먼트
    let segment: string;
    if (n === 1) segment = recency <= 400 ? "신규" : "휴면-1회";
    else if (holidayLoyal || n >= 3) segment = recency <= 400 ? "충성/명절단골" : "이탈위험-우량";
    else segment = recency <= 400 ? "성장(2회)" : "이탈위험-일반";
    seg[segment] = (seg[segment] ?? 0) + 1;

    freq[Math.min(n, 5)] = (freq[Math.min(n, 5)] ?? 0) + 1;

    const tier =
      score >= 80 ? "매우높음" : score >= 60 ? "높음" : score >= 40 ? "보통" : "낮음";
    tiers[tier] = (tiers[tier] ?? 0) + 1;

    // 다음 구매 시점 — 활성(최근 18개월) + 명절 성향
    if (recency <= 550 && dominantSeason && dominantSeason !== "평시") {
      if (dominantSeason === "추석") nextChu.count++;
      else nextSeol.count++;
    }

    profiles.push({
      nameMasked: maskName(acc.name),
      phoneMasked: maskPhone(acc.phone),
      orders: n,
      firstDate: fmtDate(first),
      lastDate: fmtDate(last),
      recencyDays: recency,
      total: Math.round(acc.total),
      aov: Math.round(aov),
      dominantSeason,
      channels: Array.from(acc.channels),
      segment,
      score,
      reasons,
    });
  }

  const totalCustomers = profiles.length;
  const repeatCustomers = profiles.filter((p) => p.orders >= 2).length;

  const segMeta: Record<
    string,
    { label: string; desc: string; action: string; tone: SegmentSummary["tone"] }
  > = {
    "충성/명절단골": {
      label: "충성 · 명절단골",
      desc: "다회·명절 반복 구매. 관계의 핵심 자산.",
      action: "다음 명절 D-30 사전 안내 + VIP 혜택·업셀(고가 세트)",
      tone: "good",
    },
    "성장(2회)": {
      label: "성장 (2회 활성)",
      desc: "최근 2회 구매. 충성으로 키울 잠재 고객.",
      action: "3번째 구매 유도 쿠폰 + 정기/구독 제안",
      tone: "info",
    },
    신규: {
      label: "신규 (최근 1회)",
      desc: "최근 첫 구매. 두 번째 구매가 관계 분기점.",
      action: "구매 후 30일 내 리뷰 요청 + 재구매 첫 혜택",
      tone: "info",
    },
    "이탈위험-우량": {
      label: "이탈위험 · 우량",
      desc: "과거 우량(다회/명절)인데 최근 이탈.",
      action: "윈백 우선순위 1순위 — 개인화 메시지 + 강한 혜택",
      tone: "warn",
    },
    "이탈위험-일반": {
      label: "이탈위험 · 일반",
      desc: "2회 구매 후 장기 미구매.",
      action: "다음 명절 시즌 리타겟 발송으로 재활성 시도",
      tone: "warn",
    },
    "휴면-1회": {
      label: "휴면 (1회·장기)",
      desc: "1회 구매 후 장기 미구매. 다수.",
      action: "저비용 대량 윈백(시즌 한정 혜택)으로 일부 재활성",
      tone: "neutral",
    },
  };

  const segments: SegmentSummary[] = Object.entries(seg)
    .map(([key, count]) => {
      const m = segMeta[key] ?? {
        label: key,
        desc: "",
        action: "",
        tone: "neutral" as const,
      };
      return {
        key,
        label: m.label,
        count,
        share: totalCustomers ? count / totalCustomers : 0,
        desc: m.desc,
        action: m.action,
        tone: m.tone,
      };
    })
    .sort((a, b) => b.count - a.count);

  const freqLabels: Record<number, string> = {
    1: "1회 (신규)",
    2: "2회",
    3: "3회",
    4: "4회",
    5: "5회+",
  };
  const freqDist = [1, 2, 3, 4, 5].map((k) => ({
    label: freqLabels[k],
    count: freq[k] ?? 0,
  }));

  const tierTone: Record<string, SegmentSummary["tone"]> = {
    매우높음: "good",
    높음: "good",
    보통: "info",
    낮음: "neutral",
  };
  const scoreTiers = ["매우높음", "높음", "보통", "낮음"].map((label) => ({
    label,
    count: tiers[label] ?? 0,
    tone: tierTone[label],
  }));

  // 다음 명절 라벨 계산
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const nextChuYear = m <= 9 ? y : y + 1;
  const nextSeolYear = m <= 2 ? y : y + 1;
  const nextPurchase: NextPurchase[] = [
    { season: "추석", dateLabel: `${nextChuYear}.09`, count: nextChu.count },
    { season: "설", dateLabel: `${nextSeolYear}.02`, count: nextSeol.count },
  ];

  const topCustomers = [...profiles]
    .sort((a, b) => b.score - a.score || b.total - a.total)
    .slice(0, 100);

  const dataLimits: string[] = [];
  if (!col.phone) dataLimits.push("전화번호 컬럼을 찾지 못해 이름으로만 고객을 식별했습니다(동명이인 합쳐질 수 있음).");
  else dataLimits.push("전화번호 결측 주문은 이름으로 식별했습니다(동명이인 주의).");
  if (!col.orderDate) dataLimits.push("주문일자 컬럼을 찾지 못해 시점·최근성 분석이 제한됩니다.");
  dataLimits.push("선물 비즈니스 특성상 구매자≠수취인일 수 있어, 본 분석은 '구매자(주문자)' 기준입니다.");
  dataLimits.push("'또 살까' 점수는 설명 가능한 휴리스틱(빈도·최근성·명절 충성)이며 확률 보장이 아닙니다.");
  if (maxDate && now.getTime() - maxDate.getTime() < 0) {
    dataLimits.push("미래 일자 데이터가 포함돼 있습니다(확인 필요).");
  }

  const channelMix = Array.from(channelCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalOrders: rows.length,
    datedOrders,
    totalCustomers,
    phoneBasedCustomers: phoneBased,
    repeatCustomers,
    repeatRate: totalCustomers ? repeatCustomers / totalCustomers : 0,
    oneTimeRate: totalCustomers ? (freq[1] ?? 0) / totalCustomers : 0,
    periodStart: minDate ? fmtDate(minDate) : null,
    periodEnd: maxDate ? fmtDate(maxDate) : null,
    channelMix,
    freqDist,
    segments,
    scoreTiers,
    nextPurchase,
    topCustomers,
    dataLimits,
  };
}
