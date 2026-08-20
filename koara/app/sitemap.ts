import type { MetadataRoute } from "next";

import { getAllBooks } from "@/content/books";
import { getAllProjects } from "@/content/projects";
import { getAllStories } from "@/content/stories";
import { SITE_URL } from "@/content/site";

/**
 * XML sitemap.
 *
 * 콘텐츠 데이터(content/*)에서 URL 을 만들어내므로
 * 새 STORY / BOOK / PROJECT 를 데이터에 추가하기만 하면
 * 다음 빌드에서 sitemap.xml 이 자동으로 갱신된다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/story"), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/vision"), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/about"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/books"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/projects"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/media"), changeFrequency: "monthly", priority: 0.7 },
  ];

  const storyRoutes: MetadataRoute.Sitemap = getAllStories().map((s) => ({
    url: url(`/story/${s.slug}`),
    changeFrequency: "yearly",
    priority: 0.6,
    ...(s.publishedAt ? { lastModified: new Date(s.publishedAt) } : {}),
  }));

  // placeholder 항목은 색인 대상이 아니므로 sitemap 에서 제외한다.
  const bookRoutes: MetadataRoute.Sitemap = getAllBooks()
    .filter((b) => !b.isPlaceholder)
    .map((b) => ({
      url: url(`/books/${b.slug}`),
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  const projectRoutes: MetadataRoute.Sitemap = getAllProjects()
    .filter((p) => !p.isPlaceholder)
    .map((p) => ({
      url: url(`/projects/${p.slug}`),
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...storyRoutes, ...bookRoutes, ...projectRoutes];
}
