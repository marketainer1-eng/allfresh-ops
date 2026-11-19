import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ExternalIcon } from "@/components/ui/Button";
import { PlaceholderText } from "@/components/ui/Placeholder";
import { JsonLd } from "@/components/seo/JsonLd";

import { person } from "@/content/person";
import { ecosystemRoles, expertiseAreas } from "@/content/home";
import { site } from "@/content/site";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph, profilePageSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

const PATH = "/about";

const breadcrumbs: BreadcrumbItem[] = [
  { name: "HOME", href: "/" },
  { name: "ABOUT", href: PATH },
];

export const metadata: Metadata = buildMetadata({
  title: "ABOUT",
  description: `${person.positioning}의 공식 프로필. 전문영역과 교육 · 산업 · 연구 · 출판 · 미디어 · 프로젝트 활동을 정리합니다.`,
  path: PATH,
  type: "profile",
});

function Block({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = `about-${eyebrow.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24">
      <p className="eyebrow text-[0.62rem] text-brand">{eyebrow}</p>
      <h2 id={headingId} className="mt-2 text-xl text-ink sm:text-2xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * ABOUT
 * STORY 가 "서사"라면 ABOUT 은 "현재의 공식 프로필"이다.
 * 민감한 개인정보(주민등록번호 · 상세 주소 · 비공개 연락처)는 포함하지 않는다.
 */
export default function AboutPage() {
  const hasLinkedChannel = person.channels.some((c) => c.url.trim() !== "");

  return (
    <>
      <JsonLd
        data={graph(profilePageSchema(PATH), breadcrumbSchema(breadcrumbs))}
      />

      <PageHero
        eyebrow="ABOUT"
        title={person.positioning}
        lead={person.intro}
        breadcrumbs={breadcrumbs}
      >
        <p className="border-l-2 border-brand-light/60 pl-4 text-sm leading-relaxed text-white/65">
          {person.jobTitle}
        </p>
      </PageHero>

      <Section tone="ivory">
        <Container width="narrow">
          <div className="space-y-14">
            {/* 기본 정보 */}
            <Block eyebrow="PROFILE" title="기본 정보">
              <dl className="divide-y divide-line rounded-2xl border border-line bg-white">
                {[
                  { label: "이름", value: person.name },
                  { label: "영문명", value: person.alternateName },
                  { label: "대표 포지셔닝", value: person.positioning },
                  { label: "대표 전문분야", value: person.primaryExpertise },
                  { label: "공식 직함", value: person.jobTitle },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 px-5 py-4 text-sm sm:flex-row sm:gap-4"
                  >
                    <dt className="w-32 shrink-0 text-ink-faint">
                      {row.label}
                    </dt>
                    <dd className="text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Block>

            {/* 전문영역 */}
            <Block eyebrow="EXPERTISE" title="전문영역">
              <ul className="grid gap-3 sm:grid-cols-2">
                {expertiseAreas.map((area) => (
                  <li
                    key={area.id}
                    className="rounded-xl border border-line bg-white p-5"
                  >
                    <p className="eyebrow text-[0.6rem] text-brand">
                      {area.labelEn}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-ink">
                      {area.labelKo}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      {area.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </Block>

            {/* 출발점과 현재 */}
            <Block eyebrow="BACKGROUND" title="출발점과 현재 연구 영역">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-[0.6rem] text-ink-faint">
                    BACKGROUND
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {person.background.map((b) => (
                      <li
                        key={b}
                        className="border-l-2 border-brand/30 pl-3 text-sm text-ink"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-[0.6rem] text-ink-faint">
                    CURRENT AREAS
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {person.currentAreas.map((a) => (
                      <li
                        key={a}
                        className="rounded-full border border-line bg-soft px-3 py-1.5 text-xs text-ink"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Block>

            {/* 경력 요약 — Phase 2 */}
            <Block eyebrow="CAREER" title="경력 요약">
              <PlaceholderText label="경력 요약 준비 중 — 확정된 내용만 등록합니다." />
            </Block>

            {/* 활동 기반 */}
            <Block eyebrow="ACTIVITIES" title="교육 · 산업 · 연구 · 출판 · 미디어 · 프로젝트">
              <dl className="grid gap-3 sm:grid-cols-2">
                {ecosystemRoles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-xl border border-line bg-white p-5"
                  >
                    <dt className="eyebrow text-[0.6rem] text-brand">
                      {role.roleEn}
                      <span className="ml-2 font-sans text-[0.65rem] font-normal normal-case tracking-normal text-ink-faint">
                        {role.roleKo}
                      </span>
                    </dt>
                    <dd className="mt-3">
                      <ul className="space-y-1.5">
                        {role.items.map((item) => (
                          <li key={item} className="text-sm text-ink">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ))}
              </dl>
            </Block>

            {/* 공식 외부 채널 */}
            <Block eyebrow="CHANNELS" title="공식 외부 채널">
              <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
                {person.channels.map((c) => (
                  <li key={c.label} className="px-5 py-4">
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-ink underline-offset-4 hover:text-brand hover:underline"
                      >
                        {c.label}
                        <ExternalIcon className="text-brand" />
                        <span className="sr-only">
                          (새 창으로 열리는 외부 링크)
                        </span>
                      </a>
                    ) : (
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                        {c.label}
                        <span className="text-xs text-ink-faint">
                          링크 준비 중
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {!hasLinkedChannel ? (
                <p className="mt-3 text-xs text-ink-faint">
                  공식 URL이 확인되면 링크와 구조화 데이터(sameAs)에 함께
                  반영됩니다.
                </p>
              ) : null}
            </Block>

            {/* 연락 */}
            <Block id="contact" eyebrow="CONTACT" title="연락">
              {person.publicContactEmail ? (
                <address className="not-italic">
                  <a
                    href={`mailto:${person.publicContactEmail}`}
                    className="text-sm text-brand underline underline-offset-4"
                  >
                    {person.publicContactEmail}
                  </a>
                </address>
              ) : (
                <PlaceholderText label="공개 연락 수단 준비 중 — 강연 · 자문 · 협업 문의 경로를 확정한 뒤 안내합니다." />
              )}
              <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                이 페이지는 {site.brandEn}의 공식 프로필 정보만 제공하며, 개인
                연락처 등 민감한 정보는 포함하지 않습니다.
              </p>
            </Block>
          </div>
        </Container>
      </Section>
    </>
  );
}
