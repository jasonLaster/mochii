const readFile = require("./helpers/readFile");
const { readOutput } = require("../index");
const cases = require("jest-in-case");

function simulateMochitest(file) {
  const out = readOutput(readFile(file), { ci: false });
  // console.log(out.join("\n"));
  return out;
}

cases(
  "mochi",
  ({ name }) => {
    const out = simulateMochitest(name);
    expect(out).toMatchSnapshot();
  },
  [
    { name: "basic.txt" },
    { name: "full.txt" },
    { name: "error.txt" },
    { name: "ufail.txt" },
    { name: "mochi-fail.txt" },
    { name: "build-fail.txt" },
    { name: "console_error.txt" },
    { name: "actions.txt" },
    { name: "frame.txt" },
    { name: "error2.txt" },
    { name: "unformatted_stack.txt" }
  ]
);
