import { readFile, writeFile } from "fs/promises";
import { Settings } from "./constants";
import { Log } from "./helpers";

const ModifyTargetInWebpackConfig = async () => {
  const webpackConfigPath = `${Settings.getFolder()}/webpack.config.js`;
  const webpackConfig = (await readFile(webpackConfigPath)).toString();
  const newWebpackConfig = webpackConfig.replace(
    /target: "node",/g,
    `target: "${Settings.target}",`,
  );
  await writeFile(webpackConfigPath, newWebpackConfig);
};
const ModifyTsConfigAccordingToTarget = async () => {
  // if target is "browser" then do the following modifications:
  // "moduleResolution": "nodenext", => "moduleResolution": "bundler",
  // "module": "NodeNext", => "module": "ESNext",
  if (Settings.target === "browser") {
    Log("info", "Modifying tsconfig.json...");
    const tsConfigPath = `${Settings.getFolder()}/tsconfig.json`;
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

const AdjustPackageTemplateForName = async () => {
  Log("info", "Adjusting package template to use the package name...");
  // set the name of the package in package.json
  const packageJsonPath = `${Settings.getFolder()}/package.json`;
  const packageJson = JSON.parse(
    (await readFile(packageJsonPath)).toString(),
  ) as {
    name: string;
  };
  packageJson.name = Settings.name;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  // then change the [PACKAGE NAME] in README.md
  const readmePath = `${Settings.getFolder()}/README.md`;
  const readme = (await readFile(readmePath)).toString();
  const newReadme = readme.replace("[PACKAGE NAME]", Settings.name);
  await writeFile(readmePath, newReadme);
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
