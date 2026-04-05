import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

function listFilesRecursively(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...listFilesRecursively(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

test("expo router app directory does not contain node:test files", () => {
  const appDir = join(process.cwd(), "app");
  const testFiles = listFilesRecursively(appDir)
    .filter((filePath) => filePath.endsWith(".test.ts"))
    .map((filePath) => relative(process.cwd(), filePath));

  assert.deepEqual(testFiles, []);
});
