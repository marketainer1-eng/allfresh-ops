/**
 * BOOKS 데이터
 *
 * ⚠️ Phase 1: 실제 책 제목 / 출판사 / ISBN / 출간일을 임의로 만들지 않는다.
 * 상세 페이지 템플릿을 검토할 수 있도록 "placeholder 임을 명시한" 항목 2개만 둔다.
 * (검토가 끝나면 books 배열을 실제 데이터로 교체하거나, 비워서 빈 상태 UI 로 되돌릴 수 있다.)
 *
 * Phase 2 에서 필요한 값: title / subtitle / authors / publisher /
 * publicationDate / isbn / cover / description / category / externalLinks
 */

import type { Book } from "../types";

const placeholderBook = (n: number): Book => ({
  slug: `placeholder-${n}`,
  title: `저서 ${n} — 제목 확정 예정`,
  subtitle: "",
  authors: ["고아라"],
  publisher: "",
  publicationDate: "",
  isbn: "",
  cover: null,
  description: "",
  category: "",
  externalLinks: [],
  isPlaceholder: true,
});

export const books: Book[] = [placeholderBook(1), placeholderBook(2)];

export function getAllBooks(): Book[] {
  return books;
}

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}
