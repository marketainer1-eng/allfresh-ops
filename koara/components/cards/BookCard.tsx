import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/content/types";
import { PlaceholderBadge } from "@/components/ui/Placeholder";

/**
 * 표지 이미지가 확정되기 전에는 CSS placeholder 를 그린다.
 * (의미 없는 이미지를 만들지 않고, 실제 표지가 들어오면 next/image 로 대체)
 */
function Cover({ book }: { book: Book }) {
  if (book.cover) {
    return (
      <Image
        src={book.cover.src}
        alt={book.cover.alt}
        width={book.cover.width}
        height={book.cover.height}
        loading="lazy"
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full flex-col justify-between bg-soft p-4"
    >
      <span className="eyebrow text-[0.6rem] text-brand">BOOK</span>
      <span className="h-px w-8 bg-brand/40" />
    </div>
  );
}

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="group relative flex gap-5">
      <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md border border-line bg-white sm:w-28">
        <Cover book={book} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-base leading-snug text-ink sm:text-lg">
          <Link
            href={`/books/${book.slug}`}
            className="underline-offset-4 after:absolute after:inset-0 after:content-[''] group-hover:underline"
          >
            {book.title}
          </Link>
        </h3>

        {book.subtitle ? (
          <p className="mt-1.5 text-sm text-ink-muted">{book.subtitle}</p>
        ) : null}

        <dl className="mt-3 space-y-1 text-xs text-ink-faint">
          {book.authors.length > 0 ? (
            <div className="flex gap-2">
              <dt className="shrink-0">저자</dt>
              <dd className="text-ink-muted">{book.authors.join(", ")}</dd>
            </div>
          ) : null}
          {book.publisher ? (
            <div className="flex gap-2">
              <dt className="shrink-0">출판사</dt>
              <dd className="text-ink-muted">{book.publisher}</dd>
            </div>
          ) : null}
          {book.publicationDate ? (
            <div className="flex gap-2">
              <dt className="shrink-0">출간</dt>
              <dd className="text-ink-muted">
                <time dateTime={book.publicationDate}>
                  {book.publicationDate}
                </time>
              </dd>
            </div>
          ) : null}
        </dl>

        {book.isPlaceholder ? (
          <div className="mt-3">
            <PlaceholderBadge />
          </div>
        ) : null}
      </div>
    </article>
  );
}
