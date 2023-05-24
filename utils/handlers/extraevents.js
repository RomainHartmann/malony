const Discord = require("discord.js");
const chalk = require('chalk');
module.exports = async client => {

    const embed = new Discord.EmbedBuilder().setTitle('New Error').setColor(client.config.color);

    process.on('unhandledRejection', async error => {
        console.log(chalk.yellow.dim('\n\n─ UNHANDLED REJECTION ─'));
        console.log(error.stack ? chalk.gray(String(error.stack)) : chalk.gray(String(error)));
        console.log(chalk.yellow.dim('─ UNHANDLED REJECTION ─\n\n\n'));
        const channel = await client.channels.cache.get(client.config.channelsOwner.channelLogsErrors);
        if (channel) {
            embed.setDescription(`\`\`\`${error.stack ? String(error.stack) : String(error)}\`\`\``)
            channel.send({ embeds: [embed] }).catch(() => { });
        }
    });
    process.on('uncaughtException', async error => {
        console.log(chalk.yellow.dim('\n\n- UNCAUGHT EXCEPTION -'));
        console.log(error.stack ? chalk.gray(String(error.stack)) : chalk.gray(String(error)));
        console.log(chalk.yellow.dim('- UNCAUGHT EXCEPTION -\n\n\n'));
        const channel = await client.channels.cache.get(client.config.channelsOwner.channelLogsErrors);
        if (channel) {
            embed.setDescription(`\`\`\`${error.stack ? String(error.stack) : String(error)}\`\`\``)
            channel.send({ embeds: [embed] }).catch((e) => { console.log(e) });
        }
    });

}