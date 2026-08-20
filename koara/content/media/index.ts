/**
 * MEDIA 데이터 — 외부 채널 링크 카드
 *
 * 원칙
 * - 외부 콘텐츠 전문을 개인 홈페이지에 복제하지 않는다.
 * - 요약 + 원문 링크 중심으로 연결한다.
 * - 실시간 API 연동은 하지 않는다 (Phase 1 은 링크 카드).
 *
 * externalUrl 이 "" 이면 카드가 "링크 준비 중" 상태로 렌더되고
 * 앵커가 아니라 비활성 블록으로 출력된다.
 *
 * Phase 2 에서 채울 값: date / description / externalUrl
 */

import type { MediaItem, MediaType } from "../types";

export const mediaTypeMeta: Record<
  MediaType,
  { labelEn: MediaType; labelKo: string; description: string }
> = {
  COLUMN: {
    labelEn: "COLUMN",
    labelKo: "칼럼",
    description: "직접 쓴 칼럼과 기고.",
  },
  EDUCATION: {
    labelEn: "EDUCATION",
    labelKo: "교육",
    description: "강의·교육 과정과 관련된 외부 페이지.",
  },
  VIDEO: {
    labelEn: "VIDEO",
    labelKo: "영상",
    description: "영상으로 공개한 내용.",
  },
  SOCIAL: {
    labelEn: "SOCIAL",
    labelKo: "소셜",
    description: "짧은 형식으로 기록하는 채널.",
  },
  MEDIA: {
    labelEn: "MEDIA",
    labelKo: "미디어",
    description: "언론·전문 매체 채널.",
  },
};

/** 화면에 노출할 분류 순서 */
export const mediaTypeOrder: MediaType[] = [
  "COLUMN",
  "MEDIA",
  "EDUCATION",
  "VIDEO",
  "SOCIAL",
];

export const mediaItems: MediaItem[] = [
  {
    id: "korea-shoppingmall-news",
    title: "한국쇼핑몰신문",
    channel: "한국쇼핑몰신문",
    type: "MEDIA",
    date: "",
    description: "",
    externalUrl: "",
  },
  {
    id: "ai-agent-times",
    title: "AI에이전트타임즈",
    channel: "AI에이전트타임즈",
    type: "MEDIA",
    date: "",
    description: "",
    externalUrl: "",
  },
  {
    id: "professor-column",
    title: "AI 이커머스학과 교수칼럼",
    channel: "AI 이커머스학과",
    type: "COLUMN",
    date: "",
    description: "",
    externalUrl: "",
  },
  {
    id: "youtube",
    title: "YouTube",
    channel: "YouTube",
    type: "VIDEO",
    date: "",
    description: "",
    externalUrl: "",
  },
  {
    id: "threads",
    title: "Threads",
    channel: "Threads",
    type: "SOCIAL",
    date: "",
    description: "",
    externalUrl: "",
  },
  {
    id: "instagram",
    title: "Instagram",
    channel: "Instagram",
    type: "SOCIAL",
    date: "",
    description: "",
    externalUrl: "",
  },
];

export function getAllMedia(): MediaItem[] {
  return mediaItems;
}

export function getMediaByType(type: MediaType): MediaItem[] {
  return mediaItems.filter((m) => m.type === type);
}

/** HOME 의 FOLLOW 섹션에서 사용하는 소셜·영상 채널 */
export function getFollowChannels(): MediaItem[] {
  return mediaItems.filter((m) => m.type === "SOCIAL" || m.type === "VIDEO");
}
