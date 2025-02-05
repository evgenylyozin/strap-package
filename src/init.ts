import { AdjustPackageTemplate } from "./adjust";
import { Log, ReportErrorAndExit } from "./helpers";
import { InstallDependencies } from "./install";
import { PrepareFolder } from "./prepare";

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
