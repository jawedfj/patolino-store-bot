const { MessageFlags } = require("discord.js");
const { JsonDatabase, } = require("wio.db");
const { getCache, checkOwner } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                interaction.channel.send({ content: `Nenhum comando correspondente a **${interaction.commandName}** foi encontrado.` }).then(() => {
                    setTimeout((msg) => {
                        msg.delete().catch(error => { })
                    }, 5000);
                }).catch(error => { })
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(`Erro ao executar comando /${interaction.commandName}:`, err.message);
                if (!interaction.replied && !interaction.deferred) {
                    interaction.reply({ content: "❌ | Ocorreu um erro ao executar este comando.", flags: MessageFlags.Ephemeral }).catch(() => {});
                }
            }

        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }
            try {
                await command.autocomplete(interaction);
            } catch (err) {
                console.error(err);
                return;
            }
        }
    },
}