/**
 * 콘텐츠 데이터 모델 (Phase 1)
 *
 * UI 컴포넌트는 이 타입만 의존한다.
 * 향후 CMS(Contentful / Sanity / Notion / MDX 등)를 붙일 때
 * content/* 의 로더만 교체하면 화면은 그대로 동작하도록 설계했다.
 */

/** 브랜드 영문 표기는 어디서든 정확히 "KO A RA" 여야 한다. */
export const BRAND_EN = "KO A RA" as const;

/* ------------------------------------------------------------------ */
/* Person Entity                                                       */
/* ------------------------------------------------------------------ */

/**
 * 외부 공식 채널.
 * url 이 확정되기 전까지는 빈 문자열로 두고, JSON-LD `sameAs` 에서 제외한다.
 * (검증되지 않은 관계를 구조화 데이터에 넣지 않기 위함)
 */
export interface OfficialChannel {
  /** 화면에 노출되는 채널 이름 */
  label: string;
  /** 채널 분류 */
  kind: "media" | "social" | "video" | "column" | "institution" | "etc";
  /** 확정된 공식 URL. 미확정이면 "" */
  url: string;
  /** JSON-LD sameAs 에 포함해도 되는지 (사실관계 확인 완료 여부) */
  verified: boolean;
}

/**
 * 기관 관계.
 * Phase 1 에서는 "구조만" 만들고 값은 비워둔다.
 * schema.org 의 affiliation / worksFor / memberOf / founder 로 승격시키는 것은
 * 공식 URL 과 사실관계가 확인된 뒤 Phase 2 에서 결정한다.
 */
export interface OrganizationRef {
  name: string;
  /** 공식 홈페이지 URL. 미확정이면 "" */
  url: string;
  /** true 일 때만 JSON-LD 에 관계로 출력한다 */
  emitToSchema: boolean;
}

export interface PersonEntity {
  /** 고아라 */
  name: string;
  /** KO A RA */
  alternateName: string;
  /** AI 이커머스 전문가 고아라 */
  positioning: string;
  /** 공식 직함 */
  jobTitle: string;
  /** 대표 전문분야 */
  primaryExpertise: string;
  /** 한 문단 소개 */
  intro: string;
  /** 출발점 */
  background: string[];
  /** 현재 연구·교육 영역 */
  currentAreas: string[];
  /** 공식 외부 채널 */
  channels: OfficialChannel[];
  /**
   * 기관 관계 슬롯. Phase 1 에서는 emitToSchema=false 로만 채운다.
   */
  organizations: {
    affiliation: OrganizationRef[];
    worksFor: OrganizationRef[];
    memberOf: OrganizationRef[];
  };
  /** 공개 가능한 연락 수단. 미확정이면 "" */
  publicContactEmail: string;
}

/* ------------------------------------------------------------------ */
/* HOME — PAST / PRESENT / FUTURE                                      */
/* ------------------------------------------------------------------ */

export interface TimelineStep {
  /** 정돈된 대문자 영문 라벨 */
  labelEn: string;
  /** 한글 단계명 */
  labelKo: string;
  /** 짧은 설명 (Phase 2 에서 확정) */
  note: string;
  /**
   * 연도. Phase 1 에서는 임의로 채우지 않는다.
   * 확정된 값이 있을 때만 문자열을 넣는다.
   */
  year?: string;
}

/** PRESENT 전문영역 */
export interface ExpertiseArea {
  id: string;
  labelEn: string;
  labelKo: string;
  summary: string;
  /** 향후 BOOKS / PROJECTS / MEDIA 연결용 슬롯 */
  related: {
    bookSlugs: string[];
    projectSlugs: string[];
    mediaIds: string[];
    storySlugs: string[];
  };
}

