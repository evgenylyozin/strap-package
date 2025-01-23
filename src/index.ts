#!/usr/bin/env node
import { confirm, select, input } from "@inquirer/prompts";
import { promisify } from "util";
import { lookup } from "dns";
import { exec } from "child_process";
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

// then the changeable settings
// mainly affect configs and additionally
// generated files, but can remove husky from
// the tools if needed
type Settings = {
  name: string;
  target: "node" | "browser" | "both";
  shouldInitializeGit: boolean;
  shouldIncludeMITLicense: boolean;
  shouldIncludeHuskyPrecommit: boolean;
  shouldIncludeNPMPublishWorkflow: boolean;
};
const Settings: Settings = {
  name: "default-package",
  target: "both", // affects webpack target and installed types (for both it stays default)
  shouldInitializeGit: true, // if false then .gitignore will be removed else "git init" will be run
  shouldIncludeMITLicense: true, // if false then "LICENSE" will be removed
  shouldIncludeHuskyPrecommit: true, // if false, then husky will be removed and .husky file too + prepare script in package.json will be removed
  shouldIncludeNPMPublishWorkflow: true, // if false, then .github will be removed
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

const FormattedSettings = (settingsObject: Record<string, unknown>) => {
  return JSON.stringify(settingsObject, null, 2);
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
  const command = `mkdir ${name} && cd ${name} && git clone https://github.com/evgenylyozin/strap-package-template.git .`;
  await asyncExec(command);
};

const assembleDependencies = (object: Setup, isDev: boolean) => {
  const dependencies = [];
  for (const [key, value] of Object.entries(object)) {
    if (value.isDev === isDev) {
      dependencies.push(key);
    }
  }
  return dependencies.join(" ");
};
const InstallDependencies = async (folderName: string) => {
  const devDependencies = assembleDependencies(FixedSetup, true);
  const prodDependencies = assembleDependencies(FixedSetup, false);
  const command = `cd ${folderName} && npm install ${devDependencies} --save-dev && npm install ${prodDependencies}`;
  await asyncExec(command);
};
const AdjustPackageTemplate = async (settings: Settings) => {
  console.log(JSON.stringify(settings, null, 2));
  await asyncExec(
    `cd ${settings.name} && node ./scripts/adjustPackageTemplate.js`,
  );
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
    WarningLog("Notice! The following settings are not customizable:");
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
    SuccessLog("Default setup is approved. Choose the customizable settings.");
    InfoLog("Default customizable settings are:");
    InfoLog(FormattedSettings(Settings));
    const shouldUseDefaults = await confirm({
      message: "Do you want to use default customizable settings?",
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
        "If the package is intended to be used in both environments, then choose 'both'",
      );
      WarningLog(
        "In the 'both' case the used APIs should be available both in Node and Browser",
      );
      WarningLog(
        "So be careful and check if the used APIs are available in both environments",
      );
      Settings.target = await select<"node" | "browser" | "both">({
        message: "Choose the target for the package",
        choices: ["node", "browser", "both"],
        default: "both",
      });

      InfoLog("Initializing the git repository is done with just 'git init'");
      Settings.shouldInitializeGit = await confirm({
        message: "Do you want to initialize a git repository?",
        default: true,
      });
      InfoLog(
        "MIT license allows others to use/modify etc. your package free of charge",
        "See more info at https://choosealicense.com/licenses/mit/",
      );
      Settings.shouldIncludeMITLicense = await confirm({
        message: "Do you want to include MIT license?",
        default: true,
      });

      InfoLog(
        "Including husky pre-commit hook is usually useful to test, lint and format the code before commit is made",
      );
      Settings.shouldIncludeHuskyPrecommit = await confirm({
        message: "Do you want to include husky pre-commit hook?",
        default: true,
      });

      InfoLog(
        "Including npm publish workflow for publishing to npm registry",
        "adds a simple workflow which is used by github actions to publish the package to npm registry",
        "Additional info is going to be generated in the README.dev.md file if the selected settings allow for this file to be included",
      );
      Settings.shouldIncludeNPMPublishWorkflow = await confirm({
        message: "Do you want to include npm publish workflow?",
        default: true,
      });
    }
    SuccessLog("DONE! Selected settings:");
    InfoLog(FormattedSettings(Settings));
    SubHeaderLog("Initializing the package in the current directory...");
    // executing commands to install all the dependencies
    // and setup the package skeleton
    // should use single exec command after all the data has been collected
    // make the folder with the name of the package
    // then copy the ./template folder contents to the new folder

    try {
      // copy all the template files to the new folder with the name of the package
      await PrepareFolder(Settings.name);
      // then install all the dependencies
      await InstallDependencies(Settings.name);
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
      "The TODO.md file was included",
      "Go over it to finalize the setup",
    );
  } catch {
    // the error handling from CTRL,C
  }
})().catch(() => {});
