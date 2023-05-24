const Discord = require('discord.js');
module.exports = {
    name: 'userinfo',
    description: 'Gives all the information about a user',
    category: 'General',
    type: Discord.ApplicationCommandType.User,
    options: [
        {
            name: 'user',
            type: Discord.ApplicationCommandOptionType.User,
            description: 'Which user\'s data do you want to see?',
            required: false
        }
    ],
    run: async (client, interaction, language) => {

        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.redcolor)
                    .setDescription(client.langs("utils", language).userNotFound)
            ]
        });

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setColor(client.config.color)
                    .setTitle(client.langs("userinfo", language).user)
                    .setDescription(
                        `**${client.langs("userinfo", language).username} :** \`${user.tag}\` (${user})\n` +
                        `**ID :** \`${user.id}\`\n` +
                        `**${client.langs("userinfo", language).joinedDiscord} :** <t:${parseInt(user.createdTimestamp / 1000)}:f> (<t:${parseInt(user.createdTimestamp / 1000)}:R>)\n\n` +
                        `**${client.langs("userinfo", language).joinedServer} :** <t:${parseInt(member.joinedTimestamp / 1000)}:f> (<t:${parseInt(member.joinedTimestamp / 1000)}:R>)\n` +
                        `**Roles (${member.roles.cache.size - 1}) :** ${member.roles.cache.filter(r => r.name !== "@everyone").map(r => `${r}`).slice(0, 10).join(", ")} ${member.roles.cache.size - 1 > 10 ? client.langs("utils", language).others : ""}`
                    )
                    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp()
            ]
        });

    }
};