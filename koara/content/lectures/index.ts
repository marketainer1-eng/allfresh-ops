/**
 * 강의 경력
 *
 * ⚠️ 이 파일에는 **확인된 사실만** 입력한다.
 * 강의 경력은 실존 인물의 직업적 이력이므로 추정해서 채우지 않는다.
 * (프로젝트 금지사항: "KO A RA의 경력이나 성과를 임의로 창작")
 *
 * ── 입력 방법 ───────────────────────────────────────────────────────
 * 아래 lectures 배열에 항목을 추가하면 된다. 개수 제한은 없다.
 * 화면(ABOUT)에서는 year 기준 내림차순으로 자동 정렬되고,
 * 연도별로 묶여서 표로 렌더된다.
 *
 * 빈 문자열("")로 둔 항목은 화면에서 자동으로 생략된다.
 *
 * 예시 (형식 참고용 — 실제 데이터로 교체할 것):
 *
 *   {
 *     period: "2025",
 *     year: 2025,
 *     organization: "명지대학교 테크노아트대학원",
 *     title: "AI 이커머스 연구방법론",
 *     category: "대학",
 *     note: "석사과정 정규 과목",
 *   },
 *   {
 *     period: "2023–2024",
 *     year: 2024,
 *     organization: "○○기업",
 *     title: "AI 활용 상세페이지 제작 실무",
 *     category: "기업",
 *     note: "재직자 교육 · 4회차",
 *   },
 * ────────────────────────────────────────────────────────────────────
 */

import type { LectureRecord } from "../types";

export const lectures: LectureRecord[] = [
  // 확인된 강의 경력을 여기에 추가한다.
];

/** 연도 내림차순 정렬 */
export function getAllLectures(): LectureRecord[] {
  return [...lectures].sort((a, b) => b.year - a.year);
}

/** 연도별로 묶어서 반환 (내림차순) */
export function getLecturesByYear(): { year: number; items: LectureRecord[] }[] {
  const map = new Map<number, LectureRecord[]>();
  for (const l of getAllLectures()) {
    const bucket = map.get(l.year);
    if (bucket) bucket.push(l);
    else map.set(l.year, [l]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

/** 수록된 강의 경력의 기간. 데이터가 없으면 null */
export function getLectureRange(): { from: number; to: number } | null {
  if (lectures.length === 0) return null;
  const years = lectures.map((l) => l.year);
  return { from: Math.min(...years), to: Math.max(...years) };
}
