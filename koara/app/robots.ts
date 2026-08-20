import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

/**
 * robots.txt
 *
 * AI 크롤러를 별도로 차단하지 않는다.
 * 이 사이트는 검색엔진과 AI 모두가 읽을 수 있도록 만드는 것이 목적이다(GEO).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
