const Discord = require("discord.js");
module.exports = async (client, interaction) => {
    let language = client.config.defaultLanguage;
    try {

        if (interaction.isCommand() || interaction.isUserContextMenuCommand()) {

            if (!interaction.guild) {
                return interaction.reply({
                    content: "You can only use the commands in a guild!",
                    ephemeral: true
                }).catch(() => { });
            }
            const commandName = interaction.commandName.toLowerCase();

            let not_allowed = false;
            let cmd = false;
            try {
                if (interaction.options._subcommand && client.interactions.has(commandName + interaction.options.getSubcommand())) {
                    cmd = client.interactions.get(commandName + interaction.options.getSubcommand());
                } else if (client.interactions.has(commandName + "(cm)")) {
                    cmd = client.interactions.get(commandName + "(cm)");
                } else if (client.interactions.has(commandName)) {
                    cmd = client.interactions.get(commandName);
                }
            } catch {
                if (client.interactions.has(commandName)) cmd = client.interactions.get(commandName);
            }
            if (cmd) {

                if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(Discord.PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.langs("permissions", language).bot.replace("{perm}", "use external emojis")).catch(() => { });

                let guildData = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);
                if (!guildData) {
                    client.db.prepare("INSERT OR REPLACE INTO guilds (id, name, language, commandsUsed, tempchannel, levels, blockLinks, yn_ytChannel, yn_txtChannel, yn_roleId, welcomeChannel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").run(interaction.guild.id, interaction.guild.name, client.config.defaultLanguage, 0, null, null, null, null, null, null, null);
                    guildData = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(interaction.guild.id);
                }
                if (guildData?.language) language = guildData.language;

                await interaction.deferReply().catch(() => { return not_allowed = true });

                if (cmd.memberPermissions && cmd.memberPermissions.length > 0) {
                    const all = [];
                    cmd.memberPermissions.map((r) => {
                        if (!interaction.member.permissionsIn(interaction.channel).has(r.perm)) return all.push(r);
                    });
                    if (all.toString()) {
                        not_allowed = true;
                        return interaction.editReply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.redcolor)
                                    .setDescription(client.langs("permissions", language).member.replace("{perm}", all.map((r) => r.name).join(", ")))
                            ],
                            ephemeral: true
                        });
                    }
                }
                if (cmd.botPermissions && cmd.botPermissions.length > 0) {
                    const all = [];
                    cmd.botPermissions.map((r) => {
                        if (!interaction.guild.members.me.permissions.has(r.perm)) return all.push(r);
                        else if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(r.perm)) return all.push(r);
                    });
                    if (all.toString()) {
                        not_allowed = true;
                        return interaction.editReply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.redcolor)
                                    .setDescription(client.langs("permissions", language).bot.replace("{perm}", all.map((r) => r.name).join(", ")))
                            ]
                        });
                    }
                }

                if (interaction.guild.id !== client.config.devServerId) {
                    if (!client.cooldowns.has(cmd.name)) {
                        client.cooldowns.set(cmd.name, new Discord.Collection());
                    }
                    const now = Date.now();
                    const timestamps = client.cooldowns.get(cmd.name);
                    const cooldownAmount = (cmd.cooldown || 3) * 1000;
                    const key = `${interaction.user.id}:${interaction.guild.id}`;
                    if (timestamps.has(key)) {
                        const expirationTime = timestamps.get(key) + cooldownAmount;
                        if (now < expirationTime) {
                            const timeLeft = (expirationTime - now) / 1000;
                            const cmd2 = client.interactions.get(cmd.name);
                            if (!not_allowed) return interaction.editReply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(client.config.redcolor)
                                        .setDescription(client.langs("cooldown", language).replace("{user}", interaction.user).replace(" {time}", timeLeft.toFixed(1) >= 2 ? (timeLeft.toFixed(1) > 60 ? ` ${client.langs("utils", language).environ} ${(Math.floor(timeLeft.toFixed(1) / 60) + 1).toString().split(".")[0]} ${client.langs("utils", language).minute}${(Math.floor(timeLeft.toFixed(1) / 60) + 1) >= 2 ? "s" : ""}` : ` ${timeLeft.toFixed(1).toString().split(".")[0]} ${client.langs("utils", language).second}${timeLeft.toFixed(1) > 1 ? "s" : ""}`) : "").replace("{cmd}", cmd2 ? `${cmd2.interactionId ? `</${cmd2.name}${cmd2?.options && cmd2?.options[0]?.type == 1 ? ` ${cmd2?.options[0].name}` : ""}:${cmd2.interactionId}>` : `\`/${cmd.name}\``}` : `\`/${cmd.name}\``))
                                ],
                                ephemeral: true
                            });
                            not_allowed = true;
                        }
                    }
                    timestamps.set(key, now);
                    setTimeout(() => timestamps.delete(`${interaction.user.id}:${interaction.guild?.id}`), cooldownAmount);
                }

                if (not_allowed) return;

                client.db.prepare("UPDATE guilds SET name = ?, commandsUsed = commandsUsed + 1 WHERE id = ?").run(interaction.guild.name, interaction.guild.id);

                if (!client.db.prepare("SELECT * FROM members WHERE guildId = ? AND id = ?").get(interaction.guild.id, interaction.user.id)) {
                    client.db.prepare("INSERT OR REPLACE INTO members (id, username, guildId, guildName, usingLuckCommand, levelLuckCommand, messages) VALUES (?, ?, ?, ?, ?, ?, ?);").run(interaction.user.id, interaction.user.tag, interaction.guild.id, interaction.guild.name, 0, 0, 0);
                }

                cmd.run(client, interaction, language).then(async () => {
                    client.logs.cmd(`(${interaction.guild.name}) - ${interaction.user.username}: /${cmd.name}`);
                });

            }
        }

    } catch (e) {
        const embed = new Discord.EmbedBuilder()
            .setColor(client.config.redcolor)
            .setDescription(client.langs("error", language).replace("{link}", client.config.supportServer.link))
        interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => { interaction.editReply({ embeds: [embed], ephemeral: true }).catch(() => { }); });
        throw new Error(e.stack ? String(e.stack) : String(e));
    }
}