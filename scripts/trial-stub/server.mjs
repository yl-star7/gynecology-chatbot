// Trial stub server — zero-dep Node HTTP that mirrors apps/api /healthz
// contract. Only used for verifying Cloud Run pipeline. Delete/replace
// with apps/api image once that builds cleanly.

import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8080);

const server = createServer((req, res) => {
  const url = req.url ?? "/";
  if (req.method === "GET" && (url === "/healthz" || url.startsWith("/healthz?"))) {
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
