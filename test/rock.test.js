var assert = require('assert')
  , P = require('autoresolve')
  , suppose = require('suppose')
  , next = require('nextflow')
  , path = require('path-extra')
  , fs = require('fs-extra');

var ROCK_CMD = P('bin/rock')
  , TEST_PATH = path.join(path.tempdir(), 'test-rock')
  , ROCK_CONF = P('test/resources/rockconf.json');

function AFE(file1, file2) {
    assert(fs.readFileSync(file1).toString() === fs.readFileSync(file2).toString());
}

describe('rock', function(){
    beforeEach(function(done){
        fs.exists(TEST_PATH, function(itDoes) {
            if (itDoes) {
                fs.remove(TEST_PATH, function(err) {
                    fs.mkdir(TEST_PATH, done);
                });
            } else {
                fs.mkdir(TEST_PATH, done);
            }
        });
    });

    after(function() {
        var conf = JSON.parse(fs.readFileSync(ROCK_CONF));
        conf.rocks['node-lib'].repo = '';
        fs.writeFileSync(ROCK_CONF, JSON.stringify(conf, null, 4));
    });

    it('should execute rock from the command line', function(done){
        var testPath = path.join(TEST_PATH, 'exec_from_cmd')
        var debugFile = path.join(testPath, 'debug.txt');

        var appName = 'myapp';
        var projectName = 'cool_module';

        next({
            ERROR: function(err) {
                console.log('ERR')
                console.log(err);
                done(err); //FAIL
            },
            makeTestDir: function() {
                fs.mkdir(testPath, this.next);
            },
            executeRock: function(){
                var rockConfigPath = ROCK_CONF;
                var rockConf = JSON.parse(fs.readFileSync(rockConfigPath).toString());
                rockConf.rocks['node-lib'].repo = P('test/resources/rocks/node-lib');
                fs.writeFileSync(rockConfigPath, JSON.stringify(rockConf, null, 4));

                process.chdir(testPath);
                suppose(ROCK_CMD, [appName, '-c', rockConfigPath, '-r', 'node-lib'])
                  //.debug(process.stdout)
                  .on('author: ').respond('JP Richardson\n')
                  .on('email: ').respond('jprichardson@gmail.com\n')
                  .on('project-description: ').respond('A cool test for a sweet library.\n')
                  .on('project-name: ').respond(projectName + '\n')
                  .error(this.error)
                  .end(this.next);
            },
            verifyResults: function(code) {
                assert(code === 0);

                var outDir = path.join(path.join(testPath, appName));
                var expectDir = P('test/resources/expect/' + appName);

                function AF(file) {
                    var file1 = path.join(outDir, file);
                    var file2 = path.join(expectDir, file);
                    AFE(file1, file2);
                }

                assert(fs.existsSync(outDir));

                AF('LICENSE');
                AF('README.md');
                AF('lib/' + projectName + '.js');
                AF('test/' + projectName + '.test.js');

                assert(!fs.existsSync(path.join(outDir, '.git')));
                assert(!fs.existsSync(path.join(outDir, '.rock')));

                done()
            }
        });
    });


});