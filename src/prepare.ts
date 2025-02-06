import { Settings } from "./constants";
import { Log, asyncExec } from "./helpers";

/**
 * Prepares the folder for the package.
 *
 * This function creates a new folder with the name given in the `Settings` object
 * and then clones the `strap-package-template` repository into it. The `.git`
 * folder is then removed to decouple the new package from the template.
 */
export const PrepareFolder = async () => {
  Log("info", "Preparing folder for the package...");
  const command = `mkdir ${Settings.getFolder()} && cd ${Settings.getFolder()} && git clone --depth=1 https://github.com/evgenylyozin/strap-package-template.git . && rm -rf .git`;
  await asyncExec(command);
};
