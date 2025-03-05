# Strap Package

Create a boilerplate to start developing a new npm package

## Notes about the tests folder

### tsconfig

The config in the tests folder is used to transpile some ts code to then use it in a subprocess to check process exit codes and output data in some tests (see ReportErrorAndExit tests for example)

Ts code is generated in the tests/src/test.ts file and transpiled into tests/dist folder, generated js files can be used with just "node" command
