const Discord = require('discord.js');
const hour = 22;
module.exports = {
    name: 'rpsdaily',
    description: 'Playing Rock paper scissors daily',
    category: 'Setup',
    cooldown: 10,
    hour: hour,
    memberPermissions: [{ name: "Manage Messages", perm: Discord.PermissionsBitField.Flags.ManageMessages }],
    options: [
        {
            name: 'set',
            description: 'Set up rps daily',
            type: Discord.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'mention',
                    description: 'Do you want the bot to ping a role every day?',
                    type: Discord.ApplicationCommandOptionType.Role,
                    required: false
                }
            ],
        },
        {
            name: 'disable',
            description: 'Disable rps daily',
            type: Discord.ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction, language) => {

        const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);

        if (interaction.options.getSubcommand() == "set") {

            if (!guildDb?.rpsDaily || !interaction.guild.channels.cache.get(guildDb?.rpsDaily)) {

                if (interaction.options.get('mention')?.role) {
                    client.db.prepare("UPDATE guilds SET rpsPing = ? WHERE id = ?").run(interaction.options.get('mention').role.id, interaction.guild.id);
                } else client.db.prepare("UPDATE guilds SET rpsPing = ? WHERE id = ?").run(null, interaction.guild.id);

                client.db.prepare("UPDATE guilds SET rpsDaily = ? WHERE id = ?").run(interaction.channel.id, interaction.guild.id);
                interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.greencolor)
                            .setDescription(client.langs("modules", language).set.replace("{name}", interaction.channel))
                    ]
                });
                client.utils.rpsDaily(client, guildDb, interaction.channel, hour);

            } else return interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(`${client.langs("modules", language).alreadyEnabled} ${client.channels.cache.get(guildDb?.rpsDaily) ? `<#${guildDb?.rpsDaily}>` : ``}`)
                ]
            });

        } else if (interaction.options.getSubcommand() == "disable") {

            if (guildDb?.rpsDaily) {

                if (guildDb?.rpsPing) client.db.prepare("UPDATE guilds SET rpsPing = ? WHERE id = ?").run(null, interaction.guild.id);
                if (guildDb?.rpsLeaderboardUser && guildDb?.rpsLeaderboardUser != 0) client.db.prepare("UPDATE guilds SET rpsLeaderboardUser = ? WHERE id = ?").run(0, interaction.guild.id);
                if (guildDb?.rpsLeaderboardBot && guildDb?.rpsLeaderboardBot != 0) client.db.prepare("UPDATE guilds SET rpsLeaderboardBot = ? WHERE id = ?").run(0, interaction.guild.id);

                client.db.prepare("UPDATE guilds SET rpsDaily = ? WHERE id = ?").run(null, interaction.guild.id);
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