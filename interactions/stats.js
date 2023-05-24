const Discord = require('discord.js');
const package = require(`${process.cwd()}/package.json`);
module.exports = {
    name: 'stats',
    description: 'View the bot stats',
    category: 'General',
    cooldown: 10,
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setTitle('Stats')
                    .setFooter({ text: `${client.user.username} v${package.version}`, iconURL: client.user.displayAvatarURL({ dynamic: false }) })
                    .addFields(
                        { name: `${client.langs("stats", language).servers} :`, value: client.guilds.cache.size.toString(), inline: true },
                        { name: `${client.langs("stats", language).users} :`, value: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toString(), inline: true },
                        { name: `${client.langs("stats", language).commands} :`, value: client.application.commands.cache.size.toString(), inline: true },
                        { name: 'node.js :', value: process.version, inline: true },
                        { name: 'discord.js :', value: package.dependencies["discord.js"].replace("^", ""), inline: true },
                        { name: 'Uptime :', value: client.utils.duration(client, language, client.uptime), inline: true }
                    )
            ]
        });

    }
};