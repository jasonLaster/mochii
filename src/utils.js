const shell = require("shelljs");

async function asyncExec (command, options) {
  const onDone = options.onDone || (() => {});
  const onLine = options.onLine || (() => {});

  const child = shell.exec(command, { async: true, silent: true }, async code =>
    onDone(code)
  );

  child.stdout.on("data", function (data) {
    data = data.trim();
    data.split("\n").forEach(async line => onLine(line));
  });
}

module.exports = {
  asyncExec
};
