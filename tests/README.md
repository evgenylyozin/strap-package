# Noted about the tests folder

## tsconfig

The config is used to transpile some ts code to then use it in a subprocess to check process exit codes and output data in some tests (see ReportErrorAndExit tests for example)

Ts code is generated in the tests/src/test.ts file and transpiled into tests/dist folder, generated js files can be used with just "node" command
