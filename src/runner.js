const { handleLine } = require("./handleLine");
const chalk = require("chalk");

function testPassed(lines) {
  const text = lines.join("\n");
  return !text.includes("TEST-UNEXPECTED-FAIL");
}

function handleCILine(testData, testLines) {
  if (!testPassed(testLines)) {
    const text = testLines.join("\n");
    return text.replace(/TEST-OK/, chalk.red("TEST-FAIL"));
  } else {
    const text = testLines.join("\n");
    if (text.match(/.*TEST-OK.*/g)) {
      const [test] = text.match(/.*TEST-OK.*/g);
      return test;
    }
  }
}

function runner(options) {
  let testData = { mode: "starting", extra: null, failedTests: [] };
  let testLines = [];
  const rawLines = [];

  function onLine(line) {
    rawLines.push(line);
    let out = line.trim();
    try {
      out = handleLine(out, testData);
    } catch (e) {
      console.error(`${chalk.red("mochii failed to parse line:")} ${out}`)
    }

    if (out) {
      if (options.ci) {
        testLines.push(out);
        if (testData.extra && testData.extra.testFinish) {
          const out = handleCILine(testData, testLines);
          testLines = [];
          return out;
        }
        if (testData.mode === "done") {
          if (testData.failedTests.includes(out)) {
            return;
          }
          testData.failedTests.push(out);
          return out;
        }
      } else {
        return out;
      }
    }
  }

  function onDone(code) {
    return rawLines.join("\n");
  }

  return {
    onLine,
    onDone
  };
}

module.exports = { runner };
