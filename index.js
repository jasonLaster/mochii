const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");
const inquirer = require("inquirer");
const fs = require("fs");

const hooks = require("./src/debugger");

const blacklist = require("./blacklist.json");

function sanitizeLine(line) {
  return line
    .trim()
    .replace(/\\"/g, '"')
    .replace(/\\"/g, '"');
}

function onFrame(line, data) {
  const [, fnc, _path, _line, column] = line.match(/(.*)@(.*):(.*):(.*)/);

  const resourcePath = _path.match(/->/) ? _path.match(/-> (.*)/)[1] : _path;
  const mappedPath = resourcePath
    .replace(/chrome:\/\/mochitests\/content\//, "")
    .replace(/chrome:\/\/mochikit\/content\//, "")
    .replace(/resource:\/\//, "");

  if (mappedPath.includes("gre/modules/")) {
    return "";
  }

  return `     ${fnc.trim()} ${chalk.dim(`${mappedPath} ${_line}:${column}`)}`;
}

function onGecko(line, data) {
  const [, msg] = line.match(/^GECKO.*?\|(.*)$/);

  if (data.mode === "starting") {
    return;
  }

  if (data.mode === "console-error") {
    if (line.includes("Handler function")) {
      return;
    }

    if (line.match(/@/)) {
      const newMsg = msg.match(/Stack:/) ? msg.match(/Stack:(.*)/)[1] : msg;
      return onFrame(newMsg);
    }
  }

  if (line.match(/\*{5,}/)) {
    data.mode = data.mode === "gecko-error" ? null : "gecko-error";
    return;
  }

  if (data.mode === "gecko-error") {
    return;
  }

  if (line.includes("console.error")) {
    data.mode = "console-error-start";
    return;
  }

  if (line.includes("Message:")) {
    const message = msg.match(/Message: (.*)/)[1];
    data.extra = message;
    return;
  }

  if (line.includes("Stack:")) {
    data.mode = "console-error";
    const message = data.extra;
    data.extra = null;
    return `   ${chalk.red("Console Error")}: ${message}`;
  }

  const response = hooks.onGecko(line, data);
  if (response) {
    return response;
  }

  return `${msg}`;
}

function onDone(line) {
  if (line.includes("TEST-UNEXPECTED-FAIL")) {
    const [, file] = line.match(/.*\|(.*?)\|.*/);
    return `${chalk.red("failed test")}: ${file}`;
  }
}

function onLine(line, data) {
  line = sanitizeLine(line);
  // line += data.mode;

  if (line.match(new RegExp(`(${blacklist.join("|")})`))) {
    return;
  }

  if (data.mode === "failed") {
    return line;
  }

  if (data.mode === "done") {
    return onDone(line);
  }

  if (data.mode === "stack-trace") {
    if (line.match(/@/)) {
      return onFrame(line);
    } else {
      data.mode = null;
      return "\n";
    }
  }

  if (
    line.includes("Error running mach") ||
    line.includes("Traceback (most recent call last):")
  ) {
    data.mode = "failed";
    return line;
  }

  if (line.includes("End BrowserChrome Test Results")) {
    data.mode = "done";
    return;
  }

  if (line.match(/TEST-/)) {
    return onTestInfo(line, data);
  }

  if (line.match(/INFO/)) {
    return onInfo(line, data);
  }

  if (line.match(/GECKO\(/)) {
    return onGecko(line, data);
  }

  if (line.match(/Console message/)) {
    return onConsole(line, data);
  }

  if (line.includes("Stack trace")) {
    data.mode = "stack-trace";
    return;
  }

  if (data.mode !== "starting") {
    return `${line}`;
  }
}

function onTestInfo(line, data) {
  const res = line.match(/(TEST-[A-Z-]*).*\|\s*(.*\.js)\s*(\|(.*))?$/);

  if (!res) {
    return line.trim();
  }

  let [, type, _path, , msg] = res;

  if (msg) {
    msg = msg.trim();
  }

  if (type === "TEST-PASS") {
    return ` ${chalk.cyan(type)} ${msg}`;
  }

  const file = path.basename(_path);

  if (type === "TEST-UNEXPECTED-FAIL") {
    const [, errorPath, error] = (msg || line).match(/(.*)-(.*)/);
    const errorFile = path.basename(errorPath);

    return ` ${chalk.red(type)} ${errorFile}\n${chalk.yellow(error)}`;
  }

  let prefix = type === "TEST-OK" ? chalk.green(type) : chalk.blue(type);

  return `${prefix} ${file}`;
}

function onInfo(line, data) {
  const [, msg] = line.match(/.*INFO(.*)$/);

  if (
    msg.includes("Start BrowserChrome Test Results") &&
    data.mode === "starting"
  ) {
    data.mode = null;
    return;
  }

  if (data.mode === "starting") {
    return;
  }

  if (msg.match(/(Passed|Failed|Todo|Mode):/)) {
    const [, type, , val] = msg.match(/((Passed|Failed|Todo|Mode)):(.*)/);
    return `${chalk.blue(type)}: ${val.trim()}`;
  }

  return chalk.yellow.dim(`  ${msg}`);
}

function onConsole(line, data) {
  if (line.match(/JavaScript Warning/)) {
    const res = line.match(/^.*JavaScript Warning: (.*)$/);
    if (!res) {
      return line;
    }

    const [, msg] = res;
    return `  ${chalk.red("JS warning: ")}${msg}`;
  }

  return line;
}

function readOutput(text) {
  let data = { mode: "starting" };
  const out = text
    .split("\n")
    .map(line => onLine(line, data))
    .filter(i => i);
  return out;
}

async function runMochitests(argString, args) {
  const command = `./mach mochitest --setpref=javascript.options.asyncstack=true ${argString}`;
  const rawLines = [];

  console.log(chalk.blue(command));

  const child = shell.exec(
    command,
    {
      async: true,
      silent: true
    },
    async code => {
      fs.writeFileSync("./mochi_log.txt", rawLines.join("\n"));
      if (args.interactive) {
        const shouldReRun = await rerun();
        if (shouldReRun) {
          setTimeout(() => runMochitests(argString, args), 0);
        }
      } else {
        shell.exit(code);
      }
    }
  );

  let testData = { mode: "starting" };

  child.stdout.on("data", function(data) {
    data = data.trim();
    data.split("\n").forEach(line => {
      try {
        rawLines.push(line);
        const out = onLine(line.trim(), testData);
        if (out) {
          console.log(out);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
}

async function rerun() {
  const { rerun } = await inquirer.prompt([
    {
      type: "confirm",
      name: "rerun",
      message: "Rerun the tests?",
      default: true
    }
  ]);
  return rerun;
}

module.exports = { runMochitests, readOutput };
