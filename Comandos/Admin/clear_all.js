const { ApplicationCommandType, MessageFlagsBitField } = require("discord.js");
const { General } = require("../../Database/index");

async function clear(channel) {
    try {
        let fetched;
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        do {
            fetched = await channel.messages.fetch({ limit: 100 });
            if (!fetched.size) break;

            const deletable = fetched.filter(msg => Date.now() - msg.createdTimestamp < fourteenDays);
            if (deletable.size > 0) {
                await channel.bulkDelete(deletable, true);
            }

            const oldMessages = fetched.filter(msg => Date.now() - msg.createdTimestamp >= fourteenDays);
            for (const msg of oldMessages.values()) {
                try {
                    await msg.delete();
                } catch (err) {
                    console.error("Erro ao deletar mensagem antiga:", err);
                }
            }
        } while (fetched.size >= 100);


    } catch (error) {
        console.error("Erro ao limpar o chat:", error);
        await interaction.editReply("Ocorreu um erro ao limpar o chat.");
    }
}

module.exports = {
    name: "clear_all",
    description: "[ADM] Limpar todo o chat",
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!General.get('owner').includes(interaction.user.id) && !interaction.member.roles.cache.has(General.get("Config.Roles.admin"))) {
            interaction.reply({
                content: `Espere! Você não tem permissão para usar este comando`,flags: MessageFlagsBitField.Flags.Ephemeral
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

        const channel = interaction.channel;
        

        await clear(channel);

        await interaction.editReply("Chat limpo com sucesso!");
    }
};
