import { Hono } from "hono";

import configRoutes from "./config.js";
import mediaRoutes from "./media.js";
import ragFilesRoutes from "./rag-files.js";
import userRoutes from "./users.js";
import weekRoutes from "./weeks.js";

const app = new Hono();

app.route("/", configRoutes);
app.route("/content/media", mediaRoutes);
app.route("/rag", ragFilesRoutes);
app.route("/", userRoutes);
app.route("/", weekRoutes);

export default app;
