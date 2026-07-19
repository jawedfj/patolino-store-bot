const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { JsonDatabase } = require("wio.db");

const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const emojiFiles = {
    carrinho: "carrinho.png",
    suporte: "suporte.png",
    users: "users.png",
    config: "config.png",
    cor: "cor.png",
    saco_dinheiro: "saco-dinheiro.png",
    banco: "banco.png",
    cadeado: "cadeado.png",
    mensagem: "mensagem.png",
    voltar: "voltar.png"
};

function formatEmoji(emoji) {
    return {
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated
    };
}

async function customEmoji(client, interaction, name, fallback) {
    const id = dbe.get(name);
    const cachedEmoji = id ? client.emojis?.cache.get(id) || interaction.guild?.emojis.cache.get(id) : null;

    if (cachedEmoji) {
        return formatEmoji(cachedEmoji);
    }

    const guildEmoji = interaction.guild?.emojis.cache.find((emoji) => emoji.name === name);
    if (guildEmoji) {
        dbe.set(name, guildEmoji.id);
        return formatEmoji(guildEmoji);
    }

    const botMember = interaction.guild?.members.me;
    const canCreateEmoji = botMember?.permissions.has(PermissionFlagsBits.ManageGuildExpressions);
    const fileName = emojiFiles[name];
    const filePath = fileName ? path.join(process.cwd(), "emojis", fileName) : null;

    if (canCreateEmoji && filePath && fs.existsSync(filePath)) {
        try {
            const createdEmoji = await interaction.guild.emojis.create({
                attachment: filePath,
                name
            });
            dbe.set(name, createdEmoji.id);
            return formatEmoji(createdEmoji);
        } catch (error) {
            console.warn(`[EMOJI] Nao foi possivel criar o emoji ${name}: ${error.message}`);
        }
    }

    return fallback;
}

async function StartAll(client, interaction) {
    const banner = new EmbedBuilder()
        .setColor(dbConfigs.get("color") || "#2B2D31")
        .setDescription("Selecione uma das opções abaixo para configurar o seu bot!");

    const components = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configVendas")
            .setLabel("Vendas")
            .setEmoji(await customEmoji(client, interaction, "carrinho", "🛒"))
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configticket")
            .setLabel("Ticket")
            .setEmoji(await customEmoji(client, interaction, "suporte", "🎫"))
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configBemvindo")
            .setLabel("Boas vindas")
            .setEmoji(await customEmoji(client, interaction, "users", "👋"))
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configAutomaticas")
            .setLabel("Ações Automáticas")
            .setEmoji(await customEmoji(client, interaction, "config", "⚙️"))
            .setStyle(2)
    );

    const components2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configbot")
            .setLabel("Personalização")
            .setEmoji(await customEmoji(client, interaction, "cor", "🎨"))
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("rendimentosBot")
            .setLabel("Rendimentos")
            .setEmoji(await customEmoji(client, interaction, "saco_dinheiro", "💰"))
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("e-salesPainel")
            .setLabel("e-Sales")
            .setEmoji(await customEmoji(client, interaction, "banco", "🏦"))
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId("configModeracao")
            .setLabel("Moderação")
            .setEmoji(await customEmoji(client, interaction, "cadeado", "🛡️"))
            .setStyle(4)
    );

    const payload = {
        components: [components, components2],
        files: [],
        embeds: [banner]
    };

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        await interaction.update(payload);
    } else {
        await interaction.editReply(payload);
    }
}

async function botConfigTickets(client, interaction) {
    await interaction.update({
        files: [],
        embeds: [
            new EmbedBuilder()
                .setTitle("Configuração Sistemas Automáticos")
                .setDescription("Selecione um dos botões abaixo para configurar o seu bot!")
                .setColor(dbConfigs.get("color") || "Default")
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId("configticket")
                    .setLabel("Configurar Ticket")
                    .setEmoji(await customEmoji(client, interaction, "suporte", "🎫")),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId("configsugestsistem")
                    .setLabel("Configurar Sistema Sugestão")
                    .setEmoji(await customEmoji(client, interaction, "mensagem", "💬"))
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("voltarconfiginicio")
                    .setEmoji(await customEmoji(client, interaction, "voltar", "↩️"))
                    .setStyle(1)
            )
        ]
    });
}

module.exports = {
    botConfigTickets,
    StartAll
};
