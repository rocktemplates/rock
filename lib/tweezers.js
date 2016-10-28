var fs = require('fs-promise')
var tweeze = require('tweezers')
var rutil = require('./util')

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
  var fileObj = {}
  var tokens = {}

  me.open = open || me.open
  me.close = close || me.open

  return Promise.all(files.map(function (file) {
    return readFileAndExtract(file)
    .then(function (obj) {
      rutil.extend(tokens, obj)
      fileObj[file] = Object.keys(obj)
    })
  }))
  .then(function () {
    fileObj.tokens = Object.keys(tokens)
    fileObj.tokens.sort()
    return fileObj
  })
}

module.exports.readFilesAndExtract = readFilesAndExtract
