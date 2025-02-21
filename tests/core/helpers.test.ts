import { describe, test, expect } from "vitest";
import {
  asyncExec,
  CreateFile,
  FormattedSettings,
  IsSetup,
} from "../../src/core/helpers.js";
import { Setup } from "../../src/core/types.js";
import { FixedSetup, Settings } from "../../src/core/constants.js";
import { spawn } from "child_process";

describe("testing IsSetup", () => {
  test("we expect the IsSetup function to return true if the passed in object has language property", () => {
    const obj = {
      language: "js",
    };
    expect(IsSetup(obj as unknown as Setup)).toBe(true);
  });
  test("we expect the IsSetup function to return false if the passed in object does not have language property", () => {
    const obj = {
      name: "test",
    };
    expect(IsSetup(obj as unknown as Setup)).toBe(false);
  });
});

describe("testing FormattedSettings", () => {
  const CorrectlyFormattedSettings = JSON.stringify(Settings, null, 2);
  // the setup should be simplified to simple string/string key/value pairs
  const CorrectlyFormattedSetup = JSON.stringify(
    {
      language: "typescript",
      testRunner: "vitest",
      linter: "eslint",
      formatter: "prettier",
      buildTool: "vite",
      hooksTool: "husky",
    },
    null,
    2,
  );
  test("the FormattedSettings function returns a correctly formatted settings object", () => {
    expect(FormattedSettings(Settings)).toBe(CorrectlyFormattedSettings);
  });
  test("the FormattedSettings function returns a correctly formatted setup object", () => {
    expect(FormattedSettings(FixedSetup)).toBe(CorrectlyFormattedSetup);
  });
});

describe("testing ReportErrorAndExit", () => {
  test("the ReportErrorAndExit function logs error message to the stdout and exits the process with the code 1", async () => {
    const TSCode = `
      import { ReportErrorAndExit } from "../../src/core/helpers.js";
      
      ReportErrorAndExit(new Error("test error"), "test");
      `;
    await CreateFile("./tests/src/test.ts", TSCode);
    await asyncExec("npx tsc --p ./tests/tsconfig.tests.json");
    spawn("node", ["./tests/dist/tests/src/test.js"], {
      stdio: "inherit",
    })
      .on("error", (err) => {
        console.error(err);
      })
      .on("exit", (code) => {
        expect(code).toBe(1);
      });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
});
