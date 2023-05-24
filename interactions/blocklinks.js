const Discord = require('discord.js');
module.exports = {
    name: 'blocklinks',
    description: 'Set up or disable link blocking for users',
    category: 'Setup',
    cooldown: 5,
    memberPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }],
    botPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }],
    options: [
        {
            name: 'action',
            description: 'Select an action',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: 'set',
                    value: 'set'
                },
                {
                    name: 'disable',
                    value: 'disable'
                }
            ]
        },
        {
            name: 'type',
            description: 'Select a type',
            type: Discord.ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: 'discord',
                    value: 'discord'
                },
                {
                    name: 'all',
                    value: 'all'
                }
            ],
        }
    ],
    run: async (client, interaction, language) => {

        const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);
        const type = interaction.options.getString('type') || "all";

        if (interaction.options.getString('action') == "set") {

            client.db.prepare("UPDATE guilds SET blockLinks = ? WHERE id = ?").run(type, interaction.guild.id);
            interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.greencolor)
                        .setDescription(client.langs("modules", language).enabled.replace("{name}", `Block links (${type})`))
                ]
            });

        } else {

            if (guildDb.blockLinks) {

                client.db.prepare("UPDATE guilds SET blockLinks = ? WHERE id = ?").run(null, interaction.guild.id);
                return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("modules", language).nowDisabled)
                    ]
                });

            } return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("modules", language).alreadyDisabled)
                ]
            });

        }

    }
};