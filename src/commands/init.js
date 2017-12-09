// Import required NPM packages
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora');
const rtrim = require('rtrim');

// Set configuration
const { userConfig } = require('../config');
const igniteConfig = require('../templates/ignite-config')

// Set Ignore Files
const ignores = [
    '.git',
    'node_modules',
    '.ignite'
];

// Set Default Ignite-Config Templates
const igniteConfigTemplate = require('../templates/ignite-config')
const dockerfileConfigTemplate = require('../templates/dockerfile');

// Command Exports
exports.command = ['init'];
exports.describe = "Initialize a new or existing project with an ignite-config file"
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
        `${chalk.bold("Ignite:")} ${chalk.green("Let's setup your project with Ignite!")}`
    )
    console.log();
    const folder = args._ ? args._.filter(
        arg => arg !== 'init'
    ).shift() : undefined;
    const workdir = folder ? path.join(process.cwd(), folder) : process.cwd();
    const folderName = path.basename(workdir);
    // console.log(folder, workdir, folderName);
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
            message: "What is the project's name?",
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
            message: "What's this project about?",
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
            message: "What file will be the start file? Ex. index.js",
            default: "index.js",
            validate: function (pkg_start_script) {
                return pkg_start_script !== '';
            }
        },
        {
            type: "input",
            name: "PKG_USE_DOCKER",
            message: "Use Docker? (y/n)",
            default: "n",
            validate: function (pkg_use_docker) {
                return pkg_use_docker !== '';
            }
        },
        {
            type: "input",
            name: "PKG_CREATE_DOCKERFILE",
            message: "Create Dockerfile? (y/n)",
            default: "n",
            validate: function (pkg_dockerfile) {
                return pkg_dockerfile !== '';
            }
        }
    ]
    inquirer.prompt(initQuestions).then(answers => {
        let inquirerAnswers = answers
        // create configuration file
        const configPath = path.join(workdir, '.ignite-config.js');
        // but first let's write the .ignite-config.js file
        let pkgUseDocker = inquirerAnswers.PKG_USE_DOCKER === 'y'
        let spinner = ora('Creating ignite configuration file').start()
        let pkgMakeDockerfile = inquirerAnswers.PKG_CREATE_DOCKERFILE === 'y'
        let configFile = igniteConfig;
        configFile = configFile.replace(/PKG_NAME/g, inquirerAnswers.PKG_NAME)
        configFile = configFile.replace(/PKG_VERSION/g, inquirerAnswers.PKG_VERSION)
        configFile = configFile.replace(/PKG_DESCRIPTION/g, inquirerAnswers.PKG_DESCRIPTION)
        configFile = configFile.replace(/PKG_AUTHOR/g, inquirerAnswers.PKG_AUTHOR)
        configFile = configFile.replace(/PKG_GITREPO/g, inquirerAnswers.PKG_GITREPO)
        configFile = configFile.replace(/PKG_START/g, inquirerAnswers.PKG_START)
        configFile = configFile.replace(/PKG_USE_DOCKER/g, pkgUseDocker)
        configFile = configFile.replace(/PKG_CREATE_DOCKERFILE/g, pkgMakeDockerfile)
        // finally do dependencies: PKG_DEPENDENCIES
        // then we need to create the dockerfile blob (PKG_DOCKERFILE_BLOB)
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
        configFile = configFile.replace(/PKG_DOCKERFILE_BLOB/g, "false");
        // TOOO: Make a dockerfile blob... this is down the road
        if(pkgUseDocker && pkgMakeDockerfile) {
            let dockerSpinner = ora("Creating Dockerfiles for Node (Node 9, Ubuntu)").start()
            let ubuntuTpl = dockerfileConfigTemplate.ubuntu;
            let nodeDefaultTpl = dockerfileConfigTemplate.default;
            ubuntuTpl = ubuntuTpl.replace(/PKG_AUTHOR/g, inquirerAnswers.PKG_AUTHOR);
            nodeDefaultTpl = nodeDefaultTpl.replace(/PKG_AUTHOR/g, inquirerAnswers.PKG_AUTHOR);
            // Create ubuntu file
            const ubuntuTplTarget = path.join(workdir, 'ubuntu.dockerfile');
            try {
                fs.statSync(ubuntuTplTarget);
            } catch(e) {
                fs.writeFileSync(ubuntuTplTarget, ubuntuTpl, 'utf8');
                verbose && console.log('Created ubuntu.dockerfile');
            }
            // Create node version 9 dockerfile
            const nodeDefaultTplTarget = path.join(workdir, 'node9.dockerfile');
            try {
                fs.statSync(nodeDefaultTplTarget);
            }
            catch (e) {
                fs.writeFileSync(nodeDefaultTplTarget, nodeDefaultTpl, 'utf8');
                verbose && console.log('Created node9.dockerfile');
            }
            dockerSpinner.succeed("Created docker files for ubuntu (6.x lts) and Node version 9");
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
    })
}