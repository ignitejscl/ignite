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
const { userConfig, configFolder } = require('../config');

// Include package.json sample file
let samplePackageJsonFileImported = require('../templates/package.json');
const samplePackageJsonFile = JSON.stringify(samplePackageJsonFileImported);
// Command Exports
exports.command = ['deploy'];
exports.describe = "Deploy your code to Heroku, or Now"
exports.builder = {
    verbose: {
        alias: 'v',
        description: 'Verbose mode will output more information than normal',
        count: true
    },
    heroku: {
        alias: 'h',
        description: 'Deploy to Heroku',
        count: true
    },
    now: {
        alias: 'n',
        description: 'Deploy to Now',
        count: true
    },
    provider: {
        alias: 'p',
        description: 'Deploy to a specified provider'
    }
};
exports.handler = async(args = {}) => {
    const {verbose} = args;
    const {heroku} = args;
    const {now} = args;
    const {provider} = args;
    console.log();
    console.log(
        `${chalk.bold("Ignite:")} ${chalk.green("Let's push to a cloud provider!")}`
    )
    console.log();
    let spinner = ora("Deployment in progress...").start();
    const folder = args._ ? args._.filter(
        arg => arg !== 'deploy'
    ).shift() : undefined;
    const workdir = process.cwd();
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
    if(heroku) {
        let gitAdd = spawn('git', ['add', '*']);
        gitAdd.on('exit', (code, signal) => {
            if(code === 0) {
                let gitCommit = spawn('git', ['commit', '-m', '"Deploy from Ignite"']);
                gitCommit.on('data', (data) => {
                    if(verbose) {
                        console.log(data)
                    }
                })
                gitCommit.on('exit', (code, signal) => {
                    if(code === 0) {
                        let gitPush = spawn('git', ['push', '-u', 'heroku', 'master']);
                        gitPush.on('exit', (code, signal) => {
                            if(code === 0) {
                                spinner.succeed("Deployed to Heroku successfully!")
                            }
                            else {
                                spinner.fail("Failed to deploy to Heroku when trying to push to heroku origin (branch = master)")
                                return;
                            }
                        })
                        gitPush.on('data', (data) => {
                            if(verbose) {
                                console.log(data)
                            }
                        })
                    }
                    else {
                        spinner.fail("Failed to add commit message")
                        return;
                    }
                })
            }
            else {
                spinner.fail("Failed to add to Git (git add *)")
                return;
            }
        })
        gitAdd.on('data', (data) => {
            if(verbose) {
                console.log(data)
            }
        })
    }
    else if(now) {
        let now = spawn('now')
        now.on('exit', (code, signal) => {
            if(code === 0) {
                spinner.succeed("Deployment completed.")
            }
            else {
                spinner.fail("Deployment to Now failed.")
            }
        })
    }
    else if(provider !== "" && provider !== null) {
        verbose && console.log(chalk.bold("Ignite:") + chalk.green("Using provider " + provider));
        let providersPath = path.join(configFolder, 'providers/'+provider);
        try {
            const selectedProvider = require(providersPath);
            spinner.succeed("Provider file loaded.");
            selectedProvider.run();
        } catch (e) {
            spinner.fail("Failed to deploy to provider.");
            console.error(
                chalk.bold('Ignite: ') + chalk.red(`Failed to import provider file for ${chalk.red(provider)}, it was not found. Are you sure it's installed?`)
            )
            return;
        }
    }
    else {
        console.log(
            chalk.red(`Error: Provider ${chalk.bold(provider)} is not supported currently.`)
        )
    }
}