/** CURRENT ECOSYSTEM — 역할 중심 */
export interface EcosystemRole {
  id: string;
  /** EDUCATION / RESEARCH / MEDIA ... */
  roleEn: string;
  roleKo: string;
  /** 해당 역할에 속한 활동 이름들 */
  items: string[];
  /**
   * 기관 상세·관계 설명은 Phase 2.
   * 지금은 화면 구조와 데이터 구조만 만든다.
   */
  note: string;
}

/** FUTURE — Vertical AI Ecosystem */
export interface VerticalAiFlowStep {
  labelEn: string;
  labelKo: string;
}

export interface VerticalDomain {
  id: string;
  labelKo: string;
  /** 확장 가능 구조임을 나타내는 슬롯 */
  status: "planned" | "exploring" | "tbd";
}

/** FUTURE — Expert IP Ecosystem (순환형) */
export interface ExpertIpNode {
  id: string;
  labelKo: string;
  /** 순환 구조 상의 층위 */
  ring: "core" | "output" | "authority" | "activation";
}

/* ------------------------------------------------------------------ */
/* STORY                                                               */
/* ------------------------------------------------------------------ */

export interface Story {
  slug: string;
  title: string;
  /** 목록 카드 / meta description 용 요약 */
  summary: string;
  /** 상세 페이지 도입부 */
  lead: string;
  /**
   * 본문 블록. Phase 1 에서는 비워두거나 placeholder 섹션 제목만 둔다.
   * Phase 2 에서 실제 원고로 교체한다.
   */
  sections: StorySection[];
  /** 발행일. 확정 전에는 undefined (Schema 에도 출력하지 않는다) */
  publishedAt?: string;
  /** 목록 상단 노출 여부 */
  featured: boolean;
  isPlaceholder: boolean;
}

export interface StorySection {
  heading: string;
  /** 문단 배열. 빈 배열이면 placeholder 안내를 노출한다. */
  paragraphs: string[];
}

/* ------------------------------------------------------------------ */
/* BOOKS                                                               */
/* ------------------------------------------------------------------ */

export interface BookExternalLink {
  label: string;
  url: string;
}

export interface Book {
  slug: string;
  title: string;
  subtitle: string;
  authors: string[];
  publisher: string;
  /** ISO 8601 (YYYY-MM-DD). 미확정이면 "" */
  publicationDate: string;
  isbn: string;
  /** 표지 이미지 경로. 미확정이면 null → CSS placeholder 렌더 */
  cover: { src: string; alt: string; width: number; height: number } | null;
  description: string;
  category: string;
  externalLinks: BookExternalLink[];
  isPlaceholder: boolean;
}

/* ------------------------------------------------------------------ */
/* PROJECTS                                                            */
/* ------------------------------------------------------------------ */

/** 프로젝트 상세 공통 템플릿 */
export type ProjectSectionKey = "why" | "problem" | "build" | "result" | "next";

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  /** 한 줄 요약 */
  summary: string;
  category: string;
  /** 진행 상태 */
  status: "building" | "running" | "planned" | "tbd";
  /** 기간 표기. 임의로 만들지 않는다. 미확정이면 "" */
  period: string;
  /** WHY / PROBLEM / BUILD / RESULT / NEXT */
  sections: Record<ProjectSectionKey, string[]>;
  isPlaceholder: boolean;
}

/* ------------------------------------------------------------------ */
/* MEDIA                                                               */
/* ------------------------------------------------------------------ */

export type MediaType = "COLUMN" | "EDUCATION" | "VIDEO" | "SOCIAL" | "MEDIA";

export interface MediaItem {
  id: string;
  title: string;
  /** 채널명 (한국쇼핑몰신문 / YouTube ...) */
  channel: string;
  type: MediaType;
  /** ISO 8601 (YYYY-MM-DD). 미확정이면 "" */
  date: string;
  description: string;
  /** 외부 원문 URL. 미확정이면 "" → "링크 준비 중" 상태로 렌더 */
  externalUrl: string;
}

/* ------------------------------------------------------------------ */
/* 공통                                                                */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  name: string;
  href: string;
}
