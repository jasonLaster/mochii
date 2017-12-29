const readFile = require("./helpers/readFile");
const { readOutput } = require("../index");
const cases = require("jest-in-case");

function simulateMochitest(file) {
  const out = readOutput(readFile(file), { ci: false });
  const ci = readOutput(readFile(file), { ci: true });
  return { out, ci };
}

cases(
  "mochi",
  ({ name }) => {
    const { out, ci } = simulateMochitest(name);
    expect(out).toMatchSnapshot();
    expect(ci).toMatchSnapshot();
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
    { name: "unformatted_stack.txt" },
    { name: "new-logs.txt" },
    { name: "waiting.txt" }
  ]
);
