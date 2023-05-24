const fs = require("fs");
module.exports = client => {
    try {

        const commands = fs.readdirSync(`${process.cwd()}/commands/`).filter((files) => files.endsWith(".js"));
        for (const file of commands) {
            const cmd = require(`${process.cwd()}/commands/${file}`);
            if (cmd.name) {
                client.commands.set(cmd.name, cmd);
            } else {
                client.logs.error(`${file}: error on the name of the command.`);
                continue;
            }
        }

        fs.readdirSync(`${process.cwd()}/interactions/`).forEach((dir) => {
            const pull = require(`${process.cwd()}/interactions/${dir}`);
            if (pull.name && pull.type && !pull.hide) client.interactions.set(pull.name + "(cm)", { "name": pull.name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, lettre => lettre.toUpperCase()), "type": pull.type, "run": pull.run });
            if (pull.name && pull.description && !pull.hide) {
                if (pull.type) delete pull.type;
                client.interactions.set(pull.name, pull);
            } else if (pull.hide) {
                client.logs.info(`${dir}: hidden interaction.`);
            } else if (!pull.type) {
                client.logs.error(`${dir}: error on the name of the interaction.`);
            }
        });

        const files = fs.readdirSync(`${process.cwd()}/events`).filter((file) => file.endsWith(".js"));
        for (const file of files) {
            const path = `${process.cwd()}/events/${file}`;
            const event = require(path);
            const eventName = file.split(".")[0];
            client.on(eventName, event.bind(null, client));
            delete require.cache[require.resolve(path)];
        }

    } catch (e) {
        client.logs.error(String(e.stack));
    }
}