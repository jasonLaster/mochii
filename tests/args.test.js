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
      ci: false,
      "default-test-path": "",
      interactive: false,
      task: false
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

    it("interactive", () => {
      expect(_getArgs("--interactive")).toEqual(
        paramDefaults({
          interactive: true
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
  });

  describe("getArgString", () => {
    it("nothing", () => {
      expect(getArgString(_getArgs(""))).toEqual("");
    });

    it("params", () => {
      expect(
        getArgString(_getArgs("--jsdebugger --setenv MOZ_HEADLESS=1"))
      ).toEqual("--jsdebugger --setenv MOZ_HEADLESS=1");
    });

    it("defaults", () => {
      expect(
        getArgString(_getArgs("--jsdebugger --default-test-path foo/bar"))
      ).toEqual("--jsdebugger foo/bar");
    });

    it("mc included", () => {
      expect(getArgString(_getArgs("--jsdebugger --mc bazz"))).toEqual(
        "--jsdebugger"
      );
    });

    it("test path included", () => {
      expect(
        getArgString(_getArgs("--jsdebugger --default-test-path foo/bar bazz"))
      ).toEqual("--jsdebugger bazz");
    });

    it("initial dashes are removed", () => {
      expect(
        getArgString(
          _getArgs("-- --jsdebugger --default-test-path foo/bar bazz")
        )
      ).toEqual("--jsdebugger bazz");
    });
  });
});
