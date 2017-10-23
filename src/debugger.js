const chalk = require("chalk");

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

function onAction(line, data) {
  const [_, action, status, actionData] = line.match(
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

  const map = {
    ADD_SOURCE: d => formatSource(d.source),
    CONNECT: d => `${d.url}`,
    PAUSED: d => pausedAction(d),
    SELECT_SOURCE: d => formatSource(d.source),
    LOAD_SOURCE_TEXT: d => formatSource(d.source),
    COMMAND: d => `${d.value.type}`
  };

  let dataStr = action in map ? map[action](dataObj) : "";
  const statusStr = status ? `${status} ` : "";
  return chalk`   {blue.dim ${action}} {dim ${statusStr}${dataStr} }`;
}

function onGecko(line, data) {
  if (line.match(/\[ACTION\]/)) {
    return onAction(line, data);
  }

  return false;
}

module.exports = {
  onGecko
};
