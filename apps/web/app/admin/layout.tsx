import type { ReactNode } from "react";

import { AdminDesignScope } from "@/components/admin/AdminDesignScope";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminDesignScope>{children}</AdminDesignScope>;
}
