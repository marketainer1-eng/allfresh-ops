import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ExternalIcon } from "@/components/ui/Button";
import { person } from "@/content/person";
import { primaryNav, site } from "@/content/site";

export function SiteFooter() {
  const year = 2026; // 빌드 시각에 의존하지 않도록 고정값으로 관리한다.
  const linkedChannels = person.channels.filter((c) => c.url.trim() !== "");

  return (
    <footer className="on-navy bg-navy text-white">
      <Container width="wide">
        <div className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.2fr_1fr_1fr]">
          {/* 정체성 */}
          <div>
            <p className="eyebrow text-base text-white">{site.brandEn}</p>
            <p className="mt-2 text-sm text-white/70">{person.positioning}</p>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-white/55">
              {person.jobTitle}
            </p>
          </div>

          {/* 사이트 메뉴 */}
          <nav aria-label="푸터 메뉴">
            <p className="eyebrow text-[0.65rem] text-brand-light">MENU</p>
            <ul className="mt-4 space-y-2.5">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/75 underline-offset-4 transition-colors hover:text-brand-light hover:underline"
                  >
                    {item.labelEn}
                    <span className="ml-2 text-xs text-white/40">
                      {item.labelKo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 공식 외부 채널 */}
          <div>
            <p className="eyebrow text-[0.65rem] text-brand-light">CHANNELS</p>
            {linkedChannels.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {linkedChannels.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-white/75 underline-offset-4 transition-colors hover:text-brand-light hover:underline"
                    >
                      {c.label}
                      <ExternalIcon />
                      <span className="sr-only">(새 창으로 열리는 외부 링크)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <ul className="mt-4 space-y-2.5">
                  {person.channels.map((c) => (
                    <li key={c.label} className="text-sm text-white/45">
                      {c.label}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-white/40">
                  공식 링크 연결 준비 중입니다.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line-navy py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {person.name} ({site.brandEn}). All rights reserved.
          </p>
          <p>{site.brandEn} — Personal Brand Archive &amp; Official Entity Hub</p>
        </div>
      </Container>
    </footer>
  );
}
