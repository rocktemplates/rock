/* eslint-env mocha */
var testutil = require('testutil')
var rock = require('../lib/rock')
var fs = require('fs')
var path = require('path')
require('terst')

var TEST_DIR = ''

describe('rock', function () {
  beforeEach(function () {
    TEST_DIR = testutil.createTestDir('rock')
  })

  describe('+ fetchRepo()', function () {
    describe('> when rock is an absolute Github HTTP repo', function () {
      it('should download the files and create the rock', function (done) {
        var repo = 'https://github.com/rocktemplates/rock-test'
        GITHUB_TEST(repo, done)
      })
    })

    describe('> when rock is a relative Github HTTP repo', function () {
      it('should download the files and create the rock', function (done) {
        var repo = 'rocktemplates/rock-test'
        GITHUB_TEST(repo, done)
      })
    })
  })
})

function GITHUB_TEST (repo, done) {
  var templateValues = {
    name: 'John'
  }

  rock.fetchRepo(TEST_DIR, repo, {templateValues: templateValues}, function (err) {
    if (err) return done(err)

    T(fs.readFileSync(path.join(TEST_DIR, 'test.txt'), 'utf8') === 'Hello John!\n')
    done()
  })
}
