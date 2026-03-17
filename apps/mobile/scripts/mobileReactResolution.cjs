const path = require("path");
const { createRequire } = require("module");

const appRequire = createRequire(path.join(__dirname, "..", "package.json"));

function safeResolve(request) {
  try {
    return appRequire.resolve(request);
  } catch {
    return null;
  }
}

const aliases = {
  react: safeResolve("react"),
  "react/jsx-runtime": safeResolve("react/jsx-runtime"),
  "react/jsx-dev-runtime": safeResolve("react/jsx-dev-runtime"),
  "react-dom": safeResolve("react-dom"),
  "react-dom/server": safeResolve("react-dom/server"),
  "react-dom/server.node": safeResolve("react-dom/server.node"),
  scheduler: safeResolve("scheduler"),
  "scheduler/unstable_mock": safeResolve("scheduler/unstable_mock"),
};

function resolveMobileReactRequest(request) {
  if (aliases[request]) {
    return aliases[request];
  }

  if (request.startsWith("react/") || request.startsWith("react-dom/") || request.startsWith("scheduler/")) {
    return safeResolve(request);
  }

  return null;
}

module.exports = {
  resolveMobileReactRequest,
};
