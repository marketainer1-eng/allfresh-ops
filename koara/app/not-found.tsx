import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { primaryNav } from "@/content/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="on-navy bg-navy py-24 text-white sm:py-32">
      <Container width="narrow">
        <p className="eyebrow text-[0.7rem] text-brand-light">ERROR 404</p>
        <h1 className="mt-5 font-serif text-3xl leading-tight text-white sm:text-4xl">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70">
          주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 아래 메뉴에서 원하는
          내용을 찾아보세요.
        </p>

        <div className="mt-9">
          <LinkButton href="/">HOME 으로 돌아가기</LinkButton>
        </div>

        <nav aria-label="전체 메뉴" className="mt-14 border-t border-line-navy pt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="eyebrow text-[0.7rem] text-white/70 underline-offset-4 transition-colors hover:text-brand-light hover:underline"
                >
                  {item.labelEn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </div>
  );
}
