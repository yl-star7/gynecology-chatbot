import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const WEB_ROOT = process.cwd();
const SOURCE_FILE_PATTERN = /\.(?:js|jsx|ts|tsx)$/;
const BOUNDARY_TEST_PATH = "src/lib/admin/design-boundary.test.ts";

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...collectSourceFiles(entryPath));
    } else if (SOURCE_FILE_PATTERN.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function toRelativePath(filePath: string) {
  return path.relative(WEB_ROOT, filePath).split(path.sep).join("/");
}

function isAdminShadcnAllowed(relativePath: string) {
  return (
    relativePath.startsWith("app/admin/") ||
    relativePath.startsWith("src/components/admin/") ||
    relativePath.startsWith("src/components/ui/") ||
    relativePath === "src/components/AdminLoginView.tsx"
  );
}

function isAdminSurface(relativePath: string) {
  return (
    relativePath.startsWith("app/admin/") ||
    relativePath.startsWith("src/components/admin/") ||
    relativePath.startsWith("src/components/Admin") ||
    relativePath.startsWith("src/components/ui/")
  );
}

describe("admin/mobile design boundary", () => {
  it("keeps shadcn UI imports on admin-only web surfaces", () => {
    const sourceFiles = [
      ...collectSourceFiles(path.join(WEB_ROOT, "app")),
      ...collectSourceFiles(path.join(WEB_ROOT, "src")),
    ];
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const relativePath = toRelativePath(filePath);
      if (relativePath === BOUNDARY_TEST_PATH) continue;

      const source = readFileSync(filePath, "utf8");

      if (
        source.includes("@/components/ui") &&
        !isAdminShadcnAllowed(relativePath)
      ) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps admin console scope classes on admin-only web surfaces", () => {
    const sourceFiles = [
      ...collectSourceFiles(path.join(WEB_ROOT, "app")),
      ...collectSourceFiles(path.join(WEB_ROOT, "src")),
    ];
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const relativePath = toRelativePath(filePath);
      if (relativePath === BOUNDARY_TEST_PATH) continue;

      const source = readFileSync(filePath, "utf8");

      if (
        /\badmin-console-(?:scope|shell)\b/.test(source) &&
        relativePath !== "app/globals.css" &&
        !isAdminShadcnAllowed(relativePath)
      ) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps shadcn support dependencies on admin UI surfaces", () => {
    const sourceFiles = [
      ...collectSourceFiles(path.join(WEB_ROOT, "app")),
      ...collectSourceFiles(path.join(WEB_ROOT, "src")),
    ];
    const violations: string[] = [];
    const supportPatterns = [
      /\bshadcn\b/i,
      /from\s+["']tailwind-merge["']/,
      /from\s+["']class-variance-authority["']/,
    ];

    for (const filePath of sourceFiles) {
      const relativePath = toRelativePath(filePath);
      if (relativePath === BOUNDARY_TEST_PATH) continue;

      const source = readFileSync(filePath, "utf8");
      const hasSupportCode = supportPatterns.some((pattern) =>
        pattern.test(source),
      );

      if (hasSupportCode && !isAdminShadcnAllowed(relativePath)) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not keep shadcn support hooks in the shared web hooks directory", () => {
    expect(existsSync(path.join(WEB_ROOT, "src/hooks/use-toast.ts"))).toBe(
      false,
    );
  });

  it("keeps admin panel backgrounds opaque", () => {
    const sourceFiles = [
      ...collectSourceFiles(path.join(WEB_ROOT, "app")),
      ...collectSourceFiles(path.join(WEB_ROOT, "src")),
    ];
    const violations: string[] = [];
    const translucentBackgroundPattern =
      /\bbg-(?:background|card|muted|popover|white|black|primary(?:-\d+)?|secondary(?:-\d+)?|accent(?:-\d+)?|neutral(?:-\d+)?|\[[^\]]+\])\/(?:[1-9]\d?|100)\b/g;

    for (const filePath of sourceFiles) {
      const relativePath = toRelativePath(filePath);
      if (relativePath === BOUNDARY_TEST_PATH || !isAdminSurface(relativePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      const matches = source.match(translucentBackgroundPattern) ?? [];
      for (const match of matches) {
        const isModalScrim =
          match === "bg-black/30" &&
          (relativePath === "src/components/ui/dialog.tsx" ||
            relativePath === "src/components/ui/sheet.tsx");
        if (isModalScrim) continue;

        violations.push(`${relativePath}: ${match}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
