#!/usr/bin/env node
import { confirm } from "@inquirer/prompts";

console.log("Create an npm package boilerplate with strap-package:");

(async () => {
  const useDefaults = await confirm({
    message:
      "Do you want to use the defaults (typescript,eslint,prettier,vitest)? - [y/n]",
    default: false,
  });

  if (useDefaults) {
    console.log("Using defaults");
  } else {
    console.log("Not using defaults");
  }
})();
