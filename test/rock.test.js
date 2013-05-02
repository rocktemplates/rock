var assert = require('assert')
  , P = require('autoresolve')
  , suppose = require('suppose')
  , next = require('nextflow')
  , path = require('path-extra')
  , fs = require('fs-extra')
  , rock = require(P('lib/rock'))
  , testutil = require('testutil')

var TEST_PATH = ''

var rockRepo1 = P('test/resources/rocks/node-lib')
  , rockRepo2 = P('test/resources/rocks/node-lib-tmpl');

function AFE(file1, file2) {
  EQ (fs.readFileSync(file1).toString(), fs.readFileSync(file2).toString());
}

describe('rock', function(){
  beforeEach(function(done){
    TEST_PATH = testutil.createTestDir('rock');
    done()
  })

  describe('+ fetchRepo()', function(){
    describe('> when default settings', function() {
      it('should generate a basic project', function(done){
        TEST(rockRepo1, done)
      });
    })

    describe('> when change open and closing templates', function() {
      it('should generate a basic project', function(done){
        TEST(rockRepo2, done)
      });
    })
  });
});


function TEST (rockRepo, done) {
  var testPath = path.join(TEST_PATH, 'create')
    , debugFile = path.join(testPath, 'debug.txt')
    , appName = 'myapp'
    , projectName = 'cool_module';

  next({
    ERROR: function(err) {
      done(err); //FAIL
    },
    makeTestDir: function() {
      fs.mkdir(testPath, this.next);
    },
    rockCreate: function(){
      process.chdir(testPath);
        
      var templateValues = {
        'author': 'JP Richardson',
        'email': 'jprichardson@gmail.com',
        'project-description': 'A cool test for a sweet library.',
        'project-name': 'cool_module'
      };

      rock.fetchRepo(appName, rockRepo, {templateValues: templateValues}, this.next);
    },
    verifyResults: function() {
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
      AF('ignore_this/READTHIS.md');

      assert(!fs.existsSync(path.join(outDir, '.git')));
      assert(!fs.existsSync(path.join(outDir, '.rock')));

      done()
    }
  });
}
