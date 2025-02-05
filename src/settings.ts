import { select, confirm } from "@inquirer/prompts";
import { FixedSetup, Settings } from "./constants";
import { Log, FormattedSettings, ReportErrorAndExit } from "./helpers";

export const DefineSettings = async () => {
  try {
    // use defaults or select specific settings
    Log("subHeader", "Choosing settings:");
    Log("warning", "The following settings are not customizable:");
    Log("info", FormattedSettings(FixedSetup));
    Log("warning", "The project will always have these tools set up with NPM");
    Log(
      "warning",
      "and the current working directory as a starting point to generate the boilerplate",
    );
    const confirmToUseUnchangeableDefaults = await confirm({
      message: "Do you agree to use this setup?",
      default: true,
    });
    if (!confirmToUseUnchangeableDefaults) {
      Log(
        "success",
        "There are many tools to start an npm package project with different setup",
      );
      Log(
        "info",
        "See for example: https://www.npmjs.com/search?q=npm%20package%20boilerplate",
      );
      Log("info", "Exiting strap-package...");
      process.exit(1);
    }
    Log("success", "Default setup is approved");
    Log("info", "Customizable settings (with defaults):");
    Log("info", FormattedSettings(Settings));
    const shouldUseDefaults = await confirm({
      message: "Do you want to use default values for customizable settings?",
      default: true,
    });
    // if the user wants to change default customizable settings
    // then ask to select the settings
    if (!shouldUseDefaults) {
      Log("subHeader", "Choose customizable settings:");
      Log(
        "info",
        "The package could be targeting Node, Browser or both",
        "Selecting specific platform allows for using specific platform APIs",
        "Like crypto, fs, path, os, etc. in Node",
        "Or window object etc. in Browser",
        "If the package is intended to be used in both environments, then choose 'Browser' to not install additional types for Node",
      );
      Log(
        "warning",
        "In the 'both' case the used APIs should be available both in Node and Browser",
      );
      Log(
        "warning",
        "So be careful and check if the used APIs are available in both environments",
      );
      Settings.target = await select<"node" | "browser">({
        message: "Choose the target for the package",
        choices: ["node", "browser"],
        default: "node",
      });
    }
    Log("success", "DONE! Selected settings:");
    Log("info", FormattedSettings(Settings));
  } catch (error) {
    ReportErrorAndExit(
      error,
      "Something went wrong while defining the package settings",
    );
  }
};
