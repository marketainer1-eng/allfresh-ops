/**
 * HOME 서사 데이터 — PAST / PRESENT / CURRENT ECOSYSTEM / FUTURE
 *
 * ⚠️ Phase 1 원칙
 * - note / summary 는 "무엇을 다루는 영역인가"를 설명하는 최소 문구만 둔다.
 * - 성과·수치·연도·기관 관계는 넣지 않는다. (Phase 2 확정)
 * - 모든 항목은 통이미지가 아니라 HTML 텍스트로 렌더된다.
 */

import type {
  EcosystemRole,
  ExpertiseArea,
  ExpertIpNode,
  TimelineStep,
  VerticalAiFlowStep,
  VerticalDomain,
} from "./types";

/* ------------------------------------------------------------------ */
/* PAST — WHERE I STARTED                                              */
/* 연도 정보는 Phase 1 에서 임의로 추가하지 않는다 (year 미지정)         */
/* ------------------------------------------------------------------ */

export const pastTimeline: TimelineStep[] = [
  {
    labelEn: "ONLINE SELLING",
    labelKo: "온라인 판매",
    note: "상품을 직접 팔며 이커머스를 익힌 출발점.",
  },
  {
    labelEn: "STARTUP",
    labelKo: "쇼핑몰 창업",
    note: "직접 쇼핑몰을 만들고 운영한 경험.",
  },
  {
    labelEn: "ONLINE MARKETING",
    labelKo: "온라인 마케팅",
    note: "검색·광고·콘텐츠로 유입과 전환을 다루는 영역.",
  },
  {
    labelEn: "EDUCATION",
    labelKo: "이커머스 교육",
    note: "현장 경험을 교육 과정으로 옮기는 단계.",
  },
  {
    labelEn: "INDUSTRY",
    labelKo: "산업·협회 활동",
    note: "개인의 경험을 산업 단위 활동으로 확장하는 단계.",
  },
  {
    labelEn: "AI × E-COMMERCE",
    labelKo: "AI × 이커머스",
    note: "AI가 이커머스 전 과정을 바꾸는 지점으로의 이동.",
  },
];

/* ------------------------------------------------------------------ */
/* PRESENT — 전문영역                                                   */
/* related 슬롯은 Phase 2 에서 BOOKS / PROJECTS / MEDIA 와 연결한다.     */
/* ------------------------------------------------------------------ */

const emptyRelations = () => ({
  bookSlugs: [] as string[],
  projectSlugs: [] as string[],
  mediaIds: [] as string[],
  storySlugs: [] as string[],
});

export const expertiseAreas: ExpertiseArea[] = [
  {
    id: "ai-ecommerce",
    labelEn: "AI E-COMMERCE",
    labelKo: "AI 이커머스",
    summary: "AI가 상품 기획·판매·운영을 바꾸는 방식을 다루는 대표 영역.",
    related: emptyRelations(),
  },
  {
    id: "ecommerce-startup",
    labelEn: "E-COMMERCE STARTUP",
    labelKo: "이커머스 창업",
    summary: "쇼핑몰 창업과 초기 운영을 실무 기준으로 다루는 영역.",
    related: emptyRelations(),
  },
  {
    id: "ai-search-agent",
    labelEn: "AI SEARCH & AGENT",
    labelKo: "AI 검색과 쇼핑 에이전트",
    summary: "검색과 추천이 에이전트 중심으로 이동하는 흐름을 연구하는 영역.",
    related: emptyRelations(),
  },
  {
    id: "geo-ai-marketing",
    labelEn: "GEO & AI MARKETING",
    labelKo: "GEO와 AI 마케팅",
    summary: "AI가 읽고 인용하는 구조를 전제로 한 마케팅 방법론.",
    related: emptyRelations(),
  },
  {
    id: "vertical-ai",
    labelEn: "VERTICAL AI",
    labelKo: "버티컬 AI",
    summary: "산업별로 특화된 AI 활용 구조를 설계하는 영역.",
    related: emptyRelations(),
  },
  {
    id: "expert-ip",
    labelEn: "EXPERT IP",
    labelKo: "전문가 IP",
    summary: "전문가의 지식과 경험이 브랜드와 사업으로 이어지는 구조.",
    related: emptyRelations(),
  },
];

