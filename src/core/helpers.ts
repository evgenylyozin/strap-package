import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import { LogType, Setup, S } from "./types.js";
import { readFile, writeFile, rm, lstat, cp } from "fs/promises";
import { Settings } from "./constants.js";

/**
 * Executes a command asynchronously using the `exec` function from the `child_process` module.
 * Is used over asyncExecWithCWD in cases where the cwd is not ready yet, like in cases:
 * - check the git is available
 * - create the package folder in the prepare script
 * In other cases, use asyncExecWithCWD to not cd to the package folder all the time
 */
export const asyncExec = promisify(exec);
/**
 * Executes a command asynchronously using the `exec` function from the `child_process` module.
 * The cwd is set to the package folder (Settings.getFolder()) before the command is executed.
 *
 * @param command - The command to be executed.
 * @returns {Promise<stdout: string, stderr: string, error: Error>} The result of the execution.
 */
export const asyncExecWithCWD = (command: string) => {
  return asyncExec(command, { cwd: Settings.getFolder() });
};

/**
 * Logs messages to the console with a specific color and style based on the log type.
 *
 * @param type - The type of log message, which determines the color and style.
 * @param messages - An array of messages to be logged.
 *
 * The log type can be one of the following:
 * - "error": Red color
 * - "warning": Yellow color
 * - "success": Green color
 * - "info": Blue color
 * - "header": Bold, underlined, black text on a white background
 * - "subHeader": Bold text
 * - Default: White color
 */
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

/**
 * Type guard to check if the provided object is of type `Setup`.
 *
 * This function determines if a given object `s` is of type `Setup` by
 * checking if it contains the `language` property, which is a distinctive
 * feature of the `Setup` type.
 *
 * @param s - The object to be checked, which can be either `S` or `Setup`.
 * @returns A boolean indicating whether the object is of type `Setup`.
 */
export const IsSetup = (s: S | Setup): s is Setup => {
  return "language" in s;
};
/**
 * Formats a settings object into a JSON string.
 *
 * This function takes a settings object, which can be of type `S` or `Setup`,
 * and returns a JSON string representation of it. If the object is of type
 * `Setup`, it formats the setup by replacing each tool's details with
 * its name for concise representation.
 *
 * @param settingsObject - The settings object to be formatted, which can
 * be either `S` or `Setup`.
 * @returns A JSON string representation of the formatted settings object.
 */
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

/**
 * Reports an error to the console with a title and then exits the process.
 *
 * If the error is an instance of the `Error` class, it logs the error
 * message. Otherwise, it logs the string representation of the object.
 *
 * @param e - The error to be reported.
 * @param title - The title of the error message.
 */
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

export const CopyFile = async (from: string, to: string) => {
  await cp(from, to);
};
export const CurrentDir = () => {
  return process.cwd();
};
export const ReadFileAsString = async (path: string) => {
  return (await readFile(path)).toString();
};
export const ReadFileAsJSON = async <T extends Record<string, unknown>>(
  path: string,
) => {
  const json = JSON.parse((await readFile(path)).toString()) as T;
  return json;
};

/**
 * Rewrites the content of a file by replacing occurrences of patterns with specified replacements.
 *
 * @param path - The path to the file that needs to be rewritten.
 * @param searchArr - An array of regular expressions to search for in the file.
 * @param replaceArr - An array of strings that will replace the matches found by the corresponding regular expressions in searchArr.
 *
 * @throws Error if searchArr and replaceArr do not have the same length.
 */
export const Rewrite = async (
  path: string,
  searchArr: RegExp[],
  replaceArr: string[],
) => {
  if (searchArr.length !== replaceArr.length) {
    throw new Error("searchArr and replaceArr must have the same length");
  }
  let file = await ReadFileAsString(path);
  for (let i = 0; i < searchArr.length; i++) {
    file = file.replace(searchArr[i], replaceArr[i]);
  }
  await writeFile(path, file);
};

/**
 * Rewrites a JSON file by replacing existing key-value pairs with the specified replacements.
 *
 * @param path - The path to the JSON file that needs to be rewritten.
 * @param replace - An object with key-value pairs where the key is the key to be found in the JSON file and the value is the new value that should replace the existing value in the file.
 */
export const JSONRewrite = async <T extends Record<string, unknown>>(
  path: string,
  replace: T,
) => {
  const json = await ReadFileAsJSON<T>(path);
  for (const key in replace) {
    json[key] = replace[key];
  }
  await writeFile(path, JSON.stringify(json, null, 2));
};

export const CreateFile = async (path: string, content: string) => {
  await writeFile(path, content);
};
export const RemoveFile = async (path: string) => {
  if (await CheckFileExists(path)) await rm(path);
};

export const CheckFileExists = async (path: string) => {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
};
