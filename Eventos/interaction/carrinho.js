const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, MessageFlagsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require("discord.js");
const { openCart, finishOrder, order } = require("../../Functions/carrinho")
const { UpdateStock } = require("../../Functions/products_setup")
const { General, Produtos, Carrinhos } = require("../../Database/index")
const { finalyPay } = require("../../Functions/pagamentos")


module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {

        const ButtonAction = interaction.isButton();
        const ModalAction = interaction.isModalSubmit();
        const SelectAction = interaction.isStringSelectMenu();

        if (ButtonAction) {
            const parts = interaction.customId.split('_');

            const [CustomId, productID, VarianteID] = parts;
            const [CustomButton, buyerID, orderID, methodPay] = parts;

            switch (CustomId) {
                case "openOrder": {
                    await openCart(productID, VarianteID, interaction, client);
                    break;
                }
                case "esperarEstoque": {
                    const Product = await Produtos.get(`Products.${productID}.sub_products.${VarianteID}`);
                    const userID = interaction.user.id;

                    if (Product.notify.includes(userID)) {
                        return interaction.update({
                            content: `${interaction.user} você já está na lista de espera para o produto \`${Product.title}\`.\nAguarde o reabastecimento!`,
                            components: [],
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    }

                    await Produtos.push(`Products.${productID}.sub_products.${VarianteID}.notify`, userID);

                    interaction.update({
                        content: `${interaction.user} você será notificado assim que o estoque do produto \`${Product.title}\` for reabastecido!`,
                        components: [],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });
                    break;
                }
            }
            switch (CustomButton) {
                case "paymentorder": {
                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    await finishOrder(orderID, buyerID, interaction, client);
                    break;
                }
                case "voltarOrder": {
                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    await order(orderID, buyerID, interaction, client);
                    break;
                }
                case "cancelOrder": {
                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    Carrinhos.delete(`${buyerID}.${orderID}`);

                    await interaction.update({ content: `Ordem cancelada, o carrinho será fechado em 5 segundos.`, embeds: [], components: [], files: [] })
                    setTimeout(() => {
                        interaction.channel.delete();
                    }, 5000)
                    break;
                }
                case "quantyOrder": {

                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalQuantyOrder_${buyerID}_${orderID}`)
                        .setTitle('Alterar Quantidade')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('quantyOrderEdit')
                            .setLabel('Quantidade')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    modal.addComponents(input1)
                    await interaction.showModal(modal);
                    break;
                }
                case "paymentorderPIX": {
                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    await finalyPay(buyerID, orderID, methodPay, interaction, client)
                    break;
                }
                case "paymentorderCARD": {
                    await finalyPay(buyerID, orderID, methodPay, interaction, client)
                    break;
                }
                case "copiaecola": {
                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    const data = await Carrinhos.get(`${buyerID}.${orderID}`);

                    const copypastePix = data.payment_info[0].copypaste

                    interaction.reply({ content: `${copypastePix}`, embeds: [], components: [], flags: MessageFlagsBitField.Flags.Ephemeral })
                    break;
                }
                case "ItemsOrder": {
                    const data = await Carrinhos.get(`${buyerID}.${orderID}.info_order.products_delivery`);

                    if(data.length > 15){
                        return interaction.reply({
                            content: `A entrega foi anexada acima como arquivo.txt.`,
                            embeds: [],
                            components: [],
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        })
                    }
                    const channel = interaction.channel
                    let mensagem = `${data.join("\n")}`

                    if (mensagem.length > 2000) {
                        const partes = mensagem.match(/.{1,2000}/g);

                        for (const parte of partes) {
                            await channel.send({ content: parte });
                        }
                    }

                    interaction.reply({
                        content: mensagem,
                        embeds: [],
                        components: [],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    })
                    break;
                }
                case "confirmPay": {
                    if (!General.get('owner').includes(interaction.user.id) && !interaction.member.roles.cache.has(General.get("Config.Roles.admin"))) {
                        interaction.reply({
                            content: `Somente o dono pode confirmar o pagamento.`, flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }
                    const data = await Carrinhos.get(`${buyerID}.${orderID}`);
                    let object = [];

                    const agora = new Date();
                    await Carrinhos.set(`${buyerID}.${orderID}.status`, 'approved');

                    let paymentStruct = {
                        method: "semiauto",
                        total: data.info_order.value,
                        copypaste: data.payment_info[0].copypaste,
                        creation_date: data.payment_info[0].creation_date,
                        approvation_date: agora,
                        proof: data.payment_info[0].proof,
                    }
                    object.push(paymentStruct)

                    await Carrinhos.set(`${buyerID}.${orderID}.payment_info`, object);

                    interaction.reply({ content: `✅・Pagamento Aprovado com sucesso, em instantes a entrega será realizada.`, embeds: [], components: [], flags: MessageFlagsBitField.Flags.Ephemeral })
                    break;
                }
                case "cuponOrder": {
                    if (interaction.user.id !== buyerID) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para interagir com este carrinho.`,flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }
                    
                    const dataOrder = await Carrinhos.get(`${buyerID}.${orderID}`);
                    const data = await Produtos.get(`Products.${dataOrder.id_product}`);
                    const variant = await Produtos.get(`Products.${dataOrder.id_product}.sub_products.${dataOrder.id_variant}`);

                    if (!variant.coupons) return interaction.reply({ content: `Os cupons não estão habilitados para este produto.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    if (data.coupons.length <= 0) return interaction.reply({ content: `O produto não existe cupons para serem utilizados.`, flags: MessageFlagsBitField.Flags.Ephemeral })

                    const modal = new ModalBuilder()
                        .setCustomId(`ModalCouponOrder_${buyerID}_${orderID}`)
                        .setTitle('Cupom de Desconto')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('counponInput')
                            .setLabel('Insira seu Cupom')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    modal.addComponents(input1)
                    await interaction.showModal(modal);
                    break;
                }
                case "confirmProof": {
                    const userid = interaction.user.id;
                    const paymentChannelId = await General.get(`Config.logs.VendasADM`)
                    const data = await Carrinhos.get(`${buyerID}.${orderID}`);

                    if (data.payment_info[0].proof) {
                        return interaction.reply({
                            content: `Você já enviou o comprovante.`,
                            components: [],
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    }

                    interaction.reply({
                        content: `Envie o comprovante de pagamento (\`.png\`, \`.jpg\`, \`.jpeg\`, \`.pdf\`) em até 1 minuto.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`${userid}_cancelled`)
                                    .setLabel("Cancelar")
                                    .setStyle(2)
                            )
                        ],
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });

                    const filterArquivo = (msg) =>
                        msg.author.id === interaction.user.id &&
                        msg.attachments.size > 0 &&
                        /\.(png|jpe?g|pdf)$/i.test(msg.attachments.first().name);

                    const collectorArquivo = interaction.channel.createMessageCollector({ filter: filterArquivo, time: 60000 });

                    collectorArquivo.on("collect", async (mensagem) => {
                        try {
                            collectorArquivo.stop();
                            const attachment = mensagem.attachments.first();
                            const targetChannel = await interaction.client.channels.cache.get(paymentChannelId);
                            if (!targetChannel) {
                                interaction.editReply({
                                    content: `Canal de comprovantes não definido, contate a admnistração!`,
                                    components: [],
                                    flags: MessageFlagsBitField.Flags.Ephemeral
                                });
                                throw new Error("Canal de comprovantes não encontrado");
                            }

                            const response = await fetch(attachment.url);
                            const arrayBuffer = await response.arrayBuffer();
                            const attachmentBuffer = Buffer.from(arrayBuffer);

                            const fileAttachment = { attachment: attachmentBuffer, name: attachment.name };

                            let Struct = [{
                                method: "semiauto",
                                total: data.payment_info[0].total,
                                copypaste: data.payment_info[0].copypaste,
                                creation_date: data.payment_info[0].creation_date,
                                expiration_date: data.payment_info[0].expiration_date,
                                proof: true,
                            }]

                            await Carrinhos.set(`${buyerID}.${orderID}.payment_info`, Struct);
                            await Carrinhos.set(`${buyerID}.${orderID}.status`, 'waiting');

                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Comprovante de Pagamento`, iconURL: "https://cdn.discordapp.com/emojis/1276927585544044598.webp?size=96&quality=lossless" })
                                .addFields(
                                    {
                                        name: `Informações do Pedido`, value: `Ordem: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(data.info_order.value).toFixed(2)}\` **-** \`${Number(data.info_order.amount)}\` **unidade(s)**`, inline: true
                                    }
                                )
                                .setColor(General.get('System.Colors.green'))
                                .setImage(`attachment://${attachment.name}`)
                                .setFooter(
                                    { text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                                )
                                .setTimestamp()

                            const buttonadm = new ButtonBuilder()
                                .setURL(`https://discord.com/channels/${interaction.guild.id}/${data.hook[0].channelid}`)
                                .setLabel('Ver Ordem')
                                .setStyle(5)

                            const row = new ActionRowBuilder().addComponents(buttonadm)

                            await targetChannel.send({
                                content: ``,
                                embeds: [embed],
                                components: [row],
                                files: [fileAttachment]
                            });

                            await mensagem.delete();

                            interaction.editReply({
                                content: `Comprovante enviado com sucesso!`,
                                components: [],
                                flags: MessageFlagsBitField.Flags.Ephemeral
                            });
                        } catch (error) {
                            console.error("Erro ao processar o comprovante:", error);
                            interaction.editReply({
                                content: `Ocorreu um erro ao processar o comprovante. Tente novamente.`,
                                components: [],
                                flags: MessageFlagsBitField.Flags.Ephemeral
                            });
                        }
                    });

                    const filterBotao = (i) =>
                    i.customId === `${userid}_cancelled` && i.user.id === interaction.user.id;
                    const collectorBotao = interaction.channel.createMessageComponentCollector({ filter: filterBotao, time: 60000 });

                    collectorBotao.on("collect", (i) => {
                        collectorArquivo.stop();
                        collectorBotao.stop("cancelled");
                        i.deferUpdate();
                        interaction.editReply({
                            content: `Cancelado com sucesso.`,
                            components: [],
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    });

                    collectorArquivo.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply({
                                content: `O tempo para enviar o comprovante foi encerrado.`,
                                components: [],
                                flags: MessageFlagsBitField.Flags.Ephemeral
                            });
                        }
                    });
                    break;
                }
            }
        }
        if (ModalAction) {
            const [CustomId, buyerID, orderID] = interaction.customId.split('_');
            switch (CustomId) {
                case 'ModalQuantyOrder': {
                    let Quanty = interaction.fields.getTextInputValue('quantyOrderEdit');
                    Quanty = Quanty.split(/[.,]/)[0];

                    if (isNaN(Quanty) || !Quanty.trim())
                        return interaction.reply({ content: `Insira apenas números inteiros.`, flags: MessageFlagsBitField.Flags.Ephemeral });

                    Quanty = parseInt(Quanty);

                    const data = await Carrinhos.get(`${buyerID}.${orderID}`);
                    const dataVariant = await Produtos.get(`Products.${data.id_product}.sub_products.${data.id_variant}`);
                    
                    if (Quanty > dataVariant.stock.length) {
                        Quanty = dataVariant.stock.length
                    }

                    let totalvalue = Number(dataVariant.price * Quanty).toFixed(2)
                    if (data.info_order.cupom.length > 0) {
                        const dataCoupon = await Produtos.get(`Products.${data.id_product}.coupons`);

                        const matchingCoupon = await dataCoupon.find((coupon) => coupon.id === data.info_order.cupom[0].id);

                        if (matchingCoupon.MinOrder > Quanty) {
                            return interaction.reply({ content: `A quantia mínima de para uso do cupom é de \`${matchingCoupon.MinOrder}\` unidade(s).`, 
                            flags: MessageFlagsBitField.Flags.Ephemeral });
                        }

                        const desconto = data.info_order.cupom[0].percent;
                        const valorDesconto = (Math.floor(desconto * totalvalue) / 100).toFixed(2);
                        totalvalue = (totalvalue - valorDesconto).toFixed(2);

                        let StructCoupon = {
                            id: data.info_order.cupom[0].id,
                            coupon: data.info_order.cupom[0].coupon,
                            percent: data.info_order.cupom[0].percent,
                            total_save: valorDesconto
                        }
                        await Carrinhos.set(`${buyerID}.${orderID}.info_order.cupom`, [StructCoupon]);
                    }

                    await Carrinhos.set(`${buyerID}.${orderID}.info_order.value`, totalvalue);
                    await Carrinhos.set(`${buyerID}.${orderID}.info_order.amount`, Quanty);

                    await order(orderID, buyerID, interaction, client);
                    break;
                }
                case 'ModalCouponOrder': {
                    let couponUse = interaction.fields.getTextInputValue('counponInput');

                    const data = await Carrinhos.get(`${buyerID}.${orderID}`);
                    const dataProduct = await Produtos.get(`Products.${data.id_product}`);

                    let totalvalue = Number(data.info_order.value).toFixed(2)
                    let cupomEncontrado = false;

                    for (const cupom of dataProduct.coupons) {
                        if (cupom.name.toLowerCase() === couponUse.toLowerCase()) {
                            cupomEncontrado = true;
                            if (data.info_order.amount < cupom.MinOrder) {
                                return interaction.reply({ content: `A quantia mínima de para uso do cupom é de \`${cupom.MinOrder}\` unidade(s).`, flags: MessageFlagsBitField.Flags.Ephemeral });
                            }
                            if (cupom.maxuses !== false) {
                                if (cupom.maxuses <= cupom.uses) {
                                    return interaction.reply({ content: `Este cupom ja atingiu seu limite de uso.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                                }
                            }
                            if (cupom.role !== "") {
                                if (!interaction.member.roles.cache.has(cupom.role)) {
                                    return interaction.reply({ content: `Você não possui permissão para utilizar este cupom.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                                }
                            }

                            const desconto = cupom.percent;
                            const valorDesconto = (Math.floor(desconto * totalvalue) / 100).toFixed(2);
                            totalvalue = (totalvalue - valorDesconto).toFixed(2);

                            let StructCoupon = {
                                id: cupom.id,
                                coupon: cupom.name,
                                percent: cupom.percent,
                                total_save: valorDesconto
                            }

                            await Carrinhos.set(`${buyerID}.${orderID}.info_order.value`, totalvalue);
                            await Carrinhos.push(`${buyerID}.${orderID}.info_order.cupom`, StructCoupon);
                            break;
                        }
                    }

                    if (!cupomEncontrado) {
                        return interaction.reply({
                            content: `O cupom \`${couponUse}\` não é válido.`,
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    }

                    await order(orderID, buyerID, interaction, client);
                    break;
                }
            }
        }
        if (SelectAction) {
            const [CustomId, productID, VarianteID] = interaction.customId.split('_');
            switch (CustomId) {
                case 'openOrder': {
                    const selectedVariant = interaction.values[0];

                    await openCart(productID, selectedVariant, interaction, client);
                    UpdateStock(productID, client);
                    break;
                }
            }
        }
    }
}