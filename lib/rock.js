var fs = require('fs-extra')
  , path = require('path')
  , fnoc = require('fnoc').configs()
  , colors = require('colors')
  , exec = require('child_process').exec
  , util = require('util')
  , hogan = require('hogan.js')
  , walker = require('walker')
  , readline = require('readline')
  , tweezers = require('tweezers')
  , _ = require('underscore')
  , TriggerFlow = require('triggerflow').TriggerFlow
  , next = require('nextflow');

function getSystemTokens() {
    return require('./tokens').tokens; //this is only temporary
}

function list(rockConfig) {
    var rockName = '', rock = null;
  
    console.log(colors.bold("\n  rock version: %s"), fnoc.package.version);
    console.log("\n  known rocks:");
    if (_(rockConfig.rocks).keys().length > 0) {
        for (rockName in rockConfig.rocks){
            rock = rockConfig.rocks[rockName];
            console.log("    %s - %s", colors.blue(rockName), rock.description);
        }
    } else {
        console.log(colors.blue("\t**None listed in your rockconf.json file.**"));
    }

    console.log();
}

function create(projectName, repoPath, callback) {
    var projectPath = path.resolve(projectName);
    var projectRockPath = path.join(projectPath, '.rock');
    var projectRockConf = path.join(projectRockPath, 'rock.json');
    var projectRockObj = {}; //empty config

    next({
        ERROR: function(err) {
            //console.log('ERROR METHOD')
            callback(err);
        },
        start: function() {
            this.next();
        },
        execGit: function() {
            //console.log('execGit')
            exec(util.format("git clone %s %s", repoPath, projectPath), this.next);
        },
        removeGitDir: function() {
            //console.log('removeGitDir');
            fs.remove(path.join(projectPath, '.git'), this.next);
        },
        checkRockConf: function() {
            fs.exists(projectRockConf, this.next);
        },
        loadRockConf: function(rockConfExists) {
            if (rockConfExists)
                fs.readFile(projectRockConf, this.next);
            else
                this.next();
        },
        walkFiles: function(err, data) {
            var files = [], self = this; ignoreDirs = [];

            if (data) {
                projectRockObj = JSON.parse(data.toString());
                ignoreDirs = projectRockObj.ignoreDirs;
                for (var i = 0; i < ignoreDirs.length; ++i) {
                    ignoreDirs[i] = path.resolve(projectPath, ignoreDirs[i]);
                    //console.log("ID: %s", ignoreDirs[i])
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
            var replacements = {}, self = this;

            var rl = readline.createInterface({input: process.stdin, output: process.stdout})
            
            var tokens = tokenObj.tokens.slice();
            function again() {
                if (tokens.length > 0) {
                    var field = tokens.shift();
                    if (_(getSystemTokens()).keys().indexOf(field) === -1) {
                        rl.question(field + ': ', function(input){
                            replacements[field] = input.trim();
                            again();
                        });
                    } else {
                        replacements[field] = getSystemTokens()[field];
                        again();
                    }
                } else {
                    rl.close();
                    self.next(tokenObj, replacements);
                }
            }
            again();
        },
        outputFiles: function(tokenObj, replacements) {
            //console.log('outputFiles')
            var allTokens = tokenObj.tokens;
            delete tokenObj.tokens;
            var pending = _(tokenObj).size();
            //console.log("Pending: " + pending)
            //console.log(replacements)

            var tf = TriggerFlow.create({pending: pending}, this.next);
            
            _(tokenObj).keys().forEach(function(file){
                var fileTokens = tokenObj[file];
                fs.readFile(file, function(err, data) {
                    var fileData = data.toString();
                    var newFileName = hogan.compile(file).render(replacements);
                    replacements['file'] = path.basename(newFileName);
                    var newFileData = hogan.compile(fileData).render(replacements);
                    fs.writeFile(newFileName, newFileData, function(err) {
                        if (err) throw err; //this should be caught by ERROR above
                        if (file !== newFileName) {
                            fs.remove(file, function(err) {
                                if (err) throw err;
                                tf.update({pending: -1});
                            });
                        } else {
                            tf.update({pending: -1});
                        }
                    });
                });
            });
        },
        deleteRockFolder: function() {
            fs.remove(projectRockPath, this.next);
        },
        finish: function() {
            callback(null);
        }


    });

}

module.exports.list = list;
module.exports.create = create;