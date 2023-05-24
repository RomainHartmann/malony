const path = require("node:path");
const fs = require("fs");
const dataFile = require("../config.js").youtubeNotifier.dataFile;
const xml2js_1 = require("xml2js");

async function newVideo(client, video) {
    const db = client.db.prepare("SELECT * FROM guilds WHERE yn_ytChannel IS NOT NULL").all();
    if (db.toString()) {
        client.logs.action(`(${db.name}) - YT Notifier: Sending a new video notification`);
        const guilds = db.filter((r, i) => r.yn_ytChannel == video.channel.id);
        guilds.map((g, i) => {
            const channel = client.guilds.cache.get(g.id).channels.cache.get(g.yn_txtChannel);
            if (channel) channel.send({
                content: "{mention} {url}"
                    .replace("{channelName}", video.channel.title)
                    .replace("{channelUrl}", video.channel.url)
                    .replace("{title}", video.title)
                    .replace("{url}", video.url)
                    .replace("{thumbnail}", video.thumb.url)
                    .replace("{mention}", client.guilds.cache.get(g.id).roles.cache.get(g.yn_roleId))
            });
        });
    } else client.notifier.unsubscribe(client, video.channel.id);
}

function channelData(client, channelId) {
    return new Promise((resolve, reject) => {
        client.utils.getYoutubeChannel(channelId)
            .then((xml) => {
                xml2js_1.parseString(xml, (err, parsedXml) => {
                    if (err !== null)
                        reject(err);
                    const channel = {
                        title: parsedXml.feed.title[0],
                        url: parsedXml.feed.link[1].$.href,
                        id: channelId,
                        released: new Date(parsedXml.feed.published[0]),
                        videos: []
                    };
                    if (parsedXml.feed.entry === undefined)
                        return resolve(channel);
                    for (let i = 0; i < parsedXml.feed.entry.length; i++) {
                        const entry = parsedXml.feed.entry[i];
                        const vid = {
                            title: entry.title[0],
                            url: entry.link[0].$.href,
                            id: entry["yt:videoId"][0],
                            released: new Date(entry.published[0]),
                            description: entry["media:group"][0]["media:description"][0],
                            width: parseInt(entry["media:group"][0]["media:content"][0].$.width),
                            height: parseInt(entry["media:group"][0]["media:content"][0].$.height),
                            thumb: {
                                width: parseInt(entry["media:group"][0]["media:thumbnail"][0].$.width),
                                height: parseInt(entry["media:group"][0]["media:thumbnail"][0].$.height),
                                url: entry["media:group"][0]["media:thumbnail"][0].$.url
                            },
                            channel: {
                                title: channel.title,
                                url: channel.title,
                                id: channel.id,
                                released: channel.released
                            }
                        };
                        channel.videos.push(vid);
                    }
                    resolve(channel);
                });
            });
    });
}

function jsonData(client) {
    return new Promise((resolve) => {
        fs.writeFile(dataFile, "", { flag: 'wx' }, async function () {
            if (!fs.existsSync(dataFile)) throw new Error(`data file not exists`);
            fs.readFile(dataFile, { encoding: "utf-8" }, (err, txt) => {
                if (err !== null) throw new Error(err);
                try {
                    client.data = JSON.parse(txt);
                } catch (err) {
                    saveData(client);
                }
                return resolve();
            });
        });
    });
}

function saveData(client) {
    if (dataFile === null) throw new Error(`data file is null`);
    fs.mkdir(path.dirname(dataFile), { recursive: true }, (err) => {
        if (err !== null) throw new Error(err);
        const txt = JSON.stringify(client.data);
        fs.writeFile(dataFile, txt, (err) => {
            if (err !== null) throw new Error(err);
        });
    });
}

async function doCheck(client) {
    const subs = client.db.prepare("SELECT * FROM guilds WHERE yn_ytChannel IS NOT NULL").all();
    for (let i = 0; i < subs.length; i++) {
        const channelId = subs[i].yn_ytChannel;
        channelData(client, channelId).then(async (channel) => {
            if (channel) {
                const prevLatestVidId = client.data.latestVideos[channel.id];
                if (channel.videos.length === 0) {
                    return client.data.latestVideos[channel.id] = null;
                }
                if (prevLatestVidId === undefined) {
                    client.data.latestVideos[channel.id] = channel.videos[0].id;
                    return saveData(client);
                }
                const vidIds = channel.videos.map(v => v.id);
                if (prevLatestVidId !== null) {
                    if (!vidIds.includes(prevLatestVidId)) {
                        client.data.latestVideos[channel.id] = channel.videos[0].id;
                        return saveData(client);
                    }
                }
                const newVids = [];
                for (let j = 0; j < channel.videos.length; j++) {
                    if (channel.videos[j].id === prevLatestVidId) break;
                    newVids.push(channel.videos[j]);
                }
                if (newVids.length === 0) return;
                for (let j = newVids.length - 1; j >= 0; j--) {
                    newVideo(client, newVids[j]);
                }
                client.data.latestVideos[channel.id] = channel.videos[0].id;
                saveData(client);
            }
        });
    }
}

function isActive(client) {
    return client.intervalId !== null;
}

function start(client) {
    if (isActive(client)) throw new Error(`the notifier is already active`);
    jsonData(client)
        .then(() => {
            doCheck(client);
            client.intervalId = setInterval(() => {
                doCheck(client);
            }, client.config.youtubeNotifier.interval);
        });
}

function stop(client) {
    if (!isActive(client)) throw new Error(`the notifier is not active`);
    if (client.intervalId === null) return;
    clearInterval(client.intervalId);
    client.intervalId = null;
}

function _subscribe(client, channel) {
    if (!/^[0-9a-zA-Z_\-]{24}$/.test(channel)) throw new Error(`Invalid channel ID inputted: ${channel}`);
    if (client.subscriptions.includes(channel)) throw new Error(`An attempt was made to subscribe to an already subscribed-to channel: ${channel}`);
    client.subscriptions.push(channel);
}

function subscribe(client, channels) {
    const argIsString = typeof channels === "string";
    if (typeof channels === "string") {
        _subscribe(client, channels);
    }
    else {
        for (let i = 0; i < channels.length; i++) {
            _subscribe(client, channels[i]);
        }
    }
}

function _unsubscribe(client, channel) {
    const index = client.subscriptions.indexOf(channel);
    if (index === -1) throw new Error(`An attempt was made to unsubscribe from a not-subscribed-to channel: ${channel}`);
    client.subscriptions.splice(index, 1);
    delete client.data.latestVideos[channel];
    saveData(client);
}

function unsubscribe(client, channels) {
    const argIsString = typeof channels === "string";
    if (typeof channels === "string") {
        _unsubscribe(client, channels);
    }
    else {
        for (let i = 0; i < channels.length; i++) {
            _unsubscribe(client, channels[i]);
        }
    }
}

module.exports = { newVideo, channelData, jsonData, saveData, doCheck, isActive, start, stop, _subscribe, subscribe, _unsubscribe, unsubscribe };