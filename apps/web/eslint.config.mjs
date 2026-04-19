import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "**/.next/**",
      "dist/**",
      "**/dist/**",
      "node_modules/**",
      "**/node_modules/**",
      "coverage/**",
      "**/coverage/**",
      "playwright-report/**",
      "**/playwright-report/**",
      "test-results/**",
      "**/test-results/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
