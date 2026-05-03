"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, CalendarDays, Zap,
  BarChart3, FolderOpen, LogOut, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  role?: string;
  workspaceName?: string;
}

const navItems = [
  {
    group: "과일 운영",
    items: [
      { href: "/app", icon: LayoutDashboard, label: "대시보드", exact: true },
      { href: "/app/fruits", icon: Package, label: "과일 포트폴리오" },
      { href: "/app/calendar", icon: CalendarDays, label: "과일 캘린더" },
      { href: "/app/campaigns", icon: Zap, label: "캠페인 관리" },
      { href: "/app/reports", icon: BarChart3, label: "성과 리포트" },
    ],
  },
  {
    group: "고객경험 진단",
    items: [
      { href: "/app/projects", icon: FolderOpen, label: "진단 프로젝트" },
    ],
  },
];

export default function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">OF</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">올프레쉬 OPS</p>
            <p className="text-xs text-gray-400 leading-tight">
              {user.workspaceName ?? "워크스페이스"}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navItems.map((group) => {
          const isAux = group.group === "고객경험 진단";
          return (
            <div key={group.group}>
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wider px-3 mb-2",
                isAux ? "text-gray-300" : "text-gray-400"
              )}>
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                        active
                          ? "bg-brand-muted text-brand font-medium"
                          : isAux
                          ? "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          active ? "text-brand" : "text-gray-300 group-hover:text-gray-500"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-brand" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user.name?.[0] ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
