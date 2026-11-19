import type { Metadata, Viewport } from "next";
import "./globals.css";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, site } from "@/content/site";
import { graph, personSchema, webSiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.homeTitle,
    // 하위 페이지: "STORY | 고아라(KO A RA)"
    template: `%s | ${site.titleSuffix}`,
  },
  description: site.homeDescription,
  applicationName: site.homeTitle,
  authors: [{ name: site.brandKo }],
  creator: site.brandKo,
  publisher: site.brandKo,
  formatDetection: { telephone: false, address: false, email: false },
  ...(site.verification.google || site.verification.naver
    ? {
        verification: {
          google: site.verification.google || undefined,
          other: site.verification.naver
            ? { "naver-site-verification": site.verification.naver }
            : undefined,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#081A33",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={site.lang}>
      <head>
        {/*
          웹폰트는 CDN 으로 불러오고 폰트 파일은 저장소에 포함하지 않는다.
          네트워크 실패 시에도 globals.css 의 시스템 폰트 스택으로 안전하게 대체된다.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/*
          @next/next/no-page-custom-font 는 pages/_document.js 를 전제로 한 규칙이라
          App Router 의 루트 레이아웃에는 해당하지 않는다.
          여기서 선언한 폰트는 모든 라우트에 한 번만 적용된다.
        */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-ivory text-ink antialiased">
        {/* 전역 구조화 데이터: Person + WebSite */}
        <JsonLd data={graph(personSchema(), webSiteSchema())} />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          본문으로 건너뛰기
        </a>

        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
