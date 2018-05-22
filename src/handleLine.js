const chalk = require("chalk");
const path = require("path");
const quickGist = require("quick-gist");

const hooks = require("./debugger");
const blacklist = require("../blacklist.json");
var emoji = require("node-emoji");

function sanitizeLine(line) {
  return line
    .trim()
    .replace(/\\"/g, '"')
    .replace(/\\"/g, '"');
}

function onFrame(line, data) {
  if (!line.match(/(.*)@(.*):(.*):(.*)/)) {
    return line;
  }

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
    data.extra = null;
    return `   ${chalk.red("Console Error")}`;
  }

  const response = hooks.onGecko(line, data);
  if (response) {
    return response;
  }

  return `${msg}`;
}

function onScreenshot(line, data) {
  const base64 = line.slice(line.indexOf("data"), -1);
  if (!data.imageIndex) {
    data.imageIndex = 1;
  }
  const imageIndex = data.imageIndex++;

  const content = `<html><img src="${base64}" /></html>`;
  quickGist(
    {
      content,
      description: "image",
      public: true,
      fileExtension: "html"
    },
    function(err, resp, data) {
      if (err) {
        return console.error(err);
      }

      const id = data.id;
      const url = `https://bitty.io/anonymous/${id}`;
      console.log(
        chalk.blue(`${emoji.get("camera")} Screenshot ${imageIndex} ${url}`)
      );
    }
  );

  return (
    "   " +
    chalk.blue(`${emoji.get("camera")} Saving Screenshot ${imageIndex}!`)
  );
}

function onDone(line) {
  if (line.includes("TEST-UNEXPECTED-FAIL")) {
    const [, file] = line.match(/.*\|(.*?)\|.*/);
    return `${chalk.red("failed test")}: ${file}`;
  }
}

function handleLine(line, data) {
  if (line.includes("[SCREENSHOT]")) {
    return onScreenshot(line, data);
  }

  line = sanitizeLine(line);
  if (data.extra && data.extra.testFinish) {
    delete data.extra.testFinish;
  }

  if (
    line.includes("Start BrowserChrome Test Results") &&
    (data.mode === "starting" || data.mode === "done")
  ) {
    data.mode = null;
    return;
  }

  if (line.includes("Stack:")) {
  }

  if (!line.includes("GECKO") && data.mode === "console-error") {
    if (line.includes("Handler function")) {
      return;
    }

    if (line.match(/@/)) {
      const newMsg = line.match(/Stack:/) ? line.match(/Stack:(.*)/)[1] : line;
      return onFrame(newMsg);
    }
  }

  if (line.match(new RegExp(`(${blacklist.join("|")})`))) {
    return;
  }

  if (data.mode === "failed") {
    return line;
  }

  if (data.mode === "done") {
    const out = onDone(line);
    return out;
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

  if (
    line.includes("End BrowserChrome Test Results") ||
    line.includes("SUITE-END")
  ) {
    data.testFinish = false;
    data.mode = "done";
    return;
  }

  if (line.match(/TEST-/)) {
    return onTestInfo(line, data);
  }

  if (line.match(/Console message/)) {
    return onConsole(line, data);
  }

  if (line.match(/INFO/)) {
    return onInfo(line, data);
  }

  if (line.match(/GECKO\(/)) {
    return onGecko(line, data);
  }

  if (line.includes("Stack trace")) {
    data.mode = "stack-trace";
    return;
  }

  if (data.mode !== "starting") {
    return hooks.onLine(line);
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
    const [, errorPath, error] = (msg || line || "").match(/(.*)-(.*)/);
    const errorFile = path.basename(errorPath);

    return ` ${chalk.red(type)} ${errorFile}\n${chalk.yellow(error)}`;
  }

  const testFinish = type === "TEST-OK";
  if (testFinish) {
    data.extra = { testFinish };
    hooks.testFinish(type, msg);
  }

  let prefix = testFinish ? chalk.green(type) : chalk.blue(type);
  return `${prefix} ${file}`;
}

function onInfo(line, data) {
  const [, msg] = line.match(/.*INFO(.*)$/);

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
    return `  ${chalk.red("JS warning: ")}\n   ${msg}`;
  }

  if (line.match(/JavaScript Error/)) {
    data.mode = "console-error";
    const res = line.match(/^.*JavaScript Error: (.*)$/);
    if (!res) {
      return line;
    }

    const [, msg] = res;
    return `  ${chalk.red("JS Error: ")}\n    ${msg}`;
  }

  return `  ${chalk.dim(line)}`;
}

module.exports = {
  handleLine
};
