// Import required NPM packages
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora');
const rtrim = require('rtrim');

// Set configuration
const { userConfig } = require('../config');
const igniteConfig = require('../templates/ignite-provider-config')
const baseTemplate = require('../templates/ignite-provider-template')

// Set Default Ignite-Config Templates
const igniteConfigTemplate = require('../templates/ignite-config')

// Command Exports
exports.command = ['create-provider'];
exports.describe = "Create a cloud provider deployment file"
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
        `${chalk.bold("Ignite:")} ${chalk.green("Let's create your provider, this won't take long.")}`
    )
    console.log();
    const folder = args._ ? args._.filter(
        arg => arg !== 'provider'
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

    // prompt user for questions
    const initQuestions = [
        {
            type: "input",
            name: "PKG_AUTHOR",
            message: "What's your name?",
            validate: function (pkg_your_author_name) {
                return pkg_your_author_name !== '';
            }
        },
        {
            type: "input",
            name: "PKG_NAME",
            message: "What is the provider's name?",
            validate: function (pkg_name) {
                return pkg_name !== '';
            }
        },
        {
            type: "input",
            name: "PKG_VERSION",
            message: "What's the version number?",
            default: "0.0.1",
            validate: function (pkg_version) {
                return pkg_version !== '';
            }
        },
        {
            type: "input",
            name: "PKG_DESCRIPTION",
            message: "What's this provider file do?",
            validate: function (pkg_description) {
                return pkg_description !== '';
            }
        },
        {
            type: "input",
            name: "PKG_DEPENDENCIES",
            message: "Package dependencies? Seperated by commas (,). Ex: chalk,express",
            default: "chalk,ora",
            validate: function (pkg_dependencies) {
                return pkg_dependencies !== '';
            }
        },
        {
            type: "input",
            name: "PKG_GITREPO",
            message: "Git Repository Link",
            default: "https://github.com/ignitejscl/ignite-project",
            validate: function (pkg_git_repo) {
                return pkg_git_repo !== '';
            }
        },
        {
            type: "input",
            name: "PKG_START",
            message: "What file will be the main file? Ex. index.js",
            default: "index.js",
            validate: function (pkg_start_script) {
                return pkg_start_script !== '';
            }
        }
    ]
    inquirer.prompt(initQuestions).then(answers => {
        let inquirerAnswers = answers
        // create configuration file
        const configPath = path.join(workdir, '.ignite-provider-config.js');
        // but first let's write the .ignite-config.js file
        let pkgUseDocker = inquirerAnswers.PKG_USE_DOCKER === 'y'
        let spinner = ora('Creating ignite provider configuration file').start()
        let pkgMakeDockerfile = inquirerAnswers.PKG_CREATE_DOCKERFILE === 'y'
        let configFile = igniteConfig;
        configFile = configFile.replace(/PKG_NAME/g, inquirerAnswers.PKG_NAME)
        configFile = configFile.replace(/PKG_VERSION/g, inquirerAnswers.PKG_VERSION)
        configFile = configFile.replace(/PKG_DESCRIPTION/g, inquirerAnswers.PKG_DESCRIPTION)
        configFile = configFile.replace(/PKG_AUTHOR/g, inquirerAnswers.PKG_AUTHOR)
        configFile = configFile.replace(/PKG_GITREPO/g, inquirerAnswers.PKG_GITREPO)
        configFile = configFile.replace(/PKG_START/g, inquirerAnswers.PKG_START)
        if(inquirerAnswers.PKG_DEPENDENCIES.indexOf(',') > -1) {
            let deps = '';
            let pkgDeps = inquirerAnswers.PKG_DEPENDENCIES.split(",")
            pkgDeps.forEach((dep) => {
                deps += `"${dep}",`
            })
            deps = rtrim(deps, ',')
            configFile = configFile.replace(/PKG_DEPENDENCIES/g, deps)
        } else {
            configFile = configFile.replace(/PKG_DEPENDENCIES/g, inquirerAnswers.PKG_DEPENDENCIES)
        }
        spinner.succeed("Created configuration file.")
        spinner = ora("Saving configuration file...").start()
        try {
            fs.statSync(configPath);
        } catch (e) {
            fs.writeFileSync(configPath, configFile, 'utf8');
            verbose && console.log(chalk.green('Created new default configuration file'))
        }
        spinner.succeed("Saved configuration file")
        spinner = ora('Creating ' + inquirerAnswers.PKG_START + ' file with base provider template...').start()
        let indexFile = path.join(workdir, inquirerAnswers.PKG_START);
        try {
            fs.statSync(indexFile);
            spinner.fail("File already exists and was not overwritten.")
        } catch (e) {
            fs.writeFileSync(indexFile, baseTemplate);
            spinner.succeed("Generated file successfully.")
        }
        verbose && console.log('Finished successfully at ' + new Date())
    })
}