const chalk = require('chalk');
const dayjs = require('dayjs');

function client(content) {
    write('CLIENT', '#c39dfb', content, '#e5e6b4');
}

function site(content) {
    write('SITE', '#4c9eac', content, '#ccccc');
}

function node(content) {
    write('NODE', '#289e90', content, '#ccccc');
}

function db(content) {
    write('DB', '#6f2aa3', content, '#ccccc');
}

function error(content) {
    write('ERROR', '#f7d600', content, '#ccccc', true);
}

function info(content) {
    write('INFO', '#a7c9c8', content, '#ccccc');
}

function cmd(content) {
    write('CMD', '#00f7ad', content, '#ccccc');
}

function action(content) {
    write('ACTION', '#0094f7', content, '#ccccc');
}

function write(tag, BgTagColor, content, contentColor, error = false) {
    if (error) {
        if (typeof (content) == 'object' || (content?.match(/\r?\n/g) || '').length + 1 > 1) {
            console.log(`\n↓ ${chalk.bgHex(BgTagColor).hex('black').bold(`[${tag}]`)} ↓`);
            console.log(content.stack ? chalk.gray(String(content.stack)) : chalk.gray(String(content)));
            console.log(`↑ ${chalk.bgHex(BgTagColor).hex('black').bold(`[${tag}]`)} ↑\n`);
        } else {
            process.stdout.write(`${chalk.hex('#BFE7F0')(`[${dayjs().format('DD/MM - HH:mm:ss')}]`)} ${chalk.bgHex(BgTagColor).hex('black').bold(`[${tag}]`)} ${chalk.hex(contentColor).bold(content)}\n`);
        }
    } else {
        process.stdout.write(`${chalk.hex('#BFE7F0')(`[${dayjs().format('DD/MM - HH:mm:ss')}]`)} ${chalk.bgHex(BgTagColor).hex('black').bold(`[${tag}]`)} ${contentColor ? chalk.hex(contentColor)(content) : content}\n`);
    }
}

module.exports = { client, site, error, node, db, info, cmd, action };