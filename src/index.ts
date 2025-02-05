#!/usr/bin/env node
import { confirm, select, input } from "@inquirer/prompts";
import { promisify } from "util";
import { lookup } from "dns";
import { exec, spawn } from "child_process";
import { readFile, writeFile } from "fs/promises";
import * as validate from "validate-npm-package-name";
import chalk from "chalk";
const asyncLookup = promisify(lookup);
const asyncExec = promisify(exec);

type ToolInfo = {
  name: string;
  supplementary: string[];
  isDev: boolean;
};
type Setup = {
  language: ToolInfo;
  testRunner: ToolInfo;
  linter: ToolInfo;
  formatter: ToolInfo;
  buildTool: ToolInfo;
  hooksTool: ToolInfo;
};
// the tools which will be installed
// in any case
const FixedSetup: Setup = {
  language: {
    name: "typescript",
    supplementary: [],
    isDev: true,
  },
  testRunner: {
    name: "vitest",
    supplementary: [],
    isDev: true,
  },
  linter: {
    name: "eslint",
    supplementary: ["@eslint/js", "typescript-eslint"],
    isDev: true,
  },
  formatter: {
    name: "prettier",
    supplementary: [],
    isDev: true,
  },
  buildTool: {
    name: "webpack",
    supplementary: ["ts-loader", "webpack-cli"],
    isDev: true,
  },
  hooksTool: {
    name: "husky",
    supplementary: [],
    isDev: true,
  },
};

// only settings which are customizable
type Settings = {
  name: string;
  target: "node" | "browser";
};
const Settings: Settings = {
  name: "default-package",
  target: "node", // affects webpack target and installed types
};

const LogEmptyLines = (count: number) => {
  for (let i = 0; i < count; i++) {
    console.log("");
  }
};
const ErrorLog = (...messages: string[]) => {
  LogEmptyLines(1);
  for (const message of messages) {
    console.log(chalk.red(message));
  }
};
const WarningLog = (...messages: string[]) => {
  for (const message of messages) {
    console.log(chalk.yellow(message));
  }
};
const SuccessLog = (...messages: string[]) => {
  for (const message of messages) {
    console.log(chalk.green(message));
  }
};
const InfoLog = (...messages: string[]) => {
  LogEmptyLines(1);
  for (const message of messages) {
    console.log(chalk.blue(message));
  }
};
const HeaderLog = (message: string) => {
  LogEmptyLines(2);
  console.log(chalk.bold.underline(message));
};
const SubHeaderLog = (message: string) => {
  LogEmptyLines(1);
  console.log(chalk.bold(message));
  LogEmptyLines(1);
};

const IsSetup = (s: Settings | Setup): s is Setup => {
  return "language" in s;
};
const FormattedSettings = (settingsObject: Settings | Setup) => {
  const s = {
    ...settingsObject,
  };
  if (IsSetup(s)) {
    // format the setup more concisely
    for (const [key, value] of Object.entries(s)) {
      s[key] = value.name;
    }
  }
  return JSON.stringify(s, null, 2);
};

const Naming = async (shouldCheck: boolean): Promise<string> => {
  const name = await input({
    message: "What is the desired name of the package?",
    default: "default-package",
  });
  if (shouldCheck) {
    InfoLog("Checking if the package name is valid...");
    const { validForNewPackages, errors, warnings } = validate(name); // check for name validity
    if (!validForNewPackages) {
      ErrorLog("Invalid package name for new package!");
      if (errors) {
        ErrorLog("Errors:", ...errors);
      }
      if (warnings) {
        WarningLog("Warnings:", ...warnings);
      }
      InfoLog("Try another name...");
      return await Naming(shouldCheck);
    }
    SuccessLog("Selected package name is valid");
    // check for name availability
    InfoLog("Checking if the package name is available...");
    const responseData = (await (
      await fetch(`http://registry.npmjs.org/${name}`)
    ).json()) as { name?: string };
    if (responseData && responseData.name) {
      ErrorLog("Package name already taken!");
      InfoLog(`See https://www.npmjs.com/package/${name}`);
      InfoLog("Try another name...");
      return await Naming(shouldCheck);
    }
    SuccessLog("Selected package name is available");
  }
  // all is fine, set the selected name to the Settings object
  return name;
};

const checkGitAvailable = async () => {
  try {
    InfoLog("Checking if git is available...");
    await asyncExec("which git");
    SuccessLog("Git is available");
  } catch {
    ErrorLog("Git is not available");
    InfoLog(
      "Strap-package uses git to clone the template files so you need to have git installed",
    );
    process.exit(1);
  }
};

