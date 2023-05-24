const Discord = require('discord.js');
module.exports = {
    name: 'levels',
    description: 'Set up or disable the level system',
    category: 'Setup',
    memberPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }],
    botPermissions: [{ name: "View Channel", perm: Discord.PermissionsBitField.Flags.ViewChannel }],
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
        }
    ],
    run: async (client, interaction, language) => {

        const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);

        if (interaction.options.get('action').value == "set") {

            if (!guildDb?.levels) {

                client.db.prepare("UPDATE guilds SET levels = ? WHERE id = ?").run("1", interaction.guild.id);
                interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.greencolor)
                            .setDescription(client.langs("modules", language).enabled.replace("{name}", "Levels"))
                    ]
                });

            } else return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("modules", language).alreadyEnabled)
                ]
            });

        } else if (interaction.options.get('action').value == "disable") {

            if (guildDb?.levels) {

                client.db.prepare("UPDATE guilds SET levels = ? WHERE id = ?").run(null, interaction.guild.id);
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