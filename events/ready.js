const { hour } = require('../interactions/rpsdaily');
module.exports = async (client) => {
    client.logs.client(`${client.user.username} is now online on ${client.guilds.cache.size} server${Number(client.guilds.cache.size) > 1 ? 's' : ''} and for ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)} users!`);

    client.interactions.forEach(async (interaction) => {
        const cmds = await client.application.commands.fetch();
        cmds.filter(cmd => cmd.name == interaction.name && cmd.type == 1).map((r) => {
            const newObj = client.interactions.get(r.name);
            newObj["interactionId"] = r.id;
            client.interactions.set(r.name, newObj);
        });
    });

    client.utils.dailyInterval(client, hour);

    const guilds = client.db.prepare("SELECT * FROM guilds WHERE yn_ytChannel IS NOT NULL").all();
    if (guilds.toString()) {
        client.logs.action(`YT Notifier - Subscribing to ${guilds.length} channel${guilds.length !== 1 ? "s" : ""}`);
        client.notifier.subscribe(client, client.utils.removeDuplicates(guilds.map((r) => r.yn_ytChannel)));
        client.notifier.start(client);
    } else client.logs.action(`YT Notifier - No channel to subscribe`);

    const tempchannels = client.db.prepare("SELECT * FROM autoTempChannels").all();
    tempchannels.forEach(async (c) => {
        const channel = client.channels.cache.get(c.id);
        if (!channel || channel.members.size == 0) {
            client.db.prepare("DELETE FROM autoTempChannels WHERE id = ?").run(channel.id);
            channel.delete();
            client.logs.action(`Tempchannels - Deleted ${channel.id} from the database`);
        }
    });
}