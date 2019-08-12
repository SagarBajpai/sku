const chalk = require('chalk');
const EslintCLI = require('eslint').CLIEngine;
const prettierWrite = require('../lib/runPrettier').write;
const args = require('../config/args').argv;

console.log(chalk.cyan('Fixing code with ESLint'));
const eslintCli = new EslintCLI({
  fix: true,
});
const eslintPathsToCheck = args.length === 0 ? ['.'] : args;
const eslintReport = eslintCli.executeOnFiles(eslintPathsToCheck);
EslintCLI.outputFixes(eslintReport);
console.log(chalk.cyan('ESLint fix complete'));

const prettierPathsToCheck = args.length === 0 ? [] : args;
prettierWrite(prettierPathsToCheck);
