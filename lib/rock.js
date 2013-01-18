var fs = require('fs-extra')
  , path = require('path')
  , colors = require('colors')
  , exec = require('child_process').exec
  , util = require('util')
  , hogan = require('hogan.js')
  , walker = require('walker')
  , readline = require('readline')
  , tweezers = require('tweezers')
  , _ = require('underscore')
  , TriggerFlow = require('triggerflow').TriggerFlow
  , next = require('nextflow')
  , request = require('request')
  , batch = require('batchflow')
  , dt = require('date-tokens')
  , rlp = require('readline-prompter');



function list(rockConfig) {
  var rockName = '', rock = null;

  console.log(colors.bold("\n  rock version: %s"), require('../package').version);
  console.log("\n  known rocks:");
  if (rockConfig && rockConfig.rocks && _(rockConfig.rocks).keys().length > 0) {
    for (rockName in rockConfig.rocks){
      rock = rockConfig.rocks[rockName];
      console.log("    %s - %s", colors.blue(rockName), rock.description);
    }
  } else {
    console.log(colors.blue("\t**None listed in your rockconf.json file.**"));
  }

  console.log();
}

function update(rockConfFile) {
  var remoteRockConf = 'https://raw.github.com/rocktemplates/rockconf/master/rockconf.json';
  request(remoteRockConf).pipe(fs.createWriteStream(rockConfFile));
}

function create(projectName, repoPath, templateValues, callback) {
  var projectPath = path.resolve(projectName);
  var projectRockPath = path.join(projectPath, '.rock');
  var projectRockConf = path.join(projectRockPath, 'rock.json');
  var projectRockObj = {}; //empty config

  if (typeof templateValues === 'function') {
      callback = templateValues;
      templateValues = {};
  }

  next({
      ERROR: function(err) {
        callback(err);
      },
      isRepoPathLocal: function() {
          //console.log("STARTING")
        fs.exists(repoPath, this.next);
      },
      copyIfLocal: function(itsLocal) {
        if (itsLocal) {
            //console.log('copy')
            //console.log(repoPath)
            fs.copy(repoPath, projectPath, this.gitDirExist);
        } else {
            //console.log('not local')
            this.next();
        }
      },
      execGit: function() {
        //console.log('execGit')
        exec(util.format("git clone %s %s", repoPath, projectPath), this.next);
      },
      gitDirExist: function(params) {
        //console.log(params);
        //console.log('gitDirExists')
        fs.exists(path.join(projectPath, '.git'), this.next);
      },
      removeGitDir: function(gdirExists) {
        //console.log('removeGitDir');
        if (gdirExists)
            fs.remove(path.join(projectPath, '.git'), this.next);
        else
            this.next();
      },
      checkRockConf: function() {
        //console.log('checkRockConf')
        fs.exists(projectRockConf, this.next);
      },
      loadRockConf: function(rockConfExists) {
        if (rockConfExists)
            fs.readFile(projectRockConf, this.next);
        else
            this.next();
      },
      walkFiles: function(err, data) {
        //console.log('walkFiles')
        var files = [], self = this, ignoreDirs = [];

        if (data) {
            projectRockObj = JSON.parse(data.toString());
            ignoreDirs = projectRockObj.ignoreDirs;
            if (ignoreDirs) {
                for (var i = 0; i < ignoreDirs.length; ++i) {
                    ignoreDirs[i] = path.resolve(projectPath, ignoreDirs[i]);
                    //console.log("ID: %s", ignoreDirs[i])
                }
            } else {
                ignoreDirs = [];
            }
        }

        walker(projectPath)
          .filterDir(function(dir, stat) { 
            if (dir === projectRockPath)
                return false;
            else
                if (ignoreDirs.indexOf(dir) >= 0) 
                    return false;
                else
                    return true;
          })
          .on('file', function(file) { files.push(file) })
          .on('end', function() { self.next(files); });
      },
      tweezeFiles: function(files) {
        //console.log('tweezefiles');
        tweezers.readFilesAndExtractUniq(files, this.next);
      },
      promptUser: function(err, tokenObj) {
        //console.log('promptuers')
        var replacements = {'file': '{{file}}'}, self = this;
        
        replacements = _.extend(replacements, dt.eval('date-'), templateValues);
        //console.log(replacements)
        rlp(tokenObj.tokens, {}, replacements).end(function(results) {
            self.next(tokenObj, results)
        });
      },
      outputFiles: function(tokenObj, replacements) {
        //console.log('outputFiles')
        delete tokenObj.tokens; //we just want to process the files,objs
        var self = this;

        batch(tokenObj).par().each(function(file, fileTokens, done) {
            fs.readFile(file, 'utf8', function(err, data) {
                var newFileName = hogan.compile(file).render(replacements);
                replacements['file'] = path.basename(newFileName);
                var newFileData = hogan.compile(data).render(replacements);
                fs.writeFile(newFileName, newFileData, function(err) {
                    if (err) throw err; //this shoudl be caught by ERROR above
                    if (file !== newFileName) {
                        fs.remove(file, function(err) {
                            if (err) throw err;
                            done();
                        });
                    } else {
                        done();
                    }
                });
            })
        }).end(function(){
            self.next();
        });
      },
      deleteRockFolder: function() {
        fs.remove(projectRockPath, this.next);
      },
      finish: function() {
        //console.log('done')
        callback(null);
      }


  });

}

module.exports.list = list;
module.exports.create = create;
module.exports.update = update;

