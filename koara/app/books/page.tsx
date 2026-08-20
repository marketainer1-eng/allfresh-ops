import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/Placeholder";
import { BookCard } from "@/components/cards/BookCard";
import { JsonLd } from "@/components/seo/JsonLd";

import { getAllBooks } from "@/content/books";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

const breadcrumbs: BreadcrumbItem[] = [
  { name: "HOME", href: "/" },
  { name: "BOOKS", href: "/books" },
];

export const metadata: Metadata = buildMetadata({
  title: "BOOKS",
  description:
    "고아라(KO A RA)의 저서와 교재를 정리합니다. 각 책의 상세 정보와 구매·소개 링크를 연결합니다.",
  path: "/books",
});

export default function BooksIndexPage() {
  const books = getAllBooks();

  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(breadcrumbs))} />

      <PageHero
        eyebrow="BOOKS"
        title="저서와 출판"
        lead="이커머스와 AI 이커머스 분야에서 쓴 책과 교재를 정리합니다."
        breadcrumbs={breadcrumbs}
      />

      <Section tone="ivory">
        <Container width="wide">
          {books.length > 0 ? (
            <ul className="grid gap-10 sm:grid-cols-2">
              {books.map((book) => (
                <li key={book.slug}>
                  <BookCard book={book} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="등록된 저서가 없습니다."
              description="저서 정보가 확정되면 이곳에 목록이 표시됩니다."
            />
          )}
        </Container>
      </Section>
    </>
  );
}
