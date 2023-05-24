const https = require("node:https");
const Discord = require("discord.js");
const levenshtein = require('fast-levenshtein');

async function playLogo(mode, client, language, thread, interaction, message, round = 0, rounds = 1, logos = [], leaderboard = []) {
    const data = require("../utils/sites.json");
    const brand = data[Math.floor(Math.random() * data.length)];
    for (let key in brand) {
        if (brand.hasOwnProperty(key)) {
            if (logos.includes(brand[key])) return setTimeout(() => playLogo(mode, client, language, thread, interaction, message, round, rounds, logos, leaderboard), 1000);
            logos.push(brand[key]);
            round++;
            thread.send({
                content: `${client.langs("guessLogo", language).brand} (${round}/${rounds})`,
                files: [new Discord.AttachmentBuilder(key.includes("https") ? key : `https://logo.clearbit.com/${key}?size=300`, { name: 'brand.png' })]
            });
            let found;
            let msg3;
            const filter = m => !m.author.bot;
            const collector = thread.createMessageCollector({ filter, time: 60000 });
            collector.on('collect', async msg => {
                if (msg.content.toLowerCase() === brand[key].toLowerCase() || msg.content.toLowerCase() === brand[key].toLowerCase().replaceAll("'", "")) {
                    msg3 = msg;
                    found = true;
                    collector.stop();
                } else if (levenshtein.get(msg.content.toLowerCase(), brand[key].toLowerCase()) <= 1) {
                    msg.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("guessLogo", language).close)
                        ]
                    });
                }
            });
            collector.on('end', async collected => {
                let msg2;
                if (found) {
                    let user = leaderboard.find(u => u.id == msg3.author.id);
                    if (!user) {
                        leaderboard.push({
                            id: msg3.author.id,
                            score: 1
                        });
                    } else {
                        user.score++;
                    }
                    msg2 = await msg3.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.greencolor)
                                .setDescription(client.langs("guessLogo", language).win.replace("{user}", msg3.author))
                        ]
                    });
                }
                else {
                    msg2 = await thread.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.redcolor)
                                .setDescription(client.langs("guessLogo", language).lose.replace("{brand}", brand[key]))
                        ]
                    }).catch(() => { });
                    if (collected.size == 0) {
                        if (mode == 1) return;
                        thread.delete().catch(() => { });
                        return await interaction.editReply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(client.config.color)
                                    .setDescription(client.langs("guessLogo", language).end)
                            ]
                        });
                    }
                }
                if (round < rounds) {
                    setTimeout(() => playLogo(mode, client, language, thread, interaction, message, round, rounds, logos, leaderboard), 1000);
                } else {
                    if (mode == 1) return;
                    await thread.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.color)
                                .setDescription(client.langs("guessLogo", language).leaderboard.replace("{url}", message.url))
                        ]
                    }).catch(() => { });
                    await interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(client.config.color)
                                .setTitle(client.langs("utils", language).leaderboard)
                                .setDescription(`${leaderboard.sort((a, b) => b.score - a.score).map((r, i) => `**#${i + 1}** ${client.users.cache.get(r.id)}\n > score \`${r.score}\``).join("\n")}`)
                        ]
                    }).catch(() => { });
                    setTimeout(() => thread.delete().catch(() => { }), 30000);
                }
            });

        }
    }
}

function getYoutubeChannel(channelId) {
    return new Promise((resolve) => {
        const request = https.request(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, (response, error) => {
            if (error || response.statusCode !== 200) resolve(null);
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                resolve(data);
            });
        });
        request.end();
    });
}

function removeDuplicates(data, key = 1) {
    if (key == 1) return data.filter((value, index) => data.indexOf(value) === index);
    else {
        const seen = new Map();
        return data.filter(item => !seen.has(item.id) && seen.set(item.id, true));
    }
}

function duration(client, language, duration, useMilli = false) {

    let remain = duration;
    let days = Math.floor(remain / (1000 * 60 * 60 * 24));
    remain = remain % (1000 * 60 * 60 * 24);
    let hours = Math.floor(remain / (1000 * 60 * 60));
    remain = remain % (1000 * 60 * 60);
    let minutes = Math.floor(remain / (1000 * 60));
    remain = remain % (1000 * 60);
    let seconds = Math.floor(remain / (1000));
    remain = remain % (1000);
    let milliseconds = remain;
    let time = {
        days,
        hours,
        minutes,
        seconds,
        milliseconds
    };
    let result;
    if (time.days) {
        let ret = time.days + ` ${client.langs("utils", language).day}`
        if (time.days !== 1) {
            ret += 's'
        }
        result = `${result ? `${result}, ` : ""}${ret}`;
    }
    if (time.hours) {
        let ret = time.hours + ` ${client.langs("utils", language).hour}`
        if (time.hours !== 1) {
            ret += 's'
        }
        result = `${result ? `${result}, ` : ""}${ret}`;
    }
    if (time.minutes) {
        let ret = time.minutes + ` ${client.langs("utils", language).minute}`
        if (time.minutes !== 1) {
            ret += 's'
        }
        result = `${result ? `${result}, ` : ""}${ret}`;

    }
    if (time.seconds) {
        let ret = time.seconds + ` ${client.langs("utils", language).second}`
        if (time.seconds !== 1) {
            ret += 's'
        }
        result = `${result ? `${result}, ` : ""}${ret}`;
    }
    if (useMilli && time.milliseconds) {
        let ret = time.milliseconds + ' ms'
        result = `${result ? `${result}, ` : ""}${ret}`;
    }

    if (!result || result.length === 0) {
        return client.langs("utils", language).now;
    } else return result.replace(result.split(" ")[0], `**${result.split(" ")[0]}**`);

}

module.exports = { duration, removeDuplicates, getYoutubeChannel, playLogo };