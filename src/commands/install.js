// Import required NPM packages
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora');
const rtrim = require('rtrim');
const { spawn } = require('child_process');

// Set configuration
const { userConfig } = require('../config');

// Include package.json sample file
let samplePackageJsonFileImported = require('../templates/package.json');
const samplePackageJsonFile = JSON.stringify(samplePackageJsonFileImported);
// Command Exports
exports.command = ['install'];
exports.describe = "Install dependencies from the ignite-config file"
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
        `${chalk.bold("Ignite:")} ${chalk.green("Installing project dependencies for you now!")}`
    )
    console.log();
    const folder = args._ ? args._.filter(
        arg => arg !== 'install'
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
    const igniteConfigFile = require(igniteConfigFilePath);
    let spinner = ora("Creating package.json").start()
    let projectName = igniteConfigFile.name;
    let projectVersion = igniteConfigFile.version;
    let projectAuthor = igniteConfigFile.author;
    let projectDescription = igniteConfigFile.description;
    let dependencies = igniteConfigFile.dependencies;
    let git = igniteConfigFile.git;
    let scripts = igniteConfigFile.scripts;
    let config = igniteConfigFile.config;
    let packageJson = samplePackageJsonFile;
    packageJson = packageJson.replace(/PKG_NAME/g, projectName);
    packageJson = packageJson.replace(/PKG_VERSION/g, projectVersion);
    packageJson = packageJson.replace(/PKG_DESCRIPTION/g, projectDescription);
    packageJson = packageJson.replace(/PKG_START/g, scripts.start);
    packageJson = packageJson.replace(/PKG_TEST/g, scripts.test);
    packageJson = packageJson.replace(/PKG_GITREPO/g, git);
    packageJson = packageJson.replace(/PKG_AUTHOR/g, projectAuthor);
    if(!fs.existsSync(path.join(workdir, 'package.json'))) {
        fs.writeFileSync(path.join(workdir, 'package.json'), packageJson);
        spinner.succeed("Wrote package.json file");
        spinner = ora("Installing dependencies").start();
        dependencies.forEach((dep) => {
            let child = spawn('npm', ['install', `${dep}`, '--save']);
            child.on('exit', (code, signal) => {
                console.log(
                    chalk.bold(`Installed ${dep} successfully`)
                );
            })
        })
        spinner.succeed("Installed dependencies successfully.");
    }
    else {
        spinner.fail("Package.json already exists, and was not overwritten.");
    }
}