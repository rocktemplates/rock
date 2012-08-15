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
  , next = require('nextflow')
  , request = require('request')
  , batch = require('batchflow');

function getSystemTokens() {
    return require('./tokens').tokens; //this is only temporary
}

function list(rockConfig) {
    var rockName = '', rock = null;
  
    console.log(colors.bold("\n  rock version: %s"), fnoc.package.version);
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
            //console.log('walkFiles')
            var files = [], self = this; ignoreDirs = [];

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
            var replacements = {}, self = this;

            var rl = readline.createInterface({input: process.stdin, output: process.stdout})
            
            batch(tokenObj.tokens).seq().each(function(i, token, done) {
                if (_(getSystemTokens()).keys().indexOf(token) === -1) {
                    rl.question(token + ': ', function(input){
                        replacements[token] = input.trim();
                        done();
                    });
                } else {
                    replacements[token] = getSystemTokens()[token];
                    done();
                }
            }).end(function(){
                rl.close();
                self.next(tokenObj, replacements);
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
            callback(null);
        }


    });

}

module.exports.list = list;
module.exports.create = create;
module.exports.update = update;

