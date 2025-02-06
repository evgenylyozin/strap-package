import { AdjustPackageTemplate } from "./adjust";
import { Log, ReportErrorAndExit } from "./helpers";
import { InstallDependencies } from "./install";
import { PrepareFolder } from "./prepare";

/**
 * Initializes a package in the current directory.
 *
 * This function will copy all the necessary files into the current directory,
 * adjust the package template according to the settings, and then install all
 * the dependencies.
 */
export const Init = async () => {
  try {
    Log("subHeader", "Initializing the package in the current directory...");
    // copy all the template files to the new folder with the name of the package
    await PrepareFolder();
    // then adjust the package template according to the settings
    await AdjustPackageTemplate();
    // then install all the dependencies
    await InstallDependencies();
    InitSuccess();
  } catch (error) {
    ReportErrorAndExit(
      error,
      "Something went wrong while initializing the package in the current directory",
    );
  }
};

/**
 * Logs a success message indicating that the package has been successfully
 * initialized in the current directory and informs the user that a TODO.md
 * file has been included for final setup.
 */
const InitSuccess = () => {
  Log(
    "success",
    "Successfully initialized the package in the current directory",
  );
  Log(
    "header",
    "The TODO.md file was included",
    "Go over it to finalize the setup",
  );
};
