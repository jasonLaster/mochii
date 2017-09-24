const minimist = require("minimist");

function getArgs(argString) {
  return minimist(argString, {
    string: ["default-test-path", "mc", "read"],
    default: {
      mc: ".",
      "default-test-path": ""
    }
  });
}

function getArgString(args) {
  args = Object.assign({}, args);

  delete args.mc;

  const defaultPath = args["default-test-path"].split(",");
  delete args["default-test-path"];

  const includedPaths = args._;
  delete args._;

  const paths = includedPaths.length > 0 ? includedPaths : defaultPath;
  const params = Object.keys(args).map(key => `--${key}=${args[key]}`);

  return params
    .concat(...paths)
    .join(" ")
    .trim();
}

module.exports = { getArgs, getArgString };
