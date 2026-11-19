/**
 * PROJECTS 데이터
 *
 * ⚠️ Phase 1: 프로젝트 실제 내용과 성과를 임의로 작성하지 않는다.
 * WHY / PROBLEM / BUILD / RESULT / NEXT 공통 템플릿 구조만 확인할 수 있도록
 * placeholder 항목 2개를 둔다.
 *
 * Phase 2 에서 sections 의 각 배열을 실제 문단으로 채운다.
 */

import type { Project } from "../types";

const emptySections = (): Project["sections"] => ({
  why: [],
  problem: [],
  build: [],
  result: [],
  next: [],
});

const placeholderProject = (n: number): Project => ({
  slug: `placeholder-${n}`,
  title: `프로젝트 ${n} — 이름 확정 예정`,
  subtitle: "",
  summary: "",
  category: "",
  status: "tbd",
  period: "",
  sections: emptySections(),
  isPlaceholder: true,
});

export const projects: Project[] = [
  placeholderProject(1),
  placeholderProject(2),
];

/** 상세 페이지 공통 템플릿의 섹션 정의 (라벨 · 순서) */
export const projectSectionMeta = [
  { key: "why", labelEn: "WHY", labelKo: "왜 시작했는가" },
  { key: "problem", labelEn: "PROBLEM", labelKo: "무엇이 문제였는가" },
  { key: "build", labelEn: "BUILD", labelKo: "무엇을 만들었는가" },
  { key: "result", labelEn: "RESULT", labelKo: "무엇이 달라졌는가" },
  { key: "next", labelEn: "NEXT", labelKo: "다음은 무엇인가" },
] as const;

export function getAllProjects(): Project[] {
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
