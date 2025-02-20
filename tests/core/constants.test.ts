import { describe, expect, test } from "vitest";
import { Settings } from "../../src/core/constants.js";

describe("testing getFolder functionality", () => {
  test("if settings.name is not scoped, we expect it to be returned as the folder name", () => {
    Settings.name = "test-package";
    const folderName = Settings.getFolder();
    expect(folderName).toBe("test-package");
  });
  test("if settings.name is scoped, we expect the 'after / part' of the scoped name to be returned as the folder name", () => {
    Settings.name = "@scope/test-package";
    const folderName = Settings.getFolder();
    expect(folderName).toBe("test-package");
  });
});
