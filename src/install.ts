import { spawn } from "child_process";
import { Settings, FixedSetup } from "./constants";
import { Log, Rewrite, asyncExecWithCWD } from "./helpers";
import { Setup } from "./types";

/**
 * Assembles dependencies from the given object.
 *
 * The object must have the type `Setup`.
 *
 * The function iterates over the object, and for each property, if the `isDev`
 * property of the value object is equal to the `isDev` parameter, it adds the
 * name of the property and the supplementary dependencies to the `dependencies`
 * array.
 *
 * @param {Setup} object - The object from which to assemble dependencies.
 * @param {boolean} isDev - Whether to include or exclude development dependencies.
 * @returns {string[]} The assembled dependencies.
 */
const assembleDependencies = (object: Setup, isDev: boolean) => {
  const dependencies: string[] = [];
  for (const [, value] of Object.entries(object)) {
    if (value.isDev === isDev) {
      dependencies.push(value.name);
      for (const supplementary of value.supplementary) {
        dependencies.push(supplementary);
      }
    }
  }
  return dependencies;
};
/**
 * Installs the given dependencies with npm.
 *
 * @param {string[]} dependencies - The dependencies to install.
 * @param {boolean} isDev - Whether to install the dependencies as development dependencies or not.
 * @returns {Promise<number>} A promise which resolves with the exit code of the npm process.
 */
const Install = (dependencies: string[], isDev: boolean) => {
  return new Promise((resolve, reject) => {
    const c = spawn(
      "npm",
      [
        "install",
        ...dependencies,
        "--progress",
        ...(isDev ? ["--save-dev"] : ["--save"]),
      ],
      { stdio: "inherit", cwd: Settings.getFolder() }, // the working directory is set here
    );
    c.on("close", (code) => {
      if (code === 0) {
        Log("success", `Successfully installed ${dependencies.join(", ")}`);
        resolve(code);
      } else {
        reject(
          new Error(
            `Failed to install ${dependencies.join(", ")}, exit code: ${code}`,
          ),
        );
      }
    });
    c.on("error", (error) => {
      reject(error);
    });
  });
};

/**
 * Initializes a new git repository in the current directory.
 *
 * This function logs an informative message, runs the `git init` command,
 * and then logs a success message.
 *
 * @returns {Promise<void>} A promise which resolves when the initialization
 * is complete.
 */
const InitGit = async () => {
  Log("info", "Initializing git...");
  const command = `git init`;
  await asyncExecWithCWD(command);
};

/**
 * Sets up husky to run the pre-commit hook.
 *
 * This function logs an informative message, initializes husky using the
 * `npx husky init` command, and then writes the pre-commit script to the
 * `.husky/pre-commit` file and makes it executable.
 *
 * @returns {Promise<void>} A promise which resolves when the setup is complete.
 */
const SetupHusky = async () => {
  Log("info", "Setting up husky...");
  const preCommitScript = `npm run prettify
npm run stage-updated
npm run typecheck
npm run lint
npm run test
npm run build`;
  const command = `npx husky init`;
  await asyncExecWithCWD(command);
  // then swap .husky/pre-commit contents with the preCommitScript
  // make sure the file is executable
  await Rewrite(
    `${Settings.getFolder()}/.husky/pre-commit`,
    [/.*/],
    [preCommitScript],
  );
  await asyncExecWithCWD(`chmod +x .husky/pre-commit`);
};

/**
 * Installs the dependencies for the generated package.
 *
 * This function logs informative messages, installs the development and
 * production dependencies, installs `@types/node` if the target is Node.js,
 * initializes a new git repository in the current directory, and sets up
 * husky to run the pre-commit hook.
 *
 * @returns {Promise<void>} A promise which resolves when the installation
 * is complete.
 */
export const InstallDependencies = async () => {
  const devDependencies = assembleDependencies(FixedSetup, true);
  const prodDependencies = assembleDependencies(FixedSetup, false);
  Log("info", "Installing dependencies...");
  if (devDependencies.length > 0) {
    Log("info", `Installing development dependencies...`);
    await Install(devDependencies, true);
  }
  if (prodDependencies.length > 0) {
    Log("info", `Installing production dependencies...`);
    await Install(prodDependencies, false);
  }
  if (Settings.target === "node") {
    Log("info", "Installing @types/node...");
    await Install(["@types/node"], true);
  }
  await InitGit();
  await SetupHusky();
};
