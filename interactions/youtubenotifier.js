const Discord = require('discord.js');
module.exports = {
    name: 'youtubenotifier',
    description: 'Set up or disable youtube notifier',
    category: 'Setup',
    cooldown: 10,
    memberPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }],
    options: [
        {
            name: 'set',
            description: 'Set up youtube notifier',
            type: Discord.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'youtube_channel',
                    description: 'Enters a youtube channel',
                    type: Discord.ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'text_channel',
                    description: 'Select a text channel',
                    type: Discord.ApplicationCommandOptionType.Channel,
                    required: true
                },
                {
                    name: 'mention',
                    description: 'What role do you want him to mention when a video is released?',
                    type: Discord.ApplicationCommandOptionType.Role,
                    required: true
                }
            ],
        },
        {
            name: 'disable',
            description: 'Disable youtube notifier',
            type: Discord.ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction, language) => {

        const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);

        if (interaction.options.getSubcommand() == 'set') {

            const ytChannel = interaction.options.get('youtube_channel').value;
            const channelId = ytChannel?.split("/channel/")[1]?.split("/")[0]?.split("?")[0];
            if (!ytChannel.includes("youtube.com/channel/") || !/^[0-9a-zA-Z_\-]{24}$/.test(channelId)) {
                return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("ytNotifier", language).invalidLink)
                    ],
                    ephemeral: true
                });
            }

            const txtChannel = interaction.options.get('text_channel').value;
            if (client.channels.cache.get(txtChannel)?.type !== Discord.ChannelType.GuildText) {
                return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("ytNotifier", language).invalidTxtChannel)
                    ],
                    ephemeral: true
                });
            }

            if (!guildDb?.yn_ytChannel) {

                if (client.notifier.isActive(client)) {
                    client.notifier.stop(client);
                }

                client.utils.getYoutubeChannel(channelId).then(async (result) => {

                    if (!result) return interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("ytNotifier", language).invalidChannelId)
                        ]
                    });
                    else {
                        client.db.prepare("UPDATE guilds SET yn_ytChannel = ?, yn_txtChannel = ?, yn_roleId = ? WHERE id = ?").run(channelId, txtChannel, interaction.options.get('mention')?.value || null, interaction.guild.id);

                        if (!client.subscriptions.includes(channelId)) client.notifier.subscribe(client, channelId);
                        client.notifier.start(client);
                        interaction.editReply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.greencolor)
                                    .setDescription(client.langs("modules", language).set.replace("{name}", client.channels.cache.get(txtChannel)))
                            ]
                        });
                    }

                });

            } else return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("modules", language).alreadyEnabled)
                ]
            });

        } else if (interaction.options.getSubcommand() == 'disable') {

            if (guildDb?.yn_ytChannel) {

                client.db.prepare("UPDATE guilds SET yn_ytChannel = ?, yn_txtChannel = ?, yn_roleId = ? WHERE id = ?").run(null, null, null, interaction.guild.id);

                const guilds = client.db.prepare("SELECT * FROM guilds WHERE yn_ytChannel IS NOT NULL").all();
                if (!guilds.filter((r, i) => r.yn_ytChannel == guildDb?.yn_ytChannel).toString()) {
                    client.notifier.unsubscribe(client, guildDb?.yn_ytChannel);
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