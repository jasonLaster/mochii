const { getArgs, getArgString } = require("../src/args");

function _getArgs(string) {
  return getArgs(string.split(" "));
}

function paramDefaults(overrides) {
  return Object.assign(
    {},
    {
      _: [],
      mc: ".",
      "default-test-path": ""
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
          mc: "foo"
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
      expect(_getArgs("--read file.log")).toEqual(
        paramDefaults({
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

  describe("getArgString", () => {
    it("nothing", () => {
      expect(getArgString(_getArgs(""))).toEqual("");
    });

    it("params", () => {
      expect(getArgString(_getArgs("--jsdebugger --set-env=headless"))).toEqual(
        "--jsdebugger=true --set-env=headless"
      );
    });

    it("defaults", () => {
      expect(
        getArgString(_getArgs("--jsdebugger --default-test-path=foo/bar"))
      ).toEqual("--jsdebugger=true foo/bar");
    });

    it("mc included", () => {
      expect(getArgString(_getArgs("--jsdebugger --mc bazz"))).toEqual(
        "--jsdebugger=true"
      );
    });

    it("test path  included", () => {
      expect(
        getArgString(_getArgs("--jsdebugger --default-test-path=foo/bar bazz"))
      ).toEqual("--jsdebugger=true bazz");
    });
  });
});
