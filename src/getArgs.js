const minimist = require('minimist')

function getArgs (argString) {
  return minimist(argString, {
    string: ['default-test-path'],
    alias: {
      mc: 'p',
      read: 'i'
    },
    default: {
      _: ['.'],
      p: '.'
    }
  })
}

module.exports = { getArgs }
