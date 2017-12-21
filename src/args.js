const minimist = require("minimist");

function getArgs (argString) {
  if (argString[0] === "--") {
    argString.shift();
  }
  return minimist(argString, {
    string: ["default-test-path", "mc", "read", "task"],
    boolean: ["interactive", "ci"],
    default: {
      mc: ".",
      ci: false,
      "default-test-path": "",
      interactive: false
    }
  });
}

function getArgString (args) {
  args = Object.assign({}, args);

  delete args.mc;

  const defaultPath = args["default-test-path"].split(",");
  delete args["default-test-path"];

  delete args["interactive"];
  delete args["ci"];

  const includedPaths = args._;
  delete args._;

  const paths = includedPaths.length > 0 ? includedPaths : defaultPath;

  const params = Object.keys(args).map(key => {
    let param = `--${key}`;
    if (args[key] === true) {
      return param;
    }
    return `${param} ${args[key]}`;
  });

  return params
    .concat(...paths)
    .join(" ")
    .trim();
}

module.exports = { getArgs, getArgString };
