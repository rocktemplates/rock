var testutil = require('testutil')
  , rock = require('../lib/rock')
  , fs = require('fs')
  , path = require('path')

TEST_DIR = ''

describe('rock', function() {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('rock')
  })

  describe('+ fetchRepo()', function() {
    describe('> when rock is an absolute Github HTTP repo', function() {
      it('should download the files and create the rock', function(done) {
        var repo = 'https://github.com/rocktemplates/node-lib'
        GITHUB_TEST(repo, done)
      })
    })

    describe('> when rock is a relative Github HTTP repo', function() {
      it('should download the files and create the rock', function(done) {
        var repo = 'rocktemplates/node-lib'
        GITHUB_TEST(repo, done)
      })
    })
  })
})

function GITHUB_TEST (repo, done) {
  var templateValues = {
    'author': 'JP Richardson',
    'email': 'jprichardson@gmail.com',
    'project-description': 'A cool test for a sweet library.',
    'project-name': 'cool_module',
    'package-name': 'cool_module'
  }

  rock.fetchRepo(TEST_DIR, repo, {templateValues: templateValues}, function(err) {
    if (err) return done(err)

    T (fs.existsSync(path.join(TEST_DIR, 'CHANGELOG.md')))
    T (fs.existsSync(path.join(TEST_DIR, 'LICENSE')))
    T (fs.existsSync(path.join(TEST_DIR, 'README.md')))
    T (fs.existsSync(path.join(TEST_DIR, 'lib')))
    T (fs.existsSync(path.join(TEST_DIR, 'package.json')))
    T (fs.existsSync(path.join(TEST_DIR, 'test')))
    T (fs.existsSync(path.join(TEST_DIR, 'lib/cool_module.js')))
    T (fs.existsSync(path.join(TEST_DIR, 'test/cool_module.test.js')))

    T (fs.readFileSync(path.join(TEST_DIR, 'package.json'), 'utf8').indexOf('cool_module') > 0)
    done()
  })
}