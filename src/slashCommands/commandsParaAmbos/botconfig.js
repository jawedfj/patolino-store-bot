const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, ActivityType, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const { StartAll } = require("../../../Functions/botconfig-runfunction");
const { JsonDatabase } = require("wio.db");
const { getCache, checkOwner } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botconfig")
        .setDescription("[🔧] Gerencie as configurações do BOT!"),

    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const type = getCache(null, 'type');
            const dono = getCache(null, "owner");

            const isVendas = (await dbPerms.get('vendas'))?.includes(interaction.user.id);
            const isTicket = (await dbPerms.get('ticket'))?.includes(interaction.user.id);
            const isOwner = checkOwner(interaction.user.id);

            if (!isVendas && !isTicket && !isOwner) {
                return await interaction.editReply({
                    content: `❌ | Você não tem permissão para usar este comando.`,
                });
            }

            await StartAll(client, interaction);

        } catch (error) {
            console.error("Erro no comando /botconfig:", error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: `❌ | Ocorreu um erro ao executar o comando.`
                });
            } else {
                await interaction.reply({
                    content: `❌ | Ocorreu um erro ao executar o comando.`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
