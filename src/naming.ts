import { input, confirm } from "@inquirer/prompts";
import * as validate from "validate-npm-package-name";
import { Settings } from "./constants";
import { Log, ReportErrorAndExit } from "./helpers";

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
