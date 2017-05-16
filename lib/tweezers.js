var fs = require('fs-promise')
var tweeze = require('tweezers')

var me = module.exports
me.open = null
me.close = null

function readFileAndExtract (file, callback) {
  return fs.readFile(file, 'utf8')
  .then(function (data) {
    return tweeze(data, me.open, me.close)
  })
}

function readFilesAndExtract (files, open, close) {
  var tokens = []

  me.open = open || me.open
  me.close = close || me.open

  return Promise.all(files.map(function (file) {
    return readFileAndExtract(file)
    .then(function (obj) {
      tokens = tokens.concat(Object.keys(obj))
    })
  }))
  .then(function () {
    return tokens
  })
}

module.exports.readFilesAndExtract = readFilesAndExtract
module.exports.extractArray = function (array) {
  return array.map(item => Object.keys(tweeze(item))).reduce((a, b) => a.concat(b), [])
}
