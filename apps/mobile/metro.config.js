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

config.watchFolders = [
  path.resolve(monorepoRoot, "packages"),
  path.resolve(projectRoot, "node_modules"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;

const PINNED_REACT = {
  react: resolveMobileReactRequest("react"),
  "react/jsx-runtime": resolveMobileReactRequest("react/jsx-runtime"),
  "react/jsx-dev-runtime": resolveMobileReactRequest("react/jsx-dev-runtime"),
  "react-dom": resolveMobileReactRequest("react-dom"),
  scheduler: resolveMobileReactRequest("scheduler"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pinned = PINNED_REACT[moduleName];
  if (pinned) {
    return { type: "sourceFile", filePath: pinned };
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
  /node_modules\/.*\/(android|ios|apple|macos|windows|gradle|ReactAndroid|ReactApple|ReactCommon|third-party-podspecs|e2e|test|tests|__tests__|flow)\/.*/,
]);

module.exports = config;
