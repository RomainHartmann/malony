const Discord = require('discord.js');
module.exports = async (client, member) => {

    if (!member || !member?.id || member.available === false) return;

    const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(member.guild.id);
    if (guildDb?.welcomeChannel && client.channels.cache.get(guildDb?.welcomeChannel)) {
        client.logs.action(`(${member.guild.name}) - ${member.user.username}: Sending a welcome message`);
        const channel = client.channels.cache.get(guildDb?.welcomeChannel);
        channel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(client.langs("welcome", guildDb.language).replace("{member}", `${member}`))
                    .setFooter({ text: `ID: ${member.id}` })
                    .setTimestamp()
                    .setColor(client.config.color)
            ]
        });
    }

}