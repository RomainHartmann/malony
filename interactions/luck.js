const Discord = require('discord.js');
module.exports = {
    name: 'luck',
    description: 'Check your luck',
    category: 'Fun',
    cooldown: 900,
    botPermissions: [{ name: "Manage Roles", perm: Discord.PermissionsBitField.Flags.ManageRoles }],
    run: async (client, interaction, language) => {

        client.db.prepare("UPDATE members SET usingLuckCommand = usingLuckCommand + 1 WHERE guildId = ? AND id = ?").run(interaction.guild.id, interaction.user.id);

        let level = 0;
        const all = [
            { role: { name: 'Lucky🎉', color: '#1cedce' }, slice: 100 },
            { role: { name: 'Lucky🎉🎉', color: '#1ce6ed' }, slice: 200 },
            { role: { name: 'Lucky👑', color: '#eaed1c' }, slice: 300 }
        ]

        const data = [];
        all.map((r, i) => {
            const lr = interaction.guild.roles.cache.find((role) => role.name === r.role.name);
            if (!lr) {
                interaction.guild.roles.create({ name: r.role.name, color: r.role.color, permissions: [], reason: "Luck command" }).then((role) => {
                    return data.push({ luckRole: role, hasRole: interaction.member.roles.cache.get(role.id), role: r.role });
                });
            } else {
                return data.push({ luckRole: lr, hasRole: interaction.member.roles.cache.get(lr.id), role: r.role });
            }
        });

        const db = client.db.prepare('SELECT * FROM members WHERE guildId = ? AND id = ?').get(interaction.guild.id, interaction.user.id);
        level = db?.levelLuckCommand || 0;

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        setTimeout(async () => {

            const number1 = Math.floor(Math.random() * (all[level]?.slice || all[2].slice)) + 1;
            const number2 = Math.floor(Math.random() * (all[level]?.slice || all[2].slice)) + 1;

            if ((data[0]?.luckRole && data[level]?.luckRole) && (interaction.guild.members.me.roles.highest.rawPosition < data[0].luckRole.rawPosition || interaction.guild.members.me.roles.highest.rawPosition < data[level]?.luckRole?.rawPosition)) {
                return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.redcolor)
                            .setDescription(client.langs("luck", language).noPerms)
                    ]
                });
            }

            const titleText = client.langs("luck", language).title;
            const finalDescription = (level >= 3 ? client.langs("luck", language).description2 : client.langs("luck", language).description).replace("{number1}", number1).replace("{number2}", number2).replace("{role}", all[level]?.role.name || all[0].role.name);

            const buildEmbed = (description) => new Discord.EmbedBuilder()
                .setColor("Grey")
                .setAuthor({ name: titleText })
                .setDescription(description);

            await interaction.editReply({ embeds: [buildEmbed("🎲")] }).catch(() => { });
            await sleep(600);
            await interaction.editReply({ embeds: [buildEmbed("🎲 🎲")] }).catch(() => { });
            await sleep(600);
            await interaction.editReply({ embeds: [buildEmbed("🎲 🎲 🎲")] }).catch(() => { });
            await sleep(600);
            await interaction.editReply({ embeds: [buildEmbed(finalDescription)] }).catch(() => { });

            if (number1 == number2) {

                client.logs.action(`(${interaction.guild.name}) - ${interaction.user.username}: Win luck 🎉`);
                client.db.prepare('UPDATE members SET levelLuckCommand = ? WHERE guildId = ? AND id = ?').run(level + 1, interaction.guild.id, interaction.user.id);

                if (data[level]?.luckRole) interaction.member.roles.add(data[level].luckRole);

                return await interaction.editReply({ content: `🎉` }).catch(() => { });

            } else return;

        }, client.ws.ping * 3);

    }
};