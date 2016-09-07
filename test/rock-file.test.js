/* eslint-env mocha */
var P = require('autoresolve')
var path = require('path-extra')
var fs = require('fs-extra')
var rock = require(P('lib/rock'))
var testutil = require('testutil')
var nock = require('nock')
require('terst')

var TEST_DIR = null

var TMPL = 'Hi, @@author@@ is going to build:\n@@project-name@@.'
var TMPL_E = 'Hi, JP is going to build:\nRock.'

describe('rock', function () {
  beforeEach(function () {
    TEST_DIR = testutil.createTestDir('rock')
    TEST_DIR = path.join(TEST_DIR, 'fetch-file')
  })

  describe('+ fetchFile()', function () {
    describe('> when change open and closing templates', function () {
      it('should generate a basic project', function (done) {
        TEST(done)
      })
    })
  })
})

function TEST (done) {
  var file = path.join(TEST_DIR, 'info.txt')
  var remote = 'http://localhost/data.txt'

  nock('http://localhost')
  .get('/data.txt')
  .reply(200, TMPL, {'Content-Type': 'text/plain'})

  var templateValues = {
    'author': 'JP',
    'project-name': 'Rock'
  }

  rock.fetchFile(file, remote, {templateValues: templateValues, tokens: {open: '@@', close: '@@'}}, function (err) {
    F(err)
    EQ(TMPL_E, fs.readFileSync(file, 'utf8'))

    done()
  })
}
