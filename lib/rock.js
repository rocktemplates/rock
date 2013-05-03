var fs = require('fs-extra')
  , path = require('path')
  , util = require('util')
  , walker = require('walker')
  , readline = require('readline')
  , tweezers = require('./tweezers')
  , next = require('nextflow')
  , batch = require('batchflow')
  , dt = require('date-tokens')
  , rlp = require('readline-prompter')
  , ghdownload = require('github-download')
  , rutil = require('./util')
  , S = require('string')
  , agent = require('superagent')

S.TMPL_OPEN = '{{'
S.TMPL_CLOSE = '}}'

function fetchFile(filePath, rock, options, callback) {
  if (typeof options === 'function') callback = options;
  if (!options.defaultValues) options.defaultValues = {}
  if (!options.templateValues) options.templateValues = {}

  filePath = path.resolve(filePath)

  var topen = S.TMPL_OPEN
    , tclose = S.TMPL_CLOSE

  if (options.tokens) {
    topen = options.tokens.open || S.TMPL_OPEN
    tclose = options.tokens.close || S.TMPL_CLOSE
  }

  next(flow = {
    ERROR: callback,
    isRockLocal: function() {
      fs.exists(rock, this.next);
    },
    copyOrDownload: function(itsLocal) {
      if (itsLocal) { //bug here if dir doesn't exist, TODO: fix
        fs.copy(rock, filePath, flow.next);
      } else {
        agent.get(rock).buffer().end(function(res) {
          fs.outputFile(filePath, res.text, flow.next)
        })
      }
    },
    tweezeFiles: function() {
      var files = [filePath]
      tweezers.readFilesAndExtract(files, topen, tclose, this.next);
    },
    promptUser: function(err, tokenObj) {
      var replacements = {'file': topen + 'file' + tclose}
      
      replacements = rutil.extend(replacements, dt.eval('date-'))
      replacements = rutil.extend(replacements, options.templateValues)

      rlp(tokenObj.tokens, options.defaultValues, replacements).end(function(results) {
        flow.next(tokenObj, results)
      })
    },
    outputFiles: function(tokenObj, replacements) {
      delete tokenObj.tokens; //we just want to process the files,objs

      fs.readFile(filePath, 'utf8', function(err, data) {
        replacements['file'] = path.basename(filePath);
        var newFileData = S(data).template(replacements, topen, tclose).s;

        fs.writeFile(filePath, newFileData, callback)
      })
    }
  })
}

function fetchRepo(projectPath, repoPath, options, callback) {
  projectPath = path.resolve(projectPath)
  var projectRockPath = path.join(projectPath, '.rock')
    , projectRockConf = path.join(projectRockPath, 'rock.json')
    , projectRockObj = {} //empty config
    , flow = {}

  if (typeof options === 'function') callback = options;
  if (!options.defaultValues) options.defaultValues = {}
  if (!options.templateValues) options.templateValues = {}

  next(flow = {
    ERROR: callback,
    isRepoPathLocal: function() {
      fs.exists(repoPath, this.next);
    },
    copyOrDownload: function(itsLocal) {
      if (itsLocal) {
        fs.copy(repoPath, projectPath, this.next);
      } else {
        ghdownload(repoPath, projectPath)
        .on('error', this.error)
        .on('end', this.next)
      }
    },
    checkRockConf: function() {
      //console.log('checkRockConf')
      fs.exists(projectRockConf, this.next);
    },
    loadRockConf: function(rockConfExists) {
      if (rockConfExists)
        fs.readJson(projectRockConf, this.next);
      else
        this.next();
    },
    walkFilesAndLoadTokenSettings: function(err, data) {
      //console.log('walkFiles')
      var files = []
        , ignoreDirs = []

      if (data) {
        projectRockObj = data
        ignoreDirs = projectRockObj.ignoreDirs || []
        for (var i = 0; i < ignoreDirs.length; ++i) {
          ignoreDirs[i] = path.resolve(projectPath, ignoreDirs[i]);
        }
      
        if (projectRockObj.tokens) {
          S.TMPL_OPEN = projectRockObj.tokens.open || S.TMPL_OPEN
          S.TMPL_CLOSE = projectRockObj.tokens.close || S.TMPL_CLOSE
        }
      }

      walker(projectPath)
      .filterDir(function(dir, stat) { //return false if you want to filter
        //if current dir is the .rock filter, then obviously filter... else filter if it is found in ignoreDirs 
        return (dir === projectRockPath) ? false : !(ignoreDirs.indexOf(dir) >= 0) 
      })
      .on('file', function(file) { files.push(file) })
      .on('end', function() { flow.next(files); });
    },
    tweezeFiles: function(files) {
      //console.log('tweezefiles');
      tweezers.readFilesAndExtract(files, S.TMPL_OPEN, S.TMPL_CLOSE, this.next);
    },
    promptUser: function(err, tokenObj) {
      var replacements = {'file': S.TMPL_OPEN + 'file' + S.TMPL_CLOSE}
      
      replacements = rutil.extend(replacements, dt.eval('date-'))
      replacements = rutil.extend(replacements, options.templateValues)

      rlp(tokenObj.tokens, options.defaultValues, replacements).end(function(results) {
        flow.next(tokenObj, results)
      })
    },
    outputFiles: function(tokenObj, replacements) {
      delete tokenObj.tokens; //we just want to process the files,objs

      batch(tokenObj).par().each(function(file, fileTokens, done) {
        fs.readFile(file, 'utf8', function(err, data) {
          var newFileName = S(file).template(replacements).s;
          replacements['file'] = path.basename(newFileName);
          
          var newFileData = S(data).template(replacements).s;

          fs.writeFile(newFileName, newFileData, function(err) {
            if (err) throw err; //this should be caught by ERROR above
            if (file !== newFileName) {
              fs.remove(file, function(err) {
                if (err) throw err;
                done()
              })
            } else {
              done()
            }
          })
        })
      }).end(flow.next)
    },
    deleteRockFolder: function() {
      fs.remove(projectRockPath, this.next);
    },
    finish: function() {
      //console.log('done')
      callback(null);
    }
  })

}

module.exports.fetchRepo = fetchRepo
module.exports.fetchFile = fetchFile





