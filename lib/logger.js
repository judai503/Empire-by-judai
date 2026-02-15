import chalk from 'chalk';

export const logMessage = (m) => {
    console.log(
        chalk.black(chalk.bgCyan(' MSG ')),
        chalk.black(chalk.bgWhite(` ${new Date().toLocaleTimeString()} `)),
        chalk.cyan(m.text?.slice(0, 20) || 'Multimedia'),
        chalk.magenta('de'),
        chalk.green(m.sender.split('@')[0])
    );
};

export const logError = (err) => {
    console.error(chalk.red.bold('❌ ERROR:'), chalk.red(err));
};
