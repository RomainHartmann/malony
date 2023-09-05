const https = require("node:https");
const Discord = require("discord.js");
const levenshtein = require('fast-levenshtein');

async function dailyInterval(client, hour, returnNext = false) {
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
    if (now > targetTime) targetTime.setDate(targetTime.getDate() + 1);
    const inT = targetTime.getTime() - now.getTime();
    if (returnNext) return inT;

    setTimeout(async function atHour() {
        guilds = client.db.prepare("SELECT * FROM guilds WHERE rpsDaily IS NOT NULL;").all();
        guilds.filter((r) => r.rpsDaily).map(async (r, i) => {
            const channel = client.channels.cache.get(r?.rpsDaily);
            if (channel) {
                // edit the older message
                let db = client.autoReconnect.prepare("SELECT * FROM autoReconnect WHERE id = ?").get(r.id);
                const choices = {
                    rock: "🪨",
                    paper: "📰",
                    scissors: "✂️"
                };

                let result;
                let users = [];
                if (db.usersVotes) users = JSON.parse(db.usersVotes);
                let score = { rock: 0, paper: 0, scissors: 0 };
                if (db.score) score = JSON.parse(db.score);

                const keys = Object.keys(choices);
                const userChoiceId = Object.keys(score).reduce((a, b) => score[a] > score[b] ? a : b);
                const botEmoji = choices[keys[Math.floor(Math.random() * keys.length)]];
                const userEmoji = choices[userChoiceId];

                let lrBot = r.rpsLeaderboardBot;
                let lrUser = r.rpsLeaderboardUser;

                switch (true) {
                    case (botEmoji == "🪨" && userEmoji == "✂️") ||
                        (botEmoji == "✂️" && userEmoji == "📰") ||
                        (botEmoji == "📰" && userEmoji == "🪨"):
                        result = client.langs("rpsDaily", r.language).botWon.replace("{emoji}", botEmoji).replace("{users}", users.length).replace("{s}", users.length != 1 ? "s" : "");
                        lrBot++;
                        break;
                    case botEmoji == userEmoji:
                        result = client.langs("rpsDaily", r.language).draw.replace("{emoji}", botEmoji);
                        break;
                    default:
                        result = client.langs("rpsDaily", r.language).usersWon.replace("{emoji}", userEmoji).replace("{votes}", users.length).replace("{s}", users.length != 1 ? "s" : "");
                        lrUser++;
                }

                if (lrBot != r.rpsLeaderboardBot) client.db.prepare("UPDATE guilds SET rpsLeaderboardBot = ? WHERE id = ?").run(lrBot, r.id);
                else if (lrUser != r.rpsLeaderboardUser) client.db.prepare("UPDATE guilds SET rpsLeaderboardUser = ? WHERE id = ?").run(lrUser, r.id);

                const msg = await channel.messages.fetch(db.message);
                if (msg) msg.edit({
                    content: `${client.langs("rpsDaily", r.language).botWins}: ${lrBot} | ${client.langs("rpsDaily", r.language).usersWins}: ${lrUser}`,
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(client.config.color)
                            .setAuthor({ name: client.langs("rpsDaily", r.language).title })
                            .setTitle(result)
                            .setFooter({ text: `${client.langs("rpsDaily", r.language).bot} : ${botEmoji}  •  ${client.langs("rpsDaily", r.language).users} : ${userEmoji}` })
                    ], components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('rockDaily')
                                    .setEmoji("🪨")
                                    .setLabel(score.rock.toString())
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled()
                            )
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('paperDaily')
                                    .setEmoji("📰")
                                    .setLabel(score.paper.toString())
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled()
                            )
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('scissorsDaily')
                                    .setEmoji("✂️")
                                    .setLabel(score.scissors.toString())
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled()
                            )
                    ]
                }).catch(() => { });
                rpsDaily(client, r, channel, hour); // new day
            }
            else return client.db.prepare("UPDATE guilds SET rpsDaily = ? WHERE id = ?").run(null, r.id);
        });

        setTimeout(atHour, 24 * 60 * 60 * 1000);
    }, (inT));
}

async function rpsDaily(client, guildDb, channel, hour) {

    client.logs.action(`${guildDb.name} - RPS Daily`);
    guildDb = client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(guildDb.id);
    reconnectDb = client.autoReconnect.prepare("SELECT * FROM autoReconnect WHERE id = ?").get(guildDb.id);

    let score = {
        rock: 0,
        paper: 0,
        scissors: 0
    };
    let role = null;

    if (guildDb?.rpsPing) role = client.guilds.cache.get(guildDb.id)?.roles.cache.get(guildDb?.rpsPing)
    if (!role) role = null;

    const message = await channel.send({
        content: `${role ? `${role}` : ``}`,
        embeds: [
            new Discord.EmbedBuilder()
                .setColor(client.config.color)
                .setTitle(client.langs("rpsDaily", guildDb.language).title)
                .setDescription(client.langs("rpsDaily", guildDb.language).description)
                .setFooter({ text: client.langs("rps", guildDb.language).description })
        ],
        components: [
            new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('rockDaily')
                        .setEmoji("🪨")
                        .setStyle(Discord.ButtonStyle.Secondary)
                )
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('paperDaily')
                        .setEmoji("📰")
                        .setStyle(Discord.ButtonStyle.Secondary)
                )
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('scissorsDaily')
                        .setEmoji("✂️")
                        .setStyle(Discord.ButtonStyle.Secondary)
                )
        ]
    }).catch(() => { });

    client.autoReconnect.prepare("INSERT OR REPLACE INTO autoReconnect (id, time, channel, message, score, usersVotes) VALUES (?, ?, ?, ?, ?, ?);").run(guildDb.id, Date.now(), channel.id, message.id, JSON.stringify(score), null);
}

async function playLogo(mode, client, language, thread, interaction, message, round = 0, rounds = 1, logos = [], leaderboard = []) {
    const data = require("../utils/logos.json");
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
                    }).catch(() => { });
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
                    }).catch(() => { });
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

module.exports = { duration, removeDuplicates, getYoutubeChannel, playLogo, rpsDaily, dailyInterval };