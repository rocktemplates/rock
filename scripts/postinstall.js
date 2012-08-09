var path = require('path-extra')
  , fs = require('fs-extra')
  , next = require('nextflow')
  , request = require('request');

var ROCK_DIR = path.join(path.homedir(), '.rock');
var ROCK_CONF = path.join(ROCK_DIR, 'rockconf.json');
var ROCK_CONF_URL = "https://raw.github.com/rocktemplates/rockconf/master/rockconf.json";

next({
    ERROR: function(err) {
        console.log(err);
        process.exit();
    },
    rockDirExist: function() {
        fs.exists(ROCK_DIR, this.next);
    },
    makeIt: function(itDoes) {
        if (!itDoes) {
            fs.mkdir(ROCK_DIR, this.next);
        } else 
            this.next();
    },
    rockConfExist: function() {
        fs.exists(ROCK_CONF, this.next);
    },
    makeRockConf: function(itDoes) {
        if (!itDoes) 
            request(ROCK_CONF_URL).pipe(fs.createWriteStream(ROCK_CONF));
    }

});