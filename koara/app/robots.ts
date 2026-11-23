import type { MetadataRoute } from "next";
import { IS_INDEXABLE, SITE_URL } from "@/content/site";

/** 정적 export(output: "export")에서도 빌드 타임에 생성되도록 고정한다. */
export const dynamic = "force-static";

/**
 * robots.txt
 *
 * · 색인 허용: 전체 허용. AI 크롤러를 별도로 차단하지 않는다.
 *   이 사이트는 검색엔진과 AI 모두가 읽을 수 있도록 만드는 것이 목적이다(GEO).
 * · 색인 차단(임시 배포): 전체 Disallow. 임시 URL 이 색인되어
 *   추후 공식 도메인과 중복 콘텐츠가 되는 것을 막는다.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
