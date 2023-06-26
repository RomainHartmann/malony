const Discord = require('discord.js');
module.exports = {
    name: 'clear',
    description: 'Delete a specific amount of messages',
    category: 'Moderation',
    memberPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }],
    botPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }, { name: "View Channels", perm: Discord.PermissionsBitField.Flags.ViewChannel }],
    options: [
        {
            name: 'number',
            description: 'The number of messages to delete',
            type: Discord.ApplicationCommandOptionType.Integer,
            min_value: 1,
            max_value: 100,
            required: true
        }
    ],
    run: async (client, interaction, language) => {

        const number = interaction.options.getInteger('number');

        const messages = await interaction.channel.messages.fetch({
            limit: Math.min(number, 100),
            before: interaction.id,
        });

        await interaction.channel.bulkDelete(messages, true).then((r) => {
            interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.greencolor)
                        .setDescription(`${client.langs("clear", language).message.replace("{number}", r.size).replace("{s}", r.size !== 1 ? "s" : "")}${r.size !== number ? `, ${client.langs("clear", language).information.toLowerCase()}` : ""}`)
                ]
            });
        });

    }
}