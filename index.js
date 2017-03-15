#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const version = require('./package.json').version;

program
    .version(version)
    .parse(process.argv);