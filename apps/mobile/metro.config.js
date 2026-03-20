const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { resolveMobileReactRequest } = require("./scripts/mobileReactResolution.cjs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolved = resolveMobileReactRequest(moduleName);
  if (resolved) {
    return context.resolveRequest(context, resolved, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.dirname(resolveMobileReactRequest("react")),
  "react-dom": path.dirname(resolveMobileReactRequest("react-dom")),
  scheduler: path.dirname(resolveMobileReactRequest("scheduler")),
};

module.exports = config;
