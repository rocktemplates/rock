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
  , tweezers = require('tweezers');

var SYSTEM_TOKENS = ['file', 'date', 'date-year', 'date-month', 'date-day', 'date-hour', 'date-min', 'date-sec'];

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

function create(projectName, rockName, callback) {
    var repoPath = '', projectPath = '';
  
    rock = fnoc.rocks[rockName];
    if (rock) {
        repoPath = rock.repo;
    } else {
        repoPath = rockName; //assuming rock repo was passed in
    }

    projectPath = path.resolve(projectName);

    next({
        ERROR: function(err) {
            callback(err);
        },
        execGit: function() {
            exec(util.format("git clone %s %s", repoPath, projectPath), this.next);
        },
        removeGitDir: function() {
            fs.remove(path.join(projectPath, '.git'), this.next);
        },
        /*removeRockDir: function() {
            fs.remove(path.join(projectPath, '.rock'), this.next);
        },*/
        walkFiles: function() {
            var files = [];
            walker(projectPath)
              .on('file', function(file) { files.push(file) })
              .on('end', function() { this.next(files); });
        },
        tweezeFiles: function(files) {
            tweezers.readFilesAndExtractUniq(files, this.next);
        },
        promptUser: function(err, tokenObj) {
            var replacements = {};
            for (var i = 0; i < tokenObj.tokens; ++i) {
                var field = tokenObj.tokens[i];
                if (SYSTEM_TOKENS.indexOf(field) == -1) {
                    rl.question(field + ': ', function(input) {
                        replacements[field] = input;
                    });
                }
            } 

            this.next(tokenObj, replacements);
        },
        outputFiles: function(tokenObj, replacements) {
            
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