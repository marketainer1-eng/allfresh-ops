import type { MetadataRoute } from "next";
import { IS_PRODUCTION_DEPLOY, SITE_URL } from "@/content/site";

/**
 * robots.txt
 *
 * · 프로덕션: 전체 허용. AI 크롤러를 별도로 차단하지 않는다.
 *   이 사이트는 검색엔진과 AI 모두가 읽을 수 있도록 만드는 것이 목적이다(GEO).
 * · preview 배포: 전체 차단. 임시 URL 이 색인되어 중복 콘텐츠가 생기는 것을 막는다.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_DEPLOY) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
