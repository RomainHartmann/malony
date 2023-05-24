const Discord = require('discord.js');
module.exports = {
    name: 'avatar',
    description: 'View avatar of a user',
    category: 'General',
    type: Discord.ApplicationCommandType.User,
    options: [
        {
            name: 'user',
            type: Discord.ApplicationCommandOptionType.User,
            description: 'Which user\'s avatar would you like to see?',
            required: false
        }
    ],
    run: async (client, interaction, language) => {

        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.redcolor)
                    .setDescription(client.langs("utils", language).userNotFound)
            ]
        });

        interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(client.langs("avatar", language).replace("{user}", member.user.username))
                    .setColor(client.config.color)
                    .setImage(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            ]
        });

    }
};