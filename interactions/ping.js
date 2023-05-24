const Discord = require('discord.js');
module.exports = {
    name: 'ping',
    description: 'View the bot\'s latency',
    category: 'General',
    cooldown: 10,
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setTitle('<a:load:869677348264493076>')
            ]
        }).then(async (i) => {
            interaction.editReply({
                embeds: [new Discord.EmbedBuilder()
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(client.config.color)
                    .setDescription(`**${client.langs("ping", language).bot} :** \`${i.createdTimestamp - interaction.createdTimestamp} ms\`\n` +
                        `**${client.langs("ping", language).api} :** \`${Math.floor(client.ws.ping)} ms\`\n`)
                    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp()
                ]
            });
        });

    }
};