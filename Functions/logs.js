const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, MessageFlagsBitField } = require("discord.js");
const { General, Produtos, Carrinhos, Tickets } = require("../Database/index");
const { Console } = require("../Functions/console")

async function logorderApproved(data, dataAnnounce, Guild, client) {
    const LogsID = await General.get('Config.logs.VendasPUB');
    const channel = await client.channels.cache.get(LogsID);
    
    if (!channel) return Console.logging(3, `Logs de pedidos [PUBLIC], Não definido.`);

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Ordem Aprovada`, iconURL: "https://cdn.discordapp.com/emojis/1251441412596301845.webp?size=96&quality=lossless" })
        .setTitle(`Compra realizada`)
        .addFields(
            {
                name: `Informações do Pedido`, value: `Produto: **${data.info_order.item}**\nValor Total: \`${formattedPrice.format(Number(data.info_order.value))}\` **-** \`${Number(data.info_order.amount)}\` **unidade(s)**`, inline: true
            }
        )
        .setColor(General.get('System.Colors.main'))
        .setFooter(
            { text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp();

    const newBuy = new ButtonBuilder()
        .setURL(`https://discord.com/channels/${dataAnnounce[0].guildid}/${dataAnnounce[0].channelid}`)
        .setLabel('Comprar')
        .setEmoji('1297811409132064768')
        .setStyle(5)

    const rowNotify = new ActionRowBuilder().addComponents(newBuy)

    channel.send({
        embeds: [embed], components: [rowNotify]
    });
}

async function orderAdmApproved(data, Guild, client) {
    const IDchannel = await General.get(`Config.logs.VendasADM`)
    const channel = await client.channels.cache.get(IDchannel)
    if (!channel) return Console.logging(3, `Logs de pedidos [ADM], Não definido.`);

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Ordem Aprovada`, iconURL: "https://cdn.discordapp.com/emojis/1251441412596301845.webp?size=96&quality=lossless" })
        .setDescription(`Comprador: <@${data.info_order.id_costumer}> `)
        .addFields(
            {
                name: `Informações do Pedido`, value: `id: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`${formattedPrice.format(Number(data.info_order.value))}\` **-** \`${Number(data.info_order.amount)}\` **unidade(s)**`, inline: true
            }
        )
        .setColor(General.get('System.Colors.green'))
        .setFooter(
            { text: `${Guild.name}`, iconURL: Guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp()


    channel.send({
        embeds: [embed], components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`ItemsOrder_${data.info_order.id_costumer}_${data.id_order}`)
                    .setLabel('Produto(s) Entregue')
                    .setEmoji('1349633661552562317')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId(`refundOrder_${data.info_order.id_costumer}_${data.id_order}`)
                    .setLabel('Reembolsar')
                    .setStyle(2))
        ]
    })
}

async function logorderCreate(data, user, interaction, client) {
    const idChannel = await General.get(`Config.logs.VendasADM`);
    const channel = await client.channels.cache.get(idChannel)

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    let embed = new EmbedBuilder()
        .setAuthor({ name: `Ordem Criada`, iconURL: "https://cdn.discordapp.com/emojis/1251441414039142462.webp?size=96&quality=lossless" })
        .setDescription(`Comprador: <@${data.info_order.id_costumer}> `)
        .addFields(
            {
                name: `Informações do Pedido`, value: `id: \`${data.id_order}\`\nProduto: **${data.info_order.item}**\nValor Total: \`${formattedPrice.format(Number(data.info_order.value))}\` **-** \`${Number(data.info_order.amount)}\` **unidade(s)**`, inline: true
            }
        )
        .setColor(General.get('System.Colors.yellow'))
        .setFooter(
            { text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp()

    const buttonadm = new ButtonBuilder()
        .setURL(`https://discord.com/channels/${interaction.guild.id}/${data.hook[0].channelid}`)
        .setLabel('Ver Ordem')
        .setStyle(5)

    const rowadm = new ActionRowBuilder().addComponents(buttonadm)

    if (!channel) {
        embed.setDescription(`Olá <@${data.info_order.id_costumer}> sua ordem foi criada com sucesso.\nProssiga para o pagamento.`)
        user.send({ embeds: [embed] }).catch((error) => {
            if (error) {
                return console.log(`Ordem ${data.id_order} criada com sucesso.\nCaixa de mensagens privadas do usuario ${data.info_order.id_costumer} está desabilitada.`)
            }
        });
        return Console.logging(3, `Logs de pedidos [ADM], Não definido.`);
    }

    channel.send({
        embeds: [embed], components: [rowadm]
    });

    embed.setDescription(`Olá <@${data.info_order.id_costumer}> sua ordem foi criada com sucesso.\nProssiga para o pagamento.`)

    user.send({ embeds: [embed] }).then(() => {
        return Console.logging(2, `Ordem: "${data.id_order}" criada com sucesso.`);
    }).catch((error) => {
        if (error) {
            return Console.logging(2, `Ordem: "${data.id_order}" criada com sucesso | Mensagens privadas do usuario ${data.info_order.id_costumer} estão desabilitadas.`);
        }
    });
}

async function logstockempty(data, client) {
    const idChannel = await General.get(`Config.logs.Sistema`);
    const channel = await client.channels.cache.get(idChannel)
    if (!channel) return Console.logging(3, `Logs do Sistema [ADM], Não definido.`);

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Estoque Esgotado`, iconURL: "https://cdn.discordapp.com/emojis/1251441273777164298.webp?size=96&quality=lossless" })
        .setDescription(`O estoque da variante: **${data.info_order.item}** se esgotou, considere gerenciar seu estoque.\nPode iniciar o gerenciamento clicando no botão logo abaixo.`)
        .setColor(General.get('System.Colors.yellow'))
        .setTimestamp()

    const buttonadm = new ButtonBuilder()
        .setCustomId(`estoqueSubproduct_${data.id_product}_${data.id_variant}`)
        .setLabel('Gerenciar Estoque')
        .setStyle(2)

    const rowadm = new ActionRowBuilder().addComponents(buttonadm)

    if (!channel) return console.log('Canal inválido para logs de sistema')

    channel.send({
        content: `<@&${General.get(`Config.Roles.staff`)}>`, embeds: [embed], components: [rowadm]
    });

}

async function logcloseTicket(data, interaction, client) {
    const idChannel = await General.get(`Config.logs.ticketChannel`);
    const channel = await client.channels.cache.get(idChannel);
    if (!channel) return Console.logging(3, `Logs de ticket [ADM], Não definido.`);

    const now = new Date();
    const options = {
        timeZone: "America/Sao_Paulo", hour12: false,
        hour: "2-digit", minute: "2-digit",
        day: "2-digit", month: "2-digit",
    };

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Atendimento Finalizado`, iconURL: "https://cdn.discordapp.com/emojis/1251441496104636496.webp?size=96&quality=lossless" })
        .addFields(
            {
                name: `Informações do Atendimento`, value: `id: \`${data.id_ticket}\`\nUsuário: <@${data.info.id_user}>\nQuem Fechou: ${interaction.user}\nFechado em: \`${now.toLocaleString("pt-BR", options)}\``, inline: true
            }
        )
        .setColor(General.get("System.Colors.yellow"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })


    channel.send({
        embeds: [embed]
    });
}

module.exports = {
    logorderApproved,
    logorderCreate,
    logstockempty,
    orderAdmApproved,
    logcloseTicket
}