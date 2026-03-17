const Module = require("module");
const { createRequire } = require("module");
const path = require("path");
const { resolveMobileReactRequest } = require("./mobileReactResolution.cjs");

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  const redirected = resolveMobileReactRequest(request);
  if (redirected) {
    return redirected;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const appRequire = createRequire(path.join(__dirname, "..", "package.json"));
process.argv = [process.argv[0], appRequire.resolve("expo/bin/cli"), "start", "--web", ...process.argv.slice(2)];
require(appRequire.resolve("expo/bin/cli"));
