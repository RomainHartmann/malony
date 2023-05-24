const Discord = require('discord.js');
const package = require(`${process.cwd()}/package.json`);
module.exports = {
    name: 'stats',
    owner: true,
    run: async (client, message, args, language) => {

        message.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setTitle('Stats')
                    .setFooter({ text: `${client.user.username} v${package.version}`, iconURL: client.user.displayAvatarURL({ dynamic: false }) })
                    .addFields(
                        { name: 'Commands Used (global)', value: client.db.prepare('SELECT SUM(commandsUsed) FROM guilds').get()['SUM(commandsUsed)'].toString() },
                        { name: 'Tempchannels', value: client.db.prepare('SELECT COUNT(*) FROM guilds WHERE tempchannel IS NOT NULL').get()['COUNT(*)'].toString() },
                        { name: 'Levels', value: client.db.prepare('SELECT COUNT(*) FROM guilds WHERE levels IS NOT NULL').get()['COUNT(*)'].toString() },
                        { name: 'Block Links', value: client.db.prepare('SELECT COUNT(*) FROM guilds WHERE blockLinks IS NOT NULL').get()['COUNT(*)'].toString() },
                        { name: 'Youtube Notifier', value: client.db.prepare('SELECT COUNT(*) FROM guilds WHERE yn_ytChannel IS NOT NULL').get()['COUNT(*)'].toString() },
                        { name: 'Welcome Channel', value: client.db.prepare('SELECT COUNT(*) FROM guilds WHERE welcomeChannel IS NOT NULL').get()['COUNT(*)'].toString() },
                    )
            ]
        });

    },
}