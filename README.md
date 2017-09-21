# Mochii

An opinionated mochitest wrapper for running mochitests and reporting the results.

![](http://g.recordit.co/dp6qbK0Jnf.gif)


### Getting Started

```bash
npm i -g mochii
```

#### Mochii Runner

Mochii tries to be a thin wrapper around `mochitest`, with some extra configuration.

```bash
mochii browser_dbg-expressions.js
mochii -- --jsdebugger browser_dbg-expressions
```

Mochii supports some options that will hopefully save you some keystrokes:

* *mozilla-central* - path to the repo you want to run the tests
* *test-path* - path to the tests you want to run

We recommend creating a bash function or an npm script to save the settings:

##### Bash Function

```bash
function mochi() {
  mochii --mc foo --default-test-path yo -- $1 $2 $3 $4
}
```

##### NPM scripts

```bash
{
  scripts: {
    mochi: "mochii --mc ../mozilla-central --default-test-path debugger/client/debugger/new --",
    mochid: "yarn mochi -- --jsdebugger -- ",
    mochir: "yarn mochi -- --repeat 10 -- ",
    mochih: "yarn mochi -- --set-env=HEADLESS -- "
  }
}
```

Our new `mochi` script is now setup to run the mochitests in the `../mozilla-central` with
the default test path `debugger/client/debugger/new`. This is ideal for running the debugger
mochitests from [debugger.html][dh]. We can now run some sweet tests:

```bash
yarn mochi  # runs all of the debugger tests
yarn mochi expressions # runs browser_dbg-expressions.js
yarn mochir expressions # runs browser_dbg-expressions.js 3 times
yarn mochih expressions # runs browser_dbg-expressions.js headlessly

yarn mochi devtools/client/debugger/new/test/mochitest/browser_dbg-expressions.js # runs browser_dbg-expressions.js
yarn mochi --repeat 3 expressions # runs browser_dbg-expressions.js 3 times
```

### Prettifying a mochitest log

If you would like to just use `mochii` reporter, you can run your mochitest in
advance and pass the output to `mochii`.

```
./mach mochitest browser_dbg-expressions > result.log
mochii --read result.log
```

[dh]:https://github.com/devtools-html/debugger.html
