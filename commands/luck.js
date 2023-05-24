const Discord = require('discord.js');
module.exports = {
    name: 'luck',
    cooldown: 900,
    botPermissions: [{ name: "Manage Roles", perm: Discord.PermissionsBitField.Flags.ManageRoles }],
    run: async (client, message, args, language) => {

        client.db.prepare("UPDATE members SET usingLuckCommand = usingLuckCommand + 1 WHERE guildId = ? AND id = ?").run(message.guild.id, message.author.id);

        const embed = new Discord.EmbedBuilder()
            .setColor("Grey")
            .setDescription("<a:load:869677348264493076>")

        const msg = await message.reply({ embeds: [embed] });

        let level = 0;
        const all = [
            { role: { name: 'Lucky🎉', color: '#1cedce' }, slice: 100 },
            { role: { name: 'Lucky🎉🎉', color: '#1ce6ed' }, slice: 200 },
            { role: { name: 'Lucky👑', color: '#eaed1c' }, slice: 300 }
        ]

        const data = [];
        all.map((r, i) => {
            const lr = message.guild.roles.cache.find((role) => role.name === r.role.name);
            if (!lr) {
                message.guild.roles.create({ name: r.role.name, color: r.role.color, permissions: [], reason: "Luck command" }).then((role) => {
                    return data.push({ luckRole: role, hasRole: message.member.roles.cache.get(role.id), role: r.role });
                });
            } else {
                return data.push({ luckRole: lr, hasRole: message.member.roles.cache.get(lr.id), role: r.role });
            }
        });

        const db = client.db.prepare("SELECT * FROM members WHERE guildId = ? AND id = ?").get(message.guild.id, message.author.id);
        level = db?.levelLuckCommand || 0;
        setTimeout(async () => {

            const number1 = Math.floor(Math.random() * (all[level]?.slice || all[2].slice)) + 1;
            const number2 = Math.floor(Math.random() * (all[level]?.slice || all[2].slice)) + 1;

            if ((data[0]?.luckRole && data[level]?.luckRole) && message.guild.members.me.roles.highest.rawPosition < data[0].luckRole.rawPosition || message.guild.members.me.roles.highest.rawPosition < data[level]?.luckRole?.rawPosition) {
                return msg.edit({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("luck", language).noPerms)
                    ]
                });
            }

            msg.edit({
                embeds: [
                    embed
                        .setAuthor({ name: client.langs("luck", language).title })
                        .setDescription((level >= 3 ? client.langs("luck", language).description2 : client.langs("luck", language).description).replace("{number1}", number1).replace("{number2}", number2).replace("{role}", all[level]?.role.name || all[0].role.name))
                ]
            });

            if (number1 == number2) {

                client.logs.action(`(${message.guild.name}) - ${message.author.username}: Win luck 🎉`);
                client.db.prepare("UPDATE members SET levelLuckCommand = ? WHERE guildId = ? AND id = ?").run(level + 1, message.guild.id, message.author.id);

                if (data[level]?.luckRole) message.member.roles.add(data[level].luckRole);

                return await msg.edit({ content: `🎉` }).catch(() => { });

            } else return;

        }, client.ws.ping * 3);

    },
}