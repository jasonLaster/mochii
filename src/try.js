var request = require("request");

async function fetchTaskLog (task) {
  return new Promise(resolve => {
    const uri = `https://public-artifacts.taskcluster.net/${task}/0/public/logs/log_info.log`;
    request({ uri, method: "GET", gzip: true }, function (
      error,
      response,
      body
    ) {
      if (error) {
      } else {
        resolve(body);
      }
    });
  });
}
function sanitizeLine (line) {
  return line.replace(/^.*INFO - /, "");
}

function sanitizeTaskLog (log) {
  return log
    .split("\n")
    .map(sanitizeLine)
    .join("\n");
}

module.exports = {
  fetchTaskLog,
  sanitizeTaskLog
};
