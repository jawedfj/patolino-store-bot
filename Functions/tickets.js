const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, MessageFlagsBitField } = require("discord.js");
const { General, Produtos, Carrinhos, Tickets } = require("../Database/index");
const { timing, genRandomString, createID, downloadFile, notifyStock } = require("./utils")
const { logcloseTicket } = require("./logs")


async function createticketPanel(channel, client, interaction) {
    const data = Tickets.get(`Panel`)

    let row;

    if (data.funcoes.length === 1) {
        const button = new ButtonBuilder()
            .setCustomId(`AbrirTicket_${data.funcoes[0].id}`)
            .setLabel(data.funcoes[0].title)
            .setEmoji(data.funcoes[0].emoji)
            .setStyle(2)

        row = new ActionRowBuilder().addComponents(button)

    } else {
        const select = new StringSelectMenuBuilder()
            .setCustomId('Abrirticket')
            .setPlaceholder('Selecione uma opção de atendimento');


        for (const func of data.funcoes) {

            const option = {
                label: `${func.title}`,
                description: `${func.desc}`,
                value: func.id,
                emoji: func.emoji
            }

            select.addOptions(option);
        }
        row = new ActionRowBuilder().addComponents(select);
    }

    const embed = new EmbedBuilder()
        .setTitle(`${data.title}`)
        .setDescription(`${data.description}`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()


    if (data.bannerURL !== '') {
        embed.setImage(`${data.bannerURL}`)
    }
    if (data.iconURL !== '') {
        embed.setThumbnail(`${data.iconURL}`)
    }

    if (data.funcoes.length === 1) {
        channel.send({ components: [row], embeds: [embed] }).then(msg => {
            Tickets.push(`Panel.announce`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
            const buttonView = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver painel`)
                    .setStyle(5)
            )
            interaction.update({ content: `Painel enviado com sucesso.`, components: [buttonView], flags: MessageFlagsBitField.Flags.Ephemeral });
        }).catch((error) => {
            console.log(error)
        })
    } else {
        channel.send({ components: [row], embeds: [embed] }).then(msg => {
            Tickets.push(`Panel.announce`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
            const buttonView = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver painel`)
                    .setStyle(5)
            )
            interaction.update({ content: `Painel enviado com sucesso.`, components: [buttonView], flags: MessageFlagsBitField.Flags.Ephemeral });
        }).catch((error) => {
            console.log(error)
        })
    }

}

