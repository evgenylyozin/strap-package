#!/usr/bin/env node
import { Init } from "./core/init.js";
import { Checks } from "./core/checks.js";
import { DefineName } from "./core/naming.js";
import { DefineSettings } from "./core/settings.js";
import { Log, ReportErrorAndExit } from "./core/helpers.js";

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
