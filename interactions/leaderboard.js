const Discord = require("discord.js");
module.exports = {
    name: 'leaderboard',
    description: 'View the ranking of the most active users',
    category: 'General',
    options: [
        {
            name: 'luck',
            description: 'Ranking of the 5 most active users with the luck command in this guild or in all guilds',
            type: Discord.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'filter',
                    description: 'Select a filter',
                    type: Discord.ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: 'guild',
                            value: 'guild'
                        },
                        {
                            name: 'global',
                            value: 'global'
                        }
                    ]
                }
            ],
        },
        {
            name: 'levels',
            description: 'Ranking of the 7 most active users in this guild',
            type: Discord.ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction, language) => {

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor("Grey")
                    .setDescription(client.langs("leaderboard", language).loading)
            ]
        });

        if (interaction.options.getSubcommand() == 'luck') {

            if (interaction.options.getString('filter') == 'global') {

                const userData = client.db.prepare('SELECT * FROM members').all();
                if (!userData) return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("utils", language).noData)
                    ]
                });

                let array = client.utils.removeDuplicates(userData.sort((a, b) => b.levelLuckCommand - a.levelLuckCommand || a.usingLuckCommand - b.usingLuckCommand), 2);

                function FdUser(user) {
                    return user.id == interaction.user.id;
                }
                const ranked = array.findIndex((element) => element == array.find(FdUser)) + 1;
                array = array.slice(0, 5);

                if (!array[0]?.id) return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("utils", language).noData)
                    ]
                });

                const embed = new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setTitle(`🎉 #1 ${array[0].username || "User"} - ${array[0].guildName}\nlevel ${array[0].levelLuckCommand} (${array[0].usingLuckCommand} ${client.langs("utils", language).attempt}${array[0].usingLuckCommand >= 2 ? "s" : ""})`)
                    .setDescription(`${array.filter(r => r.id !== array[0].id).map((r, i) => `${interaction.guild.id == r.guildId ? `**#${i + 2}** <@${r.id}>\n > level \`${r.levelLuckCommand}\` (${r.usingLuckCommand} ${client.langs("utils", language).attempt}${r.usingLuckCommand >= 2 ? "s" : ""})` : `**#${i + 2} ${r.username}** (${client.langs("utils", language).server}: ${r.guildName})\n > level \`${r.levelLuckCommand}\` (${r.usingLuckCommand} ${client.langs("utils", language).attempt}${r.usingLuckCommand >= 2 ? "s" : ""})`}`).join("\n") || "No data"}`)
                    .setAuthor({ name: client.langs("leaderboard", language).titleLuckGlobal })
                    .setThumbnail(client.user.displayAvatarURL())
                if (ranked > 5) embed.setFooter({ text: `${interaction.user.tag}: ${ranked}/${userData.length}` });
                interaction.editReply({ embeds: [embed] });

            } else if (interaction.options.getString('filter') == 'guild') {

                const userData = client.db.prepare('SELECT * FROM members WHERE guildId = ?').all(interaction.guild.id);
                if (!userData || userData.length <= 1) return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("utils", language).noData)
                    ]
                });

                let array = userData.sort((a, b) => b.levelLuckCommand - a.levelLuckCommand || a.usingLuckCommand - b.usingLuckCommand);

                function FdUser(user) {
                    return user.id == interaction.user.id;
                }
                const ranked = array.findIndex((element) => element == array.find(FdUser)) + 1;
                array = array.slice(0, 5);

                if (!array[0]?.id) return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("utils", language).noData)
                    ]
                });

                const embed = new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setTitle(`🎉 #1 ${interaction.guild.members.cache.get(array[0].id)?.user.tag || "User"}\nlevel ${array[0].levelLuckCommand} (${array[0].usingLuckCommand} ${client.langs("utils", language).attempt}${array[0].usingLuckCommand >= 2 ? "s" : ""})`)
                    .setDescription(`${array.filter(r => r.id !== array[0].id).map((r, i) => `${interaction.guild.id == r.guildId ? `**#${i + 2}** <@${r.id}>\n > level \`${r.levelLuckCommand}\` (${r.usingLuckCommand} ${client.langs("utils", language).attempt}${r.usingLuckCommand >= 2 ? "s" : ""})` : `**#${i + 2} <@${r.id}>**\n > level \`${r.levelLuckCommand}\` (${r.usingLuckCommand} ${client.langs("utils", language).attempt}${r.usingLuckCommand >= 2 ? "s" : ""})`}`).join("\n") || "No data"}`)
                    .setAuthor({ name: client.langs("leaderboard", language).titleLuckGuild })
                    .setThumbnail(client.user.displayAvatarURL())
                if (ranked > 5) embed.setFooter({ text: `${interaction.user.tag}: ${ranked}/${interaction.guild.memberCount}` });
                interaction.editReply({ embeds: [embed] });

            }

        } else if (interaction.options.getSubcommand() == 'levels') {

            const guild = client.db.prepare('SELECT * FROM guilds WHERE id = ?').get(interaction.guild.id);
            if (!guild?.levels) {
                return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(`${client.langs("modules", language).disabled}${interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ? `\n${client.langs("leaderboard", language).howToEnableLevels.replace("{/levels}", client.interactions.get("levels").interactionId ? `</levels:${client.interactions.get("levels").interactionId}>` : "`/levels`")}` : ""}`)
                    ]
                });
            }

            const userData = client.db.prepare('SELECT * FROM members WHERE guildId = ?').all(interaction.guild.id);
            if (!userData) return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("utils", language).noData)
                ]
            });

            let array = userData.sort((a, b) => (a.messages < b.messages) ? 1 : -1);

            function FdUser(user) {
                return user.id == interaction.user.id;
            }
            const ranked = array.findIndex((element) => element == array.find(FdUser)) + 1;
            array = array.slice(0, 7);

            if (!array[0]?.id) return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("utils", language).noData)
                ]
            });

            const embed = new Discord.EmbedBuilder()
                .setColor(client.config.color)
                .setTitle(`🎉 #1 ${interaction.guild.members.cache.get(array[0].id)?.user.tag || "User"} - ${array[0].messages} message${array[0].messages >= 2 ? "s" : ""} `)
                .setDescription(`${array.filter(r => r.id !== array[0].id).map((r, i) => `${interaction.guild.id == r.guildId ? `**#${i + 2}** <@${r.id}>\n > \`${r.messages}\` message${r.messages >= 2 ? "s" : ""}` : `**#${i + 2} <@${r.id}>**\n > \`${r.messages}\` message${r.messages >= 2 ? "s" : ""}`}`).join("\n") || "No data"} `)
                .setAuthor({ name: client.langs("leaderboard", language).titleLevels })
                .setThumbnail(client.user.displayAvatarURL())
            if (ranked > 7) embed.setFooter({ text: `${interaction.user.tag}: ${ranked}/${interaction.guild.memberCount}` });
            interaction.editReply({ embeds: [embed] });

        }

    }
}