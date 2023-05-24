const Discord = require("discord.js");
module.exports = async (client, oldState, newState) => {

    if (newState.channel) {
        setTimeout(async () => {
            if (!newState.member.voice.channel) return;
            const guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(newState.guild.id);
            if (!guildDb?.tempchannel || guildDb?.tempchannel != newState.channel?.id) return;
            if (!client.timeout.get("tempchannels")) client.timeout.set("tempchannels", new Discord.Collection());
            const timestamps = client.timeout.get("tempchannels");
            const cooldownAmount = 5 * 1000;
            if (timestamps.has(`${newState.member.id}:${newState.guild.id}`)) {
                const expirationTime = timestamps.get(`${newState.member.id}:${newState.guild.id}`) + cooldownAmount;
                if (Date.now() < expirationTime) return;
            }
            create();
            async function create() {
                if (timestamps.has(`${newState.member.id}:${newState.guild.id}`)) return;
                if (!newState.guild.members.me.permissions.has(Discord.PermissionsBitField.Flags.ManageChannels) || !newState.guild.members.me.permissions.has(Discord.PermissionsBitField.Flags.MoveMembers)) {
                    if (newState?.channel) newState.channel.send(`${newState.member}, ${client.langs("permissions", guildDb.language).bot.replace("{perm}", "\`Manage Channels\`, \`Move Members\`")}`).catch(async () => {
                        return client.db.prepare("UPDATE guilds SET tempchannel = ? WHERE id = ?").run(null, newState.guild.id);
                    });
                    else return;
                }
                newState.guild.channels.create({ name: client.langs("temp", guildDb.language).Tname.replace("{user}", newState.member.user.username), type: Discord.ChannelType.GuildVoice, parent: newState.channel?.parentId, reason: "Tempchannels" }).then(async (channel) => {
                    client.logs.action(`(${newState.guild.name}) - ${newState.member.user.username}: Creating a temporary voice channel`);
                    timestamps.set(`${newState.member.id}:${newState.guild.id}`, Date.now());
                    setTimeout(() => {
                        timestamps.delete(`${newState.member.id}:${newState.guild?.id}`);
                        if (newState.member.voice.channel?.id === guildDb?.tempchannel && !newState.guild.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildVoice && c.parentID === newState.channel?.parentID).find(c => c.name.includes(client.langs("temp", guildDb.language).Tname.replace("{user}", newState.member.user.username)))) create();
                    }, cooldownAmount);
                    newState.member.voice.setChannel(channel.id).catch(() => { });
                    client.db.prepare("INSERT OR REPLACE INTO autoTempChannels (id) VALUES (?);").run(channel.id);

                    setTimeout(async () => {
                        if (newState.guild.channels.cache.get(channel.id) && channel.members.size == 0) {
                            client.logs.action(`(${newState.guild.name}) - ${newState.member.user.username}: Deleting a temporary voice channel`);
                            client.db.prepare("DELETE FROM autoTempChannels WHERE id = ?").run(channel.id);
                            return channel.delete().catch(() => { });
                        }
                    }, 2000);
                });
            }
        }, 1500);
    }

    if (oldState.channel && client.db.prepare("SELECT * FROM autoTempChannels WHERE id = ?").get(oldState.channel?.id) && oldState.channel.members.size == 0) {
        setTimeout(async () => {
            if (!client.db.prepare("SELECT * FROM autoTempChannels WHERE id = ?").get(oldState.channel?.id)) return;
            client.logs.action(`(${oldState.guild.name}) - ${oldState.member.user.username}: Deleting a temporary voice channel`);
            client.db.prepare("DELETE FROM autoTempChannels WHERE id = ?").run(oldState.channel.id);
            return oldState.channel.delete().catch(() => { });
        }, 1000);
    }

};