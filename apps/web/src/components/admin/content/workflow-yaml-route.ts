import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

type WorkflowRule = AdminDashboardData["workflowRules"][number];

function yamlRouteNameFromSlug(slug: string | null | undefined) {
  const routeName = slug?.replace(/^maternal-nursing-/, "");
  if (
    routeName === "monolith" ||
    routeName === "router" ||
    routeName === "baby-info" ||
    routeName === "letter-reflection" ||
    routeName === "free-chat" ||
    routeName === "general"
  ) {
    return routeName;
  }
  return null;
}

export function getWorkflowYamlEditorRouteName(rule: WorkflowRule | undefined) {
  const slugRouteName = yamlRouteNameFromSlug(rule?.sqlSlug);
  if (slugRouteName) return slugRouteName;
  if (rule?.workflowKind === "monolith") return "monolith";
  if (rule?.workflowKind === "router") return "router";
  return null;
}
