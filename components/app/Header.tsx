"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface HeaderUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

const LABEL_MAP: Record<string, string> = {
  app: "대시보드",
  projects: "프로젝트",
  new: "새로 만들기",
  diagnosis: "진단",
  flow: "고객 여정",
  symptoms: "증상 수집",
  analysis: "병목 분석",
  tickets: "개선 티켓",
  rechecks: "효과 검증",
  reports: "리포트",
};

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = LABEL_MAP[seg] ?? (seg.length > 24 ? "상세" : seg);
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

export default function AppHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs(pathname);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
      <nav className="flex items-center gap-1.5 text-sm overflow-x-auto">
        <Link href="/app" className="text-gray-400 hover:text-brand transition-colors flex-shrink-0">
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbs.slice(1).map((crumb, i, arr) => (
          <span key={crumb.href} className="flex items-center gap-1.5 flex-shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            {i === arr.length - 1 ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-400 hover:text-brand transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>
        <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {user.name?.[0] ?? "U"}
          </span>
        </div>
      </div>
    </header>
  );
}
