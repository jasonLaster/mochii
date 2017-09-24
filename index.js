const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");

const blacklist = [
  "^s*$",
  '^"}]',
  "Unknown property",
  "Error in parsing value",
  "Unknown pseudo-class",
  "unreachable code",
  "runtests\\.py",
  "MochitestServer",
  "Main app process",
  "launched child process",
  "zombiecheck",
  "Stopping web server",
  "Stopping web socket server",
  "Stopping ssltunnel",
  "leakcheck",
  "Buffered messages",
  "Browser Chrome Test Summary",
  "Buffered messages finished",
  "CFMessagePort",
  "Completed ShutdownLeaks",
  "SUITE-END",
  "failed to bind",
  "Use of nsIFile in content process is deprecated.",
  "could not create service for entry 'OSX Speech Synth'",
  "The character encoding of the HTML document was not declared.",
  "This site appears to use a scroll-linked positioning effect",
  "Entering test bound",
  "Shutting down...",
  "Leaving test bound",
  "MEMORY STAT",
  "TELEMETRY PING",
  "started process",
  "bootstrap_defs.h",
  "Listening on port",
  "Removing tab.",
  "Tab removed and finished closing",
  "TabClose",
  "checking window state",
  "Opening the toolbox",
  "Toolbox opened and focused",
  "Tab added and finished loading",
  "MOZ_UPLOAD_DIR"
];

function sanitizeLine(line) {
  return line
    .trim()
    .replace(/\\"/g, '"')
    .replace(/\\"/g, '"');
}

function onFrame(line, data) {
  const [, fnc, _path, _line, column] = line.match(/(.*)@(.*):(.*):(.*)/);
  const file = path.basename(_path);
  return `   ${fnc} ${chalk.dim(`${file} ${_line}:${column}`)}`;
}

function onGecko(line, data) {
  const [, msg] = line.match(/^GECKO.*?\|(.*)$/);

  if (data.mode === "starting") {
    return;
  }

  if (line.match(/\*{5,}/)) {
    data.mode = data.mode === "gecko-error" ? null : "gecko-error";
    return;
  }

  if (data.mode === "gecko-error") {
    return;
  }

  if (line.includes("console.error")) {
    data.mode = "console-error";
    return `  ${chalk.red("Console Error")}`;
  }

  if (data.mode === "console-error") {
    if (line.includes("Handler function")) {
      return;
    }

    if (line.match(/@/)) {
      const newMsg = msg.match(/Stack:/) ? msg.match(/Stack:(.*)/)[1] : msg;
      return onFrame(newMsg);
    } else {
      data.mode = null;
    }
  }

  return msg;
}

function onDone(line) {
  if (line.includes("TEST-UNEXPECTED-FAIL")) {
    const [, file] = line.match(/.*\|(.*?)\|.*/);
    return `${chalk.red("failed test")}: ${file}`;
  }
}

function onLine(line, data) {
  line = sanitizeLine(line);

  if (line.match(new RegExp(`(${blacklist.join("|")})`))) {
    return;
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
    return `\n  ${chalk.bold("Stack trace")}`;
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
    const [, errorPath, error] = msg.match(/(.*)-(.*)/);
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

  return `  ${msg}`;
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

function runMochitests(argString) {
  const command = `./mach mochitest ${argString}`;
  console.log(chalk.blue(command));

  const child = shell.exec(
    command,
    {
      async: true,
      silent: true
    },
    code => shell.exit(code)
  );

  let testData = { mode: "starting" };

  child.stdout.on("data", function(data) {
    data = data.trim();
    data.split("\n").forEach(line => {
      const out = onLine(line.trim(), testData);
      if (out) {
        console.log(out);
      }
    });
  });
}

module.exports = { runMochitests, readOutput };
