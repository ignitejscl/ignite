// Import required NPM packages
const chalk = require('chalk');
const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const pkg = require('../../package.json');

// construct relative paths
const baseFolder = process.env.NODE_ENV === 'testing' 
    ? path.join(__dirname, '..', '..', 'test', 'fixtures')
    : path.join(os.homedir(), '.ignite');
const configPath = path.join(baseFolder, 'cli.config.yml');

const defaultConfiguration = {
    ignite: {
        version: pkg.version,
        author: pkg.author,
        dependencies: pkg.dependencies
    },
    providers: {
        heroku: {
            init: "heroku init"
        },
        git: {
            init: "git init",
            push: "git push -u {{ origin }} {{ branch }}",
            pull: "git pull {{ origin }} {{ branch }}"
        }
    }
};

let userConfiguration = defaultConfiguration;

// Try to create config folder if it doesn't exist
try {
    fs.statSync(baseFolder);
} catch (e) {
    fs.mkdirSync(baseFolder)
}

// create user config if it doesn't exist
try {
    fs.statSync(configPath);
} catch (e) {
    fs.writeFileSync(
        configPath,
        yaml.safeDump(defaultConfiguration), 
        'utf8'
    )
}

// load configuration
try {
    const newConfiguration = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    userConfiguration = newConfiguration
} catch (e) {
    console.error(
        chalk.bold('Ignite: ') + chalk.red('Failed to import configuration file')
    )
}

// export functions
exports.updateConfig = newConfig => {
    const cfg = Object.assign(userConfiguration, newConfig);
    fs.writeFileSync(configPath, yaml.safeDump(cfg), 'utf8')
};

exports.userConfig = userConfiguration;

exports.configFolder = baseFolder;