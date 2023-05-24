const fs = require("fs");
const Discord = require('discord.js');
module.exports = {
    name: 'reload',
    owner: true,
    run: async (client, message, args, language) => {

        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(client.config.redcolor)
                        .setDescription('We need arguments for this command!')
                ]
            });
        }

        const embed = new Discord.EmbedBuilder()
            .setColor(client.config.color)
            .setDescription('<a:load:869677348264493076>')
        const msg = await message.channel.send({
            embeds: [embed]
        });

        try {

            if (args[0].toString() === "/") {

                client.application.commands.set(client.interactions)
                    .then(inter => {
                        embed.setDescription(`\`${inter.size} Interactions\` loaded for all guilds.`);
                        return msg.edit({ embeds: [embed] });
                    }).catch((e) => error(client, embed, msg, e));

            } else if (client.interactions.get(args[0].toLowerCase())) {

                const cmd = client.interactions.get(args[0].toLowerCase());
                try {
                    if (cmd && !cmd.name) {
                        client.logs.error(`${file}: error on the name of the interaction.`);
                        embed.setDescription(`${file}: error on the name of the interaction.`);
                        return msg.edit({ embeds: [embed] });
                    }
                    delete require.cache[require.resolve(`${process.cwd()}/interactions/${cmd.name}.js`)];
                    client.interactions.delete(cmd.name);
                    client.interactions.set(cmd.name, require(`${process.cwd()}/interactions/${cmd.name}.js`));
                    embed.setDescription(`The \`${cmd.name}\` interaction has been reloaded.`);
                    return msg.edit({ embeds: [embed] });
                } catch { };

            } else if (args[0].toString() == "-c" && (client.commands.get(args[1].toLowerCase()))) {

                const cmd = client.commands.get(args[1].toLowerCase());
                try {
                    if (cmd && !cmd.name) {
                        client.logs.error(`${file}: error on the name of the command.`);
                        embed.setDescription(`${file}: error on the name of the command.`);
                        return msg.edit({ embeds: [embed] });
                    }
                    delete require.cache[require.resolve(`${process.cwd()}/commands/${cmd.name}.js`)];
                    client.commands.delete(cmd.name);
                    client.commands.set(cmd.name, require(`${process.cwd()}/commands/${cmd.name}.js`));
                    embed.setDescription(`The \`${cmd.name}\` command has been reloaded.`);
                    return msg.edit({ embeds: [embed] });
                } catch { };

            } else if (args[0].toString() == "-e" && fs.readdirSync(`${process.cwd()}/events`).filter((file) => file.toLowerCase().replace('.js', '') == args[1].toLowerCase()).toString().replace('.js', '')) {

                const eventName = fs.readdirSync(`${process.cwd()}/events`).filter((file) => file.toLowerCase().replace('.js', '') == args[1].toLowerCase()).toString().replace('.js', '');
                if (eventName) {
                    const path = `${process.cwd()}/events/${eventName}.js`;
                    const event = require(path);
                    client.removeAllListeners(eventName);
                    client.on(eventName, event.bind(null, client));
                    delete require.cache[require.resolve(path)];
                    embed.setDescription(`The \`${eventName}\` event has been reloaded.`);
                    return msg.edit({ embeds: [embed] });
                }

            } else {
                embed.setDescription(`Nothing found!`);
                return msg.edit({ embeds: [embed] });
            }

        } catch (e) { error(client, embed, msg, e) }

    },
}

function error(client, embed, msg, e) {
    embed.setColor(client.config.redcolor)
        .setDescription(`An error has occurred, look the console for **more information**\n\`\`\`${e.message ? e.message : e.stack ? String(e.stack).grey.substr(0, 2000) : String(e).grey.substr(0, 2000)}\`\`\``)
    msg.edit({ embeds: [embed] }).catch(() => { });
    throw new Error(e.stack ? String(e.stack) : String(e));
}