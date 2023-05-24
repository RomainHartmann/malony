const Discord = require('discord.js');
module.exports = async (client, guild) => {

    client.logs.client(`New guild: ${guild.name} (id: ${guild.id} | members: ${guild.memberCount})`);
    if (!guild || guild.available === false) return;

    if (!client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(guild.id)) {
        client.db.prepare("INSERT OR REPLACE INTO guilds (id, name, language, commandsUsed, tempchannel, levels, blockLinks, yn_ytChannel, yn_txtChannel, yn_roleId, welcomeChannel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").run(guild.id, guild.name, client.config.defaultLanguage, 0, null, null, null, null, null, null, null);
        client.logs.db(`Adding guild ${guild.name} (${guild.id}) to database.`);
    }

    const logChannel = await client.channels.cache.get(client.config.channelsOwner.channelLogsEvents);
    if (logChannel) logChannel.send({
        embeds: [
            new Discord.EmbedBuilder()
                .setColor("Grey")
                .setTitle("Guild create")
                .setDescription(`${guild.name} (${guild.memberCount} members)`)
                .setFooter({ text: `${guild.id} | ${client.guilds.cache.size}th server` })
                .setThumbnail(guild.iconURL({
                    dynamic: true
                }))
        ]
    }).catch(() => { });

    const guildChannel = guild.channels.cache.filter(c => c.type == Discord.ChannelType.GuildText).find(x => x.position === 0);
    if (guildChannel) guildChannel.send({
        embeds: [
            new Discord.EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
                .setTitle("Hey <a:hey:928729890595946507> !")
                .setDescription(`My prefix is \`/\`\nTo view the list of commands ${client.interactions.get("help").interactionId ? `</help:${client.interactions.get("help").interactionId}>` : "`/help`"}`)
                .setThumbnail(client.user.displayAvatarURL())
                .setColor(client.config.color)
        ]
    }).catch(() => { });

}