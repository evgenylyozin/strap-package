import { Settings } from "./constants";
import { Log, asyncExec } from "./helpers";

export const PrepareFolder = async () => {
  Log("info", "Preparing folder for the package...");
  const command = `mkdir ${Settings.getFolder()} && cd ${Settings.getFolder()} && git clone --depth=1 https://github.com/evgenylyozin/strap-package-template.git . && rm -rf .git`;
  await asyncExec(command);
};
