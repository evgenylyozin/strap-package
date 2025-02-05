import { Log, ReportErrorAndExit, asyncExec, asyncLookup } from "./helpers";

// some check functions
const checkGitAvailable = async () => {
  try {
    Log("info", "Checking if git is available...");
    await asyncExec("which git");
    Log("success", "Git is available");
  } catch {
    Log("error", "Git is not available");
    Log(
      "info",
      "Strap-package uses git to clone the template files so you need to have git installed",
    );
    process.exit(1);
  }
};
const checkIfOnline = async () => {
  try {
    Log("info", "Checking if you are online...");
    await asyncLookup("registry.npmjs.org");
    Log("success", "You are online");
  } catch {
    Log(
      "error",
      "You appear to be offline. Please connect to use strap-package...",
    );
    process.exit(1);
  }
};
const checkNodeVersion = () => {
  const currentNodeVersion = process.versions.node;
  const LTSNodeVersion = process.release.sourceUrl
    .split("node-v")[1]
    .replace(".tar.gz", "");
  Log("info", "Checking Node version to be LTS...");
  if (currentNodeVersion !== LTSNodeVersion) {
    // if not LTS then ask to use LTS node
    Log(
      "error",
      `You are running Node ${currentNodeVersion}`,
      "Strap-package requires LTS Node to be used.",
      `Currently the LTS version is ${LTSNodeVersion}`,
      "Please update your version of Node.",
    );
    process.exit(1);
  }
  Log("success", "You are running Node", currentNodeVersion, "which is LTS");
};

export const Checks = async () => {
  try {
    // first goes the online check
    await checkIfOnline();
    // then check that current node is LTS
    checkNodeVersion();
    // check if git command is available
    await checkGitAvailable();
  } catch (error) {
    ReportErrorAndExit(error, "Something went wrong while running checks");
  }
};
