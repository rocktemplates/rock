var testutil = require('testutil')
  , rutil = require('../lib/util')
  , fs = require('fs-extra')


var TEST_DIR = null

describe('lib/util', function() {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('rock')
  })

  describe('+ pathInfo', function() {
    describe('> when path is a local directory', function() {
      it('should return the right info', function() {
        var p = path.join
      })
    })
  })
})