const { ActionRowBuilder, ChannelSelectMenuBuilder, MessageFlagsBitField, ChannelType } = require("discord.js");
const { createticketPanel, updateticketPanel, openTicket, notifyTicket, closeTicket } = require("../../Functions/tickets")
const { Tickets, General } = require("../../Database/index")


module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {

        const CustomId = interaction.customId;
        const ButtonAction = interaction.isButton();
        const ChannelSelectAction = interaction.isChannelSelectMenu();
        const SelectAction = interaction.isStringSelectMenu();


        if (ButtonAction) {
            const [CustomId, UserID, TicketID] = interaction.customId.split('_');

            switch (CustomId) {
                case "sendTicketPanel": {
                    const data = await Tickets.get(`Panel`)

                    if (data.funcoes.length < 1) {
                        console.error("É necessário ao menos uma função para enviar o painel de atendimento.");
                        return interaction.reply({ content: `É necessário ao menos uma função para enviar o painel de atendimento.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`setTicketAnnounce`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            )
                    ];

                    await interaction.reply({
                        content: `Selecione o canal para enviar o painel de ticket.`,
                        embeds: [],
                        components: components,
                        flags: MessageFlagsBitField.Flags.Ephemeral
                    });
                    break;
                }
                case "updateTicketPanel": {
                    const data = Tickets.get(`Panel`)

                    if (data.announce.length === 0) {
                        return interaction.reply({ content: `O anuncio não foi postado para atualizar`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    if (data.funcoes.length === 0) {
                        return interaction.reply({ content: `Não possui funções para atualizar`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    interaction.reply({ content: `Atualizando painel`, flags: MessageFlagsBitField.Flags.Ephemeral });

                    await updateticketPanel(data, client, interaction);
                    break;
                }
                case "AbrirTicket": {
                    const data = await Tickets.get(`Panel`);

                    if (data.funcoes.length == 0) {
                        interaction.reply({ content: `Não foi possivel abrir o ticket, aguarde.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                        return console.log('panel ticket does not have function valid')
                    }

                    const funct = data.funcoes[0];

                    await openTicket(data, funct, client, interaction);
                    break;
                }
                case "notifyuser": {
                    if (!General.get('owner').includes(interaction.user.id) && !interaction.member.roles.cache.has(General.get("Config.Roles.admin")) && !interaction.member.roles.cache.has(General.get("Config.Roles.staff"))) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para isso.`, flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }

                    const data = await Tickets.get(`tickets.${UserID}.${TicketID}`);
                    if (!data) return

                    const userLocale = await interaction.guild.members.cache.get(UserID);

                    if (!userLocale) {
                        return interaction.reply({ content: `Não foi possivel localizar o usuario, ele não se encontra no servidor.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    await notifyTicket(data, userLocale, interaction, client);
                    break;
                }
                case "closeTicket": {
                    if (!General.get('owner').includes(interaction.user.id) && !interaction.member.roles.cache.has(General.get("Config.Roles.admin")) && !interaction.member.roles.cache.has(General.get("Config.Roles.staff"))) {
                        interaction.reply({
                            content: `Espere! Você não tem permissão para isso.`, flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                        return;
                    }
                    const chnnel = interaction.channel;
                    const data = await Tickets.get(`tickets.${UserID}.${TicketID}`);

                    if (!data) return chnnel.delete();
                    const userLocale = await interaction.guild.members.cache.get(UserID);

                    if (!userLocale) {
                        chnnel.delete();
                        await Tickets.set(`tickets.${data.info.id_user}.${data.id_ticket}.status`, 'closed');
                        await Tickets.set(`tickets.${data.info.id_user}.${data.id_ticket}.closed_date`, new Date());
                        return interaction.reply({ content: `Não foi possivel localizar o usuario, ele não se encontra no servidor.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    await closeTicket(data, userLocale, chnnel, interaction, client);
                    break;
                }
            }
        }
        if (ChannelSelectAction) {
            switch (CustomId) {
                case "setTicketAnnounce": {
                    const channel = await client.channels.cache.get(interaction.values[0])
                    createticketPanel(channel, client, interaction);
                    break;
                }
            }
        }
        if (SelectAction) {
            const [CustomId] = interaction.customId.split('_');
            switch (CustomId) {
                case 'Abrirticket': {
                    const data = await Tickets.get(`Panel`);
                    let selected = interaction.values[0];

                    if (data.funcoes.length == 0) {
                        interaction.reply({ content: `Não foi possivel abrir o ticket, aguarde.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                        return console.log('panel ticket does not have function valid')
                    }

                    const funct = data.funcoes.find((item) => item?.id === selected);
                    if (!funct) {
                        interaction.reply({ content: `Não foi possivel abrir o ticket, aguarde.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                        return console.log('function ticket was deleted or is undefined')
                    }

                    await openTicket(data, funct, client, interaction);
                    break;
                }
            }
        }
    }
}