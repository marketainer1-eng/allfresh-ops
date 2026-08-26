import type { ReactNode } from "react";
import { Container } from "./Container";

type Tone = "ivory" | "white" | "navy" | "soft";

const tones: Record<Tone, string> = {
  ivory: "bg-ivory text-ink",
  white: "bg-white text-ink",
  soft: "bg-soft text-ink",
  navy: "bg-navy text-white on-navy",
};

/**
 * 페이지의 한 구획.
 * <section> + 접근 가능한 라벨(aria-labelledby)을 함께 만든다.
 */
export function Section({
  id,
  tone = "ivory",
  children,
  className = "",
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`py-16 sm:py-20 lg:py-24 ${tones[tone]} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * 섹션 머리말.
 * eyebrow(영문 대문자) + h2(세리프) + 설명.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  headingId,
  tone = "light",
  align = "left",
  as: Heading = "h2",
  titleFont = "serif",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  headingId?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  /**
   * 영문 대문자 제목(WHERE I STARTED 등)은 "sans" 로 정돈된 산세리프를 쓰고,
   * 한글 제목은 기본값인 에디토리얼 세리프를 쓴다.
   */
  titleFont?: "serif" | "sans";
}) {
  const isDark = tone === "dark";
  const titleStyle =
    titleFont === "sans"
      ? "font-sans font-bold tracking-[0.04em]"
      : "font-serif";

  return (
    <header
      className={`mb-10 sm:mb-12 ${align === "center" ? "text-center" : ""}`}
    >
      {eyebrow ? (
        <p
          className={`eyebrow text-[0.7rem] sm:text-xs ${
            isDark ? "text-brand-light" : "text-brand"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        id={headingId}
        className={`mt-3 text-2xl leading-snug sm:text-3xl lg:text-4xl ${titleStyle} ${
          isDark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={`mt-4 max-w-2xl text-[0.95rem] leading-relaxed sm:text-base ${
            align === "center" ? "mx-auto" : ""
          } ${isDark ? "text-white/70" : "text-ink-muted"}`}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}

export { Container };
