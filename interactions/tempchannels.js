const Discord = require('discord.js');
module.exports = {
    name: 'tempchannels',
    description: 'Set up or edit temporary voice channels',
    category: 'Setup',
    botPermissions: [{ name: "Manage Channels", perm: Discord.PermissionsBitField.Flags.ManageChannels }, { name: "Move Members", perm: Discord.PermissionsBitField.Flags.MoveMembers }],
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

            if (!guildDb?.tempchannel || !interaction.guild.channels.cache.get(guildDb?.tempchannel)) {

                interaction.guild.channels.create({ name: "TEMP CHANNELS", type: Discord.ChannelType.GuildCategory, reason: "Tempchannels command" }).then(async (category) => {
                    interaction.guild.channels.create({ name: client.langs("temp", language).Vname, type: Discord.ChannelType.GuildVoice, parent: category.id, reason: "Tempchannels command" }).then(async (channel) => {
                        client.db.prepare("UPDATE guilds SET tempchannel = ? WHERE id = ?").run(channel.id, interaction.guild.id);
                        interaction.editReply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.greencolor)
                                    .setDescription(client.langs("modules", language).set.replace("{name}", channel))
                            ]
                        });
                    });
                });

            } else return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(`${client.langs("modules", language).alreadyEnabled} ${client.channels.cache.get(guildDb?.tempchannel) ? `<#${guildDb?.tempchannel}>` : ``}`)
                ]
            });

        } else if (interaction.options.get('action').value == "disable") {

            if (guildDb?.tempchannel) {

                client.db.prepare("UPDATE guilds SET tempchannel = ? WHERE id = ?").run(null, interaction.guild.id);
                const channel = await client.channels.cache.get(guildDb?.tempchannel);
                if (channel) {
                    await channel.delete().catch(() => { });
                    if (channel.parent.name == "TEMP CHANNELS" && channel.parent.children.cache.size == 0) {
                        await channel.parent.delete().catch(() => { });
                    }
                }
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