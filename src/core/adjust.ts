import { Settings } from "./constants.js";
import { JSONRewrite, Log, RemoveFile, Rewrite } from "./helpers.js";

/**
 * Modifies the build process depending on the Settings.target value.
 *
 * If Settings.target === "web", it changes the build script in the package.json
 * to "vite build". Otherwise, it removes the vite.config.js file.
 *
 * It logs what it is doing.
 */
export const AdjustBuildProcessForTarget = async (
  packageJsonPath = Settings.getFolder().concat("/package.json"),
  viteConfigPath = Settings.getFolder().concat("/vite.config.js"),
  target = Settings.target,
) => {
  // if the target is "web", then swap the build script in the
  // package.json for "vite build"
  if (target === "web") {
    Log("info", "Modifying build script in package.json...");
    await Rewrite(
      packageJsonPath,
      [/"build": "tsc --p tsconfig\.prod\.json",/g],
      [`"build": "vite build",`],
    );
  } else {
    // else remove the vite.config.js file
    Log("info", "Removing vite.config.js...");
    await RemoveFile(viteConfigPath);
  }
};

/**
 * Modifies the TypeScript configuration file (tsconfig.json) to adjust the
 * module resolution and module type settings according to the current target
 * specified in Settings. If the target is "browser", it replaces the existing
 * "nodenext" module resolution and "NodeNext" module type with "bundler"
 * and "ESNext" respectively.
 */
export const ModifyTsConfigAccordingToTarget = async (
  tsconfigPath = Settings.getFolder().concat("/tsconfig.json"),
  target = Settings.target,
) => {
  if (target === "web") {
    Log("info", "Modifying target in tsconfig.json...");
    await Rewrite(
      tsconfigPath,
      [/"moduleResolution": "nodenext",/g, /"module": "NodeNext",/g],
      [`"moduleResolution": "bundler",`, `"module": "ESNext",`],
    );
  }
};

/**
 * Adjusts the package template to reflect the specified package name.
 *
 * This function updates the package name in the `package.json` file and
 * replaces occurrences of `[PACKAGE NAME]` in the `README.md` file with
 * the current package name specified in the `Settings`.
 */
export const AdjustPackageTemplateForName = async (
  packageJsonPath = Settings.getFolder().concat("/package.json"),
  readmePath = Settings.getFolder().concat("/README.md"),
  name = Settings.name,
) => {
  Log("info", "Adjusting package template to use the package name...");
  // set the name of the package in package.json
  await JSONRewrite(packageJsonPath, {
    name,
  });
  // then change the [PACKAGE NAME] in README.md
  await Rewrite(readmePath, [/\[PACKAGE NAME\]/g], [name]);
};
/**
 * Adjusts the package template to use the target specified in Settings.
 *
 * This function changes the `target` setting in the Webpack configuration file
 * (webpack.config.js) to the current value of Settings.target and adjusts the
 * TypeScript configuration file (tsconfig.json) to use the correct module
 * resolution and module type for the specified target.
 */
const AdjustPackageTemplateForTarget = async () => {
  await AdjustBuildProcessForTarget();
  await ModifyTsConfigAccordingToTarget();
};
/**
 * Adjusts the package template to match the specified package name and target.
 *
 * This function updates the package name in the `package.json` file and
 * replaces occurrences of `[PACKAGE NAME]` in the `README.md` file with
 * the current package name specified in the `Settings`. It also changes
 * the `target` setting in the Webpack configuration file
 * (webpack.config.js) to the current value of Settings.target
 */
export const AdjustPackageTemplate = async () => {
  Log("info", "Adjusting package template...");
  await AdjustPackageTemplateForName();
  await AdjustPackageTemplateForTarget();
};
