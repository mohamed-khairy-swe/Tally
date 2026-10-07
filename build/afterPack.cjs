const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "linux") return;

  const appOutDir = context.appOutDir;
  const execName = context.packager.executableName || "tally";
  const originalExec = path.join(appOutDir, execName);
  const binaryExec = path.join(appOutDir, `${execName}-bin`);

  if (fs.existsSync(originalExec) && !fs.existsSync(binaryExec)) {
    fs.renameSync(originalExec, binaryExec);

    const wrapperContent = `#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/${execName}-bin" --no-sandbox --ozone-platform=x11 "$@"
`;
    fs.writeFileSync(originalExec, wrapperContent, { mode: 0o755 });
    fs.chmodSync(originalExec, 0o755);
    fs.chmodSync(binaryExec, 0o755);
    console.log(`[afterPack] Successfully created Linux startup wrapper for ${execName}`);
  }
};
