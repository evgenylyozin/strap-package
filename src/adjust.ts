import { Settings } from "./constants";
import { JSONRewrite, Log, Rewrite } from "./helpers";

const ModifyTargetInWebpackConfig = async () => {
  Log("info", "Modifying target in webpack.config.js...");
  await Rewrite(
    `${Settings.getFolder()}/webpack.config.js`,
    [/target: "node",/g],
    [`target: "${Settings.target}",`],
  );
};
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
const AdjustPackageTemplateForTarget = async () => {
  Log("info", "Adjusting webpack config...");
  await ModifyTargetInWebpackConfig();
  await ModifyTsConfigAccordingToTarget();
};
export const AdjustPackageTemplate = async () => {
  Log("info", "Adjusting package template...");
  await AdjustPackageTemplateForName();
  await AdjustPackageTemplateForTarget();
};
