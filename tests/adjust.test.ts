import { describe, test, beforeEach, afterEach, expect } from "vitest";
import {
  AdjustPackageTemplateForName,
  ModifyTargetInWebpackConfig,
} from "../src/adjust.js";
import {
  CopyFile,
  CreateFile,
  CurrentDir,
  ReadFileAsJSON,
  ReadFileAsString,
  RemoveFile,
} from "./test-helpers.js";

describe("testing ModifyTargetInWebpackConfig", () => {
  beforeEach(async () => {
    await CopyFile(
      `${CurrentDir()}/webpack.config.js`,
      `${CurrentDir()}/tests/webpack.config.js`,
    );
  });
  afterEach(async () => {
    await RemoveFile(`${CurrentDir()}/tests/webpack.config.js`);
  });
  test("we expect the target to switch from node to browser", async () => {
    await ModifyTargetInWebpackConfig(
      `${CurrentDir()}/tests/webpack.config.js`,
      "browser",
    );
    const file = await ReadFileAsString(
      `${CurrentDir()}/tests/webpack.config.js`,
    );
    expect(file).toContain(`target: "browser",`);
  });
  test("we expect the target not to change from node to node", async () => {
    await ModifyTargetInWebpackConfig(
      `${CurrentDir()}/tests/webpack.config.js`,
      "node",
    );
    const file = await ReadFileAsString(
      `${CurrentDir()}/tests/webpack.config.js`,
    );
    expect(file).toContain(`target: "node",`);
  });
});

describe("testing AdjustPackageTemplateForName", () => {
  const packageJsonObj = {
    name: "[PACKAGE_NAME_HERE]",
    version: "0.0.0",
    description: "[PACKAGE_DESCRIPTION_HERE]",
  };
  const readmeStr = `
  # [PACKAGE NAME]

Explain what the package is about. What it is useful for in general terms.
  `;
  beforeEach(async () => {
    await CreateFile(
      `${CurrentDir()}/tests/package.json`,
      JSON.stringify(packageJsonObj),
    );
    await CreateFile(`${CurrentDir()}/tests/README.md`, readmeStr);
  });
  afterEach(async () => {
    await RemoveFile(`${CurrentDir()}/tests/package.json`);
    await RemoveFile(`${CurrentDir()}/tests/README.md`);
  });
  test("we expect the package name to be replaced in package.json and README.md", async () => {
    await AdjustPackageTemplateForName(
      `${CurrentDir()}/tests/package.json`,
      `${CurrentDir()}/tests/README.md`,
      "Updated Name",
    );
    const file = await ReadFileAsJSON<typeof packageJsonObj>(
      `${CurrentDir()}/tests/package.json`,
    );
    expect(file.name).toBe("Updated Name");
    const readme = await ReadFileAsString(`${CurrentDir()}/tests/README.md`);
    expect(readme).toContain("Updated Name");
  });
});
