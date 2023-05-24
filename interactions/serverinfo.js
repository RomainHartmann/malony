const Discord = require('discord.js');
module.exports = {
    name: 'serverinfo',
    description: 'Gives all the information about the server',
    category: 'General',
    cooldown: 7,
    run: async (client, interaction, language) => {

        const db = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);
        const owner = await client.users.fetch(interaction.guild.ownerId);

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setThumbnail(interaction.guild.iconURL())
                    .setColor(client.config.color)
                    .setTitle(client.langs("serverinfo", language).server)
                    .setDescription(
                        `**Owner :** \`${owner.tag}\` (${owner})\n` +
                        `**${client.langs("serverinfo", language).serverName} :** \`${interaction.guild.name}\`\n` +
                        `**ID :** \`${interaction.guild.id}\`\n` +
                        `**${client.langs("serverinfo", language).members} :** \`${interaction.guild.memberCount}\`\n` +
                        `**Channels :** \`${interaction.guild.channels.cache.size}\`\n` +
                        `**${client.langs("serverinfo", language).commandsUsed} :** \`${db.commandsUsed}\`\n` +
                        `**${client.langs("serverinfo", language).createdServer} :** <t:${parseInt(interaction.guild.createdTimestamp / 1000)}:R>\n` +
                        `**Roles (${interaction.guild.roles.cache.size - 1}) :** ${interaction.guild.roles.cache.filter(r => r.name !== "@everyone").map(r => `${r}`).slice(0, 10).join(", ")} ${interaction.guild.roles.cache.size - 1 > 10 ? client.langs("utils", language).others : ""}`
                    )
                    .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp()
            ]
        });

    }
};