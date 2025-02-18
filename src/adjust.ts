import { Settings } from "./constants";
import { JSONRewrite, Log, Rewrite } from "./helpers";

/**
 * Modifies the target setting in webpack.config.js to match the current
 * target specified in Settings. Replaces the existing target with the
 * value of Settings.target.
 */
export const ModifyTargetInWebpackConfig = async (
  path = Settings.getFolder().concat("/webpack.config.js"),
  target = Settings.target,
) => {
  Log("info", "Modifying target in webpack.config.js...");
  await Rewrite(path, [/target: "node",/g], [`target: "${target}",`]);
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
 * (webpack.config.js) to the current value of Settings.target
 */
const AdjustPackageTemplateForTarget = async () => {
  Log("info", "Adjusting webpack config...");
  await ModifyTargetInWebpackConfig();
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
