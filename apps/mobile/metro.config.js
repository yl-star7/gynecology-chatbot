const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");
const {
  resolveMobileReactRequest,
} = require("./scripts/mobileReactResolution.cjs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);
const escapePath = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const vendorReactRoot = path.join(projectRoot, "src", "vendor", "react");
const vendorSchedulerRoot = path.join(projectRoot, "src", "vendor", "scheduler");
const mobileReactPackageRoots = [
  path.dirname(resolveMobileReactRequest("react")),
  path.dirname(resolveMobileReactRequest("react-dom")),
  path.dirname(resolveMobileReactRequest("scheduler")),
];
const mobileRuntimeShims = {
  react: path.join(vendorReactRoot, "index.js"),
  "react/jsx-runtime": path.join(vendorReactRoot, "jsx-runtime.js"),
  "react/jsx-dev-runtime": path.join(vendorReactRoot, "jsx-dev-runtime.js"),
  scheduler: path.join(vendorSchedulerRoot, "index.js"),
  "scheduler/unstable_mock": path.join(vendorSchedulerRoot, "unstable_mock.js"),
  "scheduler/unstable_post_task": path.join(vendorSchedulerRoot, "unstable_post_task.js"),
};

config.watchFolders = [
  path.resolve(monorepoRoot, "packages"),
  path.resolve(projectRoot, "node_modules"),
  ...mobileReactPackageRoots,
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const mobileReactPath = mobileRuntimeShims[moduleName];

  if (mobileReactPath) {
    return {
      type: "sourceFile",
      filePath: mobileReactPath,
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.dirname(resolveMobileReactRequest("react")),
  "react-dom": path.dirname(resolveMobileReactRequest("react-dom")),
  scheduler: path.dirname(resolveMobileReactRequest("scheduler")),
};

const excludedRoots = [
  path.join(projectRoot, "ios"),
  path.join(projectRoot, "android"),
  path.join(projectRoot, "builds"),
  path.join(projectRoot, "dist"),
  path.join(projectRoot, ".expo"),
  path.join(monorepoRoot, "apps", "web", ".next"),
  path.join(monorepoRoot, "apps", "web", "playwright-report"),
  path.join(monorepoRoot, "test-results"),
  path.join(monorepoRoot, "output"),
];

config.resolver.blockList = exclusionList([
  ...excludedRoots.map((root) => new RegExp(`^${escapePath(root)}(/.*)?$`)),
  new RegExp(`^${escapePath(path.join(monorepoRoot, "node_modules", "react"))}(/.*)?$`),
  new RegExp(`^${escapePath(path.join(monorepoRoot, "node_modules", "react-dom"))}(/.*)?$`),
  new RegExp(`^${escapePath(path.join(monorepoRoot, "node_modules", "scheduler"))}(/.*)?$`),
  /node_modules\/.*\/(android|ios|apple|macos|windows|gradle|ReactAndroid|ReactApple|ReactCommon|third-party-podspecs|e2e|test|tests|__tests__|flow)\/.*/,
]);

module.exports = config;
