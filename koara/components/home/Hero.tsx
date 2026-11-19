import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { person } from "@/content/person";
import { site } from "@/content/site";

/**
 * HERO
 * 핵심 정체성 텍스트는 이미지가 아니라 실제 HTML 텍스트로 렌더한다.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="on-navy relative overflow-hidden bg-navy text-white"
    >
      {/* 절제된 배경 — 그라데이션·네온을 쓰지 않고 얇은 라인만 사용 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-white/5 lg:block"
      />

      <Container width="wide">
        <div className="py-20 sm:py-24 lg:py-32">
          <p className="eyebrow text-xs text-brand-light">
            PERSONAL BRAND ARCHIVE
          </p>

          <h1 id="hero-title" className="mt-6">
            <span className="eyebrow block font-sans text-[2.1rem] font-bold leading-none tracking-[0.08em] text-white sm:text-6xl lg:text-7xl">
              {site.brandEn}
            </span>
            <span className="eyebrow mt-4 block font-sans text-base font-semibold leading-none tracking-[0.24em] text-brand-light sm:text-xl lg:text-2xl">
              AI E-COMMERCE
            </span>
            <span className="mt-6 block font-serif text-xl font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
              {person.positioning}
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-[0.95rem] leading-[1.9] text-white/75 sm:text-base">
            {person.intro}
          </p>

          <p className="mt-6 max-w-xl border-l-2 border-brand-light/60 pl-4 text-sm leading-relaxed text-white/60">
            {person.jobTitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <LinkButton href="/story">MY STORY</LinkButton>
            <LinkButton href="/about" variant="onNavy">
              ABOUT
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
