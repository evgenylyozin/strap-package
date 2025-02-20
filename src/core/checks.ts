import { lookup } from "dns/promises";
import { Log, ReportErrorAndExit, asyncExec } from "./helpers.js";

export const checkScriptAvailable = async (scriptName: string) => {
  try {
    Log("info", `Checking if ${scriptName} is available...`);
    await asyncExec(`which ${scriptName}`);
    Log("success", `${scriptName} is available`);
  } catch (e) {
    Log("error", `${scriptName} is not available`);
    throw e;
  }
};
/**
 * Checks if the git command is available.
 *
 * It does this by running the `which git` command and checking if it succeeds.
 * If it does, then git is available and the function logs a success message.
 * If it does not, then git is not available and the function logs an error
 * message and exits with a non-zero exit status.
 *
 * Git is required by strap-package to clone the template files.
 */
const checkGitAvailable = async () => {
  try {
    await checkScriptAvailable("git");
  } catch {
    Log(
      "info",
      "Strap-package uses git to clone the template files so you need to have git installed",
    );
    process.exit(1);
  }
};
/**
 * Checks if the system is online by attempting to resolve the DNS
 * for `registry.npmjs.org`.
 *
 * If the resolution is successful, it logs a success message indicating
 * that the system is online. If the resolution fails, it logs an error
 * message indicating that the system is offline and exits the process.
 */
export const checkIfOnline = async (lookupDomain = "registry.npmjs.org") => {
  try {
    Log("info", "Checking if you are online...");
    await lookup(lookupDomain);
    Log("success", "You are online");
  } catch (e) {
    Log(
      "error",
      "You appear to be offline. Please connect to use strap-package...",
    );
    throw e;
  }
};
/**
 * Checks if the current Node.js version is the Long Term Support (LTS) version.
 *
 * This function retrieves the current Node.js version and compares it with
 * the LTS version specified in the process release metadata. If the current
 * version is not the LTS version, it logs an error message and exits the
 * process with a non-zero status. If the current version is the LTS version,
 * it logs a success message.
 */
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

/**
 * Runs a series of checks to ensure that the environment is suitable for
 * strap-package to run.
 *
 * The checks are:
 * 1. Checks if the system is online by attempting to resolve the DNS
 *    for `registry.npmjs.org`.
 * 2. Checks if the current Node.js version is the Long Term Support (LTS)
 *    version.
 * 3. Checks if the git command is available.
 *
 * If any of the checks fail, the function logs an error message and exits
 * the process with a non-zero status code.
 */
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
