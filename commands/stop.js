const Discord = require('discord.js');
module.exports = {
    name: 'stop',
    owner: true,
    run: async (client, message, args, language) => {

        message.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(client.config.color)
                    .setDescription("<a:load:869677348264493076> Stop...")
            ]
        });

        setTimeout(async () => {
            process.exit();
        }, 2000);

    },
}