import { describe, expect, test } from "vitest";
import { checkIfOnline, checkScriptAvailable } from "../../src/core/checks.js";

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
