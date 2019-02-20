#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var fs = require('fs');
var path = require('path');
var commander = require('commander');
var index_1 = require('./index');
var CD = process.cwd();
commander
  .version(require('../package.json').version)
  .option('-c, --config [type]', 'config file', 'json2service.json')
  .option('--clear [type]', 'rm typescript service before gen', false)
  .parse(process.argv);
var Config = commander.config;
var ConfigFile = path.join(CD, Config);
if (!fs.existsSync(ConfigFile)) {
  console.error('[ERROR]: ' + Config + ' not found in ' + CD);
} else {
  var config = require(ConfigFile);
  index_1.default(config, { clear: commander.clear });
}
//# sourceMappingURL=cli.js.map
