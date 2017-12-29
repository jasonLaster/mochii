const chalk = require("chalk");
// const hankey = require("hankey");
// var emoji = require("node-emoji");
function pausedAction(action) {
  const why = action.pauseInfo.why.type;
  const frame = action.frames[0];
  const { line, column, sourceId } = frame.location;

  return `${why}: ${sourceId}:${line}:${column}`;
}

function formatUrl(url) {
  return url ? url.split("/").pop() : "";
}

function formatSource(source) {
  return `${source.id} - ${formatUrl(source.url)}`;
}

function formatAddSource(source) {
  return `\n     - ${formatSource(source)}`;
}
let counts = {};

const map = {
  ADD_SOURCE: d => formatSource(d.source),
  CONNECT: d => `${d.url}`,
  PAUSED: d => pausedAction(d),
  SELECT_SOURCE: d => formatSource(d.source),
  LOAD_SOURCE_TEXT: d => `${d.sourceId}`,
  EVALUATE_EXPRESSION: d => `${d.input}`,
  COMMAND: d => `${d.command}`,
  ADD_SOURCES: d =>
    d.sources.length > 1
      ? d.sources.map(formatAddSource).join("")
      : d.sources.map(formatSource)
};

// const emojis = {
// PAUSED: "clock130"
// };

function onAction(line, data) {
  const [, action, status, actionData] = line.match(
    /\[ACTION\] (\w+)\s*(\[\w+\])?\s*-\s*(.*)$/
  );

  // let dataObj = JSON.parse(jsesc(actionData))
  let dataObj = {};

  try {
    dataObj = JSON.parse(actionData);
  } catch (e) {
    console.error(e);
    console.log(`${action} FAILED`);
  }

  if (action in counts) {
    if (!status || status.includes("start")) {
      counts[action] = counts[action] + 1;
    }
  } else {
    counts[action] = 1;
  }

  let dataStr = action in map ? map[action](dataObj) : "";
  const statusStr = !status
    ? ""
    : status.includes("start")
      ? chalk`{green ${status}} `
      : chalk`{red ${status}} `;
  const count = counts[action];
  const icon = ""; // action in emojis ? `${emoji.get(emojis[action])} ` : "";
  return chalk`   {dim {blue ${count} ${action}} ${icon}${statusStr}${dataStr}}`;
}

function onGecko(line, data) {
  try {
    if (line.match(/\[ACTION\]/)) {
      return onAction(line, data);
    }
  } catch (e) {}

  return false;
}

function testFinish(type, msg) {
  counts = {};
}

function onLine(line, data) {
  if (line.match(/waiting for/i)) {
    return `   ${chalk.dim(line)}`;
  }

  if (line.match(/dispatched \d+ time/)) {
    return `   ${chalk.dim(line)}`;
  }
  return line;
}
module.exports = {
  onGecko,
  testFinish,
  onLine
};
