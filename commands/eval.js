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
            return message.channel.send({ content: "You can't get my token!" });
        } else if (code.startsWith("db")) {
            if (code.split(" ").length === 1) {
                if (!code.includes(".") && code !== "db") return;
                let guildDb = await client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(message.guild.id);
                let result = guildDb;
                if (code.includes(".")) result = result[code.split(".")[1]];
                if (!result) result = guildDb;
                return message.channel.send({ content: JSON.stringify(result) });
            } else if (code.includes(" = ") && code.split(" ").length === 4) {
                let guildDb = await client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(message.guild.id);
                if (!guildDb[code.split(" ")[1]]) return message.channel.send({ content: `This key doesn't exist!\n${Object.keys(guildDb).join(", ")}` });
                client.db.prepare(`UPDATE guilds SET ${code.split(" ")[1]} = ? WHERE id = ?`).run(code.split(" = ")[1], message.guild.id);
                return message.channel.send({ content: `Updated the key \`${code.split(" ")[1]}\` to \`${code.split(" = ")[1]}\`` });
            }
        }

        try {
            let ev = eval(code);
            let str = util.inspect(ev, { depth: 1 });
            str = str.replace(new RegExp(message.client.token, "g"), "TOKEN");

            if (str.length > 1914) str = str.substr(0, 1914) + "...";
            if (code.length > 1914) code = code.substr(0, 1914);

            message.channel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(message.client.config.color)
                        .setDescription(`**📥 Tested code**\n\`\`\`js\n${code}\n\`\`\`\n**📤 Result**\n\`\`\`js\n${clean(str)}\n\`\`\``)
                        .addFields({ name: "Type of:", value: typeof (str) })
                ]
            });
        }
        catch (error) {
            message.channel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(message.client.config.color)
                        .setDescription(`**📥 Tested code**\n\`\`\`js\n${code}\n\`\`\`\n**📤 Error**\n\`\`\`js\n${error}\n\`\`\``)
                        .addFields({ name: "Type of:", value: typeof (str) })
                ]
            });
        }

        function clean(text) {
            if (typeof (text) === 'string') return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            else return text;
        }
    },
}