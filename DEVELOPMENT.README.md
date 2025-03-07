# DEVELOPMENT RELATED INFORMATION

How to get, build, develop, test, publish etc.

## How to get the repo

```bash
git clone https://github.com/evgenylyozin/strap-package.git
```

## Initialize the repo to start developing

```bash
npm ci
```

or

```bash
npm i
```

## To run tests

Make changes in src/index.ts and then run:

```bash
npm run test
```

## To check types, lint, build dist files

```bash
npm run prepare-release
```

## Pre commit hook

Before commit is done, the precommit hook should run which is managed by husky
(.husky/pre-commit). It essentially fixes prettify issues, adds formatted files
to staged if any, checks types, lints, tests, builds. If all is good => the commit
happens.

It works if the prepare script was called on npm install (which should be done automatically).
If it was called it runs the husky init script which among other things changes the
source for github hooks to be in the .husky folder.

## Publishing to NPM

To publish new version of the package to npm there is a CI/CD script in the .github/workflows
folder. It is triggered only if a new release is created on the github platform.
It once again checks types, lints, tests and builds. The built files in the dist folder + a
couple other files end up being uploaded to npm. The .npmignore file is there to pick
the files due to be uploaded.

### To successfully update the npm version don't forget

- To update the version in the package.json and then
- To make the new release with this version as a tag on the github platform

## Notes about the tests folder

### tsconfig

The config in the tests folder is used to transpile some ts code to then use it in a subprocess to check process exit codes and output data in some tests (see ReportErrorAndExit tests for example)

Ts code is generated in the tests/src/test.ts file and transpiled into tests/dist folder, generated js files can be used with just "node" command
