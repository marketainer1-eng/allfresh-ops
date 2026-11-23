/**
 * BOOKS 데이터
 *
 * ⚠️ 원칙: 책 제목 / 출판사 / ISBN / 출간일을 임의로 만들지 않는다.
 * 아래 항목은 저자가 제공한 표지 원본(A5 표지 펼침면)에서 확인된 값만 입력했다.
 * 확인되지 않은 값(출간일, 판매 링크 등)은 빈 문자열로 둔다.
 *
 * Phase 2 에서 채울 값: publicationDate / externalLinks
 */

import type { Book } from "../types";

export const books: Book[] = [
  {
    slug: "ai-ecommerce-industry-research",
    title: "대한민국 AI 이커머스 산업 연구론",
    subtitle: "대한민국 AI 이커머스 산업을 데이터와 Evidence로 연구하는 방법",
    authors: ["고아라"],
    publisher: "넥서스그룹",
    // 표지에 발행일 표기가 없어 비워 둔다. 확인되면 "YYYY-MM-DD" 로 입력.
    publicationDate: "",
    // 표지 바코드: ISBN 979-11-221691-0-2 (부가기호 13320)
    isbn: "979-11-221691-0-2",
    price: "30,000원",
    cover: {
      src: "/books/ai-ecommerce-industry-research.webp",
      alt: "대한민국 AI 이커머스 산업 연구론 — 고아라 지음, 넥서스그룹. 표지",
      width: 1000,
      height: 1419,
    },
    // 표지에 실린 소개 문구 그대로 사용한다.
    description:
      "기술이 할 수 있는 일과 산업이 실제로 바뀐 일을 구분한다.\n\n" +
      "AI가 상품 설명문을 작성할 수 있다고 해서 모든 판매자가 그 기술을 활용하는 것은 아니다. " +
      "AI를 도입한 판매자가 있다고 해서 상품정보의 품질이 반드시 개선되는 것도 아니다.\n\n" +
      "이 책은 특정 AI 기술이나 서비스의 현재 기능을 암기하는 데 목적을 두지 않는다. " +
      "변화하는 산업 현상을 발견하고, 적절한 연구질문을 설정하며, " +
      "검증 가능한 근거를 통해 설명하는 능력을 기르는 데 목적을 둔다.",
    category: "AI 이커머스 · 산업 연구방법론",
    externalLinks: [],
    tableOfContents: [
      {
        part: "1부",
        title: "연구의 기초",
        chapters: [
          "1장 AI 이커머스 산업의 연구 범위",
          "2장 AI 이커머스 산업 연구문제의 발굴과 설계",
          "3장 AI 이커머스 산업 연구방법론의 선택과 설계",
          "4장 AI 이커머스 산업의 핵심 개념과 측정지표 설계",
        ],
      },
      {
        part: "2부",
        title: "산업자료와 근거 분석",
        chapters: [
          "5장 산업자료의 탐색과 근거 평가",
          "6장 디지털 관심 데이터의 분석과 해석",
          "7장 산업통계의 측정 기준과 비교 가능성",
          "8장 선행연구와 상반된 근거의 비교",
        ],
      },
      {
        part: "3부",
        title: "실증연구의 설계와 실행",
        chapters: [
          "9장 전문가·기업 인터뷰 연구",
          "10장 소비자 설문과 예비조사",
          "11장 AI 생성 콘텐츠의 실험연구",
          "12장 AI 상품 추천의 정확성 평가",
          "13장 판매자 업무성과와 수익성 연구",
        ],
      },
      {
        part: "4부",
        title: "연구결과와 산업 분석",
        chapters: [
          "14장 연구자료의 관리와 정량·정성 분석",
          "15장 연구결과의 해석과 주장 검증",
          "16장 산업 분석 원고의 구조와 집필",
        ],
      },
      {
        part: "5부",
        title: "산업 연구의 종합·간행과 후속 연구",
        chapters: [
          "17장 산업 연구결과의 종합과 비교",
          "18장 산업 리포트의 기획과 간행",
          "19장 변화 신호와 트렌드 지표 후보의 도출",
          "20장 연구 성과의 축적과 후속 연구 설계",
        ],
      },
    ],
    isPlaceholder: false,
  },
];

export function getAllBooks(): Book[] {
  return books;
}

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}
