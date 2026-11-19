import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { Section, SectionHeader } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Placeholder";
import { StoryCard } from "@/components/cards/StoryCard";
import { BookCard } from "@/components/cards/BookCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { MediaCard } from "@/components/cards/MediaCard";

import { getFeaturedStories } from "@/content/stories";
import { getAllBooks } from "@/content/books";
import { getAllProjects } from "@/content/projects";
import { getAllMedia, getFollowChannels } from "@/content/media";
import { person } from "@/content/person";
import { site } from "@/content/site";

/* ------------------------------------------------------------------ */
/* 6. FEATURED STORY                                                    */
/* ------------------------------------------------------------------ */

export function FeaturedStorySection() {
  const featured = getFeaturedStories();

  return (
    <Section id="story" tone="ivory" labelledBy="featured-story-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="STORY"
          title="지금까지의 이야기"
          headingId="featured-story-title"
          description="이 사이트에서 직접 쓰는 원본 콘텐츠는 STORY와 VISION입니다."
        />

        {featured.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((story, i) => (
              <li key={story.slug}>
                <StoryCard story={story} index={i} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="준비된 STORY가 없습니다." />
        )}

        <div className="mt-10">
          <LinkButton href="/story" variant="outline">
            모든 STORY 보기
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. BOOKS & PUBLICATIONS                                              */
/* ------------------------------------------------------------------ */

export function BooksSection() {
  const books = getAllBooks();

  return (
    <Section id="books" tone="white" labelledBy="books-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="BOOKS"
          title="BOOKS & PUBLICATIONS"
          titleFont="sans"
          headingId="books-title"
          description="저서와 교재 정보를 정리합니다."
        />

        {books.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2">
            {books.map((book) => (
              <li key={book.slug}>
                <BookCard book={book} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="등록된 저서가 없습니다."
            description="저서 정보가 확정되면 이곳에 표시됩니다."
          />
        )}

        <div className="mt-10">
          <LinkButton href="/books" variant="outline">
            BOOKS 전체 보기
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. PROJECTS                                                          */
/* ------------------------------------------------------------------ */

export function ProjectsSection() {
  const projects = getAllProjects();

  return (
    <Section id="projects" tone="ivory" labelledBy="projects-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="PROJECTS"
          title="만들고 있는 것들"
          headingId="projects-title"
          description="각 프로젝트는 WHY · PROBLEM · BUILD · RESULT · NEXT 구조로 기록합니다."
        />

        {projects.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.slug}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="등록된 프로젝트가 없습니다." />
        )}

        <div className="mt-10">
          <LinkButton href="/projects" variant="outline">
            PROJECTS 전체 보기
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. WRITING & MEDIA                                                   */
/* ------------------------------------------------------------------ */

export function MediaSection() {
  // 영상·소셜은 아래 FOLLOW 섹션에서 다루므로 여기서는 글·매체만 보여준다.
  const items = getAllMedia().filter(
    (m) => m.type !== "SOCIAL" && m.type !== "VIDEO",
  );

  return (
    <Section id="media" tone="white" labelledBy="media-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="MEDIA"
          title="WRITING & MEDIA"
          titleFont="sans"
          headingId="media-title"
          description="외부 채널에 쓴 글과 활동을 원문 링크로 연결합니다."
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <MediaCard item={item} />
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <LinkButton href="/media" variant="outline">
            MEDIA 전체 보기
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. FOLLOW KO A RA                                                   */
/* ------------------------------------------------------------------ */

export function FollowSection() {
  const channels = getFollowChannels();

  return (
    <Section id="follow" tone="soft" labelledBy="follow-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="CHANNELS"
          title={`FOLLOW ${site.brandEn}`}
          titleFont="sans"
          headingId="follow-title"
          description="짧은 기록과 영상은 아래 채널에서 이어집니다."
        />

        <ul className="grid gap-5 sm:grid-cols-3">
          {channels.map((item) => (
            <li key={item.id}>
              <MediaCard item={item} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. ABOUT / CONTACT CTA                                              */
/* ------------------------------------------------------------------ */

export function AboutCtaSection() {
  return (
    <Section id="about-cta" tone="navy" labelledBy="about-cta-title">
      <Container width="narrow">
        <div className="text-center">
          <p className="eyebrow text-[0.7rem] text-brand-light">ABOUT</p>
          <h2
            id="about-cta-title"
            className="mt-4 font-serif text-2xl leading-snug text-white sm:text-3xl"
          >
            {person.positioning}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/70">
            공식 프로필과 전문영역, 교육 · 산업 · 연구 · 출판 · 미디어 · 프로젝트
            활동을 ABOUT에서 확인할 수 있습니다.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <LinkButton href="/about">ABOUT</LinkButton>
            <LinkButton href="/vision" variant="onNavy">
              VISION
            </LinkButton>
          </div>

          <p className="mt-8 text-xs text-white/45">
            강연 · 자문 · 협업 문의는{" "}
            <Link
              href="/about#contact"
              className="underline underline-offset-4 hover:text-brand-light"
            >
              ABOUT의 연락처 안내
            </Link>
            를 참고해 주세요.
          </p>
        </div>
      </Container>
    </Section>
  );
}
