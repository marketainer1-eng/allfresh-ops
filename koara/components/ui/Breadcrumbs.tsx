import Link from "next/link";
import type { BreadcrumbItem } from "@/content/types";

/**
 * 화면에 보이는 breadcrumb.
 * 같은 데이터로 BreadcrumbList JSON-LD 도 생성한다(각 페이지에서 호출).
 */
export function Breadcrumbs({
  items,
  tone = "light",
}: {
  items: BreadcrumbItem[];
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <nav aria-label="현재 위치" className="mb-8">
      <ol
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${
          isDark ? "text-white/60" : "text-ink-faint"
        }`}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="font-medium">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`underline-offset-4 hover:underline ${
                    isDark ? "hover:text-brand-light" : "hover:text-brand"
                  }`}
                >
                  {item.name}
                </Link>
              )}
              {!isLast ? (
                <span aria-hidden="true" className="opacity-50">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
