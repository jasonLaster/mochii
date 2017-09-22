const { getArgs } = require("../src/getArgs");

function _getArgs(string) {
  return getArgs(string.split(" "));
}

function paramDefaults(overrides) {
  return Object.assign(
    {},
    {
      _: [],
      p: ".",
      mc: "."
    },
    overrides
  );
}

describe("utils", () => {
  describe("getArgs", () => {
    it("nothing passed in", () => {
      expect(_getArgs("")).toEqual(paramDefaults({ _: [""] }));
    });

    it("mc path", () => {
      expect(_getArgs("--mc foo")).toEqual(
        paramDefaults({
          mc: "foo",
          p: "foo"
        })
      );
    });

    it("default test path", () => {
      expect(_getArgs("--default-test-path foo/bar")).toEqual(
        paramDefaults({
          "default-test-path": "foo/bar"
        })
      );
    });

    it("mochitest output", () => {
      expect(_getArgs("-i file.log")).toEqual(
        paramDefaults({
          i: "file.log",
          read: "file.log"
        })
      );
    });

    it("one test path", () => {
      expect(_getArgs("browser/test/foo.js")).toEqual(
        paramDefaults({
          _: ["browser/test/foo.js"]
        })
      );
    });

    it("multiple test paths", () => {
      expect(_getArgs("browser/test/foo.js browser/test/bar.js")).toEqual(
        paramDefaults({
          _: ["browser/test/foo.js", "browser/test/bar.js"]
        })
      );
    });

    it("mochitest params passed in", () => {
      expect(_getArgs("-- --jsdebugger expressions")).toEqual(
        paramDefaults({
          _: ["--jsdebugger", "expressions"]
        })
      );
    });
  });
});
