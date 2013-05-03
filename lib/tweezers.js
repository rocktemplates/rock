var fs = require('fs')
  , tweeze = require('tweezers')
  , rutil = require('./util')
  , batch = require('batchflow')

var me = module.exports;
me.open = null
me.close = null

function readFileAndExtract (file, callback) {
  fs.readFile(file, 'utf8', function(err, data){
    if (err) return callback(err)
    
    var tokens = tweeze(data, me.open, me.close)
    callback(null, tokens)
  });
}


function readFilesAndExtract (files, open, close, callback) {
  var fileObj = {}
    , tokens = {}

  me.open = open || me.open
  me.close = close || me.open

  batch(files).par(8)
  .each(function(i, file, next) {
    readFileAndExtract(file, function(err, obj) {
      rutil.extend(tokens, obj)
      fileObj[file] = Object.keys(obj)
      next()
    })
  })
  .end(function() {
    fileObj.tokens = Object.keys(tokens)
    fileObj.tokens.sort()

    callback(null, fileObj)
  })
}

module.exports.readFilesAndExtract = readFilesAndExtract
