var P = require('autoresolve')
  , suppose = require('suppose')
  , next = require('nextflow')
  , path = require('path-extra')
  , fs = require('fs-extra')
  , testutil = require('testutil')

var ROCK_CMD = P('bin/rock')
  , TEST_PATH = null
  , ROCK_CONF = P('test/resources/rock.conf.json')
  , testRockPath = P('test/resources/rocks/node-lib')

function AFE(file1, file2) {
  T (fs.readFileSync(file1).toString() === fs.readFileSync(file2).toString())
}

describe('rock-bin', function(){
  beforeEach(function(){
    TEST_PATH = testutil.createTestDir('rock')
  })

  it('should generate a basic project', function(done){
    var testPath = path.join(TEST_PATH, 'exec_from_cmd')
      , debugFile = path.join(testPath, 'debug.txt')
      , appName = 'myapp'
      , projectName = 'cool_module'
      , rockGitDir = path.join(testRockPath, '.git')
      , cwd = process.cwd()

      next({
        ERROR: function(err) {
          done(err) //FAIL
        },
        makeTestDir: function() {
          fs.mkdir(testPath, this.next)
        },
        executeRock: function(){
          process.chdir(cwd)

          process.chdir(testPath)
          suppose(ROCK_CMD, [appName, '-c', ROCK_CONF, '-r', P('test/resources/rocks/node-lib')])
            //.debug(process.stdout)
            .on('author: ').respond('JP Richardson\n')
            .on('email: ').respond('jprichardson@gmail.com\n')
            .on('project-description: ').respond('A cool test for a sweet library.\n')
            .on('project-name: ').respond(projectName + '\n')
            .error(this.error)
            .end(this.next)
        },
        verifyResults: function(code) {
          T (code === 0)

          var outDir = path.join(path.join(testPath, appName))
          var expectDir = P('test/resources/expect/' + appName)

          function AF(file) {
            var file1 = path.join(outDir, file)
            var file2 = path.join(expectDir, file)
            AFE(file1, file2)
          }

          if (fs.existsSync(rockGitDir))
            fs.removeSync(rockGitDir)

          T (fs.existsSync(outDir))

          AF('LICENSE')
          AF('README.md')
          AF('lib/' + projectName + '.js')
          AF('test/' + projectName + '.test.js')
          AF('ignore_this/READTHIS.md')

          T (!fs.existsSync(path.join(outDir, '.git')))
          T (!fs.existsSync(path.join(outDir, '.rock')))

          done()
        }
    })
  })
})

