// Import required NPM packages
const _ = require('lodash');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const pkg = require('../../package.json')

// Config Settings
const updateTargets = [
    'host',
    'server'
];

const {userConfig} = require("../config")

// Update Functions 
// @TODO: Make github clone function

// Exports for yargs
exports.command = ['update [target]'];
exports.describe = 'checks for updates and updates the given target';
exports.builder = {
    target: {
        alias: 't',
        description: `Target for updating (${updateTargets.join(", ")}`
    }
}
exports.handler = async ({target}) => {
    console.log();
    console.log(chalk.bold('Ignite:'));
    console.log(`    current: ${pkg.version}`);
    console.log();
    return;
}