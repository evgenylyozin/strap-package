#!/usr/bin/env node
import { confirm, select, input } from "@inquirer/prompts";
import { promisify } from "util";
import { lookup } from "dns";
import * as validate from "validate-npm-package-name";
import chalk from "chalk";
const asyncLookup = promisify(lookup);

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

const FormattedSettings = (
  settingsObject: Record<string, string | boolean>,
) => {
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
    if (
      (await (await fetch(`http://registry.npmjs.org/${name}`)).json()).name
    ) {
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
    // these are not changeable
    const UnchangeableDefaults = {
      path: process.cwd(),
      packageManager: "npm",
      buildTool: "webpack",
      language: "typescript",
      testRunner: "vitest",
      linter: "eslint",
      formatter: "prettier",
    };
    // then the changeable settings
    const Settings = {
      name: "default-package",
      target: "both",
      shouldInitializeGit: true,
      shouldIncludeMITLicense: true,
      shouldIncludeHuskyPrecommit: true,
      shouldIncludeNPMPublishWorkflow: true,
      shouldIncludeReadme: true,
      shouldIncludeDevelopmentReadme: true,
      shouldIncludeGenericIgnoreFiles: true,
    };

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
    InfoLog(FormattedSettings(UnchangeableDefaults));
    WarningLog("The project will always have these tools set up");
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

      InfoLog(
        "Including README.md file will add this file along with some generic sections",
        "Such file usually contains information about the package like how to install and use it etc.",
      );
      Settings.shouldIncludeReadme = await confirm({
        message: "Do you want to include README.md file?",
        default: true,
      });

      InfoLog(
        "Including DEV.README.md file will add this file along with some generic sections",
        "Such file usually contains development information like how to build, test, run etc.",
      );
      Settings.shouldIncludeDevelopmentReadme = await confirm({
        message: "Do you want to include development README.md file?",
        default: true,
      });
      InfoLog(
        "Including generic ignore files will add files like .gitignore and .npmignore",
        "Such files usually contain information about files to be ignored by git and npm etc.",
      );
      Settings.shouldIncludeGenericIgnoreFiles = await confirm({
        message: "Do you want to include generic ignore files?",
        default: true,
      });
    }
    const MergedSettings = { ...UnchangeableDefaults, ...Settings };
    SuccessLog("DONE! Selected settings:");
    InfoLog(FormattedSettings(MergedSettings));
    SubHeaderLog("Initializing the package in the current directory...");
    // executing commands to install all the dependencies
    // and setup the package skeleton
    // should use single exec command after all the data has been collected
    // else the nvm is not available in other shell or node version is not the needed one
    //   try {
    //     console.log("Installing NVM...");
    //     await asyncExec(nvmInstallString);
    //     const enableNVMString = `
    //     unset npm_config_prefix # required for nvm install if fnm is installed
    //     export NVM_DIR="$HOME/.nvm"
    //     [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
    //     [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    // `;
    //     const installLTSNodeString = `nvm install --lts`;
    //     console.log("Enabling NVM and installing LTS node...");
    //     const { stdout } = await asyncExec(
    //       enableNVMString , " " , installLTSNodeString,
    //     );
    //     console.log(stdout);
    //     console.log("Installing LTS node... done");
    //     console.log(
    //       "Current node version: " ,
    //         JSON.stringify(await asyncExec("node --version")),
    //     );
    //   } catch (error) {
    //     console.error("Failed to install NVM...");
    //     console.error(error);
    //     process.exit(1);
    //   }
  } catch {
    // the error handling from CTRL,C
  }
})();
