import { input, confirm } from "@inquirer/prompts";
import * as validate from "validate-npm-package-name";
import { Settings } from "./constants";
import { Log, ReportErrorAndExit } from "./helpers";

/**
 * Logs warnings regarding package naming conventions and other related information.
 *
 * This function advises on creating scoped package names for private packages
 * and warns about the public nature of unscoped packages. It prompts the user
 * to confirm whether they want to check the availability and validity of the
 * package name on npm. If the user opts out, it logs a warning about the
 * potential risks of skipping this step.
 *
 * @returns A boolean indicating whether the user wishes to check package name
 * availability and validity.
 */
const BeforeNaming = async () => {
  Log("subHeader", "Before naming the package:");
  Log(
    "warning",
    "If you want to make a scoped package, then prefix its name with the needed scope",
  );
  Log(
    "warning",
    "like @scope/package-name where the @scope part could be your npm username or company name",
  );
  Log(
    "warning",
    "NOTICE! unscoped packages are always public, so for private packages you must add some scope",
  );
  const shouldCheckPackageNameAvailability = await confirm({
    message:
      "Do you want to check if the package name is available on npm and is valid?",
    default: true,
  });
  if (!shouldCheckPackageNameAvailability) {
    Log(
      "warning",
      "Skipping package name availability check and package name validation...",
    );
    Log(
      "warning",
      "Be ware that the package name might not be valid or could already be taken...",
    );
  }
  return shouldCheckPackageNameAvailability;
};
/**
 * Prompts the user to enter the desired package name and checks if the package
 * name is valid and available on npm if the user opted to do so.
 *
 * If the user opted to check the package name, the function will check if the
 * package name is valid according to the rules outlined in
 * https://github.com/npm/validate-npm-package-name and if the package name is
 * available on npm. If the package name is invalid or already taken, the
 * function will prompt the user to enter a different package name.
 *
 * @param {boolean} shouldCheck A boolean indicating whether the user wishes to
 * check package name availability and validity.
 * @returns A string representing the package name chosen by the user.
 */
const Naming = async (shouldCheck: boolean): Promise<string> => {
  const name = await input({
    message: "What is the desired name of the package?",
    default: "default-package",
  });
  if (shouldCheck) {
    Log("info", "Checking if the package name is valid...");
    const { validForNewPackages, errors, warnings } = validate(name); // check for name validity
    if (!validForNewPackages) {
      Log("error", "Invalid package name for new package!");
      if (errors) {
        Log("error", "Errors:", ...errors);
      }
      if (warnings) {
        Log("warning", "Warnings:", ...warnings);
      }
      Log("info", "Try another name...");
      return await Naming(shouldCheck);
    }
    Log("success", "Selected package name is valid");
    // check for name availability
    Log("info", "Checking if the package name is available...");
    const responseData = (await (
      await fetch(`http://registry.npmjs.org/${name}`)
    ).json()) as { name?: string };
    if (responseData && responseData.name) {
      Log("error", "Package name already taken!");
      Log("info", `See https://www.npmjs.com/package/${name}`);
      Log("info", "Try another name...");
      return await Naming(shouldCheck);
    }
    Log("success", "Selected package name is available");
  }
  // all is fine, set the selected name to the Settings object
  return name;
};

/**
 * Defines the package name by prompting the user and checking its validity
 * and availability.
 *
 * This function first logs warnings and advises on package naming conventions,
 * including the necessity of scoped names for private packages. It then prompts
 * the user to confirm whether they wish to check the availability and validity
 * of the package name on npm. If confirmed, it asks the user for the desired
 * package name and checks its validity and availability. The selected and verified
 * name is then set to the `Settings` object.
 *
 * In case of an error during the process, it reports the error and exits.
 */
export const DefineName = async () => {
  try {
    Settings.name = await Naming(await BeforeNaming());
  } catch (error) {
    ReportErrorAndExit(
      error,
      "Something went wrong while defining the package name",
    );
  }
};
