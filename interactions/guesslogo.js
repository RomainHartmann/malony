const Discord = require('discord.js');
module.exports = {
    name: 'guesslogo',
    description: 'Playing to guess the logo',
    category: 'Fun',
    cooldown: 10,
    botPermissions: [{ name: "Manage Threads", perm: Discord.PermissionsBitField.Flags.ManageThreads }, { name: "View Channels", perm: Discord.PermissionsBitField.Flags.ViewChannel }],
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor("Grey")
                    .setDescription(client.langs("guessLogo", language).message.replace("{user}", interaction.user))
                    .setFooter({ text: `1 ${client.langs("utils", language).player}` })
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('join')
                            .setLabel(client.langs("utils", language).join)
                            .setStyle(Discord.ButtonStyle.Primary)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('leave')
                            .setLabel(client.langs("utils", language).leave)
                            .setStyle(Discord.ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('start')
                            .setLabel(client.langs("utils", language).start)
                            .setStyle(Discord.ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('cancel')
                            .setLabel(client.langs("utils", language).cancel)
                            .setStyle(Discord.ButtonStyle.Secondary)
                    )
            ]
        });

        const message = await interaction.fetchReply();
        const filter = b => message.id == b.message.id;
        const collector2 = interaction.channel.createMessageComponentCollector({
            componentType: Discord.ComponentType.Button,
            time: 300000,
            filter
        });
        const leaderboard = [];
        const logos = [];
        let players = [interaction.user.id];
        let round = 0;
        let rounds;
        let started;
        let thread;
        try {
            thread = await interaction.channel.threads.create({
                name: `${client.langs("guessLogo", language).game} - ${interaction.user.username}`,
                autoArchiveDuration: 1440,
                reason: 'Guess Logo command',
                type: Discord.ChannelType.PrivateThread
            });
        } catch {
            return await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("guessLogo", language).errorThread)
                ],
                components: []
            });
        }
        thread.send(client.langs("guessLogo", language).wait);
        await thread.members.add(interaction.user.id);
        collector2.on('collect', async button => {
            let error = false;
            if (button.customId == 'join') {
                if (!players.includes(button.user.id)) {
                    await thread.members.add(button.user.id).catch(() => {
                        error = true;
                        return button.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.redcolor)
                                    .setDescription(client.langs("guessLogo", language).threadNotExist)
                            ],
                            ephemeral: true
                        }).catch(() => { });
                    });
                    if (error) return;
                    players.push(button.user.id);
                    button.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.color)
                                .setDescription(client.langs("guessLogo", language).info.replace("{thread}", thread))
                        ],
                        ephemeral: true
                    }).catch(() => { });
                    await interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor("Grey")
                                .setDescription(client.langs("guessLogo", language).message.replace("{user}", interaction.user))
                                .setFooter({ text: `${players.length} ${client.langs("utils", language).player}${players.length !== 1 ? "s" : ""}` })
                        ]
                    });
                } else {
                    return button.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("guessLogo", language).alreadyJoined)
                        ],
                        ephemeral: true
                    }).catch(() => { });
                };
            } else if (button.customId == 'leave') {
                if (button.user.id == interaction.user.id) return button.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("guessLogo", language).hostLeave)
                    ],
                    ephemeral: true
                });
                if (players.includes(button.user.id)) {
                    await thread.members.remove(button.user.id).catch(() => {
                        error = true;
                        return button.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.redcolor)
                                    .setDescription(client.langs("guessLogo", language).threadNotExist)
                            ],
                            ephemeral: true
                        }).catch(() => { });
                    });
                    if (error) return;
                    const index = players.indexOf(button.user.id);
                    if (index > -1) {
                        players.splice(index, 1);
                    }
                    button.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("guessLogo", language).leave)
                        ],
                        ephemeral: true
                    }).catch(() => { });
                    await interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor("Grey")
                                .setDescription(client.langs("guessLogo", language).message.replace("{user}", interaction.user))
                                .setFooter({ text: `${players.length} ${client.langs("utils", language).player}${players.length !== 1 ? "s" : ""}` })
                        ]
                    });
                } else {
                    return button.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("guessLogo", language).notJoined)
                        ],
                        ephemeral: true
                    }).catch(() => { });
                };
            } else if (button.customId == 'start') {
                if (button.user.id != interaction.user.id) return button.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("guessLogo", language).cant)
                    ],
                    ephemeral: true
                });
                else if (players.length < 2) return button.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("guessLogo", language).notEnoughPlayers)
                    ],
                    ephemeral: true
                }).catch(() => { });
                else if (!client.channels.cache.get(thread.id)) {
                    started = true;
                    collector2.stop();
                    return await interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("guessLogo", language).threadNotExist)
                        ],
                        components: [],
                        files: []
                    });
                }
                await interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.color)
                            .setDescription(client.langs("guessLogo", language).start)
                    ],
                    components: [],
                    files: []
                });
                button.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.color)
                            .setDescription(client.langs("guessLogo", language).rounds)
                    ],
                    components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.StringSelectMenuBuilder()
                                    .setCustomId('rounds')
                                    .setPlaceholder(client.langs("guessLogo", language).select)
                                    .addOptions([
                                        {
                                            label: '5',
                                            value: '5',
                                        },
                                        {
                                            label: '10',
                                            value: '10',
                                        },
                                        {
                                            label: '25',
                                            value: '25'
                                        },
                                        {
                                            label: '50',
                                            value: '50'
                                        }
                                    ])
                            )
                    ],
                    ephemeral: true
                }).catch(() => { });
                const filter = i => i.user.id == interaction.user.id && i.customId == 'rounds' && message.id == i.message.reference.messageId;
                const collector3 = interaction.channel.createMessageComponentCollector({
                    componentType: Discord.ComponentType.StringSelect,
                    time: 60000,
                    max: 1,
                    filter
                });
                collector3.on('collect', async select => {
                    if (collector2.ended) return;
                    rounds = select.values[0];
                    await select.deferUpdate();
                    button.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.color)
                                .setDescription(client.langs("guessLogo", language).info.replace("{thread}", thread))
                        ],
                        components: [],
                        ephemeral: true
                    }).catch(() => { });
                    started = true;
                    collector2.stop();
                    thread.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.color)
                                .setDescription(client.langs("guessLogo", language).starting)
                        ]
                    }).then((m) => setTimeout(() => {
                        m.delete();
                        client.utils.playLogo(0, client, language, thread, interaction, message, round, rounds, logos, leaderboard);
                    }, 5000));
                    await interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.color)
                                .setDescription(client.langs("guessLogo", language).ingame)
                        ]
                    });
                });
            } else if (button.customId == 'cancel') {
                if (button.user.id != interaction.user.id) return button.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("guessLogo", language).cant)
                    ],
                    ephemeral: true
                }).catch(() => { });
                started = true;
                collector2.stop();
                await interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor("#FFDA83")
                            .setDescription(client.langs("utils", language).cmdCancel)
                    ],
                    components: [],
                    files: []
                });
                await thread.delete().catch(() => { });
            }
        });
        collector2.on('end', async () => {
            if (started) return;
            await thread.delete().catch(() => { });
            await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("guessLogo", language).tooLong)
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('join')
                                .setLabel(client.langs("utils", language).join)
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setDisabled(true)
                        )
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('leave')
                                .setLabel(client.langs("utils", language).leave)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('start')
                                .setLabel(client.langs("utils", language).start)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel(client.langs("utils", language).cancel)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                ]
            }).catch(() => { });

        });

    }
};