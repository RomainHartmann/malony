require('dotenv').config();
const Discord = require('discord.js');
const SQLite = require('better-sqlite3');
const path = require('path');

const APPLY = process.argv.includes('--apply');

const ROLE_TIERS = [
    { name: 'Lucky🎉', level: 1 },
    { name: 'Lucky🎉🎉', level: 2 },
    { name: 'Lucky👑', level: 3 },
];

const db = new SQLite(path.join(__dirname, '..', 'utils', 'db', 'db.sqlite'));
db.pragma('journal_mode = wal');
db.pragma('synchronous = 2');

const selectMember = db.prepare('SELECT levelLuckCommand FROM members WHERE guildId = ? AND id = ?');
const updateLevel = db.prepare('UPDATE members SET levelLuckCommand = ? WHERE guildId = ? AND id = ?');
const insertMember = db.prepare('INSERT INTO members (id, username, guildId, guildName, usingLuckCommand, levelLuckCommand, messages) VALUES (?, ?, ?, ?, 0, ?, 0)');

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
    ],
});

function computeLevel(member) {
    let max = 0;
    for (const tier of ROLE_TIERS) {
        const role = member.guild.roles.cache.find((r) => r.name === tier.name);
        if (role && member.roles.cache.has(role.id)) {
            if (tier.level > max) max = tier.level;
        }
    }
    return max;
}

client.once(Discord.Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag} — mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
    console.log(`Guilds: ${client.guilds.cache.size}`);

    const summary = { scanned: 0, withRole: 0, updated: 0, inserted: 0, skippedNoRegress: 0, perTier: { 1: 0, 2: 0, 3: 0 } };

    for (const [, guild] of client.guilds.cache) {
        try {
            await guild.members.fetch();
        } catch (e) {
            console.error(`[${guild.name}] fetch members failed: ${e.message}`);
            continue;
        }

        const hasAnyLuckRole = ROLE_TIERS.some((t) => guild.roles.cache.find((r) => r.name === t.name));
        if (!hasAnyLuckRole) continue;

        let gUpdated = 0;
        let gInserted = 0;

        for (const [, member] of guild.members.cache) {
            if (member.user.bot) continue;
            summary.scanned++;

            const computed = computeLevel(member);
            if (computed === 0) continue;
            summary.withRole++;
            summary.perTier[computed]++;

            const row = selectMember.get(guild.id, member.id);

            if (!row) {
                if (APPLY) insertMember.run(member.id, member.user.username, guild.id, guild.name, computed);
                summary.inserted++;
                gInserted++;
            } else if ((row.levelLuckCommand || 0) < computed) {
                if (APPLY) updateLevel.run(computed, guild.id, member.id);
                summary.updated++;
                gUpdated++;
            } else {
                summary.skippedNoRegress++;
            }
        }

        if (gUpdated || gInserted) {
            console.log(`[${guild.name}] updated=${gUpdated} inserted=${gInserted}`);
        }
    }

    console.log('--- Summary ---');
    console.log(JSON.stringify(summary, null, 2));
    if (!APPLY) console.log('Dry-run: no DB writes. Re-run with --apply to commit.');

    await client.destroy();
    db.close();
    process.exit(0);
});

client.login(process.env.TOKEN);
