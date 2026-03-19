const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { resolveMobileReactRequest } = require("./scripts/mobileReactResolution.cjs");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

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
