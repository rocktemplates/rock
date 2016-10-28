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
      it('should download the files and create the rock', function () {
        var repo = 'https://github.com/rocktemplates/rock-test'
        return GITHUB_TEST(repo)
      })
    })

    describe('> when rock is a relative Github HTTP repo', function () {
      it('should download the files and create the rock', function () {
        var repo = 'rocktemplates/rock-test'
        return GITHUB_TEST(repo)
      })
    })
  })
})

function GITHUB_TEST (repo) {
  var templateValues = {
    name: 'John'
  }

  return rock.fetchRepo(TEST_DIR, repo, {templateValues: templateValues})
  .then(function () {
    T(fs.readFileSync(path.join(TEST_DIR, 'test.txt'), 'utf8') === 'Hello John!\n')
  })
}
