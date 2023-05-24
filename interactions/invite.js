const Discord = require("discord.js");
module.exports = {
    name: 'invite',
    description: 'Invite the bot',
    category: 'General',
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setDescription(client.langs("invite", language).message)
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents([
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Link)
                            .setLabel(client.langs("invite", language).button)
                            .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=69005043736`)
                    ])
            ]
        });

    }
}