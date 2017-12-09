// Import required NPM packages
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora');
const rtrim = require('rtrim');
const { spawn } = require('child_process');
const ignore = require('ignore');
const tar = require('tar-fs');

// Set configuration
const { userConfig } = require('../config');

// Include package.json sample file
let samplePackageJsonFileImported = require('../templates/package.json');
const samplePackageJsonFile = JSON.stringify(samplePackageJsonFileImported);
// Command Exports
exports.command = ['share'];
exports.describe = "Share your project with others in a compressed tarball"
exports.builder = {
    verbose: {
        alias: 'v',
        description: 'Verbose mode will output more information than normal',
        count: true
    }
};
exports.handler = async(args = {}) => {
    const {verbose} = args;
    console.log();
    console.log(
        `${chalk.bold("Ignite:")} ${chalk.green("Let's generate a share file and readme to distribute")}`
    )
    console.log();
    let spinner = ora("Packaging up project...").start();
    const folder = args._ ? args._.filter(
        arg => arg !== 'share'
    ).shift() : undefined;
    const workdir = folder ? path.join(process.cwd(), folder) : process.cwd();
    const folderName = path.basename(workdir);
    if(!fs.existsSync(workdir)) {
        console.log(
            chalk.red(`Error: Path ${chalk.bold(workdir)} does not exist.`)
        );
        console.log('Please, check your arguments and try again');
        return;
    }
    const igniteConfigFilePath = path.join(workdir, '/.ignite-config.js')
    if(!fs.existsSync(igniteConfigFilePath)) {
        console.log(
            chalk.red(`Error: Ignite Configuration file not found.`)
        )
        return;
    }
    const ignores = ['.git', 'node_modules', 'package.json', 'package-lock.json', 'ignite-bundle.tar'];
    // Create ignore stream...
    const ig = ignore().add(ignores);
    const tarStream = tar.pack(workdir, {
        ignore: name => ig.ignores(name)
    }).pipe(fs.createWriteStream('ignite-bundle.tar'))
    // what are we ignoring? let's tell the users
    verbose && console.log(`Ignoring the following paths:`, ignores)
    spinner.succeed("Created tar stream, and saved as 'ignite-bundle.tar'")
    console.log(`Now you can distribute your friends the ignite-bundle.tar and they just need to run: npm install ignitejs && ignite install to get everything started.`)
}