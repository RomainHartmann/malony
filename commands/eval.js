const Discord = require('discord.js');
const util = require('util');
module.exports = {
    name: 'eval',
    owner: true,
    run: async (client, message, args, language) => {

        let code = args.join(" ");
        if (!code) return message.channel.send({
            embeds: [new Discord.EmbedBuilder()
                .setColor(client.config.redcolor)
                .setDescription('We need arguments for this command!')
            ]
        });

        if (code.includes(".token")) {
            return message.channel.send({ content: "You are trying to take my token!" });
        }

        try {
            const ev = eval(code);
            let str = util.inspect(ev, {
                depth: 1,
            });

            str = `${str.replace(new RegExp(message.client.token, "g"), "TOKEN")}`;

            if (str.length > 1914) {
                str = str.substr(0, 1914);
                str = str + "...";
            }
            if (code.length > 1914) {
                code = code.substr(0, 1914);
                code = "Your code is very long!";
            }

            const embed = new Discord.EmbedBuilder()
                .setColor(message.client.config.color)
                .setDescription(`**📥 Tested code**\n\`\`\`js\n${code}\n\`\`\`\n**📤 Result**\n\`\`\`js\n${clean(str)}\n\`\`\``)
                .addFields({ name: "Type of:", value: typeof (str) })
            message.channel.send({ embeds: [embed] });
        }
        catch (error) {
            const embed = new Discord.EmbedBuilder()
                .setColor(message.client.config.color)
                .setDescription(`**📥 Tested code**\n\`\`\`js\n${code}\n\`\`\`\n**📤 Error**\n\`\`\`js\n${error}\n\`\`\``)
                .addFields({ name: "Type of:", value: typeof (str) })
            message.channel.send({ embeds: [embed] });
        }

        function clean(text) {
            if (typeof (text) === 'string') return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            else return text;
        }
    },
}