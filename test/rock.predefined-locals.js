/* eslint-env mocha */
var P = require('autoresolve')
var path = require('path')
var fs = require('fs-extra')
var rock = require(P('lib/rock'))
var testutil = require('testutil')
require('terst')

var TEST_DIR = null

describe('rock', function () {
  beforeEach(function () {
    TEST_DIR = testutil.createTestDir('rock')
  })
  describe('date tokens', function () {
    it('should generate the current date', function (done) {
      var file = path.join(TEST_DIR, 'date.txt')
      var date = {actual: new Date()}
      date.year = date.actual.getFullYear()
      date.month = ('00' + (date.actual.getMonth() + 1)).slice(-2)
      date.day = ('00' + date.actual.getDate()).slice(-2)
      var expected = date.year + '-' + date.month + '-' + date.day + '\n'
      rock.fetchFile(file, P('test/resources/rocks/date.txt'), function (err) {
        F(err)
        EQ(expected, fs.readFileSync(file, 'utf8'))
        done()
      })
    })
  })
  describe('literal', function () {
    it('should work with default delimiter', function (done) {
      var file = path.join(TEST_DIR, 'literal.txt')
      var expected = '{{\n'
      rock.fetchFile(file, P('test/resources/rocks/literal.txt'), function (err) {
        F(err)
        EQ(expected, fs.readFileSync(file, 'utf8'))
        done()
      })
    })
    it('should work with alternate delimiter', function (done) {
      var file = path.join(TEST_DIR, 'literal-alt.txt')
      var expected = '@@\n'
      rock.fetchFile(file, P('test/resources/rocks/literal-alt.txt'), {
        tokens: {
          open: '@@',
          close: '@@'
        }
      }, function (err) {
        F(err)
        EQ(expected, fs.readFileSync(file, 'utf8'))
        done()
      })
    })
  })
})
