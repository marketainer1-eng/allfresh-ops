import path from "node:path";
import type { NextConfig } from "next";
import { redirects as redirectRules } from "./content/redirects";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 이 프로젝트는 상위 저장소(allfresh-ops) 안의 독립 Next.js 앱이다.
  // 워크스페이스 루트를 고정하지 않으면 상위 디렉터리의 파일을 끌어온다.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  // 사진 · 책 표지 등 실제 이미지가 추가될 때를 대비한 설정.
  // AVIF / WebP 자동 변환 + 반응형 sizes 를 next/image 가 처리한다.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [96, 128, 192, 256, 384],
  },

  // 301 redirect 대응 구조.
  // 규칙은 content/redirects.ts 에서만 관리한다 (기본값: 빈 배열).
  async redirects() {
    return redirectRules;
  },
};

export default nextConfig;
