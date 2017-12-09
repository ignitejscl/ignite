// Import NPM packages required for our CLI
const yargs = require('yargs')

// Import our custom packages
// const checkUpdate = require('./util/checkUpdate');

// Version Information
const pkg = require('../package.json')

// Check for updates on CLI startup
//checkUpdate(pkg)

// Our Packages
const init = require('./commands/init')
const install = require('./commands/install')
const share = require('./commands/share')
const update = require('./commands/update')

yargs
    .version(pkg.version)
    .completion('completion')
    .demand(1)
    .help()
    .command(init)
    .command(share)
    .command(install)
    .command(update).argv;