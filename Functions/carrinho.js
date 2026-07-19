const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, PermissionFlagsBits, ChannelType, MessageFlagsBitField } = require("discord.js");
const { General, Produtos, Carrinhos } = require("../Database/index");
const { Console } = require("../Functions/console")
const { createID } = require("../Functions/utils")
const { logorderApproved, logstockempty, orderAdmApproved } = require("../Functions/logs")
const { UpdateStock } = require("../Functions/products_setup")
const fs = require('fs');
const { checkpayMP, checkpayStripe } = require("../Functions/pagamentos");


async function openCart(productID, VariantID, interaction) {
    const system = await General.get(`System.Payments`)

    if (system.status === false) return interaction.reply({ content: `O sistema de vendas esta desabilitado no momento, aguarde até que os responsáveis habilite novamente.`, flags: MessageFlagsBitField.Flags.Ephemeral });
    if (system.mercadopago.status === false && system.semiauto.status === false && system.crypto.status === false) {
        return interaction.reply({ content: `O sistema de vendas esta desabilitado no momento, aguarde até que os responsáveis habilite novamente.`, flags: MessageFlagsBitField.Flags.Ephemeral });
    }
    if (await Carrinhos.get(`${interaction.user.id}`) == null) {
        await Carrinhos.set(`${interaction.user.id}`, {})
    }

    const data = await Produtos.get(`Products.${productID}`);
    const dataVariant = await Produtos.get(`Products.${productID}.sub_products.${VariantID}`);

    if (dataVariant.stock.length == 0) {
        const buttonNotify = new ButtonBuilder()
            .setCustomId(`esperarEstoque_${productID}_${VariantID}`)
            .setLabel('Ativar Notificações')
            .setEmoji('1251441491679645698')
            .setStyle(1)

        const rowNotify = new ActionRowBuilder().addComponents(buttonNotify)

        return interaction.reply({ content: `Este produto se encontra sem estoque.\nClique no botão abaixo para ser notificado quando o estoque for abastecido.`, components: [rowNotify], flags: MessageFlagsBitField.Flags.Ephemeral });
    }

    if (!data || !dataVariant) return interaction.reply({ content: `Este produto não existe ou foi deletado.`, flags: MessageFlagsBitField.Flags.Ephemeral });

    const threadcart = interaction.channel.threads.cache.find(x => x.name.includes(interaction.user.id));

    if (threadcart !== undefined) {
        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${threadcart.id}`)
                    .setLabel('Ir para o Carrinho')
                    .setStyle(5)
            )

        return interaction.reply({ content: `Você já possuí um carrinho aberto!`, components: [row4], flags: MessageFlagsBitField.Flags.Ephemeral });
    }
    await interaction.reply({ content: `Aguarde seu carrinho esta sendo criado..`, flags: MessageFlagsBitField.Flags.Ephemeral });

    const thread = await interaction.channel.threads.create({
        name: `🛒・${dataVariant.title}・${interaction.user.id}`,
        autoArchiveDuration: 1440,
        type: ChannelType.PrivateThread,
        reason: 'Order',
        invitable: false,
        members: [interaction.user.id],
        permissionOverwrites: [
            {
                id: General.get('Config.Roles.admin'),
                allow: [PermissionFlagsBits.SendMessagesInThreads],
                allow: [PermissionFlagsBits.ViewChannel],
                allow: [PermissionFlagsBits.AttachFiles],
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.SendMessagesInThreads],
                allow: [PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.AttachFiles],
            }
        ],
    });

    const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                .setLabel('Ir para o Carrinho')
                .setStyle(5)
        )

    interaction.editReply({ content: `Carrinho criado com sucesso!`, components: [row4] });

    let creation = new Date();
    let expire = new Date(creation.getTime() + 10 * 60 * 1000);

    const options = {
        timeZone: "America/Sao_Paulo", hour12: false,
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    };


    let CarrinhoID;

    do {
        CarrinhoID = createID();
    } while (await Carrinhos.get(`${interaction.user.id}.${CarrinhoID}`));

    let CartStruct = {
        status: 'open', //'pending', 'approved', 'open', 'waiting'
        id_order: CarrinhoID,
        id_product: data.id_product,
        id_variant: dataVariant.id,
        info_order: {
            id_costumer: interaction.user.id,
            item: dataVariant.title,
            amount: 1,
            value: Number(dataVariant.price).toFixed(2),
            creation_date: creation,
            expiration_date: expire,
            products_delivery: [],
            cupom: [],
        },
        payment_info: [],
        hook: [],
        delivery: false,
    }

    await Carrinhos.set(`${interaction.user.id}.${CarrinhoID}`, CartStruct);

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    const embed = new EmbedBuilder()
        .setTitle(`Ordem: ${CarrinhoID}`)
        .setDescription(`Olá ${interaction.user}, este é seu pedido, leia com atenção e confira os termos de serviços.\n
Produto: **${dataVariant.title}**
Valor: \`${formattedPrice.format(Number(dataVariant.price))}\`
Estoque: \`${dataVariant.stock.length}\` unidade(s)`)
        .addFields(
            {
                name: `Informações do Pedido`, value: `Valor Total: \`${formattedPrice.format(Number(dataVariant.price))}\` **-** \`${Number(1)}\` **unidade(s)**`, inline: true
            }
        )
        .setColor(General.get('System.Colors.main'))
        .setFooter(
            { text: `${interaction.guild.name} | O carrinho expira em ${expire.toLocaleString("pt-BR", options)}`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )

    if (data.bannerURL !== '') {
        embed.setImage(`${data.bannerURL}`)
    }
    if (data.iconURL !== '') {
        embed.setThumbnail(`${data.bannerURL}`)
    }

    const button1 = new ButtonBuilder()
        .setCustomId(`paymentorder_${interaction.user.id}_${CarrinhoID}`)
        .setLabel('Prosseguir')
        .setEmoji('1251441846601912452')
        .setStyle(3)
    const button2 = new ButtonBuilder()
        .setCustomId(`cancelOrder_${interaction.user.id}_${CarrinhoID}`)
        .setLabel('Cancelar Ordem')
        .setEmoji('1251441411266711573')
        .setStyle(4)
    const button3 = new ButtonBuilder()
        .setCustomId(`cuponOrder_${interaction.user.id}_${CarrinhoID}`)
        .setLabel('Usar Cupom')
        .setEmoji('1251441496104636496')
        .setStyle(2)
    const button4 = new ButtonBuilder()
        .setCustomId(`quantyOrder_${interaction.user.id}_${CarrinhoID}`)
        .setLabel('Alterar Quantidade')
        .setEmoji('1264379809845477406')
        .setStyle(1)

    const row1 = new ActionRowBuilder().addComponents(button1, button4);
    const row2 = new ActionRowBuilder().addComponents(button3, button2);

    await thread.send({ components: [row1, row2], embeds: [embed], content: `${interaction.user} | <@&${General.get('Config.Roles.admin')}>` }).then((msg) => {
        Carrinhos.push(`${interaction.user.id}.${CarrinhoID}.hook`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
    })
}

async function order(orderID, buyerID, interaction) {

    const data = await Carrinhos.get(`${buyerID}.${orderID}`);
    const dataVariant = await Produtos.get(`Products.${data.id_product}.sub_products.${data.id_variant}`);

    const options = {
        timeZone: "America/Sao_Paulo", hour12: false,
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    };

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    const embed = new EmbedBuilder()
        .setTitle(`Ordem: ${orderID}`)
        .setDescription(`Olá ${interaction.user}, este é seu pedido, leia com atenção e confira os termos de serviços.\n
Produto: **${dataVariant.title}**
Valor: \`${formattedPrice.format(Number(data.info_order.value))}\`
Estoque: \`${dataVariant.stock.length}\` unidade(s)`)
        .addFields(
            {
                name: `Informações do Pedido`, value: `Valor Total: \`${formattedPrice.format(Number(data.info_order.value))}\` **-** \`${Number(data.info_order.amount)}\` **unidade(s)**`, inline: true
            }
        )
        .setColor(General.get('System.Colors.main'))
        .setFooter(
            { text: `${interaction.guild.name} | O carrinho expira em ${data.info_order.expiration_date.toLocaleString("pt-BR", options)}`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )

    const productData = await Produtos.get(`Products.${data.id_product}`);
    if (productData?.bannerURL) embed.setImage(productData.bannerURL);
    if (productData?.iconURL) embed.setThumbnail(productData.iconURL);

    const button1 = new ButtonBuilder()
        .setCustomId(`paymentorder_${buyerID}_${orderID}`)
        .setLabel('Prosseguir')
        .setEmoji('1251441846601912452')
        .setStyle(3)
    const button2 = new ButtonBuilder()
        .setCustomId(`cancelOrder_${buyerID}_${orderID}`)
        .setLabel('Cancelar Ordem')
        .setEmoji('1251441411266711573')
        .setStyle(4)
    const button3 = new ButtonBuilder()
        .setCustomId(`cuponOrder_${buyerID}_${orderID}`)
        .setLabel(`${data.info_order.cupom.length > 0 ? 'Cupom Utilizado' : 'Usar Cupom'}`)
        .setEmoji('1251441496104636496')
        .setDisabled(data.info_order.cupom.length > 0 ? true : false)
        .setStyle(2)
    const button4 = new ButtonBuilder()
        .setCustomId(`quantyOrder_${buyerID}_${orderID}`)
        .setLabel('Alterar Quantidade')
        .setEmoji('1264379809845477406')
        .setStyle(1)

    const row1 = new ActionRowBuilder().addComponents(button1, button4);
    const row2 = new ActionRowBuilder().addComponents(button3, button2);

    await interaction.update({ components: [row1, row2], embeds: [embed], content: `${interaction.user} | <@&${General.get('Config.Roles.admin')}>` })
}

async function finishOrder(orderID, userID, interaction) {

    const data = await General.get(`System.Payments`);

    let pixAtivo = null;

    if (data.mercadopago.status) {
        pixAtivo = "mercadopago";
    } else if (data.semiauto.status) {
        pixAtivo = "semiauto";
    }

    const button1 = new ButtonBuilder()
        .setCustomId(`paymentorderPIX_${userID}_${orderID}_${pixAtivo || "none"}`)
        .setEmoji('1251441500407992351')
        .setDisabled(!pixAtivo ? true : false)
        .setStyle(2);
    const button2 = new ButtonBuilder()
        .setCustomId(`paymentorderCRYPTO_${userID}_${orderID}_crypto`)
        .setEmoji('1348888206229110784')
        .setDisabled(data.crypto.status === true ? false : true)
        .setStyle(2)
    const button3 = new ButtonBuilder()
        .setCustomId(`paymentorderCARD_${userID}_${orderID}_stripe`)
        .setEmoji('1348888208070414417')
        .setDisabled(data.stripe.status === true ? false : true)
        .setStyle(2)
    const button4 = new ButtonBuilder()
        .setCustomId(`voltarOrder_${userID}_${orderID}`)
        .setEmoji('1251441490576805979')
        .setStyle(2)

    const row1 = new ActionRowBuilder().addComponents(button1, button2, button3);
    const row2 = new ActionRowBuilder().addComponents(button4);

    interaction.update({ content: `Selecione o metodo de pagamento.`, components: [row1, row2], embeds: [] })
}

async function processOrder(client) {
    const dataOrderArray = Carrinhos.all();

    if (!Array.isArray(dataOrderArray) || dataOrderArray.length === 0) {
        return;
    }

    for (const orderEntry of dataOrderArray) {
        const userOrders = orderEntry.data;

        for (const carrinhoId in userOrders) {
            const data = userOrders[carrinhoId];

            if (data.status === 'waiting' || data.status === 'approved' || data.status === 'refunded' || data.status === 'cancelled') continue;

            let response = { status: '', data: {} };

            if (!data.hook || !Array.isArray(data.hook) || data.hook.length === 0) {
                console.log(`[processOrder] Pedido ${data.id_order} sem dados de hook - pulando.`);
                continue;
            }

            // Skip expensive API fetch for open orders that haven't expired yet
            if (data.status === 'open') {
                const agora = new Date();
                const expirate = new Date(data.info_order.expiration_date);
                if (agora < expirate) continue;
            }

            const Guild = client.guilds.cache.get(data.hook[0].guildid) || await client.guilds.fetch(data.hook[0].guildid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar guilda: ${data.hook[0].guildid} - Os dados foram deletados.`)
                    response = {
                        status: 'error',
                        error: error
                    }
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
            });
            if (response.status === 'error') continue;
            const channelOrder = Guild.channels.cache.get(data.hook[0].channelid) || await Guild.channels.fetch(data.hook[0].channelid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar canal: ${data.hook[0].channelid}`)
                    response = {
                        status: 'error',
                        error: error
                    }
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
            });
            if (response.status === 'error') continue;

            if (data.status === 'open') {
                const agora = new Date();
                const expirate = new Date(data.info_order.expiration_date);

                if (agora >= expirate) {
                    await channelOrder.delete();
                    const userDelivery = await Guild.members.cache.get(data.info_order.id_costumer);
                    const dataButton = await Produtos.get(`Products.${data.id_product}.announce_info`);

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Ordem Cancelada`, iconURL: "https://cdn.discordapp.com/emojis/1251441415565738015.webp?size=96&quality=lossless" })
                        .setDescription(`Olá <@${data.info_order.id_costumer}>, a ordem com  foi cancelada.\nO tempo para concluir o pagamento se expirou.`)
                        .addFields({
                            name: `Informações do Pedido:`,
                            value: `id: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(data.info_order.value).toFixed(2)}\` **-** \`${Number(data.info_order.amount)}\` unidade(s)`,
                            inline: true
                        })
                        .setColor(General.get('System.Colors.red'))
                        .setFooter({ text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) })
                        .setTimestamp();

                    const button = new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${dataButton[0].guildid}/${dataButton[0].channelid}`)
                        .setLabel('Nova Ordem')
                        .setStyle(5)

                    const row = new ActionRowBuilder().addComponents(button)

                    await userDelivery.send({ content: ``, embeds: [embed], components: [row], files: [] }).catch((err) => {
                        if (err) {
                            return console.log(`user does not accept DMs`)
                        }
                    })
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
                continue;
            }
            if (data.status !== 'pending') continue;

            if (!data.payment_info || !Array.isArray(data.payment_info) || data.payment_info.length === 0) continue;

            const agora = new Date();

            switch (data.payment_info[0].method) {
                case 'mercadopago': {
                    const pay_info = await checkpayMP(data.payment_info[0].id_mercadopago);
                    if (pay_info !== 'approved') {
                        response.status = 'pending';
                    }
                    if (pay_info === 'approved') {
                        let index = [];

                        let paymentStruct = {
                            id_mercadopago: data.payment_info[0].id_mercadopago,
                            method: "mercadopago",
                            total: data.payment_info[0].total,
                            copypaste: data.payment_info[0].copypaste,
                            creation_date: data.payment_info[0].creation_date,
                            approvation_date: agora,
                        }

                        index.push(paymentStruct)
                        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.status`, 'approved')
                        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.payment_info`, index)
                        response.status = 'sucess';
                    }
                    break;
                }
                case 'semiauto': {
                    const expirate = new Date(data.info_order.expiration_date);

                    if (agora >= expirate) {
                        await channelOrder.delete();
                        const userDelivery = await Guild.members.cache.get(data.info_order.id_costumer);
                        const dataButton = await Produtos.get(`Products.${data.id_product}.announce_info`);

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Ordem Cancelada`, iconURL: "https://cdn.discordapp.com/emojis/1251441415565738015.webp?size=96&quality=lossless" })
                            .setDescription(`Olá <@${data.info_order.id_costumer}>, a ordem com id: \`${data.id_order}\` foi cancelada.\nO tempo para concluir o pagamento se expirou.`)
                            .addFields({
                                name: `Informações do Pedido:`,
                                value: `Produto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(data.info_order.value).toFixed(2)}\` **-** \`${Number(data.info_order.amount)}\` unidade(s)`,
                                inline: true
                            })
                            .setColor(General.get('System.Colors.red'))
                            .setFooter({ text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) })
                            .setTimestamp();

                        const button = new ButtonBuilder()
                            .setURL(`https://discord.com/channels/${dataButton[0].guildid}/${dataButton[0].channelid}`)
                            .setLabel('Nova Ordem')
                            .setStyle(5)

                        const row = new ActionRowBuilder().addComponents(button)

                        await userDelivery.send({ content: ``, embeds: [embed], components: [row], files: [] }).catch((err) => {
                            if (err) {
                                return console.log(`user does not accept DMs`)
                            }
                        })
                        Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                        continue;
                    }
                    break;
                }
                case 'stripe': {
                    const pay_info = await checkpayStripe(data.payment_info[0].id_stripe);
                    if (pay_info === 'paid') {
                        let index = [];

                        let paymentStruct = {
                            id_stripe: data.payment_info[0].id_stripe,
                            method: "stripe",
                            total: data.payment_info[0].total,
                            invoice_page: data.payment_info[0].invoice_page,
                            creation_date: data.payment_info[0].creation_date,
                            approvation_date: agora,
                        }

                        index.push(paymentStruct)
                        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.status`, 'approved')
                        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.payment_info`, index)
                        response.status = 'sucess';
                    } else {
                        response.status = 'pending';
                    }
                    break;
                }
            }

            if (response.status !== 'sucess') {
                const expirate = new Date(data.info_order.expiration_date);

                if (agora >= expirate) {
                    await channelOrder.delete();
                    const userDelivery = await Guild.members.cache.get(data.info_order.id_costumer);
                    const dataButton = await Produtos.get(`Products.${data.id_product}.announce_info`);

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Ordem Cancelada`, iconURL: "https://cdn.discordapp.com/emojis/1251441415565738015.webp?size=96&quality=lossless" })
                        .setDescription(`Olá <@${data.info_order.id_costumer}>, a ordem com id: \`${data.id_order}\` foi cancelada.\nO tempo para concluir o pagamento se expirou.`)
                        .addFields({
                            name: `Informações do Pedido:`,
                            value: `Produto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(data.info_order.value).toFixed(2)}\` **-** \`${Number(data.info_order.amount)}\` unidade(s)`,
                            inline: true
                        })
                        .setColor(General.get('System.Colors.red'))
                        .setFooter({ text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) })
                        .setTimestamp();

                    const button = new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${dataButton[0].guildid}/${dataButton[0].channelid}`)
                        .setLabel('Nova Ordem')
                        .setStyle(5)

                    const row = new ActionRowBuilder().addComponents(button)

                    await userDelivery.send({ content: ``, embeds: [embed], components: [row], files: [] }).catch((err) => {
                        if (err) {
                            return console.log(`user does not accept DMs`)
                        }
                    })
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
                continue;
            }
        }
    }
}

async function approveOrder(client) {
    const dataOrderArray = Carrinhos.all();

    if (!Array.isArray(dataOrderArray) || dataOrderArray.length === 0) {
        return;
    }

    for (const orderEntry of dataOrderArray) {
        const userOrders = orderEntry.data;

        for (const carrinhoId in userOrders) {
            const data = userOrders[carrinhoId];

            if (data.status !== 'approved') continue;
            if (data.delivery == true) continue;

            if (!data.hook || !Array.isArray(data.hook) || data.hook.length === 0) {
                console.log(`[approveOrder] Pedido ${data.id_order} sem dados de hook - pulando.`);
                continue;
            }

            let err = {
                state: false,
                msg: ``
            }

            const Guild = client.guilds.cache.get(data.hook[0].guildid) || await client.guilds.fetch(data.hook[0].guildid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar guilda: ${data.hook[0].guildid} - Os dados foram deletados.`)
                    err = {
                        state: true,
                        msg: msg
                    }
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
            });
            if (err.state == true) continue;
            const channelOrder = Guild.channels.cache.get(data.hook[0].channelid) || await Guild.channels.fetch(data.hook[0].channelid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar canal: ${data.hook[0].channelid} - Os dados foram deletados.`)
                    err = {
                        state: true
                    }
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
            });
            if (err.state == true) continue;

            const msgOrder = await channelOrder.messages.fetch(data.hook[0].msgid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar mensagem: ${data.hook[0].msgid} - Os dados foram deletados.`)
                    err = {
                        state: true,
                        msg: msg
                    }
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
            });
            if (err.state == true) continue;

            const userbuy = Guild.members.cache.get(data.info_order.id_costumer) || await Guild.members.fetch(data.info_order.id_costumer).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar usuario: ${data.info_order.id_costumer} - Os dados foram deletados.`)
                    err = {
                        state: true,
                        msg: msg
                    }
                    Carrinhos.delete(`${data.info_order.id_costumer}.${data.id_order}`);
                }
            });
            if (err.state == true) continue;

            let delivery = await deliveryOrder(data, userbuy, Guild, client);

            switch (delivery.status) {
                case 'sucess': {
                    
                    await Produtos.add(`Products.${data.id_product}.sub_products.${data.id_variant}.info.vendas`, 1)
                    await Produtos.add(`Products.${data.id_product}.sub_products.${data.id_variant}.info.vendidos`, data.info_order.amount)
                    await Produtos.add(`Products.${data.id_product}.sub_products.${data.id_variant}.info.total`, data.info_order.value)

                    Console.logging(1, `"${data.id_order}" | Delivery order - 5/6`);

                    await msgOrder.edit({
                        content: `<@${data.info_order.id_costumer}> Ordem aprovada, este canal será excluido em 1 minuto.`,
                        embeds: [],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setURL(`https://discord.com/channels/@me/${delivery.data.channelid}/${delivery.data.msgid}`)
                                    .setLabel('Entrega')
                                    .setEmoji('1290144734529982474')
                                    .setStyle(5)
                            )
                        ],
                        files: []
                    });
                    await channelOrder.setName(`✅・Pagamento Aprovado`);

                    orderAdmApproved(data, Guild, client);
                    Console.logging(1, `"${data.id_order}" | Delivery order - 6/6`);
                    logorderApproved(data, delivery.data.announce, Guild, client);

                    setTimeout(() => {
                        channelOrder.delete();
                    }, 60 * 1000)

                    UpdateStock(data.id_product, client);
                    Console.logging(2, `order "${data.id_order}" concluida com sucesso!`);
                    break;
                }
                case 'out_of_stock': {
                    await channelOrder.setName(`🚫・Ordem Cancelada`);
                    Console.logging(1, `"${data.id_order}" | Out of stock - 2/4`);

                    await msgOrder.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: `Ordem Cancelada`, iconURL: "https://cdn.discordapp.com/emojis/1251441415565738015.webp?size=96&quality=lossless" })
                                .setDescription(`Olá <@${data.info_order.id_costumer}>, seu pedido foi cancelado por falta de estoque, qualquer dúvida ou problema, contate a admnistração.`)
                                .addFields({
                                    name: `Informações do Pedido:`,
                                    value: `id: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(data.info_order.value).toFixed(2)}\` **-** \`${Number(data.info_order.amount)}\` unidade(s)`,
                                    inline: true
                                })
                                .setColor(General.get('System.Colors.red'))
                                .setFooter({ text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) })
                                .setTimestamp()
                        ], components: [], files: []
                    });

                    await channelOrder.send({ content: `**Este carrinho será excluido em 1 minuto.**` });
                    Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.status`, 'cancelled');
                    Console.logging(1, `"${data.id_order}" | Out of stock - 4/4`);

                    setTimeout(() => {
                        channelOrder.delete();
                    }, 60 * 1000)
                    UpdateStock(data.id_product, client);
                    
                    Console.logging(5, `order cancelled: "${data.id_order}" - Out of stock`);
                    break;
                }
                case 'partial_stock': {
                    let response = ''

                    Console.logging(1, `"${data.id_order}" | Partial stock - 3/6`);
                    const rolecostumer = await General.get(`Config.Roles.costumer`);
                    const msgafterbuy = await General.get(`System.Marca.msgAuto`);
                    const idVouches = await General.get('Config.logs.feedbacks');
                    const channelVouches = await client.channels.cache.get(idVouches);

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Ordem Aprovada`, iconURL: "https://cdn.discordapp.com/emojis/1251441412596301845.webp?size=96&quality=lossless" })
                        .setDescription(`Olá <@${data.info_order.id_costumer}>, houve um problema com seu pedido, no momento da entrega a quantia restante de estoque era de \`${delivery.data.amount}\` unidade(s) e seu pedido era de \`${delivery.data.oldamount}\` unidade(s), a entrega parcial foi realizada.`)
                        .addFields(
                            {
                                name: `Informações do Pedido`, value: `id: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(delivery.data.value).toFixed(2)}\` **-** \`${Number(delivery.data.amount)}\` **unidade(s)**`, inline: true
                            }
                        )
                        .setColor(General.get('System.Colors.green'))
                        .setFooter(
                            { text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) }
                        )
                        .setTimestamp()

                    await channelOrder.setName(`✅・Pagamento Aprovado`);

                    if (delivery.data.amount <= 15) {
                        await userbuy.send({ embeds: [embed], components: [] }).then((msg) => {
                            Console.logging(1, `"${data.id_order}" | Partial stock - 4/6`);

                            userbuy.send(delivery.response);
                            Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);

                            const rowDm = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setURL(`https://discord.com/channels/@me/${msg.channel.id}/${msg.id}`)
                                    .setLabel('Entrega')
                                    .setEmoji('1290144734529982474')
                                    .setStyle(5)
                            )

                            msgOrder.edit({ content: `<@${data.info_order.id_costumer}> Ordem aprovada, este canal será excluido em 1 minuto.`, embeds: [], components: [rowDm], files: [] });
                            response = 'sucess'

                            setTimeout(() => {
                                if (channelVouches) {
                                    const buttonfedbak = new ButtonBuilder()
                                        .setURL(`https://discord.com/channels/${data.hook[0].guildid}/${idVouches}`)
                                        .setLabel('Deixe um feedback')
                                        .setEmoji('1276564807335809156')
                                        .setStyle(5)

                                    const rowfeedback = new ActionRowBuilder().addComponents(buttonfedbak)

                                    userbuy.send({ content: `${msgafterbuy !== '' ? msgafterbuy : `Olá <@${data.info_order.id_costumer}>, deu tudo certo com sua compra? não se esqueça de deixar seu feedback, para fortalecer nossa loja.`}`, components: [rowfeedback] });
                                }

                                channelOrder.delete();
                            }, 60 * 1000)

                        }).catch((error) => {
                            if (error.code === 50007) {
                                Console.logging(1, `"${data.id_order}" | Partial stock [error_delivery] - 1/3`);
                                response = 'error_send'
                            } else {
                                Console.logging(5, `"${data.id_order}" | Partial stock [error_delivery]`, error);
                                response = 'error'
                            }
                        });

                    } else {
                        await userbuy.send({ embeds: [embed], components: [] }).then((msg) => {
                            Console.logging(1, `"${data.id_order}" | Partial stock - 4/6`);

                            userbuy.send(delivery.response);
                            Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);

                            const rowDm = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setURL(`https://discord.com/channels/@me/${msg.channel.id}/${msg.id}`)
                                    .setLabel('Entrega')
                                    .setEmoji('1290144734529982474')
                                    .setStyle(5)
                            )

                            msgOrder.edit({ content: `<@${data.info_order.id_costumer}> Ordem aprovada, este canal será excluido em 1 minuto.`, embeds: [], components: [rowDm], files: [] });
                            fs.unlinkSync(`delivery-${data.id_order}.txt`);

                            response = 'sucess'

                            setTimeout(() => {
                                if (channelVouches) {
                                    const buttonfedbak = new ButtonBuilder()
                                        .setURL(`https://discord.com/channels/${data.hook[0].guildid}/${idVouches}`)
                                        .setLabel('Deixe um feedback')
                                        .setEmoji('1276564807335809156')
                                        .setStyle(5)

                                    const rowfeedback = new ActionRowBuilder().addComponents(buttonfedbak)

                                    userbuy.send({ content: `${msgafterbuy !== '' ? msgafterbuy : `Olá <@${data.info_order.id_costumer}>, deu tudo certo com sua compra? não se esqueça de deixar seu feedback, para fortalecer nossa loja.`}`, components: [rowfeedback] });
                                }

                                channelOrder.delete();
                            }, 60 * 1000)

                        }).catch((error) => {
                            if (error.code === 50007) {
                                Console.logging(1, `"${data.id_order}" | Partial stock [error_delivery] - 1/3`);
                                response = 'error_send'
                            } else {
                                Console.logging(5, `"${data.id_order}" | Partial stock [error_delivery]`, error);
                                response = 'error'
                            }
                        });
                    }
                    

                    if (response === 'error_send') {
                        Console.logging(1, `"${data.id_order}" | Partial stock - 4/6`);
                        if (delivery.data.amount <= 15) {
                            Console.logging(1, `"${data.id_order}" | Partial stock [error_delivery] - 2/3`);

                            await msgOrder.edit({ content: ``, embeds: [embed], components: [], files: [] });
                            await channelOrder.send(delivery.response);

                            Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);
                            
                            Console.logging(1, `"${data.id_order}" | Partial stock [error_delivery] - 3/3`);
                        } else {
                            Console.logging(1, `"${data.id_order}" | Partial stock [error_delivery] - 2/3`);

                            await msgOrder.edit({ content: ``, embeds: [embed], components: [] });
                            await channelOrder.send(delivery.response);
                            
                            Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);
                            fs.unlinkSync(`delivery-${data.id_order}.txt`)

                            Console.logging(1, `"${data.id_order}" | Partial stock [error_delivery] - 3/3`);
                        }

                        response = 'sucess'
                        Console.logging(2, `"${data.id_order}" | Partial stock [error_delivery] - resolved`);

                        channelOrder.send({ content: `**A ordem foi aprovada e o canal deverá ser excluido em 5 minutos.**` });
                        setTimeout(() => {
                            channelOrder.delete();
                        }, 5 * 60 * 1000)
                    }

                    if (response !== 'sucess') return console.log(`Error geral na entrega do pedido: ${data.id_order}`)
                    Console.logging(1, `"${data.id_order}" | Partial stock - 5/6`);


                    if (channelVouches) {
                        channelVouches.send({ content: `<@${data.info_order.id_costumer}>` }).then((msg) => {
                            msg.delete();
                        });
                    }
                    
                    orderAdmApproved(data, Guild, client);
                    logorderApproved(data, delivery.data.announce, Guild, client);
                    
                    await Produtos.add(`Products.${data.id_product}.sub_products.${data.id_variant}.info.vendas`, 1)
                    await Produtos.add(`Products.${data.id_product}.sub_products.${data.id_variant}.info.vendidos`, Number(delivery.data.oldamount));
                    await Produtos.add(`Products.${data.id_product}.sub_products.${data.id_variant}.info.total`, Number(delivery.data.value));
                    Console.logging(1, `"${data.id_order}" | Partial stock - 6/6`);

                    if (rolecostumer && rolecostumer !== '') {
                        if (!userbuy.roles.cache.has(rolecostumer)) {
                            try {
                                await userbuy.roles.add(rolecostumer);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }

                    const dataVariantPartial = await Produtos.get(`Products.${data.id_product}.sub_products.${data.id_variant}`);
                    if (dataVariantPartial && dataVariantPartial.role && dataVariantPartial.role !== '') {
                        if (!userbuy.roles.cache.has(dataVariantPartial.role)) {
                            try {
                                await userbuy.roles.add(dataVariantPartial.role);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }

                    UpdateStock(data.id_product, client);
                    Console.logging(2, `order "${data.id_order}" concluida com sucesso!`);
                    break;
                }
                case 'error_delivery': {

                    if (data.info_order.amount <= 15) {
                        await channelOrder.setName(`✅・Pagamento Aprovado`);
                        await msgOrder.edit({ embeds: [delivery.data.embed], components: [], files: [] });
                        Console.logging(1, `"${data.id_order}" | Error delivery - 2/4`);
                        
                        await channelOrder.send({ embeds: [delivery.data.embed_delivery], components: [delivery.data.components], files: [] });
                        await channelOrder.send({ content: `**A ordem foi aprovada e o canal deverá ser excluido em 5 minutos.**` });
                        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);
                        Console.logging(1, `"${data.id_order}" | Error delivery - 3/4`);
                    } else {
                        delivery.data.embed_delivery.setDescription(`A entrega do produto foi anexada acima desta mensagem.`)
                        await channelOrder.setName(`✅・Pagamento Aprovado`);
                        
                        await msgOrder.edit({ embeds: [delivery.data.embed], components: [], files: [] });
                        Console.logging(1, `"${data.id_order}" | Error delivery - 2/4`);

                        await channelOrder.send({ embeds: [delivery.data.embed_delivery], components: [delivery.data.components], files: [delivery.data.file] });
                        await channelOrder.send({ content: `**A ordem foi aprovada e o canal deverá ser excluido em 5 minutos.**` });
                        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);

                        fs.unlinkSync(delivery.data.file.name);
                        Console.logging(1, `"${data.id_order}" | Error delivery - 3/4`);
                    }

                    orderAdmApproved(data, Guild, client);
                    Console.logging(1, `"${data.id_order}" | Error delivery - 4/4`);
                    logorderApproved(data, delivery.data.announce, Guild, client);

                    setTimeout(() => {
                        channelOrder.delete();
                    }, 5 * 60 * 1000)


                    UpdateStock(data.id_product, client);
                    Console.logging(2, `order "${data.id_order}" concluida com sucesso!`);
                    break;
                }
            }
        }
    }
}

