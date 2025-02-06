import { writeFile } from "fs/promises";
import { asyncExec } from "../src/helpers";

export const CreateFile = async (path: string, content: string) => {
  await writeFile(path, content);
};
export const RemoveFile = async (path: string) => {
  await asyncExec(`rm ${path}`);
};
