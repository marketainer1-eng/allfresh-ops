import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PlaceholderText } from "@/components/ui/Placeholder";
import { JsonLd } from "@/components/seo/JsonLd";

import { getAllStories, getStoryBySlug } from "@/content/stories";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph, storyArticleSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

/** 빌드 시점에 정적 생성 (SSG) — 검색엔진이 실제 HTML 을 그대로 읽는다. */
export function generateStaticParams(): Params[] {
  return getAllStories().map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) return buildMetadata({ title: "STORY", description: "", path: "/story" });

  return buildMetadata({
    title: story.title,
    description: story.summary,
    path: `/story/${story.slug}`,
    type: "article",
  });
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) notFound();

  const path = `/story/${story.slug}`;
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "HOME", href: "/" },
    { name: "STORY", href: "/story" },
    { name: story.title, href: path },
  ];

  return (
    <>
      <JsonLd
        data={graph(
          storyArticleSchema(story, path),
          breadcrumbSchema(breadcrumbs),
        )}
      />

      <PageHero
        eyebrow="STORY"
        title={story.title}
        lead={story.lead || undefined}
        breadcrumbs={breadcrumbs}
      >
        {story.publishedAt ? (
          <p className="text-xs text-white/50">
            <time dateTime={story.publishedAt}>{story.publishedAt}</time>
          </p>
        ) : null}
      </PageHero>

      <Section tone="ivory">
        <Container width="narrow">
          <article className="prose-ko">
            {story.sections.map((section) => (
              <section key={section.heading} className="mb-12 last:mb-0">
                <h2 className="mb-4 text-xl text-ink sm:text-2xl">
                  {section.heading}
                </h2>
                {section.paragraphs.length > 0 ? (
                  section.paragraphs.map((p, i) => (
                    <p key={i} className="text-[0.97rem] text-ink-muted">
                      {p}
                    </p>
                  ))
                ) : (
                  <PlaceholderText />
                )}
              </section>
            ))}
          </article>

          <nav
            aria-label="STORY 이동"
            className="mt-16 border-t border-line pt-8"
          >
            <Link
              href="/story"
              className="text-sm text-brand underline-offset-4 hover:underline"
            >
              ← STORY 목록으로
            </Link>
          </nav>
        </Container>
      </Section>
    </>
  );
}
