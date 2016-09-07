/* eslint-env mocha */
var P = require('autoresolve')
var suppose = require('suppose')
var path = require('path-extra')
var fs = require('fs-extra')
var testutil = require('testutil')
require('terst')

var ROCK_CMD = P('bin/rock')
var TEST_PATH = null
var ROCK_CONF = P('test/resources/rock.conf.json')
var testRockPath = P('test/resources/rocks/node-lib')

function AFE (file1, file2) {
  T(fs.readFileSync(file1).toString() === fs.readFileSync(file2).toString())
}

describe('rock-bin', function () {
  beforeEach(function () {
    TEST_PATH = testutil.createTestDir('rock')
  })

  it('should generate a basic project', function (done) {
    var testPath = path.join(TEST_PATH, 'exec_from_cmd')
    var appName = 'myapp'
    var projectName = 'cool_module'
    var rockGitDir = path.join(testRockPath, '.git')
    var cwd = process.cwd()

      // Make test directory:
    fs.mkdir(testPath, executeRock)
    function executeRock () {
      process.chdir(cwd)

      process.chdir(testPath)
      suppose(ROCK_CMD, [appName, '-c', ROCK_CONF, '-r', P('test/resources/rocks/node-lib')])
          // .debug(process.stdout)
          .when('author: ').respond('JP Richardson\n')
          .when('email: ').respond('jprichardson@gmail.com\n')
          .when('project-description: ').respond('A cool test for a sweet library.\n')
          .when('project-name: ').respond(projectName + '\n')
          .on('error', done)
          .end(verifyResults)
    }
    function verifyResults (code) {
      T(code === 0)

      var outDir = path.join(path.join(testPath, appName))
      var expectDir = P('test/resources/expect/' + appName)

      function AF (file) {
        var file1 = path.join(outDir, file)
        var file2 = path.join(expectDir, file)
        AFE(file1, file2)
      }

      if (fs.existsSync(rockGitDir)) fs.removeSync(rockGitDir)

      T(fs.existsSync(outDir))

      AF('LICENSE')
      AF('README.md')
      AF('lib/' + projectName + '.js')
      AF('test/' + projectName + '.test.js')
      AF('ignore_this/READTHIS.md')

      T(!fs.existsSync(path.join(outDir, '.git')))
      T(!fs.existsSync(path.join(outDir, '.rock')))

      done()
    }
  })
})