async function updateticketPanel(data, client, interaction) {

    let row;

    if (data.funcoes.length === 1) {
        const button = new ButtonBuilder()
            .setCustomId(`AbrirTicket_${data.funcoes[0].id}`)
            .setLabel(data.funcoes[0].title)
            .setEmoji(data.funcoes[0].emoji)
            .setStyle(2)

        row = new ActionRowBuilder().addComponents(button)

    } else {
        const select = new StringSelectMenuBuilder()
            .setCustomId('Abrirticket')
            .setPlaceholder('Selecione uma opção de atendimento');

        for (const func of data.funcoes) {

            const option = {
                label: `${func.title}`,
                description: `${func.desc}`,
                value: func.id,
                emoji: func.emoji
            }

            select.addOptions(option);
        }
        row = new ActionRowBuilder().addComponents(select);
    }

    const embed = new EmbedBuilder()
        .setTitle(`${data.title}`)
        .setDescription(`${data.description}`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()


    if (data.bannerURL !== '') {
        embed.setImage(`${data.bannerURL}`)
    }
    if (data.iconURL !== '') {
        embed.setThumbnail(`${data.iconURL}`)
    }

    for (let i = 0; i < data.announce.length; i++) {
        const annc = data.announce[i];

        const channel = await client.channels.cache.get(annc.channelid);
        if (!channel) {
            console.log(`Canal não encontrado, removendo anúncio ${i}`);
            data.announce.splice(i, 1);
            i--;
            continue;
        }

        const msg = await channel.messages.fetch(annc.msgid).catch(() => null);
        if (!msg) {
            console.log(`Mensagem não encontrada, removendo anúncio ${i}`);
            data.announce.splice(i, 1);
            i--;
            continue;
        }

        try {
            await msg.edit({ components: [row], embeds: [embed] });

            const buttonView = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver painel`)
                    .setStyle(5)
            );

            interaction.editReply({
                content: `Alterado com sucesso.`,
                components: [buttonView],
                flags: MessageFlagsBitField.Flags.Ephemeral
            });
        } catch (error) {
            console.log(`Erro ao editar mensagem: ${error}`);
        }
    }
}

async function updateticketinfoPanel(data, client, interaction) {

    let row;

    if (data.funcoes.length === 1) {
        const button = new ButtonBuilder()
            .setCustomId(`AbrirTicket_${data.funcoes[0].id}`)
            .setLabel(data.funcoes[0].title)
            .setEmoji(data.funcoes[0].emoji)
            .setStyle(2)

        row = new ActionRowBuilder().addComponents(button)

    } else {
        const select = new StringSelectMenuBuilder()
            .setCustomId('Abrirticket')
            .setPlaceholder('Selecione uma opção de atendimento');

        for (const func of data.funcoes) {

            const option = {
                label: `${func.title}`,
                description: `${func.desc}`,
                value: func.id,
                emoji: func.emoji
            }

            select.addOptions(option);
        }
        row = new ActionRowBuilder().addComponents(select);
    }

    const embed = new EmbedBuilder()
        .setTitle(`${data.title}`)
        .setDescription(`${data.description}`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()


    if (data.bannerURL !== '') {
        embed.setImage(`${data.bannerURL}`)
    }
    if (data.iconURL !== '') {
        embed.setThumbnail(`${data.iconURL}`)
    }

    for (let i = 0; i < data.announce.length; i++) {
        const annc = data.announce[i];

        const channel = await client.channels.cache.get(annc.channelid);
        if (!channel) {
            console.log(`Canal não encontrado, removendo anúncio ${i}`);
            data.announce.splice(i, 1);
            i--;
            continue;
        }

        const msg = await channel.messages.fetch(annc.msgid).catch(() => null);
        if (!msg) {
            console.log(`Mensagem não encontrada, removendo anúncio ${i}`);
            data.announce.splice(i, 1);
            i--;
            continue;
        }

        try {
            await msg.edit({ components: [row], embeds: [embed] });
        } catch (error) {
            console.log(`Erro ao editar mensagem: ${error}`);
        }
    }
}

async function openTicket(data, func, client, interaction) {

    if (data.funcoes.length == 0) return interaction.reply({ content: `Esta função não existe ou foi deletada.`, flags: MessageFlagsBitField.Flags.Ephemeral });

    const Oldthread = interaction.channel.threads.cache.find(x => x.name.includes(interaction.user.id));

    if (Oldthread !== undefined) {
        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${Oldthread.id}`)
                    .setLabel('Ir para o Ticket')
                    .setStyle(5)
            )

        return interaction.reply({ content: `Você já possuí um atendimento aberto!`, components: [row4], flags: MessageFlagsBitField.Flags.Ephemeral });
    }
    await interaction.reply({ content: `Aguarde seu ticket esta sendo criado..`, flags: MessageFlagsBitField.Flags.Ephemeral });

    const thread = await interaction.channel.threads.create({
        name: `✉️・${func.title}・${interaction.user.id}`,
        autoArchiveDuration: 10080,
        type: ChannelType.PrivateThread,
        reason: 'ticket',
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
                id: General.get('Config.Roles.staff'),
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

    interaction.editReply({
        content: `Carrinho criado com sucesso!`,
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                        .setLabel('Ir para o ticket')
                        .setStyle(5)
                )
        ]
    });

    updateticketinfoPanel(data, client, interaction);

    let ticketID;

    do {
        ticketID = createID();
    } while (await Carrinhos.get(`${interaction.user.id}.${ticketID}`));

    let Struct = {
        status: 'open', //'closed'
        id_ticket: ticketID,
        id_function: func.id,
        info: {
            id_user: interaction.user.id,
            id_staff: '',
            opened_date: new Date(),
            closed_date: '',
            transcriptUrl: '',
        },
        hook: [],
    }

    await Tickets.set(`tickets.${interaction.user.id}.${ticketID}`, Struct);

    const embed = new EmbedBuilder()
        .setTitle(`${data.title}`)
        .setDescription(`Olá ${interaction.user}.
${data.description}`)
        .setColor(General.get('System.Colors.main'))
        .setFooter(
            { text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )

    if (data.bannerURL !== '') {
        embed.setImage(`${data.bannerURL}`)
    }
    if (data.iconURL !== '') {
        embed.setThumbnail(`${data.bannerURL}`)
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`notifyuser_${interaction.user.id}_${ticketID}`)
            .setLabel('Notificar')
            .setEmoji('1251441491679645698')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`closeTicket_${interaction.user.id}_${ticketID}`)
            .setLabel('Fechar Ticket')
            .setEmoji('1251441411266711573')
            .setStyle(4)
    );

    await thread.send({ components: [row], embeds: [embed], content: `${interaction.user} | <@&${General.get('Config.Roles.staff')}>` }).then((msg) => {
        Tickets.push(`tickets.${interaction.user.id}.${ticketID}.hook`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
    })
}

async function notifyTicket(data, user, interaction, client) {

    const embed = new EmbedBuilder()
        .setTitle(`Lembrete`)
        .setDescription(`Olá ${user}, um responsável pelo seu ticket está solicitando sua presença.`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })


    const button = new ButtonBuilder()
        .setURL(`https://discord.com/channels/${data.hook[0].guildid}/${data.hook[0].channelid}`)
        .setLabel(`Ir até o Ticket`)
        .setStyle(5)

    const row = new ActionRowBuilder().addComponents(button)

    await user.send({
        content: ``,
        embeds: [embed],
        components: [row]
    }).then(() => {
        return interaction.reply({ content: `Usuario notificado com sucesso!`, flags: MessageFlagsBitField.Flags.Ephemeral });
    }).catch((err) => {
        if (!err) return
        if (err.code === 50007) {

            return interaction.reply({
                content: `${user}\nO usuario está com a DM fechada para este ou mais servidores.
Portanto não foi possivel notifica-lo em sua DM, mas mencionei ele para que veja. :)`,
                embeds: [],
                components: [],
            })
        }
        if (err) return;
    });
}

async function closeTicket(data, user, channel, interaction, client) {

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Atendimento Finalizado`, iconURL: "https://cdn.discordapp.com/emojis/1251441496104636496.webp?size=96&quality=lossless" })
        .setDescription(`Olá ${user}\nSeu atendimento com id: \`${data.id_ticket}\` foi finalizado.
Caso tenha alguma pendencia não resolvida, não hesite, abra um novo ticket.`)
        .setColor(General.get("System.Colors.red"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })


    await Tickets.set(`tickets.${data.info.id_user}.${data.id_ticket}.status`, 'closed');
    await Tickets.set(`tickets.${data.info.id_user}.${data.id_ticket}.closed_date`, new Date());
    logcloseTicket(data, interaction, client)

    try {
        channel.delete();
        await user.send({
            content: ``,
            embeds: [embed]
        });
    } catch (error) {
        if (error) return;
    }
}

module.exports = {
    createticketPanel,
    updateticketPanel,
    openTicket,
    notifyTicket,
    closeTicket
}