#!/usr/bin/env node
import { Init } from "./init";
import { Checks } from "./checks";
import { DefineName } from "./naming";
import { DefineSettings } from "./settings";
import { Log, ReportErrorAndExit } from "./helpers";

void (async () => {
  try {
    Log("header", "Create an npm package boilerplate with strap-package");
    await Checks();
    await DefineName();
    await DefineSettings();
    await Init();
  } catch (e: unknown) {
    ReportErrorAndExit(e, "Something went wrong");
  }
})();
