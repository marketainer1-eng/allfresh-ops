import type { Metadata } from "next";
import { SITE_URL, site } from "@/content/site";

/**
 * 페이지 메타데이터 빌더.
 *
 * 모든 페이지가 이 함수를 통해 다음을 얻는다.
 * - unique title
 * - meta description
 * - canonical URL
 * - Open Graph
 * - Twitter/X Card
 */
export interface PageMetaInput {
  /** 페이지 고유 제목 (접미사 없이) */
  title: string;
  description: string;
  /** 사이트 루트 기준 경로. 예: "/story/why-vertical-ai" */
  path: string;
  /** article 로 표시할지 여부 */
  type?: "website" | "article" | "profile";
  /** OG 이미지 경로. 없으면 site.defaultOgImage 사용 */
  image?: string;
  /** 검색 색인 제외가 필요한 경우 */
  noindex?: boolean;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

export function buildMetadata({
  title,
  description,
  path,
  type = "website",
  image,
  noindex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image || site.defaultOgImage;
  const images = ogImage ? [{ url: absoluteUrl(ogImage) }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: type === "profile" ? "profile" : type,
      url,
      siteName: site.homeTitle,
      title,
      description,
      locale: site.locale,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
