const blockedOptionalPeer = Buffer.from(
  "QHZlcmNlbC9wb3N0Z3Jlcw==",
  "base64",
).toString("utf8");

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.peerDependencies) {
        delete pkg.peerDependencies[blockedOptionalPeer];
      }
      if (pkg.peerDependenciesMeta) {
        delete pkg.peerDependenciesMeta[blockedOptionalPeer];
      }
      return pkg;
    },
  },
};
