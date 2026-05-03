// lib/fruit-utils.ts
// 과일 중심 운영 구조 — 비즈니스 로직

export type FruitPhase =
  | "upcoming"
  | "preparing"
  | "sourcing"
  | "marketing"
  | "in_season"
  | "peak"
  | "closing"
  | "completed"
  | "delayed";

export const PHASE_LABELS: Record<FruitPhase, string> = {
  upcoming:   "준비 전",
  preparing:  "준비 중",
  sourcing:   "소싱 중",
  marketing:  "마케팅 준비",
  in_season:  "판매 중",
  peak:       "피크",
  closing:    "마감",
  completed:  "완료",
  delayed:    "지연",
};

export const PHASE_COLORS: Record<FruitPhase, string> = {
  upcoming:   "bg-gray-100 text-gray-600",
  preparing:  "bg-blue-100 text-blue-700",
  sourcing:   "bg-blue-100 text-blue-700",
  marketing:  "bg-orange-100 text-orange-700",
  in_season:  "bg-green-100 text-green-700",
  peak:       "bg-green-200 text-green-800",
  closing:    "bg-amber-100 text-amber-700",
  completed:  "bg-gray-100 text-gray-500",
  delayed:    "bg-red-100 text-red-700",
};

export const PHASE_BAR_COLORS: Record<FruitPhase, string> = {
  upcoming:   "bg-gray-200",
  preparing:  "bg-blue-300",
  sourcing:   "bg-blue-500",
  marketing:  "bg-orange-400",
  in_season:  "bg-green-500",
  peak:       "bg-green-600",
  closing:    "bg-amber-400",
  completed:  "bg-gray-300",
  delayed:    "bg-red-500",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft:     "초안",
  planned:   "계획됨",
  active:    "진행 중",
  completed: "완료",
  delayed:   "지연",
};

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  planned:   "bg-blue-100 text-blue-700",
  active:    "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-500",
  delayed:   "bg-red-100 text-red-700",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  sourcing:  "소싱",
  pricing:   "가격",
  content:   "콘텐츠",
  sales:     "판매",
  review:    "리뷰",
};

export const TASK_TYPE_COLORS: Record<string, string> = {
  sourcing:  "bg-indigo-100 text-indigo-700",
  pricing:   "bg-cyan-100 text-cyan-700",
  content:   "bg-orange-100 text-orange-700",
  sales:     "bg-green-100 text-green-700",
  review:    "bg-purple-100 text-purple-700",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending:     "대기",
  in_progress: "진행 중",
  done:        "완료",
  delayed:     "지연",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  pending:     "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  done:        "bg-green-100 text-green-700",
  delayed:     "bg-red-100 text-red-700",
};

export const SEASON_LABELS: Record<string, string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
};

export const CHANNEL_LABELS: Record<string, string> = {
  coupang:      "쿠팡",
  marketkurly:  "마켓컬리",
  smartstore:   "스마트스토어",
  ssg:          "SSG닷컴",
  oasis:        "오아시스",
  direct:       "자사몰",
};

/**
 * 오늘 기준으로 캠페인 Phase 자동 판정
 */
export function getCampaignPhase(campaign: {
  status: string;
  sourcingStartDate: Date | null;
  pricingDueDate: Date | null;
  contentDueDate: Date | null;
  launchDate: Date | null;
  promoPeakStartDate: Date | null;
  promoPeakEndDate: Date | null;
  reviewDate: Date | null;
}): FruitPhase {
  if (campaign.status === "completed") return "completed";
  if (campaign.status === "delayed") return "delayed";

  const now = new Date();

  if (campaign.promoPeakEndDate && now > campaign.promoPeakEndDate) return "closing";
  if (campaign.promoPeakStartDate && now >= campaign.promoPeakStartDate) return "peak";
  if (campaign.launchDate && now >= campaign.launchDate) return "in_season";
  if (campaign.contentDueDate && now >= campaign.contentDueDate) return "marketing";
  if (campaign.sourcingStartDate && now >= campaign.sourcingStartDate) return "sourcing";
  if (campaign.sourcingStartDate && now < campaign.sourcingStartDate) return "preparing";

  return "upcoming";
}

/**
 * 과일의 seasonStart/End 월 기준으로 현재 제철 Phase 판정
 */
export function getFruitSeasonPhase(fruit: {
  seasonStartMonth: number;
  seasonEndMonth: number;
  peakStartMonth: number;
  peakEndMonth: number;
}): FruitPhase {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12

  const inRange = (start: number, end: number): boolean => {
    if (start <= end) return m >= start && m <= end;
    return m >= start || m <= end; // 연도 넘기는 경우 (e.g., 12~3)
  };

  if (inRange(fruit.peakStartMonth, fruit.peakEndMonth)) return "peak";
  if (inRange(fruit.seasonStartMonth, fruit.seasonEndMonth)) return "in_season";

  // 시즌 시작까지 남은 달
  const monthsToSeason = (() => {
    if (fruit.seasonStartMonth > m) return fruit.seasonStartMonth - m;
    return 12 - m + fruit.seasonStartMonth;
  })();

  if (monthsToSeason <= 2) return "preparing";
  return "upcoming";
}

/**
 * 태스크 중 지연(overdue)된 것이 있는지 확인
 */
export function hasDelayedTasks(tasks: { dueDate: Date | null; status: string }[]): boolean {
  const now = new Date();
  return tasks.some(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  );
}

/**
 * 리드타임 기반 소싱 시작일 계산
 */
export function calcSourcingStartDate(seasonStartDate: Date, sourcingLeadDays: number): Date {
  const d = new Date(seasonStartDate);
  d.setDate(d.getDate() - sourcingLeadDays);
  return d;
}

/**
 * 리드타임 기반 마케팅 시작일 계산
 */
export function calcMarketingStartDate(launchDate: Date, marketingLeadDays: number): Date {
  const d = new Date(launchDate);
  d.setDate(d.getDate() - marketingLeadDays);
  return d;
}

/**
 * 숫자를 한국 원 포맷으로
 */
export function formatKRW(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`;
  return `${amount.toLocaleString()}원`;
}

/**
 * 퍼센트 포맷
 */
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}
