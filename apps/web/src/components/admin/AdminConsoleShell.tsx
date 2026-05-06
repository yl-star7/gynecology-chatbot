"use client";

import {
  Activity,
  Bot,
  FileText,
  Images,
  LayoutDashboard,
  Menu,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/components/ui/cn";

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  {
    href: "/admin/chats",
    label: "채팅 로그",
    icon: Users,
    children: [
      { href: "/admin/chats", label: "유저 목록" },
      { href: "/admin/chats/actions", label: "액션 로그" },
    ],
  },
  {
    href: "/admin/assets",
    label: "자산 관리",
    icon: Images,
    children: [
      { href: "/admin/assets/weeks", label: "주차별" },
      { href: "/admin/assets/daily-content", label: "일별 콘텐츠" },
      { href: "/admin/assets/pools", label: "공통 풀" },
    ],
  },
  { href: "/admin/lexicon", label: "사전 (RAG)", icon: FileText },
  {
    href: "/admin/engine",
    label: "대화 엔진",
    icon: Bot,
    children: [
      { href: "/admin/engine/workflows", label: "워크플로우" },
      { href: "/admin/engine/moods", label: "기분별 변주" },
    ],
  },
  {
    href: "/admin/ops",
    label: "시스템 운영",
    icon: Activity,
    children: [
      { href: "/admin/ops/settings", label: "설정/실행" },
      { href: "/admin/ops/branding", label: "브랜딩" },
      { href: "/admin/ops/monitoring", label: "모니터링" },
      { href: "/admin/ops/audit", label: "감사 로그" },
      { href: "/admin/ops/users", label: "사용자 운영 액션" },
    ],
  },
];

interface AdminConsoleShellProps {
  adminDisplayName: string;
  currentPath: string;
  title: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

function splitHref(href: string): { path: string; query: string } {
  const idx = href.indexOf("?");
  if (idx === -1) return { path: href, query: "" };
  return { path: href.slice(0, idx), query: href.slice(idx) };
}

function isActivePath(currentPath: string, href: string) {
  const { path } = splitHref(href);
  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function isActiveSubPath(currentPath: string, href: string) {
  const { path, query } = splitHref(href);
  if (query) {
    return currentPath === `${path}${query}` || currentPath.includes(query);
  }
  return currentPath === path;
}

function SidebarContent({
  adminDisplayName,
  currentPath,
  onNavigate,
}: {
  adminDisplayName: string;
  currentPath: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          운영 제어 센터
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">관리자 콘솔</p>
      </div>

      <nav
        aria-label="관리자 탐색"
        className="flex flex-1 flex-col gap-1 overflow-y-auto"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(currentPath, item.href);
          const Icon = item.icon;

          const topClasses = cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          );

          return (
            <div key={item.href} className="flex flex-col gap-1">
              {item.children ? (
                <div className={topClasses}>
                  {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                  <span>{item.label}</span>
                </div>
              ) : (
                <a className={topClasses} href={item.href} onClick={onNavigate}>
                  {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                  <span>{item.label}</span>
                </a>
              )}

              {item.children ? (
                <div className="ml-7 flex flex-col gap-0.5 border-l border-border pl-3">
                  {item.children.map((child) => {
                    const childActive = isActiveSubPath(
                      currentPath,
                      child.href,
                    );
                    return (
                      <a
                        key={child.href}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-sm transition-colors",
                          childActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        href={child.href}
                        onClick={onNavigate}
                      >
                        {child.label}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="rounded-md border border-border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">운영자</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {adminDisplayName}
        </p>
      </div>
    </div>
  );
}

export function AdminConsoleShell({
  adminDisplayName,
  currentPath,
  title,
  onLogout,
  children,
}: AdminConsoleShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    function syncSidebarVisibility() {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    }

    syncSidebarVisibility();
    window.addEventListener("resize", syncSidebarVisibility);
    return () => window.removeEventListener("resize", syncSidebarVisibility);
  }, []);

  return (
    <div className="admin-console-shell flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <SidebarContent
          adminDisplayName={adminDisplayName}
          currentPath={currentPath}
        />
      </aside>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>관리자 탐색</SheetTitle>
          </SheetHeader>
          <SidebarContent
            adminDisplayName={adminDisplayName}
            currentPath={currentPath}
            onNavigate={() => setIsSidebarOpen(false)}
          />
        </SheetContent>

        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 shadow-sm lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SheetTrigger asChild>
                <Button
                  aria-label="사이드바 열기"
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <h2 className="truncate text-lg font-semibold text-foreground">
                {title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onLogout}
                type="button"
                variant="outline"
                size="sm"
              >
                세션 종료
              </Button>
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-6">{children}</div>
        </section>
      </Sheet>
    </div>
  );
}
