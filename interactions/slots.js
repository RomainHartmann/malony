const Discord = require('discord.js');
module.exports = {
    name: 'slots',
    description: 'Playing slot machines',
    category: 'Fun',
    run: async (client, interaction, language) => {

        const slots = [
            "🍇",
            "🍋",
            "🍐",
            "🍊",
            "🍒"
        ]

        const slot1 = slots[Math.floor(Math.random() * slots.length)];
        const slot2 = slots[Math.floor(Math.random() * slots.length)];
        const slot3 = slots[Math.floor(Math.random() * slots.length)];

        const embed = new Discord.EmbedBuilder()
            .setColor("Yellow")
            .setAuthor({ name: `🎰 ${client.langs("slots", language)}` })
            .setThumbnail('https://thumbs.gfycat.com/IdleLightheartedApe-size_restricted.gif')

        interaction.editReply({ embeds: [embed] }).then(() => {
            setTimeout(async function () {

                delete embed.data.thumbnail;
                embed.setDescription(`${slot1}|${slot2}|${slot3}`).setFooter({ text: `${interaction.user.username} ${slot1 == slot2 && slot2 == slot3 ? client.langs("utils", language).win : client.langs("utils", language).lose}` });
                await interaction.editReply({ embeds: [embed] });

            }, 1000);
        });

    }
};