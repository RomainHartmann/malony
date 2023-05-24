const Discord = require('discord.js');
module.exports = async (client, channel) => {

    if (channel.type == Discord.ChannelType.GuildVoice) {

        const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(channel.guild.id);
        if (guildDb?.tempchannel == channel.id) {
            client.logs.action(`(${channel.guild.name}) - ${channel.name}: Deleting a temporary voice channel from the database`);
            return client.db.prepare("UPDATE guilds SET tempchannel = ? WHERE id = ?").run(null, channel.guild.id);
        }

    }

};