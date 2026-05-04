import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceRoots = ["app", "src"]
  .map((sourceRoot) => path.join(mobileRoot, sourceRoot))
  .filter((sourceRoot) => statSync(sourceRoot, { throwIfNoEntry: false }));

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const forbiddenBareImports = [
  /^@\//,
  /^next(\/|$)/,
  /^lucide-react$/,
  /^@radix-ui\//,
  /^class-variance-authority$/,
  /^tailwind-merge$/,
  /^@gynecology-chatbot\/(admin|web)(\/|$)/,
];

function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    return sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function readImportSpecifiers(filePath) {
  const source = readFileSync(filePath, "utf8");
  const specifiers = [];
  const importPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(importPattern)) {
    specifiers.push(match[1] ?? match[2] ?? match[3]);
  }

  return specifiers;
}

test("mobile source does not import web or admin design surfaces", () => {
  const violations = [];

  for (const filePath of sourceRoots.flatMap(listSourceFiles)) {
    for (const specifier of readImportSpecifiers(filePath)) {
      if (specifier.startsWith(".")) {
        const resolvedPath = path.resolve(path.dirname(filePath), specifier);
        if (!resolvedPath.startsWith(`${mobileRoot}${path.sep}`)) {
          violations.push(
            `${path.relative(mobileRoot, filePath)} imports outside apps/mobile: ${specifier}`,
          );
        }
        continue;
      }

      if (forbiddenBareImports.some((pattern) => pattern.test(specifier))) {
        violations.push(
          `${path.relative(mobileRoot, filePath)} imports forbidden design surface: ${specifier}`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});
