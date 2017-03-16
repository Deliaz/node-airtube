#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const version = require('./package.json').version;
const ytdl = require('ytdl-core');
const AirPlay = require('airplay-protocol');
const ora = require('ora');
const chalk = require('chalk');
//TODO bonjour to discover devices

program
    .version(version)
    .usage('<url> [options]')
    // .option('-v, --verbose', 'enable verbose mode') // TODO verbose output
    .option('-d, --device <device>', 'hostname or IP', 'apple-tv.local')
    .option('-p, --port <port>', 'port number', 7000)
    .parse(process.argv);

const url = program.args[0]; //TODO pattern to check youtube link
if (!url) {
    program.help();
}

let logGetInfo = ora({
    text: 'Loading video info...',
    spinner: 'dots2',
    color: 'blue',
    interval: 100
});

let logConnecting = ora({
    text: 'Connecting to AirPlay device...',
    spinner: 'dots2',
    color: 'yellow',
    interval: 100
});

let logPlay = ora({
    spinner: 'dots',
    color: 'green',
    interval: 200
});

logGetInfo.start();


ytdl
    .getInfo(url)
    .then(chooseFormat)
    .then(playVideo)
    .catch(err => {
        if (err) {
            console.error('\n' + chalk.red('Error'), err.message);
            // TODO Show stack in verbose
        }
        process.exit(-1);
    });


function chooseFormat(info) {
    return new Promise((resolve, reject) => {
            if (!info || !info.formats) {
                logGetInfo.fail('Cannot get video info.');
                reject();
                return;
            }

            const format = ytdl.chooseFormat(info.formats, {
                filter: 'video' // TODO different qualities
            });

            if (!format || !format.url) {
                logGetInfo.fail('Cannot find proper source.');
                reject();
                return;
            }

            const url = format.url;
            const title = info.title;
            logGetInfo.succeed(`Video info loaded. Using ${format.resolution}.`);
            resolve({url, title});
        }
    );
}

function playVideo({url, title}) {
    return new Promise((resolve, reject) => {
        logConnecting.start();

        const airplayDevice = new AirPlay(program.device, program.port); // TODO not only default

        if (!airplayDevice) {
            logConnecting.fail('AirPlay device connection error.');
            reject();
            return;
        }

        //TODO airplayDevice.on error

        airplayDevice.play(url, function (err) {
            if (err) {
                logConnecting.fail('AirPlay playback error.');
                reject(err);
                return;
            }

            logConnecting.succeed(`Connected to ${chalk.blue(program.device + ':' + program.port)}`);
            logPlay.text = `Playing "${chalk.green(title)}". Press ${chalk.yellow('Ctrl+C')} to stop.`;
            logPlay.start();
        })
    });
}