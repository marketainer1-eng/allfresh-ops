"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { primaryNav } from "@/content/site";

/**
 * 모바일 메뉴.
 * 사이트에서 유일하게 상태를 가지는 클라이언트 컴포넌트다.
 * (불필요한 JS 를 최소화하기 위해 나머지는 모두 서버 렌더)
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // 메뉴가 열려 있는 동안 배경 스크롤 잠금 + ESC 로 닫기
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="eyebrow inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-[0.68rem] text-ink"
      >
        {open ? "CLOSE" : "MENU"}
      </button>

      {open ? (
        <div
          id={panelId}
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-ivory"
        >
          <nav aria-label="주요 메뉴 (모바일)" className="px-5 py-6">
            <ul className="divide-y divide-line">
              {primaryNav.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      // 이동과 동시에 메뉴를 닫는다 (effect 로 라우트를 감시하지 않는다)
                      onClick={() => setOpen(false)}
                      className="flex min-h-14 items-baseline gap-3 py-4"
                    >
                      <span
                        className={`eyebrow text-sm ${
                          active ? "text-brand" : "text-ink"
                        }`}
                      >
                        {item.labelEn}
                      </span>
                      <span className="text-xs text-ink-faint">
                        {item.labelKo}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
