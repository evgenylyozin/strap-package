#!/usr/bin/env node
import { Init } from "./init";
import { Checks } from "./checks";
import { DefineName } from "./naming";
import { DefineSettings } from "./settings";
import { Log, ReportErrorAndExit } from "./helpers";

// main function which should run
// when the package is called via npx
void (async () => {
  try {
    Log("header", "Create an npm package boilerplate with strap-package");
    await Checks(); // check if the environment is suitable
    await DefineName(); // define the package name
    await DefineSettings(); // define the package settings
    await Init(); // initialize the package
  } catch (e: unknown) {
    ReportErrorAndExit(e, "Something went wrong");
  }
})();
