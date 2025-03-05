import { describe, test, expect } from "vitest";
import {
  asyncExec,
  CreateFile,
  FormattedSettings,
  IsSetup,
  JSONRewrite,
  ReadFileAsJSON,
  ReadFileAsString,
  RemoveDir,
  Rewrite,
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
      
      ReportErrorAndExit(new Error("test error"), "test error title");
      `;
    await CreateFile("./tests/src/test.ts", TSCode, true);
    await asyncExec("npx tsc --p ./tests/tsconfig.tests.json");
    const Check = () => {
      return new Promise((resolve) => {
        const p = spawn("node", ["./tests/dist/tests/src/test.js"]);
        // check console output
        p.stdout.on("data", (data) => {
          expect(String(data)).toContain("test error");
        });
        p.on("exit", (code) => {
          expect(code).toBe(1);
          resolve(true);
        });
      });
    };
    await Check();
    await RemoveDir("./tests/src/");
    await RemoveDir("./tests/dist/");
  }, 100000);
});

describe("testing ReadFileAsString", () => {
  test("the ReadFileAsString function returns a string", async () => {
    const TSCode = `
      import { ReadFileAsString } from "../../src/core/helpers.js";
      
      const text = await ReadFileAsString("./tests/src/test.ts");
      console.log(text);
      `;
    await CreateFile("./tests/src/test.ts", TSCode, true);
    const data = await ReadFileAsString("./tests/src/test.ts");
    await RemoveDir("./tests/src/");
    expect(data).toEqual(TSCode);
  });
});

describe("testing ReadFileAsJSON", () => {
  test("the ReadFileAsJSON function returns an object", async () => {
    const dataObject = {
      name: "test",
      surname: "test",
    };
    const someStringifiedJSON = JSON.stringify(dataObject);
    await CreateFile("./tests/src/test.json", someStringifiedJSON, true);
    const data = await ReadFileAsJSON<typeof dataObject>(
      "./tests/src/test.json",
    );
    await RemoveDir("./tests/src/");
    expect(data).toEqual(dataObject);
    expect(data).not.toEqual(someStringifiedJSON);
  });
});

describe("testing Rewrite", () => {
  test("the Rewrite function rewrites a file with the specified search and replace patterns", async () => {
    const SomeFileData = `
    Hello world its me testing the Rewrite function
    world is Hello hello World is world world hello
    `;
    const Patterns: RegExp[] = [
      new RegExp("Hello", "g"),
      new RegExp("world", "g"),
    ];
    const Replacements: string[] = ["Goodbye", "my love"];
    await CreateFile("./tests/src/test.ts", SomeFileData, true);
    await Rewrite("./tests/src/test.ts", Patterns, Replacements);
    const data = await ReadFileAsString("./tests/src/test.ts");
    await RemoveDir("./tests/src/");
    console.log(data);
    expect(data).toEqual(
      SomeFileData.replace(Patterns[0], Replacements[0]).replace(
        Patterns[1],
        Replacements[1],
      ),
    );
  });
});

describe("testing JSONRewrite", () => {
  test("the JSONRewrite function rewrites a JSON file with the specified object values", async () => {
    const data = {
      name: "test",
      surname: "test",
    };
    await CreateFile("./tests/src/test.json", JSON.stringify(data), true);
    await JSONRewrite("./tests/src/test.json", {
      name: "updated name",
      surname: "updated surname",
    });
    const updatedData = await ReadFileAsJSON<typeof data>(
      "./tests/src/test.json",
    );
    await RemoveDir("./tests/src/");
    expect(updatedData).toEqual({
      name: "updated name",
      surname: "updated surname",
    });
  });
});
