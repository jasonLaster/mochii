#!/usr/bin/env node

const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const minimist = require("minimist");

const { runMochitests } = require("../index");

async function run(args) {
  if (!shell.test("-d", args.directory)) {
    console.log(
      chalk.red("Oops"),
      `looks like directory "${args.directory}" does not exist.`
    );
    return;
  }

  // TODO: it would be nice to automate the full workflow so users can
  // run one test and then be able to kill the run and re-run. kinda like jest --watch
  // await startWebpack()
  runMochitests(args);
}

if (process.mainModule.filename.includes("bin/mochii.js")) {
  const argString = process.argv[0].includes("bin/node")
    ? process.argv.slice(2)
    : process.argv
  const args = minimist(argString, {
    alias: {
      directory: "d",
      read: "r"
    },
    default: {
      _: ["devtools/client/debugger/new"],
      d: ".",
    }
  });

  if (args.read) {
    const _path = path.join(__dirname, "..", args.read);
    const text = fs.readFileSync(_path, { encoding: "utf8" });
    console.log(readOutput(text).join("\n"));
  } else {
    run(args);
  }
}
