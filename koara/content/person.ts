/**
 * Person Entity — 사이트 전체의 정체성 원본 데이터
 *
 * ⚠️ 원칙
 * - 여기에 있는 값만 사실로 취급한다.
 * - 경력 / 수상 / 성과 / 기관 관계를 임의로 추가하지 않는다.
 * - channels 의 url 이 "" 이고 verified 가 false 인 항목은
 *   JSON-LD sameAs 에 출력되지 않는다.
 * - organizations 의 emitToSchema 가 true 가 되기 전까지
 *   affiliation / worksFor / memberOf 는 구조화 데이터에 나가지 않는다.
 */

import type { PersonEntity } from "./types";
import { BRAND_EN } from "./types";

export const person: PersonEntity = {
  name: "고아라",
  alternateName: BRAND_EN,
  positioning: `AI 이커머스 전문가 고아라`,
  jobTitle: "명지대학교 테크노아트대학원 AI 이커머스학과 주임교수",
  primaryExpertise: "AI 이커머스",

  intro:
    "쇼핑몰 창업과 이커머스 현장에서 시작해 " +
    "AI가 검색·추천·마케팅·판매와 비즈니스를 어떻게 변화시키는지 " +
    "연구하고 교육합니다.",

  background: ["쇼핑몰 창업", "이커머스", "온라인 마케팅"],

  currentAreas: [
    "AI 검색",
    "AI 추천",
    "AI 쇼핑 에이전트",
    "GEO",
    "AI 마케팅",
    "Vertical AI",
  ],

  /**
   * 공식 외부 채널.
   * Phase 2 에서 공식 URL 을 넣고 verified 를 true 로 바꾸면
   * MEDIA 카드 링크와 JSON-LD sameAs 에 동시에 반영된다.
   */
  channels: [
    { label: "한국쇼핑몰신문", kind: "media", url: "", verified: false },
    { label: "AI에이전트타임즈", kind: "media", url: "", verified: false },
    { label: "AI 이커머스학과 교수칼럼", kind: "column", url: "", verified: false },
    { label: "YouTube", kind: "video", url: "", verified: false },
    { label: "Threads", kind: "social", url: "", verified: false },
    { label: "Instagram", kind: "social", url: "", verified: false },
  ],

  /**
   * 기관 관계 — Phase 1 에서는 "구조만" 만든다.
   * 공식 URL 과 사실관계가 확인된 뒤 emitToSchema 를 true 로 바꾼다.
   */
  organizations: {
    affiliation: [],
    worksFor: [],
    memberOf: [],
  },

  /** 공개를 원하는 연락 수단이 확정되면 입력 (민감 개인정보는 넣지 않는다) */
  publicContactEmail: "",
};

/** JSON-LD sameAs 에 실제로 내보낼 수 있는 URL 목록 */
export function verifiedSameAs(): string[] {
  return person.channels
    .filter((c) => c.verified && c.url.trim() !== "")
    .map((c) => c.url);
}
