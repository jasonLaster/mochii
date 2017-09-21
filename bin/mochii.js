#!/usr/bin/env node

const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");

const { runMochitests } = require("../index");

async function run(args) {
  if (!shell.test("-d", "firefox")) {
    const url = `https://github.com/devtools-html/debugger.html/blob/master/docs/mochitests.md`;
    console.log(
      chalk.red("Oops"),
      `looks like Firefox does not exist.\nVisit our setup instructions: ${url}`
    );
    return;
  }

  // TODO: it would be nice to automate the full workflow so users can
  // run one test and then be able to kill the run and re-run. kinda like jest --watch
  // await startWebpack()
  runMochitests(args);
}

/*
 * updateArgs is a small convenience method for determining which tests to run
 * if there are no args, include all the tests
 * if there is no browser_dbg prefix, add it.
 */
function updateArgs(args) {
  if (args.length == 0) {
    return ["devtools/client/debugger/new"];
  }

  const _args = args.slice(0, -1);
  const maybeFile = args[args.length - 1];
  const hasFile = maybeFile && !maybeFile.includes("/");

  if (!hasFile) {
    return args;
  }

  const file = maybeFile;
  if (file.includes("browser_dbg")) {
    return args;
  }

  const newFile = `browser_dbg-${file}`;
  return [..._args, newFile];
}

if (process.mainModule.filename.includes("bin/mochii.js")) {
  let args = process.argv[0].includes("bin/node")
    ? process.argv.slice(2)
    : process.argv;

  if (args[0] == "--read") {
    const file = args[1];
    const _path = path.join(__dirname, "..", file);
    const text = fs.readFileSync(_path, { encoding: "utf8" });
    console.log(readOutput(text).join("\n"));
  } else {
    args = updateArgs(args);
    run(args);
  }
}
