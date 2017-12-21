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


### Prettifying a Try Task

Try runs can be difficult to understand. Try tasks can be especially difficult to follow because the logs have to be verbose to pinpoint when a test failed. Mochii can help format a try task so that you can focus on the failure.

**Step 1:** Go to the task and copy the task id

<img src='https://shipusercontent.com/cd3a65058dd13292d2584351b332b275/Screen%20Shot%202017-12-21%20at%209.21.56%20AM.png' title='Screen Shot 2017-12-21 at 9.21.56 AM.png' width=1022>

**Step 2:** Go to your project and run `mochii --task <task-id>`

<img src='https://shipusercontent.com/d9d3e2db7efe564fb42ee9354f162733/Screen%20Shot%202017-12-21%20at%209.34.13%20AM.png' title='Screen Shot 2017-12-21 at 9.34.13 AM.png' width=1080>


You'll get the same mochii output you'd get if you ran `yarn mochi` locally :smiley:!

### Contributing to Mochii

There are two ways to contribute to Mochii

Link a local version so that local changes are seen when you run `yarn mochi`

```
git clone
cd mochii
yarn
yarn link

cd <debugger.html>
yarn link mochii
yarn mochih <test>
```

Work on a known mochitest log. This is the easiest way to quickly update the log format.

```
cd <debugger.html>
yarn mochih <test>
cp firefox/mochi_log.txt ../mochi/tests/fixtures/unformatted_stack.txt
cd <mochii>
add the test test/index.test.js
jest --watch
```

```js

  fit("multiple-failes", () => {
    const out = simulateMochitest("mutliple_fails.txt");
    console.log(out)
    expect(out).toMatchSnapshot();
  });
```
