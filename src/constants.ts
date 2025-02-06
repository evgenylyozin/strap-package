import { FolderGiver, S, Setup } from "./types";

// the tools which will be installed
// in any case
export const FixedSetup: Setup = {
  language: {
    name: "typescript",
    supplementary: [],
    isDev: true,
  },
  testRunner: {
    name: "vitest",
    supplementary: [],
    isDev: true,
  },
  linter: {
    name: "eslint",
    supplementary: ["@eslint/js", "typescript-eslint"],
    isDev: true,
  },
  formatter: {
    name: "prettier",
    supplementary: [],
    isDev: true,
  },
  buildTool: {
    name: "webpack",
    supplementary: ["ts-loader", "webpack-cli"],
    isDev: true,
  },
  hooksTool: {
    name: "husky",
    supplementary: [],
    isDev: true,
  },
};

// Changeable settings
export const Settings: S & FolderGiver = {
  name: "default-package",
  target: "node", // affects webpack target, typescript configuration, and installed types
  getFolder: () => {
    return Settings.name.startsWith("@")
      ? Settings.name.split("/")[1]
      : Settings.name;
  },
};
