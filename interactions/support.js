const Discord = require("discord.js");
module.exports = {
    name: 'support',
    description: 'Join the support server',
    category: 'General',
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setDescription(client.langs("support", language).message)
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents([
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Link)
                            .setLabel(client.langs("support", language).button)
                            .setURL(client.config.supportServer.link)
                    ])
            ]
        });

    }
}