async function deliveryOrder(data, userDelivery, Guild, client) {
    const dataVariant = await Produtos.get(`Products.${data.id_product}.sub_products.${data.id_variant}`);
    const dataAnnounce = await Produtos.get(`Products.${data.id_product}.announce_info`);

    Console.logging(1, `"${data.id_order}" | Delivery order - 1/6`);
    let stockControl = dataVariant.stock
    let items_delivery = [];

    let control = {
        status: "",
        data: {}
    }
    if (dataVariant.stock.length === 0) {
        Console.logging(1, `"${data.id_order}" | Out of stock - 1/4`);
        return control = {
            status: "out_of_stock"
        }
    }
    if (dataVariant.stock.length < data.info_order.amount) {
        Console.logging(1, `"${data.id_order}" | Partial stock - 1/6`);
        const Newvalue = Number(stockControl.length * dataVariant.price).toFixed(2)
        const amount = Number(stockControl.length)

        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.amount`, Number(amount));
        await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.value`, Newvalue);

        items_delivery = stockControl.splice(0, Number(dataVariant.stock.length));
        Produtos.set(`Products.${data.id_product}.sub_products.${data.id_variant}.stock`, stockControl);
        Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.products_delivery`, items_delivery);

        const rowdeliveryPartial = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ItemsOrder_${data.info_order.id_costumer}_${data.id_order}`)
                .setLabel('Copiar Produtos')
                .setEmoji('1349633661552562317')
                .setStyle(2),
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/@me/${dataAnnounce[0].channelid}/${dataAnnounce[0].msgid}`)
                .setLabel('Comprar Novamente')
                .setStyle(5))

        if (stockControl.length <= 0) {
            logstockempty(data, client)
        }

        if (amount > 15) {
            const fileName = `delivery-${data.id_order}.txt`;

            fs.writeFileSync(fileName, `${items_delivery.join("\n")}`);

            const fileBuffer = fs.readFileSync(fileName);
            const filedata = new AttachmentBuilder(fileBuffer, { name: fileName });

            Console.logging(1, `"${data.id_order}" | Partial stock - 2/6`);
            return control = {
                status: "partial_stock",
                response: {
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `Entrega do Produto`, iconURL: "https://cdn.discordapp.com/emojis/1251441271181148160.webp?size=96&quality=lossless" })
                            .setDescription(`A entrega do produto foi anexada acima desta mensagem.`)
                            .setColor(General.get('System.Colors.green'))

                    ],
                    components: [rowdeliveryPartial],
                    files: [filedata]
                },
                data: {
                    oldvalue: data.info_order.value,
                    oldamount: data.info_order.amount,
                    amount: amount,
                    value: Newvalue,
                    announce: dataAnnounce
                }
            }
        } else {
            Console.logging(1, `"${data.id_order}" | Partial stock - 2/6`);
            return control = {
                status: "partial_stock",
                response: {
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `Entrega do Produto`, iconURL: "https://cdn.discordapp.com/emojis/1251441271181148160.webp?size=96&quality=lossless" })
                            .setDescription(`\`\`\`${items_delivery.join("\n")}\`\`\``)
                            .setColor(General.get('System.Colors.green'))
                    ],
                    components: [rowdeliveryPartial],
                    files: []
                },
                data: {
                    oldvalue: data.info_order.value,
                    oldamount: data.info_order.amount,
                    amount: amount,
                    value: Newvalue,
                    announce: dataAnnounce
                }
            }
        }
    }

    const rolecostumer = await General.get(`Config.Roles.costumer`);
    const msgafterbuy = await General.get(`System.Marca.msgAuto`);
    const idVouches = await General.get('Config.logs.feedbacks');

    const channelVouches = await client.channels.cache.get(idVouches);
    if (rolecostumer && rolecostumer !== '') {
        if (!userDelivery.roles.cache.has(rolecostumer)) {
            try {
                await userDelivery.roles.add(rolecostumer);
            } catch (error) {
                console.error(error);
            }
        }
    }

    if (dataVariant.role && dataVariant.role !== '') {
        if (!userDelivery.roles.cache.has(dataVariant.role)) {
            try {
                await userDelivery.roles.add(dataVariant.role);
            } catch (error) {
                console.error(error);
            }
        }
    }

    items_delivery = stockControl.splice(0, Number(data.info_order.amount))
    Produtos.set(`Products.${data.id_product}.sub_products.${data.id_variant}.stock`, stockControl);
    Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.products_delivery`, items_delivery)
    Console.logging(1, `"${data.id_order}" | Delivery order - 2/6`);


    const embed = new EmbedBuilder()
        .setAuthor({ name: `Ordem Aprovada`, iconURL: "https://cdn.discordapp.com/emojis/1251441412596301845.webp?size=96&quality=lossless" })
        .setDescription(`Olá <@${data.info_order.id_costumer}> seu pedido foi aprovado, as informações do pedido estão abaixo.`)
        .addFields(
            {
                name: `Informações do Pedido`, value: `id: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`R$ ${Number(data.info_order.value).toFixed(2)}\` **-** \`${Number(data.info_order.amount)}\` **unidade(s)**`, inline: true
            }
        )
        .setColor(General.get('System.Colors.green'))
        .setFooter(
            { text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp()

    const copyitems = new ButtonBuilder()
        .setCustomId(`ItemsOrder_${data.info_order.id_costumer}_${data.id_order}`)
        .setLabel('Copiar Produtos')
        .setEmoji('1349633661552562317')
        .setStyle(2)
    const newBuy = new ButtonBuilder()
        .setURL(`https://discord.com/channels/@me/${dataAnnounce[0].channelid}/${dataAnnounce[0].msgid}`)
        .setLabel('Comprar Novamente')
        .setStyle(5)

    const rowNotify = new ActionRowBuilder().addComponents(copyitems, newBuy)
    const remainStock = Produtos.get(`Products.${data.id_product}.sub_products.${data.id_variant}.stock`);
    Console.logging(1, `"${data.id_order}" | Delivery order - 3/6`);

    let embedEntrega;

    if (items_delivery.length <= 15) {
        embedEntrega = new EmbedBuilder()
            .setAuthor({ name: `Entrega do Produto`, iconURL: "https://cdn.discordapp.com/emojis/1251441271181148160.webp?size=96&quality=lossless" })
            .setDescription(`\`\`\`${items_delivery.join("\n")}\`\`\``)
            .setColor(General.get('System.Colors.green'))

        await userDelivery.send({ embeds: [embed] }).then((msg) => {

            userDelivery.send({ embeds: [embedEntrega], components: [rowNotify] });
            Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);

            if (remainStock <= 0) {
                logstockempty(data, client)
            }

            setTimeout(() => {
                if (channelVouches) {
                    const buttonfedbak = new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${data.hook[0].guildid}/${idVouches}`)
                        .setLabel('Deixe um feedback')
                        .setEmoji('1276564807335809156')
                        .setStyle(5)

                    const rowfeedback = new ActionRowBuilder().addComponents(buttonfedbak)

                    userDelivery.send({ content: `${msgafterbuy !== '' ? msgafterbuy : `Olá <@${data.info_order.id_costumer}>, deu tudo certo com sua compra? não se esqueça de deixar seu feedback, para fortalecer nossa loja.`}`, components: [rowfeedback] });
                }
            }, 60 * 1000)

            control = {
                status: "sucess",
                data: {
                    msgid: msg.id,
                    channelid: msg.channel.id,
                    announce: dataAnnounce
                }
            }
            Console.logging(1, `"${data.id_order}" | Delivery order - 4/6`);
        }).catch((error) => {
            if (error.code === 50007) {
                Console.logging(1, `"${data.id_order}" | Error delivery - 1/6`);
                control = {
                    status: "error_delivery",
                    msg: "DM do cliente está fechada",
                    data: {
                        items: items_delivery,
                        embed: embed,
                        embed_delivery: embedEntrega,
                        components: rowNotify,
                        announce: dataAnnounce
                    }
                }
            } else {
                Console.logging(5, `"${data.id_order}" | Error_delivery[15<]`, error);
                control = {
                    status: "error",
                    data: error
                }
            }
        });
    } else {
        embedEntrega = new EmbedBuilder()
            .setAuthor({ name: `Entrega do Produto`, iconURL: "https://cdn.discordapp.com/emojis/1251441271181148160.webp?size=96&quality=lossless" })
            .setColor(General.get('System.Colors.green'))

        const fileName = `delivery-${data.id_order}.txt`;

        fs.writeFileSync(fileName, `${items_delivery.join("\n")}`);

        const fileBuffer = fs.readFileSync(fileName);
        const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

        await userDelivery.send({ embeds: [embed] }).then((msg) => {
            embedEntrega.setDescription(`A entrega do produto foi anexada acima desta mensagem.`)

            userDelivery.send({ embeds: [embedEntrega], components: [rowNotify], files: [attachment] });
            Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.delivery`, true);

            if (remainStock <= 0) {
                logstockempty(data, client)
            }

            setTimeout(() => {
                if (channelVouches) {
                    const buttonfedbak = new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${data.hook[0].guildid}/${idVouches}`)
                        .setLabel('Deixe um feedback')
                        .setEmoji('1276564807335809156')
                        .setStyle(5)

                    const rowfeedback = new ActionRowBuilder().addComponents(buttonfedbak)

                    userDelivery.send({ content: `${msgafterbuy !== '' ? msgafterbuy : `Olá <@${data.info_order.id_costumer}>, deu tudo certo com sua compra? não se esqueça de deixar seu feedback, para fortalecer nossa loja.`}`, components: [rowfeedback] });
                }
            }, 60 * 1000)

            control = {
                status: "sucess",
                data: {
                    msgid: msg.id,
                    channelid: msg.channel.id,
                    announce: dataAnnounce
                }
            }
            Console.logging(1, `"${data.id_order}" | Delivery order - 4/6`);
            fs.unlinkSync(fileName);

        }).catch((error) => {
            if (error.code === 50007) {
                Console.logging(5, `"${data.id_order}" | Error send dm user - UserId:"${data.info_order.id_costumer}"`);
                Console.logging(1, `"${data.id_order}" | Error delivery - 1/6`);
                embedEntrega.setDescription(`A entrega do produto foi anexada acima desta mensagem.`)

                control = {
                    status: "error_delivery",
                    msg: "DM do cliente está fechada",
                    data: {
                        items: items_delivery,
                        embed: embed,
                        embed_delivery: embedEntrega,
                        components: rowNotify,
                        announce: dataAnnounce,
                        file: attachment
                    }
                }
            } else {
                Console.logging(5, `"${data.id_order}" | Error_delivery[15>]`, error);
                control = {
                    status: "error",
                    data: error
                }
            }
        });

    }

    if (channelVouches) {
        channelVouches.send({ content: `<@${data.info_order.id_costumer}>` }).then((msg) => {
            msg.delete();
        });
    }

    return control;
}

module.exports = {
    openCart,
    finishOrder,
    order,
    processOrder,
    approveOrder
}