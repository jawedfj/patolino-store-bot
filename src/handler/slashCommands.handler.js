const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v10');
const fs = require("fs");
const config = require("../../config");

module.exports = (client) => {
    client.handleCommands = async (path) => {
        client.commandArray = [];
        const commandFolders = fs.readdirSync(path);
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../slashCommands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            };
        };
    };

    const registerCommands = async (guild = null) => {
        const rest = new REST({
            version: `10`
        }).setToken(config.token);

        if (guild) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id), {
                body: client.commandArray
            });
            console.log(`[SLASH] ${client.commandArray.length} comandos registrados no servidor: ${guild.name}`);
            return;
        }

        await rest.put(
            Routes.applicationCommands(client.user.id), {
            body: []
        });
        console.log("[SLASH] Comandos globais limpos para evitar duplicacao no /.");

        for (const guild of client.guilds.cache.values()) {
            await registerCommands(guild);
        }

        console.log(`[SLASH] Link de convite com slash commands: https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);
    };

    client.on("ready", async (r) => {
        try {
            await registerCommands();
        } catch (err) {
            console.log(err);
        };
    });

    client.on("guildCreate", async (guild) => {
        try {
            await registerCommands(guild);
        } catch (err) {
            console.log(err);
        };
    });
};
