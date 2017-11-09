const { handleLine } = require("./handleLine");

function testPassed (lines) {
  const text = lines.join("\n");
  return !text.includes("TEST-UNEXPECTED-FAIL");
}

function handleCILine (testData, testLines) {
  if (!testPassed(testLines)) {
    return testLines.join("\n");
  } else {
    const text = testLines.join("\n");
    if (text.match(/.*TEST-OK.*/g)) {
      const [test] = text.match(/.*TEST-OK.*/g);
      return test;
    }

    if (testData.mode === "done") {
      return testLines.join("\n");
    }
  }
}

function runner (options) {
  let testData = { mode: "starting", extra: null };
  let testLines = [];
  const rawLines = [];

  function onLine (line) {
    rawLines.push(line);
    const out = handleLine(line.trim(), testData);
    if (out) {
      if (options.ci) {
        testLines.push(out);
        if (testData.extra && testData.extra.testFinish) {
          const out = handleCILine(testData, testLines);
          testLines = [];
          return out;
        }
      } else {
        return out;
      }
    }
  }

  function onDone (code) {
    return rawLines.join("\n");
  }

  return {
    onLine,
    onDone
  };
}

module.exports = { runner };
