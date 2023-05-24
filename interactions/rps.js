const Discord = require('discord.js');
module.exports = {
    name: 'rps',
    description: 'Playing Rock paper scissors',
    category: 'Fun',
    run: async (client, interaction, language) => {

        const choices = ['🪨', '✂️', '📰'];

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setTitle(client.langs("rps", language).title)
                    .setDescription(client.langs("rps", language).description)
                    .setTimestamp()
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('rock')
                            .setEmoji("🪨")
                            .setStyle(Discord.ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('paper')
                            .setEmoji("📰")
                            .setStyle(Discord.ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('scissors')
                            .setEmoji("✂️")
                            .setStyle(Discord.ButtonStyle.Secondary)
                    )
            ]
        });
        const message = await interaction.fetchReply();

        const filter = i => i.message.id == message.id && i.user.id == interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            componentType: Discord.ComponentType.Button,
            time: 180000,
            max: 1,
            filter
        });

        collector.on('collect', async b => {

            const botEmoji = choices[Math.floor(Math.random() * choices.length)];
            let userEmoji;
            if (b.customId == "rock") userEmoji = "🪨";
            else if (b.customId == "paper") userEmoji = "📰";
            else if (b.customId == "scissors") userEmoji = "✂️";

            const embed = new Discord.EmbedBuilder()
                .setColor(client.config.color)
                .setTitle(client.langs("rps", language).title)
                .addFields({ name: client.langs("rps", language).yourChoice, value: `${userEmoji}` }, { name: client.langs("rps", language).botChoice, value: botEmoji })
            if ((botEmoji == "🪨" && userEmoji == "✂️") || (botEmoji == "✂️" && userEmoji == "📰") || (botEmoji == "📰" && userEmoji == "🪨")) {
                embed.setFooter({ text: client.langs("utils", language).lose });
            } else if (botEmoji == userEmoji) {
                embed.setFooter({ text: client.langs("utils", language).equality });
            } else embed.setFooter({ text: client.langs("utils", language).win });
            await interaction.editReply({ embeds: [embed], components: [] });

        });

        collector.on('end', (collected, reason) => {
            if (reason !== "time") return;
            interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.color)
                        .setTitle(client.langs("rps", language).title)
                        .setDescription(client.langs("rps", language).description)
                        .setTimestamp()
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('rock')
                                .setEmoji("🪨")
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('paper')
                                .setEmoji("📰")
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('scissors')
                                .setEmoji("✂️")
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                ]

            });

        });

    }
};