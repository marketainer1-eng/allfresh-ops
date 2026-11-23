import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { BreadcrumbItem } from "@/content/types";

/**
 * 하위 페이지 공통 헤더.
 * breadcrumb → eyebrow → h1 → lead 순서의 시맨틱 구조를 보장한다.
 */
export function PageHero({
  eyebrow,
  title,
  titleFont = "serif",
  lead,
  breadcrumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  titleFont?: "serif" | "sans";
  lead?: string;
  breadcrumbs: BreadcrumbItem[];
  children?: ReactNode;
}) {
  return (
    <div className="on-navy border-b border-line-navy bg-navy text-white">
      <Container width="wide">
        <div className="py-12 sm:py-16 lg:py-20">
          <Breadcrumbs items={breadcrumbs} tone="dark" />

          <p className="eyebrow text-[0.7rem] text-brand-light">{eyebrow}</p>

          <h1
            className={`mt-4 text-3xl leading-tight text-white sm:text-4xl lg:text-5xl ${
              titleFont === "sans"
                ? "font-sans font-bold tracking-[0.03em]"
                : "font-serif"
            }`}
          >
            {title}
          </h1>

          {lead ? (
            <p className="mt-6 max-w-2xl text-[0.95rem] leading-[1.9] text-white/70 sm:text-base">
              {lead}
            </p>
          ) : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </div>
  );
}
