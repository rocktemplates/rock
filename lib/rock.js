var fs = require('fs-promise')
var path = require('path')
var walker = require('walker')
var tweezers = require('./tweezers')
var dt = require('date-tokens')
var rlp = require('readline-prompter')
var ghdownload = require('github-download')
var rutil = require('./util')
var S = require('string')
var agent = require('superagent')
var globby = require('globby')
var exists = require('path-exists')

S.TMPL_OPEN = '{{'
S.TMPL_CLOSE = '}}'

function fetchFile (filePath, rock, options) {
  if (!options) options = {}
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
  return exists(rock)
  .then(function copyOrDownload (itsLocal) {
    if (itsLocal) { // bug here if dir doesn't exist, TODO: fix
      return fs.copy(rock, filePath)
    } else {
      return new Promise(function (resolve) {
        agent.get(rock).buffer().end(function (res) {
          resolve(fs.outputFile(filePath, res.text))
        })
      })
    }
  })
  .then(function tweezeFiles () {
    var files = [filePath]
    return tweezers.readFilesAndExtract(files, topen, tclose)
  })
  .then(function promptUser (tokenObj) {
    var replacements = {
      '-file': topen + '-file' + tclose,
      '-literal': topen
    }

    replacements = rutil.extend(replacements, dt.eval('-date-'))
    replacements = rutil.extend(replacements, options.templateValues)

    return new Promise(function (resolve) {
      rlp(tokenObj.tokens, options.defaultValues, replacements).end(function (results) {
        resolve(results)
      })
    })
  })
  .then(function outputFiles (replacements) {
    return fs.readFile(filePath, 'utf8')
    .then(function (data) {
      replacements['-file'] = path.basename(filePath)
      var newFileData = S(data).template(replacements, topen, tclose).s
      return fs.writeFile(filePath, newFileData)
    })
  })
}

function fetchRepo (projectPath, repoPath, options) {
  projectPath = path.resolve(projectPath)
  var projectRockPath = path.join(projectPath, '.rock')
  var projectRockConf = path.join(projectRockPath, 'rock.json')
  var projectRockObj = {} // empty config

  if (!options) options = {}
  if (!options.defaultValues) options.defaultValues = {}
  if (!options.templateValues) options.templateValues = {}

  // Check if rock is local:
  return exists(repoPath)
  .then(function copyOrDownload (itsLocal) {
    if (itsLocal) {
      return fs.copy(repoPath, projectPath, {filter: function (p) {
        return !/.*\/\.git$/.test(p)
      }})
    } else {
      return new Promise(function (resolve, reject) {
        ghdownload(repoPath, projectPath)
        .on('error', reject)
        .on('end', resolve)
      })
    }
  })
  .then(function checkRockConf () {
    return exists(projectRockConf)
  })
  .then(function loadRockConf (rockConfExists) {
    if (rockConfExists) {
      return fs.readJson(projectRockConf)
      .then(function (data) {
        if (data) {
          projectRockObj = data

          if (projectRockObj.tokens) {
            S.TMPL_OPEN = projectRockObj.tokens.open || S.TMPL_OPEN
            S.TMPL_CLOSE = projectRockObj.tokens.close || S.TMPL_CLOSE
          }
        }
      })
    }
  })
  .then(function walkFilesAndLoadTokenSettings (data) {
    // console.log('walkFiles')
    var files = []
    var ignoreDirs = []

    if (projectRockObj) {
      ignoreDirs = projectRockObj.ignoreDirs || []
      ignoreDirs = ignoreDirs.map(function (dir) {
        return path.resolve(projectPath, dir)
      })
    }

    return new Promise(function (resolve, reject) {
      walker(projectPath)
      .filterDir(function (dir, stat) { // return false if you want to filter
        // if current dir is the .rock filter, then obviously filter... else filter if it is found in ignoreDirs
        return (dir === projectRockPath) ? false : !(ignoreDirs.indexOf(dir) >= 0)
      })
      .on('file', function (file) { files.push(file) })
      .on('error', reject)
      .on('end', function () {
        resolve(files)
      })
    })
  })
  .then(function tweezeFiles (files) {
    // console.log('tweezefiles')
    return tweezers.readFilesAndExtract(files, S.TMPL_OPEN, S.TMPL_CLOSE)
  })
  .then(function promptUser (tokenObj) {
    var replacements = {
      '-file': S.TMPL_OPEN + '-file' + S.TMPL_CLOSE,
      '-literal': S.TMPL_OPEN
    }

    replacements = rutil.extend(replacements, dt.eval('-date-'))
    replacements = rutil.extend(replacements, options.templateValues)

    return new Promise(function (resolve) {
      rlp(tokenObj.tokens, options.defaultValues, replacements).end(function (results) {
        resolve({
          tokenObj: tokenObj,
          replacements: results
        })
      })
    })
  })
  .then(function outputFiles (results) {
    var tokenObj = results.tokenObj
    var replacements = results.replacements
    delete tokenObj.tokens // we just want to process the files

    // For each file:
    return Promise.all(Object.keys(tokenObj).map(function (file) {
      // Read it:
      return fs.readFile(file, 'utf8')
      .then(function renderTemplate (data) {
        var newFileName = S(file).template(replacements).s
        replacements['-file'] = path.basename(newFileName)

        var newFileData = S(data).template(replacements).s

        return fs.writeFile(newFileName, newFileData)
        .then(function () {
          // Pass newFileName to next function:
          return newFileName
        })
      })
      .then(function deleteOldFile (newFileName) {
        if (file !== newFileName) {
          return fs.remove(file)
        }
      })
    })) // End of Promise.all
  })
  .then(function getDeleteFolderList () {
    var deleteArr = []
    if (projectRockObj.delete) {
      deleteArr = globby.sync(projectRockObj.delete, {cwd: projectPath})
      // Convert to absolute paths:
      deleteArr = deleteArr.map(function (dir) {
        return path.join(projectPath, dir)
      })
    }
    // Add .rock to delete array:
    deleteArr.push(projectRockPath)
    return deleteArr
  })
  .then(function deleteFolders (deleteArr) {
    return Promise.all(deleteArr.map(function (dir) {
      return fs.remove(dir)
    }))
  })
}

module.exports.fetchRepo = fetchRepo
module.exports.fetchFile = fetchFile
