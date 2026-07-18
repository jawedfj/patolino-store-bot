const { ApplicationCommandType, ButtonBuilder, ActionRowBuilder, EmbedBuilder, MessageFlagsBitField } = require("discord.js");
const { General, BList, Tickesettings } = require("../../Database/index");
const startTime = Date.now();

function timing() {
    const horabrasil = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(horabrasil).getHours();

    if (hora >= 0 && hora < 6) {
        return 'Boa madrugada';
    } else if (hora < 12) {
        return 'Bom dia';
    } else if (hora < 18) {
        return 'Boa tarde';
    } else {
        return 'Boa noite';
    }
}

module.exports = {
    name: "config",
    description: "[OWNER] Gerenciar aplicação",
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!General.get('owner').includes(interaction.user.id) && !interaction.member.roles.cache.has(General.get("Config.Roles.admin"))) {
            interaction.reply({
                content: `Espere! Você não tem permissão para usar este comando`, flags: MessageFlagsBitField.Flags.Ephemeral
            });
            return;
        }

        interaction.reply({
            content: ``,
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: "https://cdn.discordapp.com/emojis/1265111276237881454.webp?size=96&quality=lossless" })
                    // Descrição atualizada conforme solicitado
                    .setDescription(`${timing()}, Sr(a) **${interaction.user.username}**.`)
                    // Banner adicionado
                    .setImage("https://bot-247--lucasademar1502.replit.app/banner.png")
                    .addFields(
                        { name: "**Ping**", value: `\`${client.ws.ping} ms\``, inline: true },
                        { name: `**Tempo de Execução**`, value: `<t:${Math.ceil(startTime / 1000)}:R>`, inline: true }
                    )
                    .setColor(General.get("System.Colors.main"))
                    .setFooter({ text: `${interaction.guild.name}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp()
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('GerenciarLoja')
                            .setLabel('Loja')
                            .setEmoji('1319043599521812480')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('GerenciarTickets')
                            .setLabel('Painel de Atendimentos')
                            .setEmoji('1319043579179696271')
                            .setStyle(2)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('PersonalizaAPP')
                            .setLabel('Personalização')
                            .setEmoji('1319043534547976242')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('GerenciarDefinicoes')
                            .setLabel('Configurações')
                            .setEmoji('1319043594941759579')
                            .setStyle(2)
                    )
            ],
            flags: MessageFlagsBitField.Flags.Ephemeral
        });
    }
};                