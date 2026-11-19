import path from "node:path";
import type { NextConfig } from "next";
import { redirects as redirectRules } from "./content/redirects";

/**
 * STATIC_EXPORT=1 로 빌드하면 out/ 에 순수 정적 사이트를 생성한다.
 * (Netlify 드래그&드롭 배포처럼 Node 런타임이 없는 호스팅용)
 *
 * 이 사이트는 전 페이지가 SSG 이므로 정적 export 로도 기능 손실이 없다.
 * 다만 export 모드에서는 next/image 최적화와 redirects() 가 지원되지 않으므로
 * 해당 설정만 분기한다. 일반 빌드(Vercel 등)는 기존 동작을 그대로 유지한다.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 이 프로젝트는 상위 저장소(allfresh-ops) 안의 독립 Next.js 앱이다.
  // 워크스페이스 루트를 고정하지 않으면 상위 디렉터리의 파일을 끌어온다.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  ...(isStaticExport ? { output: "export" as const } : {}),

  // 사진 · 책 표지 등 실제 이미지가 추가될 때를 대비한 설정.
  // AVIF / WebP 자동 변환 + 반응형 sizes 를 next/image 가 처리한다.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [96, 128, 192, 256, 384],
    // 정적 export 에는 이미지 최적화 서버가 없다.
    unoptimized: isStaticExport,
  },

  // 301 redirect 대응 구조. 규칙은 content/redirects.ts 에서만 관리한다.
  // (정적 export 에서는 지원되지 않으므로 호스팅의 리다이렉트 기능을 쓴다 —
  //  Netlify 라면 _redirects 파일)
  ...(isStaticExport
    ? {}
    : {
        async redirects() {
          return redirectRules;
        },
      }),
};

export default nextConfig;
