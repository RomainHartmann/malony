const Discord = require("discord.js");
module.exports = {
    name: 'help',
    description: 'View the list of commands',
    category: 'General',
    run: async (client, interaction, language) => {

        const categories = [];
        client.interactions.forEach(interaction => {
            if (!categories.includes(interaction.category)) categories.push(interaction.category);
        });

        const embed = new Discord.EmbedBuilder()
            .setColor(client.config.color)
            .setTitle(client.langs("help", language).title)
            .setDescription(client.langs("help", language).description.replace("{link}", client.config.supportServer.link))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        categories.sort().forEach(async cat => {

            if (cat) embed.addFields({
                name: cat,
                value: client.interactions.filter(cmd => cmd.category === cat && cmd.name).map(cmd =>
                    `${cmd.interactionId ? `</${cmd.name}${cmd?.options && cmd?.options[0]?.type == 1 ? ` ${cmd?.options[0].name}` : ""}:${cmd.interactionId}>` : `\`/${cmd.name}\``}: ${cmd.description}`
                ).join("\n")
            });

        });

        await interaction.editReply({ embeds: [embed] });

    }
}