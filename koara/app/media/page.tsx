import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { MediaCard } from "@/components/cards/MediaCard";
import { JsonLd } from "@/components/seo/JsonLd";

import { getMediaByType, mediaTypeMeta, mediaTypeOrder } from "@/content/media";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

const breadcrumbs: BreadcrumbItem[] = [
  { name: "HOME", href: "/" },
  { name: "MEDIA", href: "/media" },
];

export const metadata: Metadata = buildMetadata({
  title: "MEDIA",
  description:
    "고아라(KO A RA)의 칼럼 · 미디어 · 영상 · 소셜 채널을 한곳에서 연결합니다. 외부 콘텐츠는 원문 링크로 안내합니다.",
  path: "/media",
});

/**
 * MEDIA
 * - 실시간 API 연동 대신 링크 카드로 구현한다.
 * - 외부 콘텐츠 전문을 복제하지 않고 요약 + 원문 링크로만 연결한다.
 * - 분류 필터는 클라이언트 JS 없이 분류별 섹션으로 나눠 렌더한다.
 */
export default function MediaPage() {
  const groups = mediaTypeOrder
    .map((type) => ({ type, items: getMediaByType(type) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(breadcrumbs))} />

      <PageHero
        eyebrow="MEDIA"
        title="글과 미디어 활동"
        lead="외부 매체와 채널에 쓴 글, 강의와 영상 활동을 원문 링크로 연결합니다. 이 페이지는 외부 콘텐츠를 복제하지 않고 안내만 합니다."
        breadcrumbs={breadcrumbs}
      >
        <nav aria-label="분류 바로가기">
          <ul className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <li key={g.type}>
                <a
                  href={`#${g.type.toLowerCase()}`}
                  className="eyebrow inline-flex min-h-11 items-center rounded-full border border-white/25 px-4 py-2 text-[0.65rem] text-white/80 transition-colors hover:border-brand-light hover:text-brand-light"
                >
                  {g.type}
                  <span className="ml-2 text-white/40">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <Section tone="ivory">
        <Container width="wide">
          <div className="space-y-16">
            {groups.map((group) => {
              const meta = mediaTypeMeta[group.type];
              return (
                <section
                  key={group.type}
                  id={group.type.toLowerCase()}
                  aria-labelledby={`media-${group.type.toLowerCase()}`}
                  className="scroll-mt-24"
                >
                  <header className="mb-6 border-b border-line pb-4">
                    <h2
                      id={`media-${group.type.toLowerCase()}`}
                      className="font-sans text-lg font-bold tracking-[0.06em] text-ink sm:text-xl"
                    >
                      {meta.labelEn}
                      <span className="ml-3 font-sans text-xs font-normal tracking-normal text-ink-faint">
                        {meta.labelKo}
                      </span>
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted">
                      {meta.description}
                    </p>
                  </header>

                  <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <MediaCard item={item} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </Container>
      </Section>
    </>
  );
}
