import { Settings } from "./constants";
import { JSONRewrite, Log, Rewrite } from "./helpers";

/**
 * Modifies the target setting in webpack.config.js to match the current
 * target specified in Settings. Replaces the existing target with the
 * value of Settings.target.
 */
export const ModifyTargetInWebpackConfig = async (
  path = Settings.getFolder(),
  target = Settings.target,
) => {
  Log("info", "Modifying target in webpack.config.js...");
  await Rewrite(
    `${path}/webpack.config.js`,
    [/target: "node",/g],
    [`target: "${target}",`],
  );
};
/**
 * Modifies the TypeScript configuration file (tsconfig.json) to adjust the
 * module resolution and module type settings according to the current target
 * specified in Settings. If the target is "browser", it replaces the existing
 * "nodenext" module resolution and "NodeNext" module type with "bundler"
 * and "ESNext" respectively.
 */
const ModifyTsConfigAccordingToTarget = async () => {
  if (Settings.target === "browser") {
    Log("info", "Modifying target in tsconfig.json...");
    await Rewrite(
      `${Settings.getFolder()}/tsconfig.json`,
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
const AdjustPackageTemplateForName = async () => {
  Log("info", "Adjusting package template to use the package name...");
  // set the name of the package in package.json
  await JSONRewrite(`${Settings.getFolder()}/package.json`, {
    name: Settings.name,
  });
  // then change the [PACKAGE NAME] in README.md
  await Rewrite(
    `${Settings.getFolder()}/README.md`,
    [/\[PACKAGE NAME\]/g],
    [Settings.name],
  );
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
  Log("info", "Adjusting webpack config...");
  await ModifyTargetInWebpackConfig();
  await ModifyTsConfigAccordingToTarget();
};
/**
 * Adjusts the package template to match the specified package name and target.
 *
 * This function updates the package name in the `package.json` file and
 * replaces occurrences of `[PACKAGE NAME]` in the `README.md` file with
 * the current package name specified in the `Settings`. It also changes
 * the `target` setting in the Webpack configuration file
 * (webpack.config.js) to the current value of Settings.target and adjusts the
 * TypeScript configuration file (tsconfig.json) to use the correct module
 * resolution and module type for the specified target.
 */
export const AdjustPackageTemplate = async () => {
  Log("info", "Adjusting package template...");
  await AdjustPackageTemplateForName();
  await AdjustPackageTemplateForTarget();
};
