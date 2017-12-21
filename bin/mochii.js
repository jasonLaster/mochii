#!/usr/bin/env node

const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");

const { getArgs, getArgString } = require("../src/args");
const { runMochitests, readOutput, tryTask } = require("../index");

function moveDirectory(args) {
  if (!shell.test("-d", args.mc)) {
    console.log(
      chalk.red("Oops"),
      `looks like directory "${args.mc}" does not exist.`
    );
    return;
  }
  shell.cd(args.mc);
}

async function run(args) {
  moveDirectory(args);
  runMochitests(getArgString(args), args);
}

const argString = process.argv[0].includes("bin/node")
  ? process.argv.slice(2)
  : process.argv;

const args = getArgs(argString);

if (args.read) {
  const _path = path.join(__dirname, "..", args.read);
  const text = fs.readFileSync(_path, { encoding: "utf8" });
  console.log(readOutput(text));
} else if (args.task) {
  tryTask(args.task);
} else {
  run(args);
}
