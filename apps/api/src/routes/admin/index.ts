import { Hono } from "hono";

import analyticsRoutes from "./analytics.js";
import configRoutes from "./config.js";
import contentBasicRoutes from "./content-basic.js";
import dashboardRoutes from "./dashboard.js";
import homeCopyRoutes from "./home-copy.js";
import knowledgeRoutes from "./knowledge.js";
import mediaRoutes from "./media.js";
import moodVariantRoutes from "./mood-variants.js";
import paraphraseRoutes from "./paraphrases.js";
import personaRoutes from "./persona.js";
import ragFilesRoutes from "./rag-files.js";
import userRoutes from "./users.js";
import weekRoutes from "./weeks.js";
import workflowConfigRoutes from "./workflow-config.js";

const app = new Hono();

app.route("/", analyticsRoutes);
app.route("/", configRoutes);
app.route("/", contentBasicRoutes);
app.route("/", dashboardRoutes);
app.route("/", homeCopyRoutes);
app.route("/", knowledgeRoutes);
app.route("/content/media", mediaRoutes);
app.route("/", moodVariantRoutes);
app.route("/", paraphraseRoutes);
app.route("/", personaRoutes);
app.route("/rag", ragFilesRoutes);
app.route("/", userRoutes);
app.route("/", weekRoutes);
app.route("/", workflowConfigRoutes);

export default app;
