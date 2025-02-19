import { readFile, cp } from "fs/promises";

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
