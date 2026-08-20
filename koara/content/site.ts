/**
 * 사이트 전역 설정 · 네비게이션 · 기본 SEO 값
 *
 * 여기의 문자열만 바꾸면 전체 사이트의 메타데이터가 교체된다.
 * (Phase 2 에서 title / description 확정 예정)
 */

import { BRAND_EN } from "./types";

/**
 * 배포 도메인.
 * Vercel 프로젝트 환경변수 NEXT_PUBLIC_SITE_URL 에 실제 도메인을 넣으면
 * canonical / OG / sitemap.xml / robots.txt 가 모두 그 값을 따른다.
 * 도메인이 확정되지 않았으므로 임의의 주소를 하드코딩하지 않는다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const site = {
  brandEn: BRAND_EN,
  brandKo: "고아라",

  /** <title> 템플릿의 접미사 */
  titleSuffix: `고아라(${BRAND_EN})`,

  /** HOME title (Phase 2 수정 예정) */
  homeTitle: `고아라(${BRAND_EN}) | AI 이커머스 전문가`,

  /** HOME meta description (Phase 2 수정 예정) */
  homeDescription:
    `AI 이커머스 전문가 고아라(${BRAND_EN})의 공식 홈페이지. ` +
    "쇼핑몰 창업과 이커머스 현장에서 시작해 AI 검색·추천·쇼핑 에이전트·GEO·AI 마케팅·Vertical AI를 " +
    "연구하고 교육하며 만들어가는 프로젝트와 저서, 미디어 활동을 소개합니다.",

  locale: "ko_KR",
  lang: "ko",

  /**
   * 기본 OG 이미지.
   * 확정된 대표 이미지가 없으므로 Phase 1 에서는 사용하지 않는다.
   * public/og/default.png 를 추가한 뒤 "/og/default.png" 로 지정하면 전체에 적용된다.
   */
  defaultOgImage: "" as string,

  /** 검색엔진 소유확인 코드 (Phase 2) */
  verification: {
    google: "",
    naver: "",
  },
} as const;

/* ------------------------------------------------------------------ */
/* 상단 메뉴                                                            */
/* JOURNAL 메뉴는 만들지 않는다 (블로그형으로 운영하지 않음)             */
/* ------------------------------------------------------------------ */

export interface NavItem {
  labelEn: string;
  labelKo: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { labelEn: "HOME", labelKo: "홈", href: "/" },
  { labelEn: "STORY", labelKo: "스토리", href: "/story" },
  { labelEn: "VISION", labelKo: "비전", href: "/vision" },
  { labelEn: "BOOKS", labelKo: "저서", href: "/books" },
  { labelEn: "PROJECTS", labelKo: "프로젝트", href: "/projects" },
  { labelEn: "MEDIA", labelKo: "미디어", href: "/media" },
  { labelEn: "ABOUT", labelKo: "소개", href: "/about" },
];
