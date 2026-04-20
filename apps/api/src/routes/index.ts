import type { Hono } from "hono";
import authRoutes from "./mobile/auth.js";
import onboardingRoutes from "./mobile/onboarding.js";
import contentItemsRoutes from "./mobile/content-items.js";
import linkRoutes from "./mobile/link.js";
import brandingRoutes from "./mobile/branding.js";
import profileRoutes from "./mobile/profile.js";
import pushRoutes from "./mobile/push.js";
import weeksRoutes from "./mobile/weeks.js";
import homeRoutes from "./mobile/home.js";
import todayRoutes from "./mobile/today.js";
import sessionsRoutes from "./mobile/sessions.js";
import chatRoutes from "./mobile/chat.js";
import recordsRoutes from "./mobile/records.js";
import dailySummaryRoutes from "./internal/daily-summary.js";

export function mountMobileRoutes(app: Hono) {
  app.route("/api/mobile/auth", authRoutes);
  app.route("/api/mobile/onboarding", onboardingRoutes);
  app.route("/api/mobile/content-items", contentItemsRoutes);
  app.route("/api/mobile/link", linkRoutes);
  app.route("/api/mobile/branding", brandingRoutes);
  app.route("/api/mobile/profile", profileRoutes);
  app.route("/api/mobile/push", pushRoutes);
  app.route("/api/mobile/weeks", weeksRoutes);
  app.route("/api/mobile/home", homeRoutes);
  app.route("/api/mobile/today", todayRoutes);
  app.route("/api/mobile/sessions", sessionsRoutes);
  app.route("/api/mobile/chat", chatRoutes);
  app.route("/api/mobile/records", recordsRoutes);
  app.route("/api/internal/daily-summary", dailySummaryRoutes);
}
