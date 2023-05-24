const Discord = require('discord.js');
module.exports = {
    name: 'language',
    description: 'Select the language of the bot',
    category: 'General',
    memberPermissions: [{ name: "Administrator", perm: Discord.PermissionsBitField.Flags.Administrator }],
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setDescription(client.langs("language", language).select)
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId('language')
                            .setPlaceholder(client.langs("language", language).select)
                            .addOptions([
                                {
                                    label: 'English (US)',
                                    value: 'en',
                                    default: language === 'en'
                                },
                                {
                                    label: 'Français',
                                    value: 'fr',
                                    default: language === 'fr'
                                }

                            ])
                    )
            ]
        });

        const message = await interaction.fetchReply();
        const filter = (i) => i.user.id === interaction.user.id && i.customId === 'language' && i.message.id === message.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 900000 });

        collector.on('collect', async (i) => {
            if (language !== i.values[0]) {
                client.db.prepare("UPDATE guilds SET language = ? WHERE id = ?").run(i.values[0], interaction.guild.id);
            }
            i.update({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.greencolor)
                        .setDescription(client.langs("language", i.values[0]).set)
                ],
                components: []
            });
        });


        collector.on('end', (collected, reason) => {
            if (reason === 'time') return;
            interaction.editReply({
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.StringSelectMenuBuilder()
                                .setCustomId('language')
                                .setPlaceholder(client.langs("language", language).select)
                                .setDisabled(true)
                                .addOptions([
                                    {
                                        label: 'English (US)',
                                        value: 'en',
                                        default: language === 'en'
                                    },
                                    {
                                        label: 'Français',
                                        value: 'fr',
                                        default: language === 'fr'
                                    }

                                ])
                        )
                ]
            }).catch(() => { });
        });
    }
};