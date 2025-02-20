import { describe, expect, test } from "vitest";
import {
  checkIfOnline,
  checkNodeVersion,
  checkScriptAvailable,
} from "../../src/core/checks.js";

describe("testing checkScriptAvailable", () => {
  test("we expect that if the script is available in the system it shouldn't throw", async () => {
    await checkScriptAvailable("git");
  });
  test("we expect that if the script is not available in the system it should throw", async () => {
    await expect(checkScriptAvailable("nonexistentscript")).rejects.toThrow();
  });
});

describe("testing checkIfOnline", () => {
  test("we expect that if the system is online the function shouldn't throw", async () => {
    await checkIfOnline();
  });
  test("we expect that if the system is offline the function should throw", async () => {
    await expect(checkIfOnline("nonexistentdomain")).rejects.toThrow();
  });
});

describe("testing checkNodeVersion", () => {
  test("if the node version is LTS then the function should not throw", () => {
    // redefining process data for testing purposes
    Object.defineProperty(process, "versions", {
      value: {
        node: "LTS",
      },
      writable: true,
    });
    Object.defineProperty(process, "release", {
      value: {
        sourceUrl: "node-vLTS",
      },
      writable: true,
    });
    checkNodeVersion();
  });
  test("if the node version is not LTS then the function should throw", () => {
    // redefining process data for testing purposes
    Object.defineProperty(process, "versions", {
      value: {
        node: "notLTS",
      },
      writable: true,
    });
    expect(() => checkNodeVersion()).toThrow();
  });
});
