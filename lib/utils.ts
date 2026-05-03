import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const JOURNEY_STEPS: Record<string, string> = {
  discovery: "발견",
  consideration: "고려",
  purchase: "구매",
  fulfillment: "이행",
  post_purchase: "구매 후",
  retention: "재구매",
};

export const CHANNELS: Record<string, string> = {
  smartstore: "스마트스토어",
  coupang: "쿠팡",
  marketkurly: "마켓컬리",
  ssg: "SSG닷컴",
  oasis: "오아시스마켓",
  direct: "직거래",
  offline: "오프라인",
  other: "기타",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  collecting: "수집 중",
  analyzing: "분석 중",
  review: "검토 중",
  completed: "완료",
  active: "활성",
  paused: "일시정지",
  archived: "보관",
};

export const PRIORITY_LABELS: Record<string, string> = {
  critical: "긴급",
  high: "높음",
  medium: "중간",
  low: "낮음",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  collecting: "bg-blue-100 text-blue-700",
  analyzing: "bg-purple-100 text-purple-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-gray-100 text-gray-700",
  archived: "bg-gray-100 text-gray-500",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function apiError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
