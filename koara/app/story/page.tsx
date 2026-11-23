import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/Placeholder";
import { StoryCard } from "@/components/cards/StoryCard";
import { JsonLd } from "@/components/seo/JsonLd";

import { getAllStories } from "@/content/stories";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

const breadcrumbs: BreadcrumbItem[] = [
  { name: "HOME", href: "/" },
  { name: "STORY", href: "/story" },
];

export const metadata: Metadata = buildMetadata({
  title: "STORY",
  description:
    "AI 이커머스 전문가 고아라(KO A RA)가 직접 쓰는 스토리. 어디에서 시작해 무엇을 만들어왔는지 기록합니다.",
  path: "/story",
});

export default function StoryIndexPage() {
  const stories = getAllStories();

  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(breadcrumbs))} />

      <PageHero
        eyebrow="STORY"
        title="지금까지의 이야기"
        lead="이 홈페이지에서 직접 쓰는 원본 콘텐츠는 STORY와 VISION입니다. 자주 새 글을 올리는 채널이 아니라, 핵심 서사를 정리해 두는 곳입니다."
        breadcrumbs={breadcrumbs}
      />

      <Section tone="ivory">
        <Container width="wide">
          {stories.length > 0 ? (
            <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, i) => (
                <li key={story.slug}>
                  <StoryCard story={story} index={i} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="준비된 STORY가 없습니다." />
          )}
        </Container>
      </Section>
    </>
  );
}
