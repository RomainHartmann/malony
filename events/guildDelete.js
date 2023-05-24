module.exports = async (client, guild) => {

    if (!guild || guild.available === false) return;

    if (!client.db.prepare("SELECT * FROM guilds WHERE id = ?").get(guild.id)) return;
    client.db.prepare("DELETE FROM guilds WHERE id = ?").run(guild.id);
    client.logs.db(`Deleting guild ${guild.name} (${guild.id}) from database.`);

}