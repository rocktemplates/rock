/* eslint-env mocha */
var P = require('autoresolve')
var path = require('path')
var fs = require('fs')
var rock = require(P('lib/rock'))
var testutil = require('testutil')
require('terst')

var TEST_DIR = null

describe('rock', function () {
  beforeEach(function () {
    TEST_DIR = testutil.createTestDir('rock')
  })
  describe('date tokens', function () {
    it('should generate the current date', function () {
      var file = path.join(TEST_DIR, 'date.txt')
      var date = {actual: new Date()}
      date.year = date.actual.getFullYear()
      date.month = ('00' + (date.actual.getMonth() + 1)).slice(-2)
      date.day = ('00' + date.actual.getDate()).slice(-2)
      var expected = date.year + '-' + date.month + '-' + date.day + '\n'
      return rock.fetchFile(file, P('test/resources/rocks/date.txt'))
      .then(function () {
        EQ(expected, fs.readFileSync(file, 'utf8'))
      })
    })
  })
  describe('literal', function () {
    it('should work with default delimiter', function () {
      var file = path.join(TEST_DIR, 'literal.txt')
      var expected = '{{\n'
      return rock.fetchFile(file, P('test/resources/rocks/literal.txt'))
      .then(function () {
        EQ(expected, fs.readFileSync(file, 'utf8'))
      })
    })
    it('should work with alternate delimiter', function () {
      var file = path.join(TEST_DIR, 'literal-alt.txt')
      var expected = '@@\n'
      return rock.fetchFile(file, P('test/resources/rocks/literal-alt.txt'), {
        tokens: {
          open: '@@',
          close: '@@'
        }
      })
      .then(function () {
        EQ(expected, fs.readFileSync(file, 'utf8'))
      })
    })
  })
})
