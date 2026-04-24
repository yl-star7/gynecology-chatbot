"use client";

import { useEffect, useState, type ReactNode } from "react";

import styles from "./AdminConsoleLayout.module.css";

type NavItem = {
  href: string;
  label: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/users", label: "사용자 관리" },
  {
    href: "/admin/content",
    label: "콘텐츠",
    children: [
      { href: "/admin/content", label: "전체" },
      { href: "/admin/content?tag=week", label: "주차별" },
      { href: "/admin/content?tag=note", label: "지식 안내문" },
      { href: "/admin/content?tag=rag", label: "RAG 참조" },
      { href: "/admin/content?tag=lexicon", label: "자유 검색 사전" },
    ],
  },
  {
    href: "/admin/engine",
    label: "대화 엔진",
    children: [
      { href: "/admin/engine/workflows", label: "워크플로우" },
      { href: "/admin/engine/moods", label: "기분별 변주" },
      { href: "/admin/engine/copy", label: "홈/프롬프트 문구" },
    ],
  },
  {
    href: "/admin/assets",
    label: "자산",
    children: [
      { href: "/admin/assets/images", label: "이미지" },
      { href: "/admin/assets/uploads", label: "업로드 원본" },
      { href: "/admin/assets/settings", label: "스토리지 설정" },
    ],
  },
  {
    href: "/admin/ops",
    label: "운영",
    children: [
      { href: "/admin/ops/monitoring", label: "모니터링" },
      { href: "/admin/ops/audit", label: "감사 로그" },
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
    // Query-string sub-items are decorative for now; active only when currentPath
    // contains the exact query literal (e.g. "/admin/content?tag=week").
    return currentPath === `${path}${query}` || currentPath.includes(query);
  }
  return currentPath === path;
}

export function AdminConsoleShell({
  adminDisplayName,
  currentPath,
  title,
  onLogout,
  children,
}: AdminConsoleShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    function syncSidebarVisibility() {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }

    syncSidebarVisibility();
    window.addEventListener("resize", syncSidebarVisibility);
    return () => window.removeEventListener("resize", syncSidebarVisibility);
  }, []);

  return (
    <main className={styles.consoleRoot}>
      {isSidebarOpen ? (
        <button
          aria-label="사이드바 닫기"
          className={styles.sidebarBackdrop}
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ""}`}
      >
        <div>
          <h1 className={styles.brandHeading}>운영 제어 센터</h1>
        </div>

        <nav aria-label="관리자 탐색" className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(currentPath, item.href);

            return (
              <div key={item.href} className={styles.navGroup}>
                {item.children ? (
                  <div
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  >
                    {item.label}
                  </div>
                ) : (
                  <a
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    href={item.href}
                  >
                    {item.label}
                  </a>
                )}

                {item.children ? (
                  <div className={styles.subnav}>
                    {item.children.map((child) => (
                      <a
                        key={child.href}
                        className={`${styles.subnavItem} ${
                          isActiveSubPath(currentPath, child.href)
                            ? styles.subnavItemActive
                            : ""
                        }`}
                        href={child.href}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className={styles.sideNote}>
          <span className={styles.metaLabel}>운영자</span>
          <strong>{adminDisplayName}</strong>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLead}>
            <button
              aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
              className={styles.sidebarToggle}
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
            >
              {isSidebarOpen ? "닫기" : "메뉴"}
            </button>
            <h2 className={styles.topbarHeading}>{title}</h2>
          </div>

          <div className={styles.topbarActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onLogout}
            >
              세션 종료
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}
