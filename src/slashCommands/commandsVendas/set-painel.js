const {
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache, checkOwner } = require("../../../Functions/connect_api");

const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-painel-venda")
        .setDescription("Sete a mensagem de compra de um painel com select menu!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Painel")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
        let dono = getCache(null, "owner");

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = checkOwner(interaction.user.id);

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value }))
            );
            return;
        }

        for (const panel of dbPanels.all()) {
            choices.push({
                name: `ID: ${panel.ID} | Produtos: ${Object.keys(panel.data.products).length}`,
                value: panel.ID,
            });
        }

        choices.sort((a, b) => a.value - b.value);
        const searchId = interaction.options.getString("id").toLowerCase();

        if (searchId) {
            const filteredChoices = choices.filter(choice =>
                choice.value.toLowerCase().startsWith(searchId)
            );
            await interaction.respond(
                filteredChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        } else {
            const limitedChoices = choices.slice(0, 25);
            await interaction.respond(
                limitedChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        }
    },

    async execute(interaction, client) {
        let dono = getCache(null, "owner");

        const choices = [];
        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = checkOwner(interaction.user.id);

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value }))
            );
            return;
        }

        const idPanel = interaction.options.getString("id");

        if (!dbPanels.has(idPanel)) {
            await interaction.reply({
                content: `❌ | ID do painel: **${idPanel}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        try {
            const titleP = await dbPanels.get(`${idPanel}.embed.title`) || "Título não configurado";
            const descriptionP = await dbPanels.get(`${idPanel}.embed.description`) || "Descrição não configurada";
            const colorP = await dbPanels.get(`${idPanel}.embed.color`);
            const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`);
            const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`);
            const footerP = await dbPanels.get(`${idPanel}.embed.footer`);

            const umEmoji = `<:um:${dbe.get('um') || "0"}>`;
            const doisEmoji = `<:dois:${dbe.get('dois') || "0"}>`;
            const tresEmoji = `<:tres:${dbe.get('tres') || "0"}>`;
            const quatroEmoji = `<:quatro:${dbe.get('quatro') || "0"}>`;
            const cincoEmoji = `<:cinco:${dbe.get('cinco') || "0"}>`;
            const seisEmoji = `<:seis:${dbe.get('seis') || "0"}>`;
            const seteEmoji = `<:sete:${dbe.get('sete') || "0"}>`;
            const oitoEmoji = `<:oito:${dbe.get('oito') || "0"}>`;

            const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`) || "Selecione um produto";

            let allOptions = [];
            let totalProducts = 0;

            const allPanels = dbPanels.all().filter((panel) => panel.ID == idPanel);

            if (allPanels.length === 0) {
                await interaction.reply({
                    content: `❌ | Painel com ID **${idPanel}** não encontrado após filtragem.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await Promise.all(
                allPanels.map(async (panel) => {
                    if (!panel.data || !panel.data.products) {
                        console.warn(`Painel ${panel.ID} não possui estrutura de dados válida.`);
                        return;
                    }

                    const productIds = Object.keys(panel.data.products || {});
                    totalProducts = productIds.length;

                    for (const pId of productIds) {
                        try {
                            if (!await dbProducts.has(pId)) {
                                allOptions.push({
                                    label: `Produto ${pId}`,
                                    emoji: "⚠️",
                                    description: "Produto não encontrado no banco de dados",
                                    value: pId
                                });
                                continue;
                            }

                            const nameP = await dbProducts.get(`${pId}.name`) || "Produto sem nome";
                            const priceP = await dbProducts.get(`${pId}.price`) || "0.00";
                            const estoqueP = await dbProducts.get(`${pId}.stock`) || [];
                            const emojiP = await dbPanels.get(`${idPanel}.products.${pId}.emoji`) || "🛒";

                            allOptions.push({
                                label: nameP.substring(0, 100),
                                emoji: emojiP,
                                description: `💸 Valor: ${Number(priceP).toLocaleString(global.lenguage?.um || 'pt-BR', { style: 'currency', currency: global.lenguage?.dois || 'BRL' })} | 📦 Estoque: ${estoqueP.length}`,
                                value: pId
                            });
                        } catch (productError) {
                            console.error(`Erro ao processar o produto ${pId}:`, productError);
                            allOptions.push({
                                label: `Produto ${pId} (Erro)`,
                                emoji: "⚠️",
                                description: "Erro ao carregar detalhes do produto",
                                value: pId
                            });
                        }
                    }
                })
            );

            if (totalProducts < 1) {
                await interaction.reply({
                    content: `❌ | Este painel ainda não possui produtos. Por favor, adicione produtos e tente novamente!`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (allOptions.length > 25) {
                allOptions = allOptions.slice(0, 25);
            }

            if (allOptions.length === 0) {
                await interaction.reply({
                    content: `❌ | Não foi possível carregar nenhum produto válido para este painel.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const rowPanel = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(idPanel)
                    .setPlaceholder(placeholderP)
                    .addOptions(allOptions)
            );

            const emojiString = `${umEmoji}${doisEmoji}${tresEmoji}${quatroEmoji}${cincoEmoji}${seisEmoji}${seteEmoji}${oitoEmoji}`;

            const embedPanel = new EmbedBuilder()
                .setAuthor({ name: titleP })
                .setDescription(`${emojiString}\n\n${descriptionP}`)
                .setColor(colorP !== "none" ? colorP : "#460580")
                .setFooter({ text: footerP !== "none" ? footerP : " " });

            if (thumbP && thumbP !== "none" && thumbP !== "https://sem-img.com") {
                embedPanel.setThumbnail(thumbP);
            }

            if (bannerP && bannerP !== "none" && bannerP !== "https://sem-img.com") {
                embedPanel.setImage(bannerP);
            }

            const msg = await interaction.channel.send({
                embeds: [embedPanel],
                components: [rowPanel]
            });

            await dbPanels.set(`${idPanel}.msgLocalization.channelId`, interaction.channel.id);
            await dbPanels.set(`${idPanel}.msgLocalization.messageId`, msg.id);

            await interaction.reply({
                content: `✅ | Painel setado com sucesso no canal: ${interaction.channel}.`,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(`Erro ao configurar o painel ${idPanel}:`, error);
            await interaction.reply({
                content: `❌ | Ocorreu um erro ao configurar o painel`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};