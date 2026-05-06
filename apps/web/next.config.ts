import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/api/internal/workflows/sync": [
      "../../packages/mobile-api/src/workflows/maternal-nursing.yaml",
    ],
    "/api/admin/workflow-rules/refresh-yaml": [
      "../../packages/mobile-api/src/workflows/maternal-nursing.yaml",
    ],
  },
};

export default nextConfig;
