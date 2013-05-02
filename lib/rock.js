var fs = require('fs-extra')
  , path = require('path')
  , util = require('util')
  , hogan = require('hogan.js')
  , walker = require('walker')
  , readline = require('readline')
  , tweezers = require('./tweezers')
  , next = require('nextflow')
  , batch = require('batchflow')
  , dt = require('date-tokens')
  , rlp = require('readline-prompter')
  , ghdownload = require('github-download')
  , rutil = require('./util')


function create(projectName, repoPath, options, callback) {
  var projectPath = path.resolve(projectName)
    , projectRockPath = path.join(projectPath, '.rock')
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
    walkFiles: function(err, data) {
      //console.log('walkFiles')
      var files = []
        , ignoreDirs = []

      if (data) {
        projectRockObj = data
        ignoreDirs = projectRockObj.ignoreDirs || []
        for (var i = 0; i < ignoreDirs.length; ++i) {
          ignoreDirs[i] = path.resolve(projectPath, ignoreDirs[i]);
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
      tweezers.readFilesAndExtract(files, this.next);
    },
    promptUser: function(err, tokenObj) {
      var replacements = {'file': '{{file}}'}
      
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
          var newFileName = hogan.compile(file).render(replacements);
          replacements['file'] = path.basename(newFileName);
          var newFileData = hogan.compile(data).render(replacements);
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

module.exports.create = create;





