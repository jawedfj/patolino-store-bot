const { ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ChannelType, MessageFlagsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, StringSelectMenuBuilder } = require("discord.js");
const { PaymentSetup, LojaSetup, plansSetup } = require("../../Functions/telas")
const { createID, downloadFile, notifyStock } = require("../../Functions/utils")
const { PlanConfig } = require("../../Functions/plans")
const { ProductSetup, VariantSetup, CouponSetup, CreateAnnounce, estoqueSetup, UpdateAnnounce, UpdateStock } = require("../../Functions/products_setup")
const { General, Produtos, Planos } = require("../../Database/index")
const moment = require('moment-timezone');
const fs = require('fs');


module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {

        const ButtonAction = interaction.isButton();
        const ModalAction = interaction.isModalSubmit();
        const ChannelSelectAction = interaction.isChannelSelectMenu();
        const SelectAction = interaction.isStringSelectMenu();
        const RoleSelectAction = interaction.isRoleSelectMenu();

        if (ButtonAction) {
            const [CustomId, productID, VarianteID] = interaction.customId.split('_');

            switch (CustomId) {
                case "sendAnnounceproduct": {
                    const data = await Produtos.get(`Products.${productID}`);
                    const Variantes = Object.keys(data.sub_products)

                    if (Variantes.length < 1) {
                        console.error("É necessário ao menos uma variante para anunciar o produto.");
                        return interaction.reply({ content: `É necessário ao menos uma variante para anunciar o produto.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`setChannelAnnounce_${productID}`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            )
                    ];

                    await interaction.reply({
                        content: `Selecione o canal para enviar o anúncio.`,
                        embeds: [],
                        components: components,
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });
                    break;
                }
                case "estoqueSubproduct": {
                    if (!General.get('owner').includes(interaction.user.id) && !interaction.member.roles.cache.has(General.get("Config.Roles.admin"))) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para isso.`, flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    await estoqueSetup(productID, VarianteID, interaction, client)
                    break;
                }
                case "deleteestoqueSubproduct": {
                    const stockCount = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}.stock`, []);

                    if (stockCount.length === 0) {
                        await interaction.reply({
                            content: `O estoque da variante já esta vazio.`,
                            embeds: [],
                            components: [],
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        })
                    }

                    await interaction.update({
                        content: `⚠️ Tem certeza? Esta ação irá deletar todo seu estoque `,
                        embeds: [],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`confirmdeleteStock_${productID}_${VarianteID}`)
                                    .setLabel(`Confirmar`)
                                    .setEmoji('1251441846601912452')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId(`VoltarVariant_${productID}_${VarianteID}`)
                                    .setLabel('Voltar')
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                        ],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    })
                    break;
                }
                case "confirmdeleteStock": {
                    await Produtos.set(`Products.${productID}.sub_products.${VarianteID}.stock`, []);
                    await VariantSetup(client, interaction, productID, VarianteID);
                    break;
                }
                case "clearRoleSubProduct": {
                    await Produtos.set(`Products.${productID}.sub_products.${VarianteID}.role`, '');
                    await VariantSetup(client, interaction, productID, VarianteID);
                    break;
                }
                case "createProduct": {

                    const modal = new ModalBuilder()
                        .setCustomId('ModalCreateproduct')
                        .setTitle('Criar Produto')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ProductTitle')
                            .setLabel('Titulo do Produto')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(64)
                            .setMinLength(3)
                            .setRequired(true)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ProductDesc')
                            .setLabel('Descrição do Produto')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ProductBanner')
                            .setLabel('Banner de exibição')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira uma URL válida da sua imagem..')
                            .setRequired(false)
                    )
                    const input4 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ProductIcon')
                            .setLabel('Miniatura de exibição')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira uma URL válida  da sua imagem..')
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2, input3, input4)
                    await interaction.showModal(modal);
                    break;
                }
                case "manageProduct": {
                    const Products = await Produtos.get(`Products`) || {};

                    if (Object.keys(Products).length === 0) {
                        return interaction.reply({ content: `Não existem produtos para configurar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    if (Object.keys(Products).length === 1) {
                        return await ProductSetup(client, interaction, Object.keys(Products)[0]);
                    }

                    const productEntries = Object.values(Products);
                    const menus = [];

                    for (let i = 0; i < productEntries.length; i += 25) {
                        const productBatch = productEntries.slice(i, i + 25);
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`manageProductSelect_${i / 25}`)
                            .setPlaceholder(`Selecione um Produto [${i + 1}-${Math.min(i + 25, productEntries.length)}]`)
                            .setMaxValues(1);

                        productBatch.forEach(prod => {

                            selectMenu.addOptions({
                                label: prod.title?.substring(0, 100) || "Sem título",
                                description: `Variantes: ${Object.keys(prod.sub_products).length}` || "Sem descrição",
                                value: prod.id_product.toString(),
                                emoji: '1342771110625808465'
                            });
                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId(`voltarLojaSetup`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione um **produto** para editar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });

                    break;
                }
                case "deleteProduct": {

                    const Products = await Produtos.get(`Products`) || {};

                    if (Object.keys(Products).length === 0) {
                        return interaction.reply({ content: `Não existem produtos para deletar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const productEntries = Object.values(Products);
                    const menus = [];

                    for (let i = 0; i < productEntries.length; i += 25) {
                        const productBatch = productEntries.slice(i, i + 25);
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`deleteProductSelect`)
                            .setPlaceholder(`Selecione um Produto [${i + 1}-${Math.min(i + 25, productEntries.length)}]`)
                            .setMaxValues(productBatch.length);

                        productBatch.forEach(prod => {

                            selectMenu.addOptions({
                                label: prod.title?.substring(0, 100) || "Sem título",
                                description: `Variantes: ${Object.keys(prod.sub_products).length}` || "Sem descrição",
                                value: prod.id_product.toString(),
                                emoji: '1344203167700750418'
                            });

                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId(`voltarLojaSetup`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione o produto para deletar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });

                    break;
                }
                case "customProduct": {
                    const data = await Produtos.get(`Products.${productID}`)

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalEditproduct_${productID}`)
                        .setTitle('Editar Produto')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditProductTitle')
                            .setLabel('Titulo do Produto')
                            .setStyle(TextInputStyle.Short)
                            .setValue(data.title)
                            .setMaxLength(64)
                            .setMinLength(3)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditProductDesc')
                            .setLabel('Descrição do Produto')
                            .setValue(data.description)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditProductBanner')
                            .setLabel('Banner de exibição')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira uma URL válida da sua imagem..')
                            .setRequired(false)
                    )
                    const input4 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditProductIcon')
                            .setLabel('Miniatura de exibição')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira uma URL válida  da sua imagem..')
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2, input3, input4)
                    await interaction.showModal(modal);
                    break;
                }
                case "createSubproduct": {

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalCreateSubproduct_${productID}`)
                        .setTitle('Criar Variante')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('SubProductTitle')
                            .setLabel('Titulo da Variante')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(64)
                            .setMinLength(3)
                            .setRequired(true)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('SubProductPrice')
                            .setLabel('Valor da Variante')
                            .setPlaceholder('Ex: 2,90 - 1.500,90')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('SubProductEmoji')
                            .setLabel('Emoji da Variante (Opcional)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira um emoji válido')
                            .setRequired(false)
                    )
                    modal.addComponents(input1, input2, input3)
                    await interaction.showModal(modal);
                    break;
                }
                case "manageSubproduct": {
                    const Products = await Produtos.get(`Products.${productID}.sub_products`) || {};

                    if (Object.keys(Products).length === 0) {
                        return interaction.reply({ content: `Não existem variantes para configurar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    if (Object.keys(Products).length === 1) {
                        return await VariantSetup(client, interaction, productID, Object.keys(Products)[0]);
                    }

                    const productEntries = Object.values(Products);
                    const menus = [];

                    const formattedPrice = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    })

                    for (let i = 0; i < productEntries.length; i += 25) {
                        const productBatch = productEntries.slice(i, i + 25);
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`manageSubProductSelect_${productID}_${i / 25}`)
                            .setPlaceholder(`Selecione uma Variante [${i + 1}-${Math.min(i + 25, productEntries.length)}]`)
                            .setMaxValues(1);

                        productBatch.forEach(prod => {

                            selectMenu.addOptions({
                                label: prod.title?.substring(0, 100) || "Sem título",
                                description: `Valor: ${formattedPrice.format(Number(prod.price))} | Estoque: ${prod.stock.length}`,
                                value: prod.id.toString(),
                                emoji: '1342771110625808465'
                            });
                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId(`voltarProductSetup_${productID}`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione uma **variante** para editar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });

                    break;
                }
                case "deleteSubproduct": {
                    const Products = await Produtos.get(`Products.${productID}.sub_products`) || {};

                    if (Object.keys(Products).length === 0) {
                        return interaction.reply({ content: `Não existem variantes para deletar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const productEntries = Object.values(Products);
                    const menus = [];

                    for (let i = 0; i < productEntries.length; i += 25) {
                        const productBatch = productEntries.slice(i, i + 25);
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`deleteSubproductSelect_${productID}_${i / 25}`)
                            .setPlaceholder(`Selecione uma Variante [${i + 1}-${Math.min(i + 25, productEntries.length)}]`)
                            .setMaxValues(1);

                        productBatch.forEach(prod => {

                            selectMenu.addOptions({
                                label: prod.title?.substring(0, 100) || "Sem título",
                                description: `Valor: ${prod.price} | Estoque: ${prod.stock.length}`,
                                value: prod.id.toString(),
                                emoji: '1344203167700750418'
                            });
                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId(`voltarProductSetup_${productID}`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione uma **variante** para deletar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });

                    break;
                }
                case "backupClearStockVariant": {
                    let data = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}`);
                    const chnel = interaction.channel;
                    const fileName = `estoque-${VarianteID}.txt`;

                    fs.writeFileSync(fileName, '');

                    for (const conts of data.stock) {
                        if (conts !== '') {
                            fs.appendFileSync(fileName, conts + '\n', 'utf-8');
                        }
                    }

                    const fileBuffer = fs.readFileSync(fileName);
                    const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

                    await ProductSetup(client, interaction, productID);
                    chnel.send({
                        content: `Backup da variante **${data.title}**`,
                        files: [attachment]
                    });
                    Produtos.delete(`Products.${productID}.sub_products.${VarianteID}`);
                    fs.unlinkSync(fileName);
                    break;
                }
                case "nextDeleteVariant": {
                    Produtos.delete(`Products.${productID}.sub_products.${VarianteID}`);

                    await ProductSetup(client, interaction, productID);
                    break;
                }
                case "downloadStock": {
                    let data = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}`);

                    const fileName = `estoque-${VarianteID}.txt`;
                    fs.writeFileSync(fileName, '');

                    for (const conts of data.stock) {
                        if (conts !== '') {
                            fs.appendFileSync(fileName, conts + '\n', 'utf-8');
                        }
                    }

                    const fileBuffer = fs.readFileSync(fileName);
                    const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

                    interaction.reply({
                        content: `Backup da variante **${data.title}**`,
                        files: [attachment],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });
                    fs.unlinkSync(fileName);
                    break;
                }
                case "createCoupon": {

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalCreateCoupon_${productID}`)
                        .setTitle('Criar Cupom')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('couponName')
                            .setLabel('Nome do Cupom')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(24)
                            .setMinLength(3)
                            .setRequired(true)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('couponPercent')
                            .setLabel('Porcentagem de Desconto')
                            .setPlaceholder('Insira somente números')
                            .setMaxLength(3)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('couponRole')
                            .setLabel('Cargo Necessário (Opcional)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira o id do cargo')
                            .setRequired(false)
                    )
                    const input4 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('couponMaxuse')
                            .setLabel('Quantidade de usos Total (Opcional)')
                            .setPlaceholder('Defina quantas vezes o cupom pode ser utilizado')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                    const input5 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('couponMinOrder')
                            .setLabel('Pedido Minímo (Opcional)')
                            .setPlaceholder('Defina em quantidade de produto e não valor')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2, input3, input4, input5)
                    await interaction.showModal(modal);
                    break;
                }
                case "deleteCoupon": {
                    const Coupons = await Produtos.get(`Products.${productID}.coupons`) || [];

                    if (Coupons.length === 0) {
                        return interaction.reply({ content: `Não existem cupons para deletar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const menus = [];

                    for (let i = 0; i < Coupons.length; i += 25) {
                        const couponBatch = Coupons.slice(i, i + 25);

                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`deleteCouponSelect_${productID}`)
                            .setPlaceholder(`Selecione um Cupom para deletar [${i + 1}-${Math.min(i + 25, Coupons.length)}]`)
                            .setMaxValues(Coupons.length);

                        couponBatch.forEach(coupon => {
                            selectMenu.addOptions({
                                label: `${coupon.name} - ${coupon.percent} %`,
                                description: `Usos: ${coupon.uses}/${coupon.maxuses || '∞'} | Pedido Minimo: ${coupon.MinOrder} unidade(s)`,
                                value: coupon.id.toString(),
                                emoji: '1251441496104636496'
                            });
                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId(`voltarCouponSetup_${productID}`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione um **cupom** para deletar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });
                    break;
                }
                case "addestoqueLine": {
                    const modal = new ModalBuilder()
                        .setCustomId(`stockLinemodal_${productID}_${VarianteID}`)
                        .setTitle("Adicionar Estoque");

                    const text = new TextInputBuilder()
                        .setCustomId("inputLineStock")
                        .setLabel("Adicione um produto por linha")
                        .setStyle(2)
                        .setMaxLength(4000)
                        .setPlaceholder("Ex: Produto1 \nProduto2 \nProduto3")
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(text));

                    await interaction.showModal(modal);
                    break;
                }
                case "estoquefantasma": {
                    const modal = new ModalBuilder()
                        .setCustomId(`modalGhostStock_${productID}_${VarianteID}`)
                        .setTitle(`Adicionar estoque fantasma`);

                    const quantyInput = new TextInputBuilder()
                        .setCustomId('QtyStockGhostInput')
                        .setLabel(`Quantidade`)
                        .setPlaceholder(`Insira aqui a quantidade que deseja adicionar`)
                        .setStyle(1)
                        .setRequired(true)

                    const productInput = new TextInputBuilder()
                        .setCustomId('StockGhostInput')
                        .setLabel(`Produto Fantasma`)
                        .setPlaceholder(`Ex: Abra ticket para resgatar\nCaso não definido, será enviado o default.`)
                        .setStyle(2)
                        .setRequired(false)

                    const Row1 = new ActionRowBuilder().addComponents(quantyInput);
                    const Row2 = new ActionRowBuilder().addComponents(productInput);

                    modal.addComponents(Row1, Row2);
                    await interaction.showModal(modal);
                    break;
                }
                case "estoqueArquivo": {
                    const userid = interaction.user.id
                    interaction.reply({
                        content: `Envie o arquivo txt contendo os produtos em até 1 minuto.`,
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`${userid}_cancelled`)
                                        .setLabel("Cancelar")
                                        .setStyle(2)
                                )
                        ],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });

                    const filterArquivo = (msg) => msg.author.id === interaction.user.id && msg.attachments.size > 0 && msg.attachments.first().name.endsWith(".txt");
                    const collectorArquivo = interaction.channel.createMessageCollector({ filter: filterArquivo, time: 60000 });

                    collectorArquivo.on("collect", async (mensagem) => {
                        const attachment = mensagem.attachments.first();
                        const fileContent = await downloadFile(attachment.url);
                        mensagem.delete();

                        const lines = fileContent.split('\n');

                        let count = 0;
                        for (const line of lines) {
                            const produto = line.trim();
                            if (produto !== "") {
                                await Produtos.push(`Products.${productID}.sub_products.${VarianteID}.stock`, produto);
                                count++;
                            }
                        }
                        const userEspera = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}.notify`);
                        if (userEspera.length > 0) {
                            await notifyStock(count, productID, VarianteID, interaction);
                        }
                        UpdateStock(productID, client);
                        collectorArquivo.stop();
                        interaction.editReply({ content: `Foram adicionados \`${count}\` itens ao estoque.`, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                    });

                    const filterBotao = (i) => i.customId.startsWith(userid) && i.customId.endsWith("_cancelled") && i.user.id === interaction.user.id;
                    const collectorBotao = interaction.channel.createMessageComponentCollector({ filter: filterBotao, time: 60000 });

                    collectorBotao.on("collect", (i) => {
                        collectorArquivo.stop();
                        collectorBotao.stop("cancelled");
                        i.deferUpdate();
                        interaction.editReply({ content: `Cancelado com sucesso.`, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                    });

                    collectorArquivo.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply({ content: `O tempo para enviar o arquivo foi encerrado.`, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                        }
                    });
                    break;
                }
                case "updateAnnounceproduct": {
                    const data = await Produtos.get(`Products.${productID}`);
                    const Variantes = Object.keys(data.sub_products)

                    if (Variantes.length < 1) {
                        console.error("O produto precisa ter variante para postar o anúncio.");
                        return interaction.reply({ content: `O produto precisa ter variante para postar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    if (data.announce_info.length < 1) {
                        console.error("O produto não foi anunciado ou seu anúncio foi deletado, portanto não é possivel atualizar.");
                        return interaction.reply({ content: `O produto não foi anunciado ou seu anúncio foi deletado, portanto não é possivel atualizar.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    UpdateAnnounce(productID, interaction, client)
                    break;
                }
                case "customSubProduct": {

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalEditSubproduct_${productID}_${VarianteID}`)
                        .setTitle('Editar Variante')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditSubProductTitle')
                            .setLabel('Titulo da Variante')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(64)
                            .setMinLength(3)
                            .setRequired(false)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditSubProductPrice')
                            .setLabel('Valor da Variante')
                            .setPlaceholder('Ex: 2,90 - 1.500,90')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditSubProductEmoji')
                            .setLabel('Emoji da Variante (Opcional)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira um emoji válido')
                            .setRequired(false)
                    )
                    modal.addComponents(input1, input2, input3)
                    await interaction.showModal(modal);
                    break;
                }
                case "createPlans": {

                    const modal = new ModalBuilder()
                        .setCustomId('ModalcreatePlans')
                        .setTitle('Criar Plano')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('PlanTitleInput')
                            .setLabel('Titulo')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(64)
                            .setMinLength(3)
                            .setRequired(true)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('descPlanInput')
                            .setLabel('Descrição do Plano')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )

                    modal.addComponents(input1, input2)
                    await interaction.showModal(modal);
                    break;
                }
                case "managePlans": {
                    const plans = await Planos.get(`plans`) || {};

                    if (Object.keys(plans).length === 0) {
                        return interaction.reply({ content: `Não existem planos para configurar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const plansEntries = Object.values(plans);
                    const menus = [];

                    for (let i = 0; i < plansEntries.length; i += 25) {
                        const plansBatch = plansEntries.slice(i, i + 25);
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`managePlanSelect_${i / 25}`)
                            .setPlaceholder(`Selecione um Plano [${i + 1}-${Math.min(i + 25, plansEntries.length)}]`)
                            .setMaxValues(1);

                        plansBatch.forEach(plan => {

                            selectMenu.addOptions({
                                label: plan.title.substring(0, 100) || "Sem título",
                                description: `Assinante Ativos: ${plan.subscribers_total}`,
                                value: plan.id_plan.toString(),
                                emoji: '1273127418386976788'
                            });
                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId("voltarplansSetup")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione um **plano** para editar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });
                    break;
                }
                case "customPlan": {
                    const data = await Planos.get(`plans.${productID}`);

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalEditplan_${productID}`)
                        .setTitle('Editar Plano')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditPlanTitle')
                            .setLabel('Titulo')
                            .setStyle(TextInputStyle.Short)
                            .setValue(data.title)
                            .setMaxLength(64)
                            .setMinLength(3)
                            .setRequired(false)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('EditPlanDesc')
                            .setLabel('Descrição do Plano')
                            .setValue(data.description)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2)
                    await interaction.showModal(modal);
                    break;
                }
                case "deletePlans": {
                    const plans = await Planos.get(`plans`) || {};

                    if (Object.keys(plans).length === 0) {
                        return interaction.reply({ content: `Não existem planos para deletar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const plansEntries = Object.values(plans);
                    const menus = [];

                    for (let i = 0; i < plansEntries.length; i += 25) {
                        const plansBatch = plansEntries.slice(i, i + 25);
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`deletePlanSelect_${i / 25}`)
                            .setPlaceholder(`Selecione um Plano [${i + 1}-${Math.min(i + 25, plansEntries.length)}]`)
                            .setMaxValues(1);

                        plansBatch.forEach(plan => {

                            selectMenu.addOptions({
                                label: plan.title.substring(0, 100) || "Sem título",
                                description: `Assinante Ativos: ${plan.subscribers_total}`,
                                value: plan.id_plan.toString(),
                                emoji: '1251441411266711573'
                            });
                        });

                        menus.push(new ActionRowBuilder().addComponents(selectMenu));
                    }

                    const button = new ButtonBuilder()
                        .setCustomId("voltarplansSetup")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')

                    const rowButton = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${interaction.user}, selecione um **plano** para deletar.`,
                        embeds: [],
                        components: [...menus, rowButton]
                    });
                    break;
                }
                case "createkeyPlan": {
                    const modal = new ModalBuilder()
                        .setCustomId(`ModalcreatekeyPlan_${productID}`)
                        .setTitle('Gerar Keys de Resgate')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('quantyKeyInput')
                            .setLabel('Quantidade Keys')
                            .setPlaceholder('Ex: 19')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('timeSubscriber')
                            .setLabel('Tempo de Assinatura')
                            .setPlaceholder('Defina o tempo em dias com numeros inteiros, Ex: 5')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('prefixKeycreate')
                            .setLabel('Prefixo de Key (Opcional)')
                            .setPlaceholder('Ex: loja-156a5-6a5s6-4f566-9653')
                            .setMaxLength(5)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2, input3)
                    await interaction.showModal(modal);
                    break;
                }
                case "deletekeyPlan": {
                    const plans = await Planos.get(`plans.${productID}.keys`) || {};

                    if (Object.keys(plans).length === 0) {
                        return interaction.reply({ content: `Não existem keys para deletar.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const button1 = new ButtonBuilder()
                        .setCustomId(`confirDeleteKeys_${productID}`)
                        .setLabel("Confirmar")
                        .setStyle(3)
                    const button2 = new ButtonBuilder()
                        .setCustomId(`voltarplanConfig_${productID}`)
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')

                    const rowButton = new ActionRowBuilder().addComponents(button1, button2);

                    await interaction.update({
                        content: `${interaction.user}, ⚠️ tem certeza? esta ação irá deletar todas keys restantes do plano, voce poderá criar mais.`,
                        embeds: [],
                        components: [rowButton]
                    });
                    break;
                }
                case "confirDeleteKeys": {
                    await Planos.set(`plans.${productID}.keys`, []);

                    await PlanConfig(client, interaction, productID);
                    break;
                }
                case "tutorialPlan": {
                    const modal = new ModalBuilder()
                        .setCustomId(`ModaltutorialPlan_${productID}`)
                        .setTitle('Definir Tutoriais')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('TutorialLinkInput')
                            .setLabel('Tutorial em Video (URL)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('TutorialTextInput')
                            .setLabel('Tutorial em Texto')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2)
                    await interaction.showModal(modal);
                    break;
                }
                case "giftPlan": {
                    const modal = new ModalBuilder()
                        .setCustomId(`giftLinemodal_${productID}_${VarianteID}`)
                        .setTitle("Adicionar Brindes");

                    const text = new TextInputBuilder()
                        .setCustomId("inputLinegift")
                        .setLabel("Adicione um brinde por linha")
                        .setStyle(2)
                        .setMaxLength(4000)
                        .setPlaceholder("Ex: brinde1 \nbrinde2 \nbrinde3")
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(text));

                    await interaction.showModal(modal);
                    break;
                }
            }
        }
        if (ModalAction) {
            const [CustomId, productID, VarianteID] = interaction.customId.split('_');
            switch (CustomId) {
                case 'giftLinemodal': {
                    const content = interaction.fields.getTextInputValue("inputLinegift");
                    const array = content.split("\n").map(line => line.trim());

                    let asd = 0;

                    for (const unitys of array) {
                        if (unitys) {
                            asd++;
                            await Planos.push(`plans.${productID}.extra_gift`, unitys);
                        }
                    }

                    await interaction.reply({ content: `Foram adicionados \`${asd}\` brinde(s).`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    break;
                }
                case 'ModaltutorialPlan': {
                    let link = interaction.fields.getTextInputValue('TutorialLinkInput');
                    let text = interaction.fields.getTextInputValue('TutorialTextInput');
                    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;

                    const data = await Planos.get(`plans.${productID}.tutorial`);

                    let struct = {
                        message: text ? text : data.message,
                        url: (urlRegex.test(link) ? link : data.url)
                    }

                    await Planos.set(`plans.${productID}.tutorial`, struct);
                    await PlanConfig(client, interaction, productID);
                    break;
                }
                case 'ModalcreatekeyPlan': {
                    let qtd = parseInt(interaction.fields.getTextInputValue('quantyKeyInput'));
                    let timePlan = parseInt(interaction.fields.getTextInputValue('timeSubscriber'));
                    let prefixKey = interaction.fields.getTextInputValue('prefixKeycreate');

                    if (qtd > 500) {
                        return interaction.reply({ content: `O maximo por operação é de \`500\``, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    if (isNaN(qtd)) {
                        return interaction.reply({ content: `Insira apenas números para a quantidade de keys a serem geradas.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    if (isNaN(timePlan)) {
                        return interaction.reply({ content: `Insira apenas números para a quantidade de tempo da assinatura.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const data = await Planos.get(`plans.${productID}`);

                    const fileName = `keys-${productID}.txt`;
                    fs.writeFileSync(fileName, '');

                    for (let i = 0; i < qtd; i++) {
                        let key = createID();
                        const checkKey = data.keys.find(keyData => keyData.id === key);

                        if (checkKey) {
                            i--;
                            continue;
                        }

                        fs.appendFileSync(fileName, key + '\n', 'utf-8');

                        const structKey = {
                            id: `${prefixKey ? prefixKey : ''}${key}`,
                            time_assign: timePlan,
                            id_plan: productID
                        }


                        await Planos.push(`keys`, structKey);
                    }

                    const fileBuffer = fs.readFileSync(fileName);
                    const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

                    interaction.reply({
                        content: `Foram criadas \`${qtd}\` keys da assinatura **${data.title}** - de \`${timePlan} dias\` de assinatura.`,
                        files: [attachment],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });
                    fs.unlinkSync(fileName);
                    break;
                }
                case "ModalEditplan": {
                    const titlePlan = interaction.fields.getTextInputValue('EditPlanTitle');
                    const descriptionPlan = interaction.fields.getTextInputValue('EditPlanDesc');

                    const data = await Planos.get(`plans.${productID}`);

                    let Struct = {
                        id_plan: data.id_plan,
                        title: titlePlan ? titlePlan : data.title,
                        description: descriptionPlan ? descriptionPlan : data.description,
                        subscribers_total: data.subscribers_total,
                        role_plan: data.role_plan,
                        tutorial: {
                            message: data.tutorial.message,
                            url: data.tutorial.url
                        },
                        extra_gift: data.extra_gift || [],
                        keys: data.keys
                    };

                    await Planos.set(`plans.${productID}`, Struct);

                    await PlanConfig(client, interaction, productID);
                    break;
                }
                case 'ModalcreatePlans': {
                    const titlePlan = interaction.fields.getTextInputValue('PlanTitleInput');
                    const descriptionPlan = interaction.fields.getTextInputValue('descPlanInput');

                    let idPlan;

                    do {
                        idPlan = createID();
                    } while (await Planos.get(`plans.${idPlan}`));

                    let Struct = {
                        id_plan: idPlan,
                        title: titlePlan,
                        description: descriptionPlan,
                        subscribers_total: 0,
                        role_plan: '',
                        tutorial: {
                            message: '',
                            url: ''
                        },
                        extra_gift: [],
                        keys: []
                    };

                    await Planos.set(`plans.${idPlan}`, Struct);

                    await PlanConfig(client, interaction, idPlan);
                    break;
                }
                case 'ModalCreateproduct': {
                    const titleProduct = interaction.fields.getTextInputValue('ProductTitle');
                    const descriptionProduct = interaction.fields.getTextInputValue('ProductDesc');
                    const bannerProduct = interaction.fields.getTextInputValue('ProductBanner');
                    const iconProduct = interaction.fields.getTextInputValue('ProductIcon');
                    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;

                    let idProduct;

                    do {
                        idProduct = createID();
                    } while (await Produtos.get(`Products.${idProduct}`));

                    let Struct = {
                        id_product: idProduct,
                        title: titleProduct,
                        description: descriptionProduct,
                        bannerURL: urlRegex.test(bannerProduct) ? bannerProduct : '',
                        iconURL: urlRegex.test(iconProduct) ? iconProduct : '',
                        configs: { vendidos: true, embed: true },
                        coupons: [],
                        announce_info: [],
                        sub_products: {}
                    };

                    await Produtos.set(`Products.${idProduct}`, Struct);

                    await ProductSetup(client, interaction, idProduct);
                    break;
                }
                case 'ModalCreateSubproduct': {
                    const titleVariant = interaction.fields.getTextInputValue('SubProductTitle');
                    let priceVariant = interaction.fields.getTextInputValue('SubProductPrice');
                    const EmojiVariant = interaction.fields.getTextInputValue('SubProductEmoji');

                    priceVariant = priceVariant.replace(/\./g, '').replace(',', '.');
                    if (isNaN(priceVariant)) {
                        return interaction.reply({ content: `Insira apenas números para o valor da variante.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }
                    if (Number(priceVariant) < 0.01) {
                        return interaction.reply({ content: `O valor da variante deve ser maior que 0.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }
                    let idSubProduct;

                    do {
                        idSubProduct = createID();
                    } while (await Produtos.get(`Products.${productID}.sub_products.${idSubProduct}`));

                    let Struct = {
                        id: idSubProduct,
                        title: titleVariant,
                        price: Number(priceVariant).toFixed(2),
                        emoji: EmojiVariant ? EmojiVariant : '1297811409132064768',
                        role: '',
                        coupons: true,
                        notify: [],
                        info: {
                            vendas: 0,
                            vendidos: 0,
                            total: 0
                        },
                        stock: []
                    };

                    await Produtos.set(`Products.${productID}.sub_products.${idSubProduct}`, Struct);

                    await VariantSetup(client, interaction, productID, idSubProduct);
                    UpdateStock(productID, client);
                    break;
                }
                case "ModalEditproduct": {
                    const titleProduct = interaction.fields.getTextInputValue('EditProductTitle');
                    const descriptionProduct = interaction.fields.getTextInputValue('EditProductDesc');
                    const bannerProduct = interaction.fields.getTextInputValue('EditProductBanner');
                    const iconProduct = interaction.fields.getTextInputValue('EditProductIcon');
                    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;

                    const data = await Produtos.get(`Products.${productID}`);

                    let Struct = {
                        id_product: productID,
                        title: titleProduct ? titleProduct : data.title,
                        description: descriptionProduct ? descriptionProduct : data.description,
                        bannerURL: urlRegex.test(bannerProduct) ? bannerProduct : data.bannerURL,
                        iconURL: urlRegex.test(iconProduct) ? iconProduct : data.iconURL,
                        configs: {
                            vendidos: data.configs.vendidos,
                            embed: data.configs.embed
                        },
                        coupons: data.coupons,
                        announce_info: data.announce_info,
                        sub_products: data.sub_products
                    };

                    await Produtos.set(`Products.${productID}`, Struct);

                    await ProductSetup(client, interaction, productID);
                    UpdateStock(productID, client);
                    break;
                }
                case 'ModalEditSubproduct': {
                    const titleVariant = interaction.fields.getTextInputValue('EditSubProductTitle');
                    let priceVariant = interaction.fields.getTextInputValue('EditSubProductPrice');
                    const EmojiVariant = interaction.fields.getTextInputValue('EditSubProductEmoji');

                    if (priceVariant) {
                        priceVariant = priceVariant.replace(/\./g, '').replace(',', '.');
                        if (isNaN(priceVariant)) {
                            return interaction.reply({ content: `Insira apenas números para o valor da variante.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                        }
                        if (Number(priceVariant) < 0.01) {
                            return interaction.reply({ content: `O valor da variante deve ser maior que 0.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                        }
                    }

                    const data = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}`);

                    let Struct = {
                        id: data.id,
                        title: titleVariant ? titleVariant : data.title,
                        price: Number(priceVariant).toFixed(2) || Number(data.price).toFixed(2),
                        emoji: EmojiVariant ? `${EmojiVariant}` : '1297811409132064768',
                        role: data.role,
                        coupons: data.coupons,
                        notify: data.notify || [],
                        info: {
                            vendas: data.info.vendas,
                            vendidos: data.info.vendidos,
                            total: data.info.total
                        },
                        stock: data.stock
                    };

                    await Produtos.set(`Products.${productID}.sub_products.${VarianteID}`, Struct);

                    await VariantSetup(client, interaction, productID, VarianteID);
                    UpdateStock(productID, client);
                    break;
                }
                case 'ModalCreateCoupon': {
                    const nameCoupon = interaction.fields.getTextInputValue('couponName');
                    const percentCoupon = interaction.fields.getTextInputValue('couponPercent');
                    const RoleCoupon = interaction.fields.getTextInputValue('couponRole');
                    const MaximoUsos = interaction.fields.getTextInputValue('couponMaxuse');
                    const PedidoMinimo = interaction.fields.getTextInputValue('couponMinOrder');

                    if (isNaN(percentCoupon)) return interaction.reply({ content: `Você deve inserir apenas números para definir a porcentagem`, embeds: [], components: [], flags: MessageFlagsBitField.Flags.Ephemeral })
                    if (Number(percentCoupon) < 1 || Number(percentCoupon) > 99) {
                        return interaction.reply({ content: `Insira uma porcetagem válida entre 1 - 99.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const date = moment().tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm:ss");
                    let cpns = await Produtos.get(`Products.${productID}.coupons`) || [];

                    const idcoupon = createID();

                    let Struct = {
                        id: idcoupon,
                        name: nameCoupon,
                        percent: Number(percentCoupon) ? Number(percentCoupon) : 10,
                        role: '',
                        maxuses: MaximoUsos ? MaximoUsos : false,
                        uses: 0,
                        MinOrder: PedidoMinimo ? PedidoMinimo : 1,
                        created_at: date,
                    };

                    if (RoleCoupon) {
                        const guild = interaction.guild;
                        const cargo = guild.roles.cache.get(RoleCoupon);
                        if (cargo) {
                            Struct.role = RoleCoupon;
                        }
                    }

                    cpns.push(Struct)

                    await Produtos.set(`Products.${productID}.coupons`, cpns);

                    await CouponSetup(client, interaction, productID);
                    break;
                }
                case 'stockLinemodal': {
                    const content = interaction.fields.getTextInputValue("inputLineStock");
                    const array = content.split("\n").map(line => line.trim());

                    let asd = 0;
                    let countStock = [];

                    for (const unitys of array) {
                        if (unitys) {
                            asd++;
                            countStock.push(unitys);
                            await Produtos.push(`Products.${productID}.sub_products.${VarianteID}.stock`, unitys);
                        }
                    }

                    UpdateStock(productID, client);
                    await interaction.reply({ content: `Sincronizando estoque..`, flags: MessageFlagsBitField.Flags.Ephemeral, });

                    const userEspera = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}.notify`);
                    if (userEspera.length > 0) {
                        await notifyStock(asd, productID, VarianteID, interaction);
                    }

                    await interaction.editReply({ content: `Foram adicionados \`${asd}\` itens ao estoque.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    break;
                }
                case 'modalGhostStock': {
                    let qtd = interaction.fields.getTextInputValue('QtyStockGhostInput');
                    let produto = interaction.fields.getTextInputValue('StockGhostInput');

                    if (qtd > 1000) {
                        return interaction.reply({ content: `O maximo por operação é de \`1000\``, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    if (isNaN(qtd)) {
                        return interaction.reply({ content: `Insira apenas números para a quantidade de estoque.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const arrayItens = [];
                    if (produto == '') {
                        for (let i = 0; i < qtd; i++) {
                            const linha = `Contate a admnistração`;
                            arrayItens.push(linha);
                            await Produtos.push(`Products.${productID}.sub_products.${VarianteID}.stock`, ...arrayItens);
                        }
                    } else {
                        for (let i = 0; i < qtd; i++) {
                            const linha = `${produto}`;
                            arrayItens.push(linha);
                            await Produtos.push(`Products.${productID}.sub_products.${VarianteID}.stock`, ...arrayItens);
                        }
                    }

                    UpdateStock(productID, client);
                    await interaction.reply({ content: `Atualizando estoque..`, flags: MessageFlagsBitField.Flags.Ephemeral }).then(async tt => {
                        const userEspera = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}.notify`);
                        if (userEspera.length > 0) {
                            await tt.edit({ content: `Notificando usuarios a espera do produto..`, flags: MessageFlagsBitField.Flags.Ephemeral }).then(async () => {

                                await notifyStock(qtd, productID, VarianteID, interaction);

                            });
                        }
                        await tt.edit({ content: `Total de \`${qtd}\` itens adicionados ao estoque.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    });
                    break;
                }
            }
        }
        if (SelectAction) {
            const [CustomId, productID, VarianteID] = interaction.customId.split('_');
            switch (CustomId) {
                case 'deletePlanSelect': {
                    const selectedPlanId = interaction.values[0];

                    Planos.delete(`plans.${selectedPlanId}`)

                    await plansSetup(client, interaction);
                    break;
                }
                case 'managePlanSelect': {
                    const selectedPlanId = interaction.values[0];

                    await PlanConfig(client, interaction, selectedPlanId);
                    break;
                }
                case 'manageProductSelect': {
                    const selectedProductId = interaction.values[0];

                    await ProductSetup(client, interaction, selectedProductId);
                    break;
                }
                case 'manageSubProductSelect': {
                    const selectedSubProductId = interaction.values[0];

                    await VariantSetup(client, interaction, productID, selectedSubProductId);
                    break;
                }
                case 'deleteProductSelect': {
                    const selectedProductIds = interaction.values;

                    for (const productId of selectedProductIds) {
                        Produtos.delete(`Products.${productId}`);
                    }

                    await LojaSetup(client, interaction);
                    break;
                }
                case 'deleteSubproductSelect': {
                    const selectedProductIds = interaction.values[0];
                    const data = await Produtos.get(`Products.${productID}.sub_products.${selectedProductIds}`);

                    if (data.stock.length > 0) {

                        const rowButton1 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`nextDeleteVariant_${productID}_${selectedProductIds}`)
                                .setLabel(`Deletar sem Backup`)
                                .setEmoji(`1251441411266711573`)
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId(`backupClearStockVariant_${productID}_${selectedProductIds}`)
                                .setLabel(`Backup e Deletar`)
                                .setEmoji(`1286148928835948574`)
                                .setStyle(2),
                        );
                        const rowButton2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`voltarProductSetup_${productID}`)
                                .setLabel(`Cancelar`)
                                .setStyle(4),
                        );

                        await interaction.update({
                            content: `${interaction.user} A variante **${data.title}** a ser deletada possui estoque, deseja realizar um backup do estoque antes de deleta-la?`,
                            embeds: [], components: [rowButton1, rowButton2], flags: MessageFlagsBitField.Flags.Ephemeral
                        })
                    } else {
                        Produtos.delete(`Products.${productID}.sub_products.${selectedProductIds}`);

                        await ProductSetup(client, interaction, productID);
                    }
                    break;
                }
                case 'optionsCustomProduct': {
                    const optionSelected = interaction.values[0];
                    const data = await Produtos.get(`Products.${productID}`);

                    switch (optionSelected) {
                        case 'ExibitionVendidos': {
                            if (data.configs.vendidos === true) {
                                await Produtos.set(`Products.${productID}.configs.vendidos`, false);
                                await ProductSetup(client, interaction, productID);
                            } else {
                                await Produtos.set(`Products.${productID}.configs.vendidos`, true);
                                await ProductSetup(client, interaction, productID);
                            }
                            break;
                        }
                        case 'ExibitionEmbed': {
                            if (data.configs.embed === true) {
                                await Produtos.set(`Products.${productID}.configs.embed`, false);
                                await ProductSetup(client, interaction, productID);
                            } else {
                                await Produtos.set(`Products.${productID}.configs.embed`, true);
                                await ProductSetup(client, interaction, productID);
                            }
                            break;
                        }
                    }
                    break;
                }
                case 'optionsSubProduct': {
                    const optionSelected = interaction.values[0];
                    const data = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}`);

                    switch (optionSelected) {
                        case 'statusCuponSubProduct': {
                            if (data.coupons === true) {
                                await Produtos.set(`Products.${productID}.sub_products.${VarianteID}.coupons`, false);
                                await VariantSetup(client, interaction, productID, VarianteID);
                            } else {
                                await Produtos.set(`Products.${productID}.sub_products.${VarianteID}.coupons`, true);
                                await VariantSetup(client, interaction, productID, VarianteID);
                            }
                            break;
                        }
                    }
                    break;
                }
                case 'selectMethodPix': {
                    const optionSelected = interaction.values[0];
                    const data = await General.get(`System.Payments`);

                    if (optionSelected === 'onoffMP') {
                        if (data.mercadopago.status === true) {
                            await General.set(`System.Payments.mercadopago.status`, false);
                        } else {
                            const token = await General.get(`System.Payments.mercadopago.token`);
                            if (token === '') {
                                return interaction.reply({ content: `Voce precisa definir seu token mercadopago antes de ativar esta opção.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                            }
                            await General.set(`System.Payments.semiauto.status`, false);
                            await General.set(`System.Payments.mercadopago.status`, true);
                        }
                    }
                    if (optionSelected === 'onoffSemiauto') {
                        if (data.semiauto.status === true) {
                            await General.set(`System.Payments.semiauto.status`, false);
                        } else {
                            if (General.get(`System.Payments.semiauto.key`) == '') {
                                return interaction.reply({ content: `Voce precisa definir uma chave pix para ativar esta opção.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                            }
                            await General.set(`System.Payments.semiauto.status`, true);
                            await General.set(`System.Payments.mercadopago.status`, false);
                        }
                    }
                    await PaymentSetup(client, interaction);
                    break;
                }
                case 'selectMethodCard': {
                    const optionSelected = interaction.values[0];
                    const data = await General.get(`System.Payments`);

                    if (optionSelected === 'onoffStripe') {
                        if (data.stripe.status === true) {
                            await General.set(`System.Payments.stripe.status`, false);
                        } else {
                            const token = await General.get(`System.Payments.stripe.token`);
                            if (token === '') {
                                return interaction.reply({ content: `Voce precisa definir seu token mercadopago antes de ativar esta opção.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                            }
                            await General.set(`System.Payments.mercadopago.status`, true);
                        }
                    }
                    if (optionSelected === 'onoffSemiauto') {
                        if (data.semiauto.status === true) {
                            await General.set(`System.Payments.semiauto.status`, false);
                        } else {
                            if (General.get(`System.Payments.semiauto.key`) == '') {
                                return interaction.reply({ content: `Voce precisa definir uma chave pix para ativar esta opção.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                            }
                            await General.set(`System.Payments.semiauto.status`, true);
                            await General.set(`System.Payments.mercadopago.status`, false);
                        }
                    }
                    await PaymentSetup(client, interaction);
                    break;
                }
                case 'deleteCouponSelect': {
                    const selectedCouponNames = interaction.values;
                    let coupons = await Produtos.get(`Products.${productID}.coupons`) || [];

                    const updatedCoupons = coupons.filter(coupon => !selectedCouponNames.includes(coupon.id));

                    await Produtos.set(`Products.${productID}.coupons`, updatedCoupons);

                    await CouponSetup(client, interaction, productID);
                    break;
                }
            }
        }
        if (ChannelSelectAction) {
            const [CustomId, productID] = interaction.customId.split('_');
            switch (CustomId) {
                case "setChannelAnnounce": {
                    const value = interaction.values[0];

                    interaction.reply({ content: `Aguarde...`, embeds: [], components: [], flags: MessageFlagsBitField.Flags.Ephemeral })
                    await CreateAnnounce(value, productID, interaction, client);
                    break;
                }
            }
        }
        if (RoleSelectAction) {
            const [CustomId, productID, VariantID] = interaction.customId.split('_');
            const value = interaction.values[0];
            switch (CustomId) {
                case "choseRoleplan": {
                    await Planos.set(`plans.${productID}.role_plan`, value);
                    await PlanConfig(client, interaction, productID);
                    break;
                }
                case "selectRoleSubProduct": {
                    const guild = interaction.guild;
                    const cargo = guild.roles.cache.get(value);
                    if (cargo) {
                        await Produtos.set(`Products.${productID}.sub_products.${VariantID}.role`, value);
                    }
                    await VariantSetup(client, interaction, productID, VariantID);
                    break;
                }
            }
        }
    }
}