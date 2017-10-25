const fs = require("fs");
const path = require("path");

function readFile (name) {
  const text = fs.readFileSync(
    path.join(__dirname, `../fixtures/${name}`),
    "utf8"
  );

  return text;
}

module.exports = readFile;
