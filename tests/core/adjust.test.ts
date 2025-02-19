import { describe, test, beforeEach, afterEach, expect } from "vitest";
import {
  AdjustBuildProcessForTarget,
  AdjustPackageTemplateForName,
  ModifyTsConfigAccordingToTarget,
} from "../../src/core/adjust.js";
import {
  CurrentDir,
  ReadFileAsJSON,
  ReadFileAsString,
} from "../test-helpers.js";
import { CreateFile, RemoveFile } from "../../src/core/helpers.js";

const packageJson = `{
  "name": "[PACKAGE_NAME_HERE]",
  "version": "0.0.0",
  "description": "[PACKAGE_DESCRIPTION_HERE]",
  "scripts": {
    "build": "tsc --p tsconfig.prod.json",
    "make-executable": "chmod +x ./dist/index.js"
  }
}`;

describe("testing AdjustPackageTemplateForName", () => {
  const readmeStr = `
  # [PACKAGE NAME]
Explain what the package is about. What it is useful for in general terms.
  `;
  beforeEach(async () => {
    await CreateFile(`${CurrentDir()}/tests/package.json`, packageJson);
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
    const file = await ReadFileAsJSON(`${CurrentDir()}/tests/package.json`);
    expect(file.name).toBe("Updated Name");
    const readme = await ReadFileAsString(`${CurrentDir()}/tests/README.md`);
    expect(readme).toContain("Updated Name");
  });
});

describe("testing AdjustBuildProcessForTarget", () => {
  beforeEach(async () => {
    await CreateFile(`${CurrentDir()}/tests/package.json`, packageJson);
    await CreateFile(`${CurrentDir()}/tests/vite.config.js`, `config`);
  });
  afterEach(async () => {
    await RemoveFile(`${CurrentDir()}/tests/package.json`);
    await RemoveFile(`${CurrentDir()}/tests/vite.config.js`);
  });
  test("if Settings.target === 'web', we expect the build script to be changed to 'vite build'", async () => {
    await AdjustBuildProcessForTarget(
      `${CurrentDir()}/tests/package.json`,
      `${CurrentDir()}/tests/vite.config.js`,
      "web",
    );
    // expect the vite.config.js file to exist
    expect(
      await ReadFileAsString(`${CurrentDir()}/tests/vite.config.js`),
    ).toContain("config");
    // expect the build script to change
    const file = await ReadFileAsJSON<{ scripts: { build: string } }>(
      `${CurrentDir()}/tests/package.json`,
    );
    expect(file.scripts.build).toBe("vite build");
  });
  test("if Settings.target !== 'web', we expect the vite.config.js file to be removed", async () => {
    await AdjustBuildProcessForTarget(
      `${CurrentDir()}/tests/package.json`,
      `${CurrentDir()}/tests/vite.config.js`,
      "node",
    );
    // expect the vite.config.js file to not exist
    try {
      await ReadFileAsString(`${CurrentDir()}/tests/vite.config.js`);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
    // expect the build script to not change
    const file = await ReadFileAsJSON<{ scripts: { build: string } }>(
      `${CurrentDir()}/tests/package.json`,
    );
    expect(file.scripts.build).toBe("tsc --p tsconfig.prod.json");
  });
});

const tsconfig = `
  {
    "compilerOptions": {
      "isolatedModules": true,
      "allowJs": true,
      "target": "es6",
      "moduleResolution": "nodenext",
      "module": "NodeNext",
      "esModuleInterop": true,
      "outDir": "dist",
      "declaration": true,
      "declarationDir": "dist"
    },
    "exclude": ["node_modules", "dist", "*config*"]
  }
    `;

describe("testing ModifyTsConfigAccordingToTarget", () => {
  beforeEach(async () => {
    await CreateFile(`${CurrentDir()}/tests/tsconfig.json`, tsconfig);
  });
  afterEach(async () => {
    await RemoveFile(`${CurrentDir()}/tests/tsconfig.json`);
  });
  test("if Settings.target === 'web', we expect the module resolution and module type to be changed to 'bundler' and 'ESNext' respectively", async () => {
    await ModifyTsConfigAccordingToTarget(
      `${CurrentDir()}/tests/tsconfig.json`,
      "web",
    );
    // expect the moduleResolution and module fields to change
    const file = await ReadFileAsJSON<{
      compilerOptions: { moduleResolution: string; module: string };
    }>(`${CurrentDir()}/tests/tsconfig.json`);
    expect(file.compilerOptions.moduleResolution).toBe("bundler");
    expect(file.compilerOptions.module).toBe("ESNext");
  });
  test("if Settings.target !== 'web', we expect the module resolution and module type to not change", async () => {
    await ModifyTsConfigAccordingToTarget(
      `${CurrentDir()}/tests/tsconfig.json`,
      "node",
    );
    // expect the moduleResolution and module fields to change
    const file = await ReadFileAsJSON<{
      compilerOptions: { moduleResolution: string; module: string };
    }>(`${CurrentDir()}/tests/tsconfig.json`);
    expect(file.compilerOptions.moduleResolution).toBe("nodenext");
    expect(file.compilerOptions.module).toBe("NodeNext");
  });
});