const PrepareFolder = async (name: string) => {
  InfoLog("Preparing folder for the package...");
  const command = `mkdir ${name} && cd ${name} && git clone --depth=1 https://github.com/evgenylyozin/strap-package-template.git . && rm -rf .git`;
  await asyncExec(command);
};

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
const Install = (folderName: string, dependencies: string[]) => {
  return new Promise((resolve, reject) => {
    const c = spawn(
      "npm",
      ["install", ...dependencies, "--save-dev", "--progress"],
      { stdio: "inherit", cwd: folderName },
    );
    c.on("close", (code) => {
      if (code === 0) {
        SuccessLog(`Successfully installed ${dependencies.join(", ")}`);
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
const InstallDependencies = async (folderName: string) => {
  const devDependencies = assembleDependencies(FixedSetup, true);
  const prodDependencies = assembleDependencies(FixedSetup, false);
  InfoLog("Installing dependencies...");
  if (devDependencies.length > 0) {
    InfoLog(`Installing development dependencies...`);
    await Install(folderName, devDependencies);
  }
  if (prodDependencies.length > 0) {
    InfoLog(`Installing production dependencies...`);
    await Install(folderName, prodDependencies);
  }
};
const ModifyTargetInWebpackConfig = async (
  name: string,
  target: "node" | "browser",
) => {
  const webpackConfigPath = `${name}/webpack.config.js`;
  const webpackConfig = (await readFile(webpackConfigPath)).toString();
  const newWebpackConfig = webpackConfig.replace(
    /target: "node",/g,
    `target: "${target}",`,
  );
  await writeFile(webpackConfigPath, newWebpackConfig);
};
const ModifyTsConfigAccordingToTarget = async (
  name: string,
  target: "node" | "browser",
) => {
  // if target is "browser" then do the following modifications:
  // "moduleResolution": "nodenext", => "moduleResolution": "bundler",
  // "module": "NodeNext", => "module": "ESNext",
  if (target === "browser") {
    InfoLog("Modifying tsconfig.json...");
    const tsConfigPath = `${name}/tsconfig.json`;
    const tsConfig = (await readFile(tsConfigPath)).toString();
    const newTsConfig = tsConfig
      .replace(
        /"moduleResolution": "nodenext",/g,
        `"moduleResolution": "bundler",`,
      )
      .replace(/"module": "NodeNext",/g, `"module": "ESNext",`);
    await writeFile(tsConfigPath, newTsConfig);
  }
};

const InstallTypesForNodeTarget = async (name: string) => {
  InfoLog("Installing @types/node...");
  const command = `cd ${name} && npm install @types/node --save-dev`;
  await asyncExec(command);
  SuccessLog("Successfully installed @types/node");
};
const AdjustPackageTemplateForTarget = async (
  name: string,
  target: "node" | "browser",
) => {
  InfoLog("Adjusting webpack config...");
  await ModifyTargetInWebpackConfig(name, target);
  await ModifyTsConfigAccordingToTarget(name, target);
  if (target === "node") await InstallTypesForNodeTarget(name);
};

const SetupHusky = async (name: string) => {
  InfoLog("Setting up husky...");
  const preCommitScript = `npm run prettify
npm run stage-updated
npm run typecheck
npm run lint
npm run test
npm run build`;
  const command = `cd ${name} && npx husky init`;
  await asyncExec(command);
  // then swap .husky/pre-commit contents with the preCommitScript
  // make sure the file is executable
  const preCommitPath = `${name}/.husky/pre-commit`;
  await writeFile(preCommitPath, preCommitScript);
  await asyncExec(`chmod +x ${preCommitPath}`);
};
const ReturnFolderNameAndPackageName = (name: string) => {
  const folderName = name.startsWith("@") ? name.split("/")[1] : name;
  return { folderName, packageName: name };
};
const InitGit = async (name: string) => {
  InfoLog("Initializing git...");
  const command = `cd ${name} && git init`;
  await asyncExec(command);
};
const AdjustPackageTemplateForName = async (
  packageFolder: string,
  packageName: string,
) => {
  InfoLog("Adjusting package template to use the package name...");
  // set the name of the package in package.json
  const packageJsonPath = `${packageFolder}/package.json`;
  const packageJson = JSON.parse(
    (await readFile(packageJsonPath)).toString(),
  ) as {
    name: string;
  };
  packageJson.name = packageName;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  // then change the [PACKAGE NAME] in README.md
  const readmePath = `${packageFolder}/README.md`;
  const readme = (await readFile(readmePath)).toString();
  const newReadme = readme.replace("[PACKAGE NAME]", packageName);
  await writeFile(readmePath, newReadme);
};
const AdjustPackageTemplate = async (settings: Settings) => {
  const { name, target } = settings;
  const { folderName, packageName } = ReturnFolderNameAndPackageName(name);

  InfoLog("Adjusting package template...");
  await AdjustPackageTemplateForName(folderName, packageName);
  await AdjustPackageTemplateForTarget(folderName, target);
  await InitGit(folderName);
  await SetupHusky(folderName);
};
(async () => {
  try {
    HeaderLog(
      chalk.bold.bgWhite.black(
        "Create an npm package boilerplate with strap-package",
      ),
    );
    // first goes the online check
    const checkIfOnline = async () => {
      try {
        InfoLog("Checking if you are online...");
        await asyncLookup("registry.npmjs.org");
        SuccessLog("You are online");
      } catch {
        ErrorLog(
          "You appear to be offline. Please connect to use strap-package...",
        );
        process.exit(1);
      }
    };
    await checkIfOnline();
    // then check that current node is LTS
    const currentNodeVersion = process.versions.node;
    const LTSNodeVersion = process.release.sourceUrl
      .split("node-v")[1]
      .replace(".tar.gz", "");
    InfoLog("Checking Node version to be LTS...");
    if (currentNodeVersion !== LTSNodeVersion) {
      // if not LTS then ask to use LTS node
      ErrorLog(
        `You are running Node ${currentNodeVersion}`,
        "Strap-package requires LTS Node to be used.",
        `Currently the LTS version is ${LTSNodeVersion}`,
        "Please update your version of Node.",
      );
      process.exit(1);
    }
    SuccessLog("You are running Node", currentNodeVersion, "which is LTS");
    // check if git command is available
    await checkGitAvailable();

    SubHeaderLog("Before naming the package:");
    WarningLog(
      "If you want to make a scoped package, then prefix its name with the needed scope",
    );
    WarningLog(
      "like @scope/package-name where the @scope part could be your npm username or company name",
    );
    WarningLog(
      "NOTICE! unscoped packages are always public, so for private packages you must add some scope",
    );
    const shouldCheckPackageNameAvailability = await confirm({
      message:
        "Do you want to check if the package name is available on npm and is valid?",
      default: true,
    });
    if (!shouldCheckPackageNameAvailability) {
      WarningLog(
        "Skipping package name availability check and package name validation...",
      );
      WarningLog(
        "Be ware that the package name might not be valid or could already be taken...",
      );
    }

    Settings.name = await Naming(shouldCheckPackageNameAvailability);

    // use defaults or select specific settings
    SubHeaderLog("Choosing settings:");
    WarningLog("The following settings are not customizable:");
    InfoLog(FormattedSettings(FixedSetup));
    WarningLog("The project will always have these tools set up with NPM");
    WarningLog(
      "and the current working directory as a starting point to generate the boilerplate",
    );
    const confirmToUseUnchangeableDefaults = await confirm({
      message: "Do you agree to use this setup?",
      default: true,
    });
    if (!confirmToUseUnchangeableDefaults) {
      SuccessLog(
        "There are many tools to start an npm package project with different setup",
      );
      InfoLog(
        "See for example: https://www.npmjs.com/search?q=npm%20package%20boilerplate",
      );
      InfoLog("Exiting strap-package...");
      process.exit(1);
    }
    SuccessLog("Default setup is approved");
    InfoLog("Customizable settings (with defaults):");
    InfoLog(FormattedSettings(Settings));
    const shouldUseDefaults = await confirm({
      message: "Do you want to use default values for customizable settings?",
      default: true,
    });
    // if the user wants to change default customizable settings
    // then ask to select the settings
    if (!shouldUseDefaults) {
      SubHeaderLog("Choose customizable settings:");
      InfoLog(
        "The package could be targeting Node, Browser or both",
        "Selecting specific platform allows for using specific platform APIs",
        "Like crypto, fs, path, os, etc. in Node",
        "Or window object etc. in Browser",
        "If the package is intended to be used in both environments, then choose 'Browser' to not install additional types for Node",
      );
      WarningLog(
        "In the 'both' case the used APIs should be available both in Node and Browser",
      );
      WarningLog(
        "So be careful and check if the used APIs are available in both environments",
      );
      Settings.target = await select<"node" | "browser">({
        message: "Choose the target for the package",
        choices: ["node", "browser"],
        default: "node",
      });
    }
    SuccessLog("DONE! Selected settings:");
    InfoLog(FormattedSettings(Settings));
    SubHeaderLog("Initializing the package in the current directory...");
    try {
      const { folderName } = ReturnFolderNameAndPackageName(Settings.name);
      // copy all the template files to the new folder with the name of the package
      await PrepareFolder(folderName);
      // then install all the dependencies
      await InstallDependencies(folderName);
      // then adjust the package template according to the settings
      // removing some files if needed, reinstalling dependencies
      // etc.
      await AdjustPackageTemplate(Settings);
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : e instanceof String
            ? e.toString()
            : "Unknown error";
      ErrorLog(
        "Something went wrong while initializing the package in the current directory",
        errorMessage,
      );
      process.exit(1);
    }

    SuccessLog("Successfully initialized the package in the current directory");
    InfoLog(
      chalk.bold.underline("The TODO.md file was included"),
      chalk.bold.underline("Go over it to finalize the setup"),
    );
  } catch {
    // the error handling from CTRL+C
  }
})().catch(() => {});
