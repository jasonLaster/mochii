const shell = require("shelljs");

const fs = require("fs");
const chalk = require("chalk");
const inquirer = require("inquirer");

const { runner } = require("./src/runner");
const { asyncExec } = require("./src/utils");

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

async function runMochitests(argString, args) {
  const command = `./mach mochitest --setpref=javascript.options.asyncstack=true ${argString}`;

  console.log(chalk.blue(command));
  const { onLine, onDone } = runner({ ci: args.ci });
  async function mochiOnDone(code) {
    const text = onDone(code);
    fs.writeFileSync("./mochi_log.txt", text);
    if (args.interactive) {
      const shouldReRun = await rerun();
      if (shouldReRun) {
        setTimeout(() => runMochitests(argString, args), 0);
      }
    } else {
      shell.exit(code);
    }
  }

  function mochiOnLine(line) {
    try {
      const out = onLine(line);
      if (out) {
        console.log(out);
      }
    } catch (e) {
      console.error(e);
    }
  }

  asyncExec(command, { onDone: mochiOnDone, onLine: mochiOnLine });
}

function readOutput(text, options = { ci: true }) {
  const { onLine } = runner(options);

  const out = text
    .split("\n")
    .map(line => onLine(line))
    .filter(i => i)
    .join("\n");
  return out;
}

module.exports = { runMochitests, readOutput };
