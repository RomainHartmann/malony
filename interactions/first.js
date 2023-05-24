const Discord = require('discord.js');
module.exports = {
    name: 'first',
    description: 'The first one to press wins!',
    category: 'Fun',
    options: [
        {
            name: 'opponent',
            type: Discord.ApplicationCommandOptionType.User,
            description: 'Choose your opponent',
            required: true
        }
    ],
    run: async (client, interaction, language) => {

        const opponent = interaction.options.getUser('opponent');
        if (opponent.id == interaction.user.id) return interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.redcolor)
                    .setDescription(client.langs("first", language).notYou)
            ],
            ephemeral: true
        });
        else if (opponent.bot) return interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.redcolor)
                    .setDescription(client.langs("first", language).notBot)
            ],
            ephemeral: true
        });
        else if (!interaction.guild.members.cache.get(opponent.id)) return interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.redcolor)
                    .setDescription(client.langs("utils", language).userNotFound)
            ],
            ephemeral: true
        });

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setDescription(client.langs("first", language).request.replace("{opponent}", opponent).replace("{user}", interaction.user))
                    .setColor("Grey")
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('yes')
                            .setLabel(client.langs("utils", language).yes)
                            .setStyle(Discord.ButtonStyle.Success)
                    )
            ]
        });
        const msg = await interaction.fetchReply();
        const filter = i => msg.id == i.message.id && i.user.id == opponent.id && i.customId == 'yes';
        const collector = interaction.channel.createMessageComponentCollector({
            componentType: Discord.ComponentType.Button,
            time: 180000,
            max: 1,
            filter
        });

        collector.on('collect', async button => {

            await button.deferUpdate();
            const embed = new Discord.EmbedBuilder()
                .setColor("Aqua")
            interaction.editReply({
                embeds: [embed.setTitle("3")], components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('shoot')
                                .setLabel(client.langs("first", language).button)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                ]
            });
            setTimeout(async function () {
                interaction.editReply({ embeds: [embed.setTitle("2")] });
            }, 1000);
            setTimeout(async function () {
                interaction.editReply({ embeds: [embed.setTitle("1")] });
            }, 2000);
            setTimeout(async function () {
                interaction.editReply({
                    embeds: [embed.setTitle("GO!")], components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('shoot')
                                    .setLabel(client.langs("first", language).button)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                            )
                    ]
                });
            }, 3000);

            const filter2 = i => i.customId == 'shoot' && (i.user.id == interaction.user.id || i.user.id == opponent.id);
            const collector2 = interaction.channel.createMessageComponentCollector({
                componentType: Discord.ComponentType.Button,
                time: 60000,
                filter2
            });

            collector2.on('collect', async b => {
                if (msg.id !== b.message.id) return;
                collector2.stop();
                await b.deferUpdate();
                interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setDescription(client.langs("first", language).win.replace("{user}", b.user))
                            .setColor("Aqua")
                    ], components: []
                });
            });

            collector2.on('end', async (collected, reason) => {
                if (reason == "time") return await interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setDescription(client.langs("first", language).noAnswer)
                            .setColor(client.config.redcolor)
                    ],
                    components: []
                });
            });

        });
        collector.on('end', async (collected, reason) => {
            if (reason == "time") return await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setDescription(client.langs("first", language).noAnswer)
                        .setColor(client.config.redcolor)
                ], components: []
            });
        });

    }
};