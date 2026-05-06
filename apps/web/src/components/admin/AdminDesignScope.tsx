"use client";

import { useEffect, type ReactNode } from "react";

const ADMIN_SCOPE_CLASS = "admin-console-scope";

export function AdminDesignScope({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add(ADMIN_SCOPE_CLASS);
    return () => {
      document.body.classList.remove(ADMIN_SCOPE_CLASS);
    };
  }, []);

  return <div className={ADMIN_SCOPE_CLASS}>{children}</div>;
}
