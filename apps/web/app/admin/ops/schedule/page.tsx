import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminOpsScheduleRoute() {
  redirect("/admin/ops/monitoring");
}
