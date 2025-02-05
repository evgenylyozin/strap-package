import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import { Settings, FixedSetup } from "./constants";
import { Log, asyncExec } from "./helpers";
import { Setup } from "./types";

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
const Install = (dependencies: string[]) => {
  return new Promise((resolve, reject) => {
    const c = spawn(
      "npm",
      ["install", ...dependencies, "--save-dev", "--progress"],
      { stdio: "inherit", cwd: Settings.getFolder() },
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

const InstallTypesForNodeTarget = async () => {
  Log("info", "Installing @types/node...");
  const command = `cd ${Settings.getFolder()} && npm install @types/node --save-dev`;
  await asyncExec(command);
  Log("success", "Successfully installed @types/node");
};

const SetupHusky = async () => {
  Log("info", "Setting up husky...");
  const preCommitScript = `npm run prettify
npm run stage-updated
npm run typecheck
npm run lint
npm run test
npm run build`;
  const command = `cd ${Settings.getFolder()} && npx husky init`;
  await asyncExec(command);
  // then swap .husky/pre-commit contents with the preCommitScript
  // make sure the file is executable
  const preCommitPath = `${Settings.getFolder()}/.husky/pre-commit`;
  await writeFile(preCommitPath, preCommitScript);
  await asyncExec(`chmod +x ${preCommitPath}`);
};

const InitGit = async () => {
  Log("info", "Initializing git...");
  const command = `cd ${Settings.getFolder()} && git init`;
  await asyncExec(command);
};

export const InstallDependencies = async () => {
  const devDependencies = assembleDependencies(FixedSetup, true);
  const prodDependencies = assembleDependencies(FixedSetup, false);
  Log("info", "Installing dependencies...");
  if (devDependencies.length > 0) {
    Log("info", `Installing development dependencies...`);
    await Install(devDependencies);
  }
  if (prodDependencies.length > 0) {
    Log("info", `Installing production dependencies...`);
    await Install(prodDependencies);
  }
  if (Settings.target === "node") await InstallTypesForNodeTarget();
  await InitGit();
  await SetupHusky();
};
