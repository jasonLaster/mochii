const shell = require("shelljs");

let base64 = null;
let isProcessingBase64 = false;

async function asyncExec(command, options) {
  const onDone = options.onDone || (() => {});
  const onLine = options.onLine || (() => {});

  const child = shell.exec(command, { async: true, silent: true }, async code =>
    onDone(code)
  );

  child.stdout.on("data", function(data) {
    data.split("\n").forEach(line => {
      if (data.includes("[SCREENSHOT]")) {
        isProcessingBase64 = true;
        base64 = line;
        return;
      }

      if (isProcessingBase64) {
        if (line.match(/^\S{50,}/)) {
          base64 = `${base64}\n${line}`;
          return;
        } else {
          onLine(base64);
          base64 = null;
          isProcessingBase64 = false;
        }
      }

      onLine(line.trim());
    });
  });
}

module.exports = {
  asyncExec
};
