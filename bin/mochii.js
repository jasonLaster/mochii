#!/usr/bin/env node

const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");

const { getArgs } = require("../src/getArgs");
const { runMochitests, readOutput } = require("../index");

async function run(args) {
  if (!shell.test("-d", args.mc)) {
    console.log(
      chalk.red("Oops"),
      `looks like directory "${args.mc}" does not exist.`
    );
    return;
  }

  // TODO: it would be nice to automate the full workflow so users can
  // run one test and then be able to kill the run and re-run. kinda like jest --watch
  // await startWebpack()
  runMochitests(args);
}

const argString = process.argv[0].includes("bin/node")
  ? process.argv.slice(2)
  : process.argv;

const args = getArgs(argString);

if (args.read) {
  const _path = path.join(__dirname, "..", args.read);
  const text = fs.readFileSync(_path, { encoding: "utf8" });
  console.log(readOutput(text).join("\n"));
} else {
  run(args);
}
