import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ExternalIcon } from "@/components/ui/Button";
import { PlaceholderText } from "@/components/ui/Placeholder";
import { JsonLd } from "@/components/seo/JsonLd";

import { getAllBooks, getBookBySlug } from "@/content/books";
import type { Book, BreadcrumbItem } from "@/content/types";
import { bookSchema, breadcrumbSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllBooks().map((b) => ({ slug: b.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return buildMetadata({ title: "BOOKS", description: "", path: "/books" });

  return buildMetadata({
    title: book.title,
    description:
      book.description ||
      `고아라(KO A RA)의 저서 정보 — ${book.title}`,
    path: `/books/${book.slug}`,
    type: "article",
    // 표지 이미지가 확정되면 자동으로 OG 이미지로 사용된다.
    image: book.cover?.src,
  });
}

/** 값이 있는 항목만 정의 목록으로 출력한다 (빈 값을 임의로 채우지 않음) */
function BookFacts({ book }: { book: Book }) {
  const facts: { label: string; value: React.ReactNode }[] = [];

  if (book.authors.length > 0)
    facts.push({ label: "저자", value: book.authors.join(", ") });
  if (book.publisher) facts.push({ label: "출판사", value: book.publisher });
  if (book.publicationDate)
    facts.push({
      label: "출간일",
      value: <time dateTime={book.publicationDate}>{book.publicationDate}</time>,
    });
  if (book.isbn) facts.push({ label: "ISBN", value: book.isbn });
  if (book.category) facts.push({ label: "분류", value: book.category });

  if (facts.length === 0) {
    return <PlaceholderText label="서지 정보 준비 중" />;
  }

  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-white">
      {facts.map((f) => (
        <div key={f.label} className="flex gap-4 px-5 py-3.5 text-sm">
          <dt className="w-20 shrink-0 text-ink-faint">{f.label}</dt>
          <dd className="text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  const path = `/books/${book.slug}`;
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "HOME", href: "/" },
    { name: "BOOKS", href: "/books" },
    { name: book.title, href: path },
  ];

  return (
    <>
      {/* placeholder 상태의 책은 Book 구조화 데이터를 내보내지 않는다. */}
      <JsonLd
        data={graph(bookSchema(book, path), breadcrumbSchema(breadcrumbs))}
      />

      <PageHero
        eyebrow="BOOK"
        title={book.title}
        lead={book.subtitle || undefined}
        breadcrumbs={breadcrumbs}
      />

      <Section tone="ivory">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
            {/* 표지 */}
            <div>
              <div className="relative aspect-[3/4] w-40 overflow-hidden rounded-lg border border-line bg-white lg:w-full">
                {book.cover ? (
                  <Image
                    src={book.cover.src}
                    alt={book.cover.alt}
                    fill
                    sizes="(max-width: 1024px) 160px, 260px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-full w-full flex-col justify-between bg-soft p-5"
                  >
                    <span className="eyebrow text-[0.6rem] text-brand">
                      BOOK
                    </span>
                    <span className="h-px w-10 bg-brand/40" />
                  </div>
                )}
              </div>
              {!book.cover ? (
                <p className="mt-3 text-xs text-ink-faint">
                  표지 이미지 준비 중
                </p>
              ) : null}
            </div>

            {/* 본문 */}
            <div>
              <h2 className="text-lg text-ink sm:text-xl">책 소개</h2>
              <div className="prose-ko mt-4">
                {book.description ? (
                  <p className="text-[0.97rem] text-ink-muted">
                    {book.description}
                  </p>
                ) : (
                  <PlaceholderText label="책 소개 준비 중" />
                )}
              </div>

              <h2 className="mt-12 text-lg text-ink sm:text-xl">서지 정보</h2>
              <div className="mt-4">
                <BookFacts book={book} />
              </div>

              <h2 className="mt-12 text-lg text-ink sm:text-xl">링크</h2>
              <div className="mt-4">
                {book.externalLinks.length > 0 ? (
                  <ul className="flex flex-wrap gap-3">
                    {book.externalLinks.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/25 px-5 py-2.5 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
                        >
                          {link.label}
                          <ExternalIcon />
                          <span className="sr-only">
                            (새 창으로 열리는 외부 링크)
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <PlaceholderText label="외부 링크 준비 중" />
                )}
              </div>

              <nav
                aria-label="BOOKS 이동"
                className="mt-16 border-t border-line pt-8"
              >
                <Link
                  href="/books"
                  className="text-sm text-brand underline-offset-4 hover:underline"
                >
                  ← BOOKS 목록으로
                </Link>
              </nav>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
