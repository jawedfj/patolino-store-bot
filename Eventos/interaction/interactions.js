const { ButtonBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, MessageFlagsBitField, ChannelType, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require("discord.js");
const { RoleSetup,
    ChannelSetup,
    Customizar,
    TicketSetup,
    MarcaSetup } = require("../../Functions/telas")
const { timing, createID } = require("../../Functions/utils")
const { General, Tickets } = require("../../Database/index")
const { default: MercadoPagoConfig, Payment } = require("mercadopago");
const { QrCodePix } = require('qrcode-pix');
const Stripe = require('stripe');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const axios = require('axios');


module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {

        const CustomId = interaction.customId;
        const ButtonAction = interaction.isButton();
        const ModalAction = interaction.isModalSubmit();
        const RoleSelectAction = interaction.isRoleSelectMenu();
        const ChannelSelectAction = interaction.isChannelSelectMenu();
        const SelectAction = interaction.isStringSelectMenu();

        if (ButtonAction) {

            switch (CustomId) {
                case "DefinirlogsVendaADM": {
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`logsVendaADMSelect`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarcfgchannel`)
                                    .setLabel(`Voltar`)
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                    ];

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o canal para **Logs de Vendas**.`,
                        embeds: [],
                        components: components
                    });
                    break;
                }
                case "DefinirlogsVouch": {
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`logsFeedbacksSelect`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarcfgchannel`)
                                    .setLabel(`Voltar`)
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                    ];

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o canal para **Feedbacks**.`,
                        embeds: [],
                        components: components
                    });
                    break;
                }
                case "DefinirlogsSistema": {
                    const comp = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`logsSistemaSelect`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarcfgchannel`)
                                    .setLabel(`Voltar`)
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                    ];

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o canal para **Logs do Sistema**.`,
                        embeds: [],
                        components: comp
                    });
                    break;
                }
                case "DefinirlogsTickets": {
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`logsTicketSelect`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarcfgchannel`)
                                    .setLabel(`Voltar`)
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                    ];

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o canal para **Logs de Tickets**.`,
                        embeds: [],
                        components: components
                    });
                    break;
                }
                case "changecargomembro": {
                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o cargo para membro comum.\n- **Este cargo será adicionado a todos usuarios que entrarem no servidor.**`,
                        embeds: [],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new RoleSelectMenuBuilder()
                                        .setCustomId(`Membroroleselect`)
                                        .setPlaceholder(`Clique e selecione o cargo`)
                                        .setMaxValues(1)
                                ),
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`voltarcfgrole`)
                                        .setLabel(`Voltar`)
                                        .setEmoji(`1251441490576805979`)
                                        .setStyle(2)
                                )
                        ]
                    });
                    break;
                }
                case "changecargoCostumer": {
                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o cargo para clientes.\n- **O cargo será setado automáticamente após qualquer compra no servidor.**`,
                        embeds: [],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new RoleSelectMenuBuilder()
                                        .setCustomId(`Clienteroleselect`)
                                        .setPlaceholder(`Clique e selecione o cargo`)
                                        .setMaxValues(1)
                                ),
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`voltarcfgrole`)
                                        .setLabel(`Voltar`)
                                        .setEmoji(`1251441490576805979`)
                                        .setStyle(2)
                                )
                        ]
                    });
                    break;
                }
                case "changecargostaff": {
                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o cargo para equipe de suporte.\n- **O cargo terá permissões somente para controlar tickets de atendimento.**`,
                        embeds: [],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new RoleSelectMenuBuilder()
                                        .setCustomId(`Staffroleselect`)
                                        .setPlaceholder(`Clique e selecione o cargo`)
                                        .setMaxValues(1)
                                ),
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`voltarcfgrole`)
                                        .setLabel(`Voltar`)
                                        .setEmoji(`1251441490576805979`)
                                        .setStyle(2)
                                )
                        ]
                    });
                    break;
                }
                case "changecargoadmin": {

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o cargo para admnistradores.\n- **Escolha com atenção, pois este cargo terá acesso completo a todas informações do bot.**`,
                        embeds: [],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new RoleSelectMenuBuilder()
                                        .setCustomId(`Adminroleselect`)
                                        .setPlaceholder(`Clique e selecione o cargo`)
                                        .setMaxValues(1)
                                ),
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`voltarcfgrole`)
                                        .setLabel(`Voltar`)
                                        .setEmoji(`1251441490576805979`)
                                        .setStyle(2)
                                )
                        ]
                    });
                    break;
                }
                case "DefinirlogsVendaPublic": {
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`logsVendapublicSelect`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarcfgchannel`)
                                    .setLabel(`Voltar`)
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                    ];

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o canal para **Logs de Entregas** (Público).`,
                        embeds: [],
                        components: components
                    });
                    break;
                }
                case "DefinirlogsTrafego": {
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`logsTrafegoSelect`)
                                    .setPlaceholder(`Clique e selecione o canal`)
                                    .setMaxValues(1)
                                    .setChannelTypes(ChannelType.GuildText)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarcfgchannel`)
                                    .setLabel(`Voltar`)
                                    .setEmoji(`1251441490576805979`)
                                    .setStyle(2)
                            )
                    ];

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, defina o canal de **Entradas e Saídas**.`,
                        embeds: [],
                        components: components
                    });
                    break;
                }
                case "setcolormainBot": {
                    const modal = new ModalBuilder()
                        .setCustomId('mainColorModal')
                        .setTitle('Editar Cor Principal')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('mainColor')
                                    .setLabel('Cor Principal')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Insira um código HEX Colour "#ffffff"')
                                    .setMaxLength(7)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "setlogoBot": {
                    const modal = new ModalBuilder()
                        .setCustomId('avatarbotModal')
                        .setTitle('Configurar Avatar do Bot')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('botAvatarURL')
                                    .setLabel('URL do Avatar do Bot')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Insira a URL válida')
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "setnameBot": {
                    const modal = new ModalBuilder()
                        .setCustomId('nomebotModal')
                        .setTitle('Alterar Nome do Bot')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('botName')
                                    .setLabel('Nome da Aplicação')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "setbannerBot": {
                    const modal = new ModalBuilder()
                        .setCustomId('bannerbotModal')
                        .setTitle('Configurar Banner do Bot')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('botBannerURL')
                                    .setLabel('URL do Banner do Bot')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Insira a URL válida')
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "setdescBot": {
                    const modal = new ModalBuilder()
                        .setCustomId('DescbotModal')
                        .setTitle('Configurar Descrição do Bot')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('botDescInput')
                                    .setLabel('Descrição na bio do Bot')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setPlaceholder('Insira a descrição do bot')
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "setatividadeBot": {
                    const modal = new ModalBuilder()
                        .setCustomId('statusbotModal')
                        .setTitle('Configurar Status do Bot')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('input1Status')
                            .setLabel('Atividade da Aplicação (Status)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira o primeiro Status')
                            .setRequired(false)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('input2Status')
                            .setLabel('Atividade da Aplicação (Status)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira o segundo Status')
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2)
                    await interaction.showModal(modal);
                    break;
                }
                case "customTicketPanel": {

                    const data = await Tickets.get(`Panel`)

                    const modal = new ModalBuilder()
                        .setCustomId('ModalTicketPanel')
                        .setTitle('Personalizar painel')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketTitle')
                            .setLabel('Titulo do Painel')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(64)
                            .setValue(data.title || '')
                            .setPlaceholder('titulo do painel de atendimento..')
                            .setRequired(true)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketDesc')
                            .setLabel('Descrição')
                            .setValue(data.description || '')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Insira a descrição do painel de atendimento..')
                            .setRequired(true)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketBanner')
                            .setLabel('Banner do Painel')
                            .setValue(data.banner || '')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira a URL do banner..')
                            .setRequired(false)
                    )
                    const input4 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketIcon')
                            .setLabel('Icon do Painel')
                            .setValue(data.icon || '')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Insira a URL do icon..')
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2, input3, input4)
                    await interaction.showModal(modal);
                    break;
                }
                case "createFuncTicket": {
                    const modal = new ModalBuilder()
                        .setCustomId('addFunctionTicket')
                        .setTitle('Adicionar Função')

                    const input1 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketFunctionTitle')
                            .setLabel('Titulo da Função')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(64)
                            .setPlaceholder('titulo do Função..')
                            .setRequired(false)
                    )
                    const input2 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketFunctionDesc')
                            .setLabel('Descrição da Função')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Insira a descrição da Função..')
                            .setRequired(false)
                    )
                    const input3 = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticketFunctionEmoji')
                            .setLabel('Emoji da Função')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Ex: <:scadeon:12332417841293808:>')
                            .setRequired(false)
                    )

                    modal.addComponents(input1, input2, input3)
                    await interaction.showModal(modal);
                    break;
                }
                case "deleteFuncTicket": {

                    const SelectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`DelFunctionTicketSelect`)
                        .setPlaceholder(`Selecione para deletar`)


                    const funcoes = Tickets.get(`Panel.funcoes`) || [];

                    if (funcoes.length === 0) {
                        return interaction.reply({ content: "Nenhuma função encontrada para deletar.", flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    funcoes.slice(0, 25).forEach(func => {
                        const option = {
                            label: func.title?.substring(0, 100) || "Sem título",
                            description: func.desc ? func.desc.substring(0, 100) : "Não definido",
                            value: func.id,
                            emoji: '1265528447418105940'
                        };

                        SelectMenu.addOptions(option);
                    });

                    SelectMenu.setMaxValues(funcoes.length);

                    const button = new ButtonBuilder()
                        .setCustomId(`voltarcfgcticket`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const row = new ActionRowBuilder().addComponents(SelectMenu);
                    const row1 = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, selecione uma ou mais funções para deletar.`,
                        embeds: [],
                        components: [row, row1]
                    });

                    break;
                }
                case "manageFuncTicket": {

                    const SelectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`manageFunctionTicketSelect`)
                        .setPlaceholder(`Selecione para editar`)
                        .setMaxValues(1)


                    const funcoes = Tickets.get(`Panel.funcoes`) || [];

                    if (funcoes.length === 0) {
                        return interaction.reply({ content: "Não existem funções para editar.", flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    funcoes.slice(0, 25).forEach(func => {
                        const option = {
                            label: func.title?.substring(0, 100) || "Sem título",
                            description: func.desc ? func.desc.substring(0, 100) : "Não definido",
                            value: func.id,
                            emoji: '1265528447418105940'
                        };

                        SelectMenu.addOptions(option);
                    });


                    const button = new ButtonBuilder()
                        .setCustomId(`voltarcfgcticket`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2);

                    const row = new ActionRowBuilder().addComponents(SelectMenu);
                    const row1 = new ActionRowBuilder().addComponents(button);

                    await interaction.update({
                        content: `${timing()} ${interaction.user}, selecione uma ou mais funções para editar.`,
                        embeds: [],
                        components: [row, row1]
                    });

                    break;
                }
                case "QRcodeSetupColor": {
                    const modal = new ModalBuilder()
                        .setCustomId('QRcodeColorModal')
                        .setTitle('Editar Cores Qrcode')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('primaryColorQrcode')
                                    .setLabel('Cor Primária')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Insira um código HEX Colour "#ffffff"')
                                    .setMaxLength(7)
                                    .setRequired(false)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('secondaryColorQrcode')
                                    .setLabel('Cor Secundária')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Insira um código HEX Colour "#ffffff"')
                                    .setMaxLength(7)
                                    .setRequired(false)
                            ),
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "msgbuySetup": {
                    const modal = new ModalBuilder()
                        .setCustomId('msgbuySetupModal')
                        .setTitle('Mensagem pós Venda Aprovada')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('msgbuyinput')
                                    .setLabel('Insira a Mensagem')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "emojiFeedback": {
                    const modal = new ModalBuilder()
                        .setCustomId('emojiFeedbackModal')
                        .setTitle('Reações a Feedbacks')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('emojiFeedbackinput')
                                    .setLabel('Emoji Reações Automáticas')
                                    .setPlaceholder(`Ex: <:name:IDEmoji:>`)
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "QRcodeSetupLogo": {
                    const userid = interaction.user.id;
                    interaction.reply({
                        content: `Envie a imagem do produto (\`.png\`, \`.jpg\`, \`.jpeg\`) em até 1 minuto.`,
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
                        /\.(png|jpe?g)$/i.test(msg.attachments.first().name);

                    const collectorArquivo = interaction.channel.createMessageCollector({ filter: filterArquivo, time: 60000 });

                    collectorArquivo.on("collect", async (mensagem) => {
                        try {
                            collectorArquivo.stop();
                            const attachment = mensagem.attachments.first();
                            const imageURL = attachment.url;
                            const directoryPath = path.join(__dirname, "../../assets/");
                            const filePath = path.join(directoryPath, "logoqr.png");

                            if (!fs.existsSync(directoryPath)) {
                                fs.mkdirSync(directoryPath, { recursive: true });
                            }

                            const response = await fetch(imageURL);
                            const buffer = await response.buffer();

                            fs.writeFileSync(filePath, buffer);

                            await mensagem.delete();

                            interaction.editReply({
                                content: `Imagem adicionada ao estoque com sucesso!`,
                                components: [],
                                flags: MessageFlagsBitField.Flags.Ephemeral
                            });
                        } catch (error) {
                            console.error("Erro ao processar a imagem:", error);
                            interaction.editReply({
                                content: `Ocorreu um erro ao processar a imagem. Tente novamente.`,
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
                                content: `O tempo para enviar a imagem foi encerrado.`,
                                components: [],
                                flags: MessageFlagsBitField.Flags.Ephemeral
                            });
                        }
                    });
                    break;
                }
                case "setMPtoken": {
                    const modal = new ModalBuilder()
                        .setCustomId('MPtokenModal')
                        .setTitle('Mercadopago')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('MPtokenInput')
                                    .setLabel('Acess Token')
                                    .setPlaceholder('APP_USR-')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "setStripetoken": {
                    const modal = new ModalBuilder()
                        .setCustomId('StripetokenModal')
                        .setTitle('Stripe')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('StripetokenInput')
                                    .setLabel('Secret Key')
                                    .setPlaceholder('sk_live_**')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
                case "configpix": {
                    const modal = new ModalBuilder()
                        .setCustomId('configpixModal')
                        .setTitle('Carteira Manual')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('configpixInput')
                                    .setLabel('Chave Pix')
                                    .setMinLength(5)
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                    break;
                }
            }
        }
        if (ModalAction) {
            const [CustomId, ID] = interaction.customId.split('_');
            switch (CustomId) {
                case "configpixModal": {
                    const tokenInput = interaction.fields.getTextInputValue('configpixInput');

                    await General.set(`System.Payments.semiauto.key`, tokenInput);

                    interaction.reply({ content: `Chave Pix definida com sucesso.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    break;
                }
                case "StripetokenModal": {
                    const tokenInput = interaction.fields.getTextInputValue('StripetokenInput');
                    const stripe = Stripe(tokenInput);

                    await stripe.customers.list({ limit: 1 }).then(() => {
                        General.set(`System.Payments.stripe`, {
                            status: true,
                            token: tokenInput,
                        });

                        interaction.reply({ content: `Secret Key **Stripe** definido com sucesso, o sistema agora suporta pagamentos com cartões de crédito e débito.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }).catch((err) => {
                        if (err) {
                            interaction.reply({ content: `Secret Key inválidan\nErro: ${err.message}.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                        }
                    });
                    break;
                }
                case "MPtokenModal": {
                    const tokenInput = interaction.fields.getTextInputValue('MPtokenInput');

                    const Clientes = new MercadoPagoConfig({ accessToken: tokenInput });
                    const payments = new Payment(Clientes);

                    await payments.search({ limit: 1 }).then(() => {
                        General.set(`System.Payments.mercadopago.token`, tokenInput);

                        interaction.reply({ content: `Token **Mercadopago** definido com sucesso.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }).catch((err) => {
                        if (err) {
                            interaction.reply({ content: `Token inválido\nErro: ${err.message}.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                        }
                    })

                    break;
                }
                case "ModalTicketPanel": {
                    const titleF = interaction.fields.getTextInputValue('ticketTitle');
                    const descriptionF = interaction.fields.getTextInputValue('ticketDesc');
                    const bannerF = interaction.fields.getTextInputValue('ticketBanner');
                    const iconF = interaction.fields.getTextInputValue('ticketIcon');
                    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;

                    const data = await Tickets.get(`Panel`)
                    const funcStruct = {
                        title: titleF || data.title,
                        description: descriptionF || data.description,
                        bannerURL: (urlRegex.test(bannerF) ? bannerF : data.bannerURL),
                        iconURL: (urlRegex.test(iconF) ? iconF : data.iconURL),
                        funcoes: data.funcoes || [],
                        announce: data.announce || []
                    };

                    await Tickets.set(`Panel`, funcStruct);

                    await TicketSetup(client, interaction);
                    break;
                }
                case "addFunctionTicket": {
                    const title = interaction.fields.getTextInputValue('ticketFunctionTitle');
                    const description = interaction.fields.getTextInputValue('ticketFunctionDesc');
                    const emoji = interaction.fields.getTextInputValue('ticketFunctionEmoji');
                    const EmojiRegex = /^<a?:\w+:\d+>$/;

                    let Ticketfunctions = await Tickets.get(`Panel.funcoes`) || [];

                    if (Ticketfunctions.some(func => func.title.toLowerCase() === title.toLowerCase())) {
                        return interaction.reply({
                            content: "Já existe uma função com este titulo, escolha outro!",
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    }

                    let functionID = createID();

                    let funcStruct = {
                        id: functionID,
                        title: title || 'Atendimento',
                        desc: description || 'Solicite um atendimento para obter uma resolução.',
                        emoji: (EmojiRegex.test(emoji) ? emoji : '1276564803762258082')
                    };
                    Ticketfunctions.push(funcStruct);

                    await Tickets.set(`Panel.funcoes`, Ticketfunctions);

                    await TicketSetup(client, interaction);
                    break;
                }
                case "mainColorModal": {
                    const mainColouur = interaction.fields.getTextInputValue('mainColor');
                    const hexColorRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

                    if (!hexColorRegex.test(mainColouur)) {
                        return interaction.reply({ content: `Código Hex Color \`${mainColouur}\` está inválido, Pegue um código HEX válido [neste site.](https://www.google.com/search?q=color+picker&oq=color+picker) `, flags: MessageFlagsBitField.Flags.Ephemeral });
                    } else {
                        General.set(`System.Colors.main`, mainColouur)
                        await Customizar(client, interaction);
                    }
                    break;
                }
                case "QRcodeColorModal": {
                    const data = await General.get(`System.Marca.qrcode`)
                    const primaryColouur = interaction.fields.getTextInputValue('primaryColorQrcode');
                    const secondaryColouur = interaction.fields.getTextInputValue('secondaryColorQrcode');
                    const hexColorRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

                    let response = {
                        primary: `${hexColorRegex.test(primaryColouur) ? primaryColouur : data.primary}`,
                        secondary: `${hexColorRegex.test(secondaryColouur) ? secondaryColouur : data.secondary}`
                    }

                    await General.set(`System.Marca.qrcode`, response);
                    await MarcaSetup(client, interaction);
                    break;
                }
                case "msgbuySetupModal": {
                    const inputMSG = interaction.fields.getTextInputValue('msgbuyinput');

                    if (inputMSG) {
                        await General.set(`System.Marca.msgAuto`, `${inputMSG}`);
                    }

                    await MarcaSetup(client, interaction);
                    break;
                }
                case "emojiFeedbackModal": {
                    const emoji = interaction.fields.getTextInputValue('emojiFeedbackinput');
                    const EmojiRegex = /^<a?:\w+:\d+>$/;

                    if (EmojiRegex.test(emoji)) {
                        await General.set(`System.Marca.emojiAuto`, emoji);
                    } else {
                        return interaction.reply({ content: `Emoji inserido é inválido, tente novamente.`, flags: MessageFlagsBitField.Flags.Ephemeral })
                    }

                    await MarcaSetup(client, interaction);
                    break;
                }
                case "statusbotModal": {
                    const state1 = interaction.fields.getTextInputValue('input1Status');
                    const state2 = interaction.fields.getTextInputValue('input2Status');

                    const data = await General.get(`System.App.status`)

                    let struct = [
                        `${state1 ? state1 : data[0]}`,
                        `${state2 ? state2 : data[1]}`
                    ]

                    await General.set(`System.App.status`, struct)

                    await Customizar(client, interaction);
                    break;
                }
                case "nomebotModal": {
                    const botName = interaction.fields.getTextInputValue('botName');

                    try {
                        await client.user.setUsername(botName);
                        await Customizar(client, interaction);
                    } catch (error) {
                        if (error.code === 50035 && error.rawError?.errors?.username?._errors[0]?.code === 'USERNAME_TOO_MANY_USERS') {
                            await interaction.reply({ content: `Muitas aplicações já possui este nome de usuário.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                        } else {
                            await interaction.reply({ content: `Erro ao Alterar o nome do APP.`, flags: MessageFlagsBitField.Flags.Ephemeral });
                        }
                    }
                    break;
                }
                case "DescbotModal": {
                    const description = interaction.fields.getTextInputValue('botDescInput');

                    const token = process.env.DISCORD_TOKEN;

                    url = 'https://discord.com/api/v10/applications/@me',
                        data = {
                            description:
                                `${description}`,
                        }
                    try {
                        axios.patch(url, data, {
                            headers: {
                                Authorization: 'Bot ' + token,
                                'Content-Type': 'application/json',
                            },
                        });
                        await Customizar(client, interaction);
                    } catch (error) {
                        console.log(error)
                    }
                    break;
                }
                case "avatarbotModal": {
                    const botAvatar = interaction.fields.getTextInputValue('botAvatarURL');

                    try {
                        await client.user.setAvatar(botAvatar);
                        await Customizar(client, interaction);
                    } catch (error) {
                        await interaction.reply({ content: `error\n \`${error}\``, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }
                    break;
                }
                case "bannerbotModal": {
                    const botBanner = interaction.fields.getTextInputValue('botBannerURL');

                    try {
                        await client.user.setBanner(botBanner);
                        await Customizar(client, interaction);
                    } catch (error) {
                        await interaction.reply({ content: `error\n \`${error}\``, flags: MessageFlagsBitField.Flags.Ephemeral });
                    }
                    break;
                }
                case 'editFunctionTicketModal': {
                    const newTitle = interaction.fields.getTextInputValue('titulofuncTicket')
                    const newDescription = interaction.fields.getTextInputValue('descfuncTicket')
                    const newEmoji = interaction.fields.getTextInputValue('emojifuncTicket')
                    const EmojiRegex = /^<a?:\w+:\d+>$/;

                    let Ticketfunctions = await Tickets.get("Panel.funcoes") || [];

                    if (!Array.isArray(Ticketfunctions)) {
                        console.error("Erro: 'Panel.funcoes' não é um array:", Ticketfunctions);
                        return interaction.reply({
                            content: "❌ Erro ao carregar as funções do painel.",
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    }

                    let funcaoIndex = Ticketfunctions.findIndex(func => func.id === ID);

                    if (funcaoIndex === -1) {
                        return interaction.reply({
                            content: "❌ Função não encontrada!",
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    }

                    Ticketfunctions[funcaoIndex] = {
                        id: Ticketfunctions[funcaoIndex].id,
                        title: newTitle,
                        desc: newDescription,
                        emoji: (EmojiRegex.test(newEmoji) ? newEmoji : '1276564803762258082')
                    };

                    await Tickets.set("Panel.funcoes", Ticketfunctions);

                    await TicketSetup(client, interaction);
                    break;
                }

            }
        }
        if (SelectAction) {
            switch (CustomId) {
                case 'DelFunctionTicketSelect': {
                    const valoresParaDeletar = interaction.values;

                    let funcoes = Tickets.get("Panel.funcoes") || [];

                    funcoes = funcoes.filter(func => !valoresParaDeletar.includes(func.id));

                    Tickets.set("Panel.funcoes", funcoes);

                    await TicketSetup(client, interaction);
                    break;
                }
                case 'manageFunctionTicketSelect': {
                    const valoresSelecionados = interaction.values;

                    const funcaoSelecionada = valoresSelecionados[0];

                    let funcoes = Tickets.get("Panel.funcoes") || [];
                    const funcao = funcoes.find(func => func.id === funcaoSelecionada);

                    if (!funcao) {
                        return interaction.reply({ content: "Função não encontrada!", flags: MessageFlagsBitField.Flags.Ephemeral });
                    }

                    const modal = new ModalBuilder()
                        .setCustomId(`editFunctionTicketModal_${funcaoSelecionada}`)
                        .setTitle(`Editar Função: ${funcao.title}`);

                    const titleInput = new TextInputBuilder()
                        .setCustomId('titulofuncTicket')
                        .setLabel("Titulo")
                        .setStyle(TextInputStyle.Short)
                        .setValue(funcao.title);

                    const descInput = new TextInputBuilder()
                        .setCustomId('descfuncTicket')
                        .setLabel("Descrição")
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(funcao.desc);

                    const emojiInput = new TextInputBuilder()
                        .setCustomId('emojifuncTicket')
                        .setLabel("Emoji")
                        .setStyle(TextInputStyle.Short)
                        .setValue(funcao.emoji);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(titleInput),
                        new ActionRowBuilder().addComponents(descInput),
                        new ActionRowBuilder().addComponents(emojiInput),
                    );

                    await interaction.showModal(modal);

                    break;
                }
            }
        }
        if (ChannelSelectAction) {
            switch (CustomId) {
                case "logsTrafegoSelect":
                    await General.set("Config.logs.trafego", interaction.values[0]);
                    ChannelSetup(client, interaction);
                    break;
                case "logsVendapublicSelect":
                    await General.set("Config.logs.VendasPUB", interaction.values[0]);
                    ChannelSetup(client, interaction);
                    break;
                case "logsVendaADMSelect":
                    await General.set("Config.logs.VendasADM", interaction.values[0]);
                    ChannelSetup(client, interaction);
                    break;
                case "logsFeedbacksSelect":
                    await General.set("Config.logs.feedbacks", interaction.values[0]);
                    ChannelSetup(client, interaction);
                    break;
                case "logsSistemaSelect":
                    await General.set("Config.logs.Sistema", interaction.values[0]);
                    ChannelSetup(client, interaction);
                    break;
                case "logsTicketSelect":
                    await General.set("Config.logs.ticketChannel", interaction.values[0]);
                    ChannelSetup(client, interaction);
                    break;
            }
        }
        if (RoleSelectAction) {
            const value = interaction.values[0];
            switch (CustomId) {
                case "Adminroleselect":
                    General.set(`Config.Roles.admin`, value);
                    await RoleSetup(client, interaction);
                    break;

                case "Staffroleselect":
                    General.set(`Config.Roles.staff`, value);
                    await RoleSetup(client, interaction);
                    break;

                case "Clienteroleselect":
                    General.set(`Config.Roles.costumer`, value);
                    await RoleSetup(client, interaction);
                    break;

                case "Membroroleselect":
                    General.set(`Config.Roles.member`, value);
                    await RoleSetup(client, interaction);
                    break;
            }
        }
    }
}