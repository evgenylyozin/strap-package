import { describe, expect, test } from "vitest";
import { Setup } from "../../src/core/types.js";
import {
  assembleDependencies,
  ExcludeViteIfTargetIsNode,
} from "../../src/core/install.js";
import { Settings } from "../../src/core/constants.js";

describe("testing assembleDependencies", () => {
  test("assembles dependencies and their supplementaries for dev dependencies", () => {
    const setup: Setup = {
      buildTool: {
        name: "a",
        isDev: true,
        supplementary: ["b", "c"],
      },
      formatter: {
        name: "d",
        isDev: true,
        supplementary: ["e", "f"],
      },
      hooksTool: {
        name: "g",
        isDev: true,
        supplementary: ["h", "i"],
      },
      linter: {
        name: "j",
        isDev: true,
        supplementary: ["k", "l"],
      },
      language: {
        name: "m",
        isDev: true,
        supplementary: ["n", "o"],
      },
      testRunner: {
        name: "p",
        isDev: true,
        supplementary: ["q", "r"],
      },
    };
    const dependencies = assembleDependencies(setup, true);
    expect(dependencies).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
    ]);
  });
  test("assembles dependencies and their supplementaries for prod dependencies", () => {
    const setup: Setup = {
      buildTool: {
        name: "a",
        isDev: false,
        supplementary: ["b", "c"],
      },
      formatter: {
        name: "d",
        isDev: false,
        supplementary: ["e", "f"],
      },
      hooksTool: {
        name: "g",
        isDev: false,
        supplementary: ["h", "i"],
      },
      linter: {
        name: "j",
        isDev: false,
        supplementary: ["k", "l"],
      },
      language: {
        name: "m",
        isDev: false,
        supplementary: ["n", "o"],
      },
      testRunner: {
        name: "p",
        isDev: false,
        supplementary: ["q", "r"],
      },
    };
    const dependencies = assembleDependencies(setup, false);
    expect(dependencies).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
    ]);
  });
});

describe("testing ExcludeViteIfTargetIsNode", () => {
  test("excludes vite from dependencies if target is node", () => {
    const dependencies = ["vite", "vite-plugin-dts"];
    Settings.target = "node";
    const result = ExcludeViteIfTargetIsNode(dependencies);
    expect(result).toEqual([]);
  });
  test("does not exclude vite from dependencies if target is not node", () => {
    const dependencies = ["vite", "vite-plugin-dts"];
    Settings.target = "web";
    const result = ExcludeViteIfTargetIsNode(dependencies);
    expect(result).toEqual(dependencies);
  });
});
