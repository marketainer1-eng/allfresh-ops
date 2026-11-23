import Link from "next/link";
import { primaryNav, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { MobileNav } from "./MobileNav";

/**
 * 상단 네비게이션.
 * 서버 컴포넌트로 렌더되며, 모바일 토글만 작은 클라이언트 컴포넌트다.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory/90 backdrop-blur-sm">
      <Container width="wide">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link
            href="/"
            className="group flex shrink-0 flex-col leading-none"
            aria-label={`${site.brandEn} 홈으로 이동`}
          >
            <span className="eyebrow text-sm text-ink transition-colors group-hover:text-brand sm:text-base">
              {site.brandEn}
            </span>
            <span className="mt-1 text-[0.65rem] tracking-[0.14em] text-ink-faint">
              AI E-COMMERCE
            </span>
          </Link>

          <nav aria-label="주요 메뉴" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="eyebrow text-[0.72rem] text-ink-muted transition-colors hover:text-brand"
                  >
                    {item.labelEn}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
