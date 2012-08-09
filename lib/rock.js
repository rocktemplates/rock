var fs = require('fs-extra')
  , path = require('path')
  , fnoc = require('fnoc').configs()
  , colors = require('colors')
  , exec = require('child_process').exec
  , util = require('util')
  , hogan = require('hogan.js')
  , walker = require('walker')
  , program = require('commander')
  , rl = require('readline').createInterface({input: process.stdin, output: process.stdout})
  , tweezers = require('tweezers')
  , _ = require('underscore')
  , TriggerFlow = require('triggerflow').TriggerFlow
  , next = require('nextflow');

function getSystemTokens() {
    return {
        'file': null
      , 'date': function() { return (new Date()).toDateString(); }
      , 'date-year': function() { return (new Date()).getFullYear(); }
      , 'date-month': function() { return (new Date()).getMonth() + 1; } //JavaScript months are goofy
      , 'date-day': function() { return (new Date()).getDate(); }
      , 'date-hour': function() { return (new Date()).getHour(); }
      , 'date-min': function() { return (new Date()).getMin(); }
      , 'date-sec': function() { return (new Date()).getSeconds(); }
    };
}

function list() {
    var rockName = '', rock = null;
  
    console.log(colors.bold("\n  bedrock version: %s"), fnoc.package.version);
    console.log("\n  known rocks:");
    for (rockName in fnoc.rocks){
        rock = fnoc.rocks[rockName];
        console.log("    %s - %s", colors.blue(rockName), rock.description);
    }
    console.log();
    rl.close();
}

function create(projectName, configPath, rockName, callback) {
    var repoPath = '', rockConfig = null;
    var projectPath = path.resolve(projectName);
    var projectRockPath = path.join(projectPath, '.rock')

    next({
        ERROR: function(err) {
            console.log('ERROR METHOD')
            callback(err);
        },
        loadConfigFile: function() {
            fs.readFile(configPath, this.next);
        },
        parseConfigFile: function(err, data) {
            rockConfig = JSON.parse(data.toString());
            var rock = rockConfig.rocks[rockName];
            if (rock) {
                repoPath = rock.repo;
            } else {
                repoPath = rockName; //here we are assuming a repo path was passed in instead of a rock name
            }
            this.next();
        },
        execGit: function() {
            console.log('execGit')
            exec(util.format("git clone %s %s", repoPath, projectPath), this.next);
        },
        removeGitDir: function() {
            console.log('removeGitDir');
            fs.remove(path.join(projectPath, '.git'), this.next);
        },
        walkFiles: function() {
            console.log('walkFiles');
            var files = [], self = this;

            walker(projectPath)
              .filterDir(function(dir, stat) { 
                if (dir === projectRockPath)
                    return false;
                else
                    return true;
              })
              .on('file', function(file) { files.push(file) })
              .on('end', function() { self.next(files); });
        },
        tweezeFiles: function(files) {
            console.log('tweezefiles');
            tweezers.readFilesAndExtractUniq(files, this.next);
        },
        promptUser: function(err, tokenObj) {
            console.log('promptuers')
            var replacements = {}, self = this;
            
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
            console.log('outputFiles')
            var allTokens = tokenObj.tokens;
            delete tokenObj.tokens;
            var pending = _(tokenObj).size();
            console.log("Pending: " + pending)
            console.log(replacements)

            var tf = TriggerFlow.create({pending: pending}, this.next);
            
            _(tokenObj).keys().forEach(function(file){
                //(function(f) {
                    var fileTokens = tokenObj[file];
                    fs.readFile(file, function(err, data) {
                        var fileData = data.toString();
                        var newFileName = hogan.compile(file).render(replacements);
                        replacements['file'] = path.basename(newFileName);
                        var newFileData = hogan.compile(fileData).render(replacements);
                        if (path.basename(newFileName) === 'README.md') {
                            console.log('README');
                            console.log(file);
                            console.log(newFileData);
                            console.log('ENDREADME')
                        }
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
                //})(fileTokens);
            });
        },
        deleteRockFolder: function() {
            console.log('deleteRockFolder')
            callback(null);
        } 


    });



            /*var pending = 0, templateFields = {};

            files.forEach(function(file, i) {
              pending += 1;
              fs.readFile(file, function(err, data){
                var replacements = [];
                if (err){} //maybe should do something here
                else {
                  var re = /\{\{[\w|\-]*\}\}/g; //mustache template match regex
                  var matches = data.toString().match(re);
                  if (matches) {
                    matchesCopy = matches.slice();
                    askUser = function(){
                      if (matchesCopy.length > 0) {
                        var match = matchesCopy.shift();
                        console.log(matchesCopy.length);
                        var field = match.substring(2, match.length - 2);
                        if (templateFields[field]) {
                          replacements.push(input);
                          askUser();
                        } else {
                          rl.question(field + ': ', function(input){
                            replacements.push(input);
                            templateFields[field] = input;
                            askUser();
                          });
                        }
                      } else {
                        var fileParts = data.toString().split(re);
                        var newBuffer = '';
                        for (var i = 0; i < fileParts.length - 1; ++i){
                          newBuffer += fileParts[i] + replacements[i];
                        }

                        newBuffer += fileParts[fileParts.length-1];

                        fs.writeFile(file, newBuffer, function(err){
                          pending -= 1;
                          if (err)
                            console.log(err);

                          if (pending == 0){
                            rl.close();
                            fs.remove(path.join(projectPath, 'rock.json'));
                          }
                        });
                      }
                    }
                    askUser();
                  }
                }
              });

              
            });
          });
        }
      });
      //callback(null);
    }
  });*/
}

module.exports.list = list;
module.exports.create = create;