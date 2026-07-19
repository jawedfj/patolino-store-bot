const { readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");

module.exports = (client) => {
    const registerEvent = (filePath) => {
        const event = require(filePath);

        if (!event || typeof event.name !== "string" || typeof event.execute !== "function") {
            return;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    };

    const loadEvents = (dir, recursive = false) => {
        const files = readdirSync(dir);
        for (const file of files) {
            const filePath = join(dir, file);
            const stats = statSync(filePath);

            if (stats.isDirectory() && recursive) {
                loadEvents(filePath, recursive);
                continue;
            }

            if (stats.isFile() && file.endsWith(".js")) {
                registerEvent(filePath);
            };
        };
    };

    loadEvents(join(__dirname, "../events/client"));
    loadEvents(join(__dirname, "../events/eventsFunctions"));
};
