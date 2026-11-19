/**
 * STORY 데이터
 *
 * ⚠️ Phase 1: 긴 본문을 임의로 작성하지 않는다.
 *   - 카드 제목
 *   - 짧은 placeholder 설명
 *   - 상세 페이지 기본 레이아웃(섹션 뼈대)
 * 까지만 만든다. sections[].paragraphs 가 비어 있으면
 * 화면에는 "원고 준비 중" placeholder 가 렌더된다.
 *
 * Phase 2: paragraphs 를 실제 원고로 채우고 isPlaceholder 를 false 로 바꾼다.
 * (MDX 로 옮기고 싶다면 이 파일의 로더만 교체하면 된다.)
 */

import type { Story } from "../types";

/** 모든 STORY 가 공유하는 기본 섹션 뼈대 */
const outline = (): Story["sections"] => [
  { heading: "시작", paragraphs: [] },
  { heading: "과정", paragraphs: [] },
  { heading: "지금", paragraphs: [] },
];

export const stories: Story[] = [
  {
    slug: "ai-ecommerce-department",
    title: "AI 이커머스학과를 만들기까지",
    summary: "원고 준비 중입니다.",
    lead: "",
    sections: outline(),
    featured: true,
    isPlaceholder: true,
  },
  {
    slug: "why-i-build-organizations",
    title: "왜 나는 필요한 조직을 먼저 만드는가",
    summary: "원고 준비 중입니다.",
    lead: "",
    sections: outline(),
    featured: true,
    isPlaceholder: true,
  },
  {
    slug: "why-vertical-ai",
    title: "왜 Vertical AI인가",
    summary: "원고 준비 중입니다.",
    lead: "",
    sections: outline(),
    featured: true,
    isPlaceholder: true,
  },
];

export function getAllStories(): Story[] {
  return stories;
}

export function getFeaturedStories(): Story[] {
  return stories.filter((s) => s.featured);
}

export function getStoryBySlug(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}
