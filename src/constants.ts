// the tools which will be installed

import { FolderGiver, S, Setup } from "./types";

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

export const Settings: S & FolderGiver = {
  name: "default-package",
  target: "node", // affects webpack target and installed types
  getFolder: () => {
    return Settings.name.startsWith("@")
      ? Settings.name.split("/")[1]
      : Settings.name;
  },
};