/* ------------------------------------------------------------------ */
/* CURRENT ECOSYSTEM — 역할 중심                                        */
/* 기관 관계를 과도하게 설명하지 않는다. 화면 구조와 데이터 구조만.       */
/* ------------------------------------------------------------------ */

export const ecosystemRoles: EcosystemRole[] = [
  {
    id: "education",
    roleEn: "EDUCATION",
    roleKo: "교육",
    items: ["AI 이커머스학과"],
    note: "",
  },
  {
    id: "professional-education",
    roleEn: "PROFESSIONAL EDUCATION",
    roleKo: "전문 교육",
    items: ["AI 이커머스 아카데미"],
    note: "",
  },
  {
    id: "industry",
    roleEn: "INDUSTRY",
    roleKo: "산업",
    items: ["협회 활동"],
    note: "",
  },
  {
    id: "research",
    roleEn: "RESEARCH",
    roleKo: "연구",
    items: ["AI 미디어 커머스 연구소"],
    note: "",
  },
  {
    id: "media",
    roleEn: "MEDIA",
    roleKo: "미디어",
    items: ["한국쇼핑몰신문", "AI에이전트타임즈"],
    note: "",
  },
  {
    id: "knowledge",
    roleEn: "KNOWLEDGE",
    roleKo: "지식",
    items: ["저서", "교재", "연구", "강의"],
    note: "",
  },
];

/* ------------------------------------------------------------------ */
/* FUTURE — A. VERTICAL AI ECOSYSTEM                                    */
/* ------------------------------------------------------------------ */

export const verticalAiFlow: VerticalAiFlowStep[] = [
  { labelEn: "INDUSTRY", labelKo: "산업" },
  { labelEn: "AI SPECIALIZATION", labelKo: "AI 특화" },
  { labelEn: "AI ADOPTION", labelKo: "AI 활용" },
  { labelEn: "STARTUP", labelKo: "창업" },
  { labelEn: "MARKETING", labelKo: "마케팅" },
  { labelEn: "EDUCATION", labelKo: "교육" },
  { labelEn: "PUBLISHING", labelKo: "출판" },
  { labelEn: "EXPERT", labelKo: "전문가" },
  { labelEn: "PROJECT", labelKo: "프로젝트" },
];

/**
 * 확장 가능한 예시 분야.
 * 상세 콘텐츠는 Phase 1 에서 작성하지 않는다 (status: "tbd").
 */
export const verticalDomains: VerticalDomain[] = [
  { id: "fashion", labelKo: "패션", status: "tbd" },
  { id: "beauty", labelKo: "뷰티", status: "tbd" },
  { id: "senior", labelKo: "시니어", status: "tbd" },
  { id: "food", labelKo: "식품", status: "tbd" },
  { id: "pet", labelKo: "펫", status: "tbd" },
  { id: "creator", labelKo: "크리에이터", status: "tbd" },
  { id: "etc", labelKo: "기타 분야", status: "tbd" },
];

/* ------------------------------------------------------------------ */
/* FUTURE — B. EXPERT IP ECOSYSTEM (순환형)                             */
/*                                                                     */
/* 책을 출발점으로 고정하지 않는다.                                      */
/* output 링의 어느 항목에서든 시작할 수 있고, 서로 전환된다.            */
/* ------------------------------------------------------------------ */

export const expertIpNodes: ExpertIpNode[] = [
  { id: "core", labelKo: "전문가의 지식·경험", ring: "core" },

  { id: "book", labelKo: "책", ring: "output" },
  { id: "column", labelKo: "칼럼", ring: "output" },
  { id: "sns", labelKo: "SNS", ring: "output" },
  { id: "video", labelKo: "영상", ring: "output" },
  { id: "audio", labelKo: "오디오", ring: "output" },
  { id: "course", labelKo: "인강", ring: "output" },
  { id: "lecture-note", labelKo: "강의안", ring: "output" },
  { id: "project-exp", labelKo: "프로젝트 경험", ring: "output" },
  { id: "interview", labelKo: "인터뷰", ring: "output" },

  { id: "authority", labelKo: "권위와 브랜드", ring: "authority" },

  { id: "teaching", labelKo: "강의", ring: "activation" },
  { id: "consulting", labelKo: "컨설팅", ring: "activation" },
  { id: "project", labelKo: "프로젝트", ring: "activation" },
  { id: "collaboration", labelKo: "협업", ring: "activation" },
];
