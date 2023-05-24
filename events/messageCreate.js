const Discord = require("discord.js");
module.exports = async (client, message) => {
    let language = client.config.defaultLanguage;
    try {

        if (!message || !message.guild || message.guild.available === false || !message.channel || message.webhookId || message.author.bot) return;
        if (message.channel?.partial) await message.channel.fetch().catch(() => { });
        if (message.member?.partial) await message.member.fetch().catch(() => { });

        let guildData = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(message.guild.id);
        if (!guildData) {
            client.db.prepare("INSERT OR REPLACE INTO guilds (id, name, language, commandsUsed, tempchannel, levels, blockLinks, yn_ytChannel, yn_txtChannel, yn_roleId, welcomeChannel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").run(message.guild.id, message.guild.name, client.config.defaultLanguage, 0, null, null, null, null, null, null, null);
            guildData = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(message.guild.id);
        }
        if (guildData?.language) language = guildData.language;

        if (guildData.levels) {
            if (!client.timeout.get("antispam")) client.timeout.set("antispam", new Discord.Collection());
            const antispam = client.timeout.get("antispam");
            const data = antispam.get(`${message.member.id}:${message.guild.id}`) || 0;
            if (data === 0) {
                setTimeout(async () => {
                    if (!message.member?.id) return;
                    let data2 = antispam.get(`${message.member.id}:${message.guild.id}`);
                    if (data2 > 7) data2 = 2;
                    const memberData = client.db.prepare("SELECT * FROM members WHERE guildId = ? AND id = ?").get(message.guild.id, message.author.id);
                    if (!memberData) client.db.prepare("INSERT OR REPLACE INTO members (id, username, guildId, guildName, usingLuckCommand, levelLuckCommand, messages) VALUES (?, ?, ?, ?, ?, ?, ?);").run(message.author.id, message.author.tag, message.guild.id, message.guild.name, 0, 0, data2);
                    else client.db.prepare("UPDATE members SET messages = ?, username = ?, guildName = ? WHERE guildId = ? AND id = ?").run(memberData.messages + data2, message.author.tag, message.guild.name, message.guild.id, message.author.id);
                    antispam.delete(`${message.member.id}:${message.guild.id}`);
                }, 10000);
            }
            antispam.set(`${message.member.id}:${message.guild.id}`, data + 1);
        }

        if (guildData.blockLinks && !message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            if (guildData.blockLinks == "discord" && (message.content.includes("discord.gg/") || message.content.includes("discord.com/invite/") || message.content.includes("discordapp.com/invite/"))) {
                message.delete().catch(() => { });
                message.channel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("blockLinks", language).discord.replace("{user}", message.author))
                    ]
                });
            } else if (guildData.blockLinks == "all" && (message.content.includes("https:") || message.content.includes("http:") || message.content.includes("www."))) {
                message.delete().catch(() => { });
                message.channel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("blockLinks", language).all.replace("{user}", message.author))
                    ]
                });
            }
        }

        let args;
        let cmdName;
        let prefix;
        let not_allowed = false;
        message.mentions.users.first() === client.user && message.content.startsWith('<@') ? prefix = `<@${client.user.id}>` : prefix = client.config.prefix;
        if (message.content.startsWith(prefix)) {
            args = message.content.slice(prefix.length).trim().split(/ +/g);
            cmdName = args.shift().toLowerCase();
        } else return;

        if (!message.guild.members.me.permissionsIn(message.channel).has(Discord.PermissionsBitField.Flags.SendMessages)) return;
        else if (!message.guild.members.me.permissionsIn(message.channel).has(Discord.PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.langs("permissions", language).bot.replace("{perm}", "use external emojis")).catch(() => { });
        else if (!message.guild.members.me.permissionsIn(message.channel).has(Discord.PermissionsBitField.Flags.EmbedLinks)) return message.channel.send(client.langs("permissions", language).bot.replace("{perm}", "embed links")).catch(() => { });
        else if (!message.guild.members.me.permissionsIn(message.channel).has(Discord.PermissionsBitField.Flags.AddReactions)) return message.channel.send(client.langs("permissions", language).bot.replace("{perm}", "add reactions")).catch(() => { });

        const cmd = client.commands.get(cmdName);
        if (cmd && ((cmd.owner && message.author.id == client.config.RomainHartmannID) || !cmd.owner)) {

            if (cmd.botPermissions && cmd.botPermissions.length > 0) {
                const all = [];
                cmd.botPermissions.map((r) => {
                    if (!message.guild.members.me.permissions.has(r.perm)) return all.push(r);
                    else if (!message.guild.members.me.permissionsIn(message.channel).has(r.perm)) return all.push(r);
                });
                if (all.toString()) {
                    not_allowed = true;
                    return message.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("permissions", language).bot.replace("{perm}", all.map((r) => r.name).join(", ")))
                        ]
                    });
                }
            }

            if (message.guild.id !== client.config.devServerId) {
                if (!client.cooldowns.has(cmd.name)) {
                    client.cooldowns.set(cmd.name, new Discord.Collection());
                }
                const now = Date.now();
                const timestamps = client.cooldowns.get(cmd.name);
                const cooldownAmount = (cmd.cooldown || 3) * 1000;
                const key = `${message.author.id}:${message.guild.id}`;
                if (timestamps.has(key)) {
                    const expirationTime = timestamps.get(key) + cooldownAmount;
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        const cmd2 = client.interactions.get(cmd.name);
                        if (!not_allowed) return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.redcolor)
                                    .setDescription(client.langs("cooldown", language).replace("{user}", message.author).replace(" {time}", timeLeft.toFixed(1) >= 2 ? (timeLeft.toFixed(1) > 60 ? ` ${client.langs("utils", language).environ} ${(Math.floor(timeLeft.toFixed(1) / 60) + 1).toString().split(".")[0]} ${client.langs("utils", language).minute}${(Math.floor(timeLeft.toFixed(1) / 60) + 1) >= 2 ? "s" : ""}` : ` ${timeLeft.toFixed(1).toString().split(".")[0]} ${client.langs("utils", language).second}${timeLeft.toFixed(1) > 1 ? "s" : ""}`) : "").replace("{cmd}", cmd2 ? `${cmd2.interactionId ? `</${cmd2.name}${cmd2?.options && cmd2?.options[0]?.type == 1 ? ` ${cmd2?.options[0].name}` : ""}:${cmd2.interactionId}>` : `\`${cmd.name}\``}` : `\`${cmd.name}\``))
                            ],
                            ephemeral: true
                        });
                        not_allowed = true;
                    }
                }
                timestamps.set(key, now);
                setTimeout(() => timestamps.delete(`${message.author.id}:${message.guild?.id}`), cooldownAmount);
            }

            client.db.prepare("UPDATE guilds SET commandsUsed = commandsUsed + 1, name = ? WHERE id = ?").run(message.guild.name, message.guild.id);

            if (!client.db.prepare("SELECT * FROM members WHERE guildId = ? AND id = ?").get(message.guild.id, message.author.id)) {
                client.db.prepare("INSERT OR REPLACE INTO members (id, username, guildId, guildName, usingLuckCommand, levelLuckCommand, messages) VALUES (?, ?, ?, ?, ?, ?, ?);").run(message.author.id, message.author.tag, message.guild.id, message.guild.name, 0, 0, 0);
            }

            cmd.run(client, message, args, language).then(async () => {
                client.logs.cmd(`(${message.guild.name}) - ${message.author.username}: ${client.config.prefix}${cmd.name}`);
            });

        } else if (prefix == `<@${client.user.id}>`) {
            return message.channel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setDescription(client.langs("mention", language).replace("{/help}", client.interactions.get("help").interactionId ? `</help:${client.interactions.get("help").interactionId}>` : "`/help`"))
                        .setColor(client.config.color)
                        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
                ]
            });
        }

    } catch (e) {
        if (client.commands.get(message.content.slice(client.config.prefix.length).trim().split(/ +/g).shift().toLowerCase())) {
            message.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription(client.langs("error", language).replace("{link}", client.config.supportServer.link))
                ]
            }).catch(() => { });
        }
        throw new Error(e.stack ? String(e.stack) : String(e));
    }
}