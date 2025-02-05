import chalk from "chalk";
import { exec } from "child_process";
import { lookup } from "dns/promises";
import { promisify } from "util";
import { LogType, Setup, S } from "./types";

export const asyncExec = promisify(exec);
export const asyncLookup = lookup;

export const Log = (type: LogType, ...messages: string[]) => {
  const colorFn =
    type === "error"
      ? chalk.red
      : type === "warning"
        ? chalk.yellow
        : type === "success"
          ? chalk.green
          : type === "info"
            ? chalk.blue
            : type === "header"
              ? chalk.bold.underline.bgWhite.black
              : type === "subHeader"
                ? chalk.bold
                : chalk.white;
  for (const message of messages) {
    console.log(colorFn(message));
  }
};

const IsSetup = (s: S | Setup): s is Setup => {
  return "language" in s;
};
export const FormattedSettings = (settingsObject: S | Setup) => {
  const s = {
    ...settingsObject,
  };
  if (IsSetup(s)) {
    // format the setup more concisely
    for (const [key, value] of Object.entries(s)) {
      s[key] = value.name;
    }
  }
  return JSON.stringify(s, null, 2);
};

export const ReportErrorAndExit = (e: unknown, title: string) => {
  const errorMessage =
    e instanceof Error
      ? e.message
      : e instanceof String
        ? e.toString()
        : e instanceof Object
          ? JSON.stringify(e)
          : "Unknown error";
  Log("error", title, errorMessage);
  process.exit(1);
};
