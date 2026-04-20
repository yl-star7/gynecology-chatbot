// Trial stub server — zero-dep Node HTTP that mirrors apps/api /healthz
// contract. Only used for verifying Cloud Run pipeline. Delete/replace
// with apps/api image once that builds cleanly.
//
// Note: Cloud Run's Google Front End intercepts GET /healthz on *.run.app
// hosts and returns its own 404 before the request reaches the container.
// We therefore also expose /_health and /livez which do hit our server,
// so the pipeline smoke test is verifiable.

import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8080);

const HEALTH_PATHS = new Set(["/healthz", "/_health", "/livez", "/readyz"]);

const server = createServer((req, res) => {
  const rawUrl = req.url ?? "/";
  const path = rawUrl.split("?")[0];
  if (req.method === "GET" && HEALTH_PATHS.has(path)) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
});

server.listen(port, () => {
  console.log(`trial-stub listening on :${port}`);
});
