/**
 * JSON-LD (schema.org) 빌더
 *
 * ⚠️ 원칙 (Phase 1)
 * - 검증되지 않은 사실은 절대 출력하지 않는다.
 * - sameAs 는 person.channels 중 verified === true 이고 url 이 있는 것만.
 * - affiliation / worksFor / memberOf / founder 는
 *   organizations[*].emitToSchema === true 일 때만 출력한다.
 *   (Phase 1 기본값은 모두 비어 있으므로 해당 필드 자체가 나가지 않는다)
 * - datePublished / isbn / publisher 등도 값이 있을 때만 넣는다.
 */

import { person, verifiedSameAs } from "@/content/person";
import { SITE_URL, site } from "@/content/site";
import type { Book, BreadcrumbItem, OrganizationRef, Story } from "@/content/types";
import { absoluteUrl } from "./seo";

type Json = Record<string, unknown>;

/** 빈 문자열 / 빈 배열 / undefined 키를 제거한다 */
function compact(obj: Json): Json {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function orgNodes(refs: OrganizationRef[]): Json[] | undefined {
  const emitted = refs.filter((o) => o.emitToSchema && o.name.trim() !== "");
  if (emitted.length === 0) return undefined;
  return emitted.map((o) =>
    compact({ "@type": "Organization", name: o.name, url: o.url }),
  );
}

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/* ------------------------------------------------------------------ */
/* Person                                                              */
/* ------------------------------------------------------------------ */

export function personSchema(): Json {
  return compact({
    "@type": "Person",
    "@id": PERSON_ID,
    name: person.name,
    alternateName: person.alternateName,
    url: SITE_URL,
    jobTitle: person.jobTitle,
    description: person.intro,
    knowsAbout: [
      person.primaryExpertise,
      ...person.background,
      ...person.currentAreas,
    ],
    sameAs: verifiedSameAs(),
    affiliation: orgNodes(person.organizations.affiliation),
    worksFor: orgNodes(person.organizations.worksFor),
    memberOf: orgNodes(person.organizations.memberOf),
    email: person.publicContactEmail
      ? `mailto:${person.publicContactEmail}`
      : undefined,
  });
}

/* ------------------------------------------------------------------ */
/* WebSite                                                             */
/* ------------------------------------------------------------------ */

export function webSiteSchema(): Json {
  return compact({
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: site.homeTitle,
    description: site.homeDescription,
    inLanguage: site.lang,
    publisher: { "@id": PERSON_ID },
  });
}

/* ------------------------------------------------------------------ */
/* ProfilePage (ABOUT)                                                 */
/* ------------------------------------------------------------------ */

export function profilePageSchema(path: string): Json {
  return compact({
    "@type": "ProfilePage",
    "@id": `${absoluteUrl(path)}#profilepage`,
    url: absoluteUrl(path),
    inLanguage: site.lang,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
  });
}

/* ------------------------------------------------------------------ */
/* BreadcrumbList                                                      */
/* ------------------------------------------------------------------ */

export function breadcrumbSchema(items: BreadcrumbItem[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Article (STORY)                                                     */
/* datePublished 가 확정되지 않으면 출력하지 않는다.                     */
/* ------------------------------------------------------------------ */

export function storyArticleSchema(story: Story, path: string): Json {
  return compact({
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    headline: story.title,
    description: story.summary,
    url: absoluteUrl(path),
    inLanguage: site.lang,
    author: { "@id": PERSON_ID },
    datePublished: story.publishedAt,
    isPartOf: { "@id": WEBSITE_ID },
  });
}

/* ------------------------------------------------------------------ */
/* Book                                                                */
/* placeholder 상태의 책은 구조화 데이터를 내보내지 않는다.              */
/* ------------------------------------------------------------------ */

export function bookSchema(book: Book, path: string): Json | null {
  if (book.isPlaceholder) return null;

  return compact({
    "@type": "Book",
    "@id": `${absoluteUrl(path)}#book`,
    name: book.title,
    alternativeHeadline: book.subtitle,
    url: absoluteUrl(path),
    inLanguage: site.lang,
    author: book.authors.map((a) =>
      a === person.name ? { "@id": PERSON_ID } : { "@type": "Person", name: a },
    ),
    publisher: book.publisher
      ? { "@type": "Organization", name: book.publisher }
      : undefined,
    datePublished: book.publicationDate,
    isbn: book.isbn,
    description: book.description,
    genre: book.category,
    image: book.cover ? absoluteUrl(book.cover.src) : undefined,
  });
}

/* ------------------------------------------------------------------ */
/* CreativeWork (PROJECT)                                              */
/* ------------------------------------------------------------------ */

export function creativeWorkSchema(input: {
  name: string;
  description: string;
  path: string;
}): Json {
  return compact({
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(input.path)}#creativework`,
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: site.lang,
    creator: { "@id": PERSON_ID },
  });
}

/* ------------------------------------------------------------------ */
/* @graph 조립                                                          */
/* ------------------------------------------------------------------ */

export function graph(...nodes: (Json | null | undefined)[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((n): n is Json => Boolean(n)),
  };
}
