const Discord = require('discord.js');
module.exports = {
    name: 'welcomes',
    description: 'Set up or edit welcome channel',
    category: 'Setup',
    botPermissions: [{ name: "Send Messages", perm: Discord.PermissionsBitField.Flags.SendMessages }, { name: "View Channel", perm: Discord.PermissionsBitField.Flags.ViewChannel }],
    memberPermissions: [{ name: "Manage Channels", perm: Discord.PermissionsBitField.Flags.ManageChannels }],
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

            if (!guildDb?.welcomeChannel || !interaction.guild.channels.cache.get(guildDb?.welcomeChannel)) {

                client.db.prepare("UPDATE guilds SET welcomeChannel = ? WHERE id = ?").run(interaction.channel.id, interaction.guild.id);
                interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.greencolor)
                            .setDescription(client.langs("modules", language).set.replace("{name}", interaction.channel))
                    ]
                });

            } else return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(`${client.langs("modules", language).alreadyEnabled} ${client.channels.cache.get(guildDb?.welcomeChannel) ? `<#${guildDb?.welcomeChannel}>` : ``}`)
                ]
            });

        } else if (interaction.options.get('action').value == "disable") {

            if (guildDb?.welcomeChannel) {

                client.db.prepare("UPDATE guilds SET welcomeChannel = ? WHERE id = ?").run(null, interaction.guild.id);
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