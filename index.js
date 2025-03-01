const Discord = require("discord.js");
const config = require("./config.js");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./utils/db/db.sqlite');
const autoReconnect = new SQLite("./utils/db/autoReconnect.sqlite");
const file = require('./utils/languages.json');

const client = new Discord.Client({
    fetchAllMembers: true,
    failIfNotExists: false,
    intents: 33411,
    allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: false
    }
});
module.exports = client;

client.commands = new Discord.Collection();
client.interactions = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.timeout = new Discord.Collection();
client.config = config;
client.logs = require('./utils/logger.js');
client.utils = require('./utils/utilities.js');
client.notifier = require('./utils/notifier.js');
client.data = {
    latestVideos: {}
};
client.subscriptions = [];
client.intervalId = null;

client.setMaxListeners(25);
require('events').defaultMaxListeners = 25;

Array("extraevents", "loader").forEach(handler => {
    try { require(`./utils/handlers/${handler}`)(client); } catch (e) { client.logs.error(e); };
});

const guildsTable = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guilds';").get();
if (!guildsTable['count(*)']) {
    client.logs.db("Creating guilds table");
    sql.prepare("CREATE TABLE guilds (id TEXT PRIMARY KEY, name TEXT, language TEXT, commandsUsed INTEGER, tempchannel TEXT, levels TEXT, blockLinks TEXT, yn_ytChannel TEXT, yn_txtChannel TEXT, yn_roleId TEXT, welcomeChannel TEXT, rpsDaily TEXT, rpsLeaderboardUser INTEGER, rpsLeaderboardBot INTEGER, rpsPing TEXT);").run();
    sql.prepare("CREATE UNIQUE INDEX idx_guilds_id ON guilds (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
}
const membersTable = sql.prepare("SELECT count() FROM sqlite_master WHERE type='table' AND name = 'members';").get();
if (!membersTable['count()']) {
    client.logs.db("Creating members table");
    sql.prepare("CREATE TABLE members (id TEXT, username TEXT, guildId TEXT, guildName TEXT, usingLuckCommand INTEGER, levelLuckCommand INTEGER, messages INTEGER, PRIMARY KEY (id, guildId));").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
}
const autoTempChannelsTable = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'autoTempChannels';").get();
if (!autoTempChannelsTable['count(*)']) {
    client.logs.db("Creating autoTempChannels table");
    sql.prepare("CREATE TABLE autoTempChannels (id TEXT);").run();
    sql.prepare("CREATE UNIQUE INDEX idx_autoTempChannels_id ON autoTempChannels (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
}
client.db = sql;

const autoReconnectTable = autoReconnect.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'autoReconnect';").get();
if (!autoReconnectTable['count(*)']) {
    client.logs.db("Creating autoReconnect table");
    autoReconnect.prepare("CREATE TABLE autoReconnect (id TEXT PRIMARY KEY, time INTEGER, channel TEXT, message TEXT, score TEXT, usersVotes TEXT);").run();
    autoReconnect.prepare("CREATE UNIQUE INDEX idx_autoReconnect_id ON autoReconnect (id);").run();
    autoReconnect.pragma("synchronous = 1");
    autoReconnect.pragma("journal_mode = wal");
}
client.autoReconnect = autoReconnect;

client.langs = (textId, lang) => {
    if (!textId) throw new Error(`-Translate- Missing textId`);
    else if (!file[textId]) throw new Error(`-Translate- TextId Not found:\ntextId: ${textId}`);
    else if (!lang) throw new Error(`-Translate- Missing language:\ntextId: ${textId}`);
    else if (!file[textId][lang]) throw new Error(`-Translate- Missing translation in json:\ntextId: ${textId}\nlanguage: ${lang}`);
    return file[textId][lang];
}

require('dotenv').config();
client.login(process.env.TOKEN);