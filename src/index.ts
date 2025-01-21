#!/usr/bin/env node
import { confirm, select, input } from "@inquirer/prompts";
import { promisify } from "util";
import { lookup } from "dns";
import * as validate from "validate-npm-package-name";
import chalk from "chalk";

const ErrorLog = (message: string) => {
  console.log(chalk.red(message));
};
const WarningLog = (message: string) => {
  console.log(chalk.yellow(message));
};
const SuccessLog = (message: string) => {
  console.log(chalk.green(message));
};
const InfoLog = (message: string) => {
  console.log(chalk.blue(message));
};
const HeaderLog = (message: string) => {
  console.log(chalk.bold.underline(message));
};

HeaderLog(
  chalk.bold.bgWhite.black(
    "Create an npm package boilerplate with strap-package",
  ),
);

const asyncLookup = promisify(lookup);
(async () => {
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
      "You are running Node " +
        currentNodeVersion +
        "\n" +
        "Strap package requires LTS Node to be used. \n" +
        "Currently the LTS version is " +
        LTSNodeVersion +
        "\nPlease update your version of Node.",
    );
    process.exit(1);
  }
  SuccessLog("You are running Node " + currentNodeVersion + " which is LTS");
  // gathering info
  const Settings = {
    name: "default-package",
    path: process.cwd(),
    target: "both",
    packageManager: "npm",
    buildTool: "webpack",
    language: "typescript",
    testRunner: "vitest",
    linter: true,
    formatter: true,
    shouldInitializeGit: true,
    shouldIncludeMITLicense: true,
  };
  const FormattedSettings = () => {
    return JSON.stringify(Settings, null, 2);
  };
  InfoLog("Before naming the package:");
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
  const Naming = async (shouldCheck: boolean) => {
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
          ErrorLog("Errors:" + errors);
        }
        if (warnings) {
          WarningLog("Warnings:" + warnings);
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
    Settings.name = name;
  };

  await Naming(shouldCheckPackageNameAvailability);

  InfoLog("The package could be using APIs which are available only in node");
  InfoLog("Like crypto, fs, path, os, etc.");
  InfoLog("Or APIs which are available only in browser");
  InfoLog("Like window object etc.");
  InfoLog("Or it could be hybrid, using APIs from both");
  InfoLog(
    "Selecting which APIs will be used affect dependencies, especially the type and build tools",
  );
  Settings.target = await select<"node" | "browser" | "both">({
    message: "Which APIs will the package be using?",
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
  );
  InfoLog("See full license at https://choosealicense.com/licenses/mit/");
  Settings.shouldIncludeMITLicense = await confirm({
    message: "Do you want to include MIT license?",
    default: true,
  });
  SuccessLog("Selected settings:\n" + FormattedSettings());
  InfoLog("Initializing the package in the current directory...");
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
  //       enableNVMString + " " + installLTSNodeString,
  //     );
  //     console.log(stdout);
  //     console.log("Installing LTS node... done");
  //     console.log(
  //       "Current node version: " +
  //         JSON.stringify(await asyncExec("node --version")),
  //     );
  //   } catch (error) {
  //     console.error("Failed to install NVM...");
  //     console.error(error);
  //     process.exit(1);
  //   }
})();
