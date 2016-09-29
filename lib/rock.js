var fs = require('fs-extra')
var path = require('path')
var walker = require('walker')
var tweezers = require('./tweezers')
var batch = require('batchflow')
var dt = require('date-tokens')
var rlp = require('readline-prompter')
var ghdownload = require('github-download')
var rutil = require('./util')
var S = require('string')
var agent = require('superagent')
var globby = require('globby')

S.TMPL_OPEN = '{{'
S.TMPL_CLOSE = '}}'

function fetchFile (filePath, rock, options, callback) {
  if (typeof options === 'function') callback = options
  if (!options.defaultValues) options.defaultValues = {}
  if (!options.templateValues) options.templateValues = {}

  filePath = path.resolve(filePath)

  var topen = S.TMPL_OPEN
  var tclose = S.TMPL_CLOSE

  if (options.tokens) {
    topen = options.tokens.open || S.TMPL_OPEN
    tclose = options.tokens.close || S.TMPL_CLOSE
  }

  // Check if rock is local:
  fs.exists(rock, copyOrDownload)
  function copyOrDownload (itsLocal) {
    if (itsLocal) { // bug here if dir doesn't exist, TODO: fix
      fs.copy(rock, filePath, tweezeFiles)
    } else {
      agent.get(rock).buffer().end(function (res) {
        fs.outputFile(filePath, res.text, tweezeFiles)
      })
    }
  }
  function tweezeFiles (err) {
    if (err) return callback(err)
    var files = [filePath]
    tweezers.readFilesAndExtract(files, topen, tclose, promptUser)
  }
  function promptUser (err, tokenObj) {
    if (err) return callback(err)
    var replacements = {
      '-file': topen + '-file' + tclose,
      '-literal': topen
    }

    replacements = rutil.extend(replacements, dt.eval('-date-'))
    replacements = rutil.extend(replacements, options.templateValues)

    rlp(tokenObj.tokens, options.defaultValues, replacements).end(function (results) {
      outputFiles(tokenObj, results)
    })
  }
  function outputFiles (tokenObj, replacements) {
    delete tokenObj.tokens // we just want to process the files,objs

    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) return callback(err)
      replacements['-file'] = path.basename(filePath)
      var newFileData = S(data).template(replacements, topen, tclose).s

      fs.writeFile(filePath, newFileData, callback)
    })
  }
}

function fetchRepo (projectPath, repoPath, options, callback) {
  projectPath = path.resolve(projectPath)
  var projectRockPath = path.join(projectPath, '.rock')
  var projectRockConf = path.join(projectRockPath, 'rock.json')
  var projectRockObj = {} // empty config

  if (typeof options === 'function') callback = options
  if (!options.defaultValues) options.defaultValues = {}
  if (!options.templateValues) options.templateValues = {}

  // Check if rock is local:
  fs.exists(repoPath, copyOrDownload)
  function copyOrDownload (itsLocal) {
    if (itsLocal) {
      fs.copy(repoPath, projectPath, {filter: function (p) {
        return !/.*\/\.git$/.test(p)
      }}, checkRockConf)
    } else {
      ghdownload(repoPath, projectPath)
      .on('error', callback)
      .on('end', checkRockConf)
    }
  }
  function checkRockConf (err) {
    if (err) return callback(err)
    // console.log('checkRockConf')
    fs.exists(projectRockConf, loadRockConf)
  }
  function loadRockConf (rockConfExists) {
    if (rockConfExists) {
      fs.readJson(projectRockConf, walkFilesAndLoadTokenSettings)
    } else {
      walkFilesAndLoadTokenSettings()
    }
  }
  function walkFilesAndLoadTokenSettings (err, data) {
    if (err) return callback(err)
    // console.log('walkFiles')
    var files = []
    var ignoreDirs = []

    if (data) {
      projectRockObj = data
      ignoreDirs = projectRockObj.ignoreDirs || []
      for (var i = 0; i < ignoreDirs.length; ++i) {
        ignoreDirs[i] = path.resolve(projectPath, ignoreDirs[i])
      }

      if (projectRockObj.tokens) {
        S.TMPL_OPEN = projectRockObj.tokens.open || S.TMPL_OPEN
        S.TMPL_CLOSE = projectRockObj.tokens.close || S.TMPL_CLOSE
      }
    }

    walker(projectPath)
    .filterDir(function (dir, stat) { // return false if you want to filter
      // if current dir is the .rock filter, then obviously filter... else filter if it is found in ignoreDirs
      return (dir === projectRockPath) ? false : !(ignoreDirs.indexOf(dir) >= 0)
    })
    .on('file', function (file) { files.push(file) })
    .on('end', function () { tweezeFiles(files) })
  }
  function tweezeFiles (files) {
    // console.log('tweezefiles');
    tweezers.readFilesAndExtract(files, S.TMPL_OPEN, S.TMPL_CLOSE, promptUser)
  }
  function promptUser (err, tokenObj) {
    if (err) return callback(err)
    var replacements = {
      '-file': S.TMPL_OPEN + '-file' + S.TMPL_CLOSE,
      '-literal': S.TMPL_OPEN
    }

    replacements = rutil.extend(replacements, dt.eval('-date-'))
    replacements = rutil.extend(replacements, options.templateValues)

    rlp(tokenObj.tokens, options.defaultValues, replacements).end(function (results) {
      outputFiles(tokenObj, results)
    })
  }
  function outputFiles (tokenObj, replacements) {
    delete tokenObj.tokens // we just want to process the files,objs

    batch(tokenObj).par().each(function (file, fileTokens, done) {
      fs.readFile(file, 'utf8', function (err, data) {
        if (err) throw err
        var newFileName = S(file).template(replacements).s
        replacements['-file'] = path.basename(newFileName)

        var newFileData = S(data).template(replacements).s

        fs.writeFile(newFileName, newFileData, function (err) {
          if (err) throw err // this should be caught by ERROR above
          if (file !== newFileName) {
            fs.remove(file, function (err) {
              if (err) throw err
              done()
            })
          } else {
            done()
          }
        })
      })
    }).end(deleteFolders)
  }
  function deleteFolders () {
    var deleteArr = []
    if (projectRockObj.delete) {
      deleteArr = globby.sync(projectRockObj.delete, {cwd: projectPath})
    }
    // Use absolute paths:
    deleteArr.forEach(function (dir, i) {
      deleteArr[i] = path.join(projectPath, dir)
    })
    // Add .rock to delete array:
    deleteArr.push(projectRockPath)
    // Delete dirs:
    try {
      deleteArr.forEach(function (dir) {
        fs.removeSync(dir)
      })
    } catch (e) {
      callback(e)
    } finally {
      callback(null)
    }
  }
}

module.exports.fetchRepo = fetchRepo
module.exports.fetchFile = fetchFile
