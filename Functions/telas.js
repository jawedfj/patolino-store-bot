const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, MessageFlagsBitField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { General, Produtos, Carrinhos, Tickets } = require("../Database/index");
const { timing } = require("../Functions/utils")
const startTime = Date.now();

async function Main(client, interaction) {
    interaction.update({
        content: ``,
        embeds: [
            new EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                .setDescription(`${timing()}, Sr(a) **${interaction.user.username}**.`)
                .setImage("https://bot-247--lucasademar1502.replit.app/banner.png")
                .addFields(
                    { name: "**Ping**", value: `\`${client.ws.ping} ms\``, inline: true },
                    { name: `**Tempo de Execução**`, value: `<t:${Math.ceil(startTime / 1000)}:R>`, inline: true }
                )
                .setColor(General.get("System.Colors.main"))
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('GerenciarLoja').setLabel('Loja').setEmoji('1319043599521812480').setStyle(2),
                    new ButtonBuilder().setCustomId('GerenciarTickets').setLabel('Painel de Atendimentos').setEmoji('1319043579179696271').setStyle(2)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('PersonalizaAPP').setLabel('Personalização').setEmoji('1319043534547976242').setStyle(2),
                    new ButtonBuilder().setCustomId('GerenciarDefinicoes').setLabel('Configurações').setEmoji('1319043594941759579').setStyle(2)
                )
        ],
        files: [],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function Configurações(client, interaction) {
    interaction.update({
        content: `Escolha a opção que deseja configurar.`,
        embeds: [],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('GerenciarCargos')
                        .setLabel('Gerenciar Cargos')
                        .setStyle(2)
                        .setEmoji('1276927582419554316'),
                    new ButtonBuilder()
                        .setCustomId('GerenciarCanais')
                        .setLabel('Gerenciar Logs')
                        .setStyle(2)
                        .setEmoji('1276927585544044598'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('MetodosPagamento')
                        .setLabel('Formas de Pagamento')
                        .setStyle(2)
                        .setEmoji('1273049581667745864'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar1")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function RoleSetup(client, interaction) {

    interaction.update({
        content: ``,
        embeds: [
            new EmbedBuilder()
                .setAuthor({ name: `Definir Cargos`, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                .setDescription(`${timing()} **${interaction.user.username}**\n \n- **Selecione abaixo a opção deseja configurar.** \n
**Cargo de Administrador:** ${General.get(`Config.Roles.admin`) == null ? `\`Não definido\`` : `<@&${General.get(`Config.Roles.admin`)}>`}
**Cargo de Suporte:** ${General.get(`Config.Roles.staff`) == null ? `\`Não definido\`` : `<@&${General.get(`Config.Roles.staff`)}>`}
**Cargo de Cliente:** ${General.get(`Config.Roles.costumer`) == null ? `\`Não definido\`` : `<@&${General.get(`Config.Roles.costumer`)}>`}
**Cargo de Membro:** ${General.get(`Config.Roles.member`) == null ? `\`Não definido\`` : `<@&${General.get(`Config.Roles.member`)}>`}
                    `)
                .setColor(General.get("System.Colors.main"))
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('changecargoadmin')
                        .setLabel('Cargo de Admnistrador')
                        .setStyle(2)
                        .setEmoji('1251441849130946572'),
                    new ButtonBuilder()
                        .setCustomId('changecargostaff')
                        .setLabel('Cargo de Suporte')
                        .setStyle(2)
                        .setEmoji('1241951076434055178'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("changecargoCostumer")
                        .setLabel("Cargo Cliente")
                        .setStyle(2)
                        .setEmoji('1276564807335809156'),
                    new ButtonBuilder()
                        .setCustomId("changecargomembro")
                        .setLabel('Cargo de Membros')
                        .setStyle(2)
                        .setEmoji('1261435261653483611')
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar2")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                )
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function ChannelSetup(client, interaction) {
    interaction.update({
        content: ``,
        embeds: [
            new EmbedBuilder()
                .setAuthor({ name: `Definir Canais de Logs`, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                .setDescription(`Olá, **${interaction.user.username}**\n \n- **Selecione abaixo a opção deseja configurar.** \n
**Canal de logs de Tickets:** ${General.get(`Config.logs.ticketChannel`) == null ? `\`Não definido\`` : `<#${General.get(`Config.logs.ticketChannel`)}>`}
**Canal de logs do Sistema:** ${General.get(`Config.logs.Sistema`) == null ? `\`Não definido\`` : `<#${General.get(`Config.logs.Sistema`)}>`}
**logs Entradas e Saídas:** ${General.get(`Config.logs.trafego`) == null ? `\`Não definido\`` : `<#${General.get(`Config.logs.trafego`)}>`}
**Canal de logs Vendas Admin:** ${General.get(`Config.logs.VendasADM`) == null ? `\`Não definido\`` : `<#${General.get(`Config.logs.VendasADM`)}>`}
**Canal de logs Vendas Public:** ${General.get(`Config.logs.VendasPUB`) == null ? `\`Não definido\`` : `<#${General.get(`Config.logs.VendasPUB`)}>`}
**Canal Feedbacks:** ${General.get(`Config.logs.feedbacks`) == null ? `\`Não definido\`` : `<#${General.get(`Config.logs.feedbacks`)}>`}
`)
                .setColor(General.get("System.Colors.main"))
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("DefinirlogsTickets")
                        .setLabel('Logs de Ticket')
                        .setStyle(2)
                        .setEmoji('1267032211455082508'),
                    new ButtonBuilder()
                        .setCustomId("DefinirlogsSistema")
                        .setLabel("Logs Sistema")
                        .setStyle(2)
                        .setEmoji('1267032211455082508'),
                    new ButtonBuilder()
                        .setCustomId("DefinirlogsTrafego")
                        .setLabel("Entradas e Saídas")
                        .setStyle(2)
                        .setEmoji('1267032211455082508'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("DefinirlogsVendaADM")
                        .setLabel("Logs de Vendas")
                        .setStyle(2)
                        .setEmoji('1267032211455082508'),
                    new ButtonBuilder()
                        .setCustomId("DefinirlogsVendaPublic")
                        .setLabel("Logs Entregas")
                        .setStyle(2)
                        .setEmoji('1267032211455082508'),
                    new ButtonBuilder()
                        .setCustomId("DefinirlogsVouch")
                        .setLabel('Canal Feedbacks')
                        .setEmoji('1267032211455082508')
                        .setStyle(2)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar2")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                )
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function PaymentSetup(client, interaction) {

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Definições de Pagamentos`, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .addFields(
            { name: `Sistema de Pagamentos (Status)`, value: `${General.get(`System.Payments.status`) ? '**Ligado**' : '**Desligado**'}` },
            {
                name: `Informações`, value: `Na seleção de gateway para processar seus pedidos o emoji \`🟢\` indica que o gateway está responsável por processar os pagamentos.
Logo todas outras opções que possuem \`🔴\` estão inativas.
                ` },
        )
        .setDescription(`Olá **${interaction.user.username}**\n \n- Selecione a opção de pagamento que deseja configurar.\n
`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`selectMethodPix`)
        .setPlaceholder('[PIX] Selecionar Gateway responsável')
        .setMaxValues(1)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`MercadoPago`)
                .setDescription(`Ativar/Desativar uso desta forma de pagamento.`)
                .setEmoji(`${General.get(`System.Payments.mercadopago.status`) ? `🟢` : `🔴`}`)
                .setValue(`onoffMP`),
            new StringSelectMenuOptionBuilder()
                .setLabel(`Semi-Automático`)
                .setDescription(`Ativar/Desativar uso desta forma de pagamento.`)
                .setEmoji(`${General.get(`System.Payments.semiauto.status`) ? `🟢` : `🔴`}`)
                .setValue(`onoffSemiauto`),
        );
    const selectMenu2 = new StringSelectMenuBuilder()
        .setCustomId(`selectMethodCard`)
        .setPlaceholder('[CARD] Selecionar Gateway responsável')
        .setMaxValues(1)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`Stripe`)
                .setDescription(`Ativar/Desativar uso desta forma de pagamento.`)
                .setEmoji(`${General.get(`System.Payments.stripe.status`) ? `🟢` : `🔴`}`)
                .setValue(`onoffStripe`),
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const row4 = new ActionRowBuilder().addComponents(selectMenu2);

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("MPSetup")
                .setStyle(2)
                .setEmoji('1273106836790444147'),
            new ButtonBuilder()
                .setCustomId("SemiAutoPaySetup")
                .setLabel("Semi-Automático")
                .setStyle(2)
                .setEmoji('1251441500407992351'),
        )
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("EFISetup")
                .setStyle(2)
                .setDisabled(true)
                .setEmoji('1296065449737457734'),
            new ButtonBuilder()
                .setCustomId("CryptoPaySetup")
                .setDisabled(true)
                .setStyle(2)
                .setEmoji('1338341250712997919'),
            new ButtonBuilder()
                .setCustomId("StripePaySetup")
                .setStyle(2)
                .setEmoji('1356173479376064512'),
        )
    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar2")
                .setLabel("Voltar")
                .setStyle(2)
                .setEmoji('1251441490576805979')
        )

    await interaction.update({ content: ``, embeds: [embed], components: [row1, row2, row, row4, row3], files: [], });
}

async function Utils(client, interaction) {
    interaction.update({
        content: ``,
        embeds: [],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('GerenciarModeracao')
                        .setLabel('Moderação')
                        .setStyle(2)
                        .setEmoji('1276564802281672865'),
                    new ButtonBuilder()
                        .setCustomId('GerenciarWebhook')
                        .setLabel('Weebhooks')
                        .setStyle(2)
                        .setEmoji('1298710553266618488'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('GerenciarAutomaticos')
                        .setLabel('Ações Automáticas')
                        .setStyle(2)
                        .setEmoji('1262641711834861599'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar1")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        files: [],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function Customizar(client, interaction) {
    interaction.update({
        content: ``,
        embeds: [
            new EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                .setDescription(`${timing()}, Sr(a) **${interaction.user.username}**.`)
                .setImage("https://bot-247--lucasademar1502.replit.app/banner.png")
                .addFields(
                    { name: "**Ping**", value: `\`${client.ws.ping} ms\``, inline: true },
                    { name: `**Tempo de Execução**`, value: `<t:${Math.ceil(startTime / 1000)}:R>`, inline: true }
                )
                .setColor(General.get("System.Colors.main"))
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
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
        files: [],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function LojaSetup(client, interaction) {

    interaction.update({
        content: `Escolha a opção que deseja.`,
        embeds: [],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('marcaLoja')
                        .setLabel('Personalizações')
                        .setEmoji('1263226754739343531')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('manageProduct')
                        .setLabel('Produtos')
                        .setEmoji('1276564808723861667')
                        .setStyle(1),
                    /*new ButtonBuilder()
                        .setCustomId('plansConfig')
                        .setLabel('Assinaturas')
                        .setEmoji('1273127418386976788')
                        .setStyle(2),*/
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('createProduct')
                        .setLabel('Criar Produto')
                        .setEmoji('1251441497346281482')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId('deleteProduct')
                        .setLabel('Excluir Produto')
                        .setEmoji('1251441411266711573')
                        .setStyle(4),
                    new ButtonBuilder()
                        .setCustomId('rendimentosOptions')
                        .setLabel('Rentabilidade')
                        .setEmoji('1319004166424891515')
                        .setStyle(2),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar1")
                        .setLabel("Back")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        files: [],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function TicketSetup(client, interaction) {
    let embed = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    const title = Tickets.get(`Panel.title`);
    const description = Tickets.get(`Panel.description`);
    const funcoes = Tickets.get(`Panel.funcoes`) || [];

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);


    funcoes.forEach(func => {
        embed.addFields({ name: `**${func.title}**`, value: `**Pré descrição:** \`${func.desc}\`\n**Emoji:** ${func.emoji ? `\`Não definido\`` : `${func.emoji}`}` });
    });

    interaction.update({
        content: ``,
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId('createFuncTicket')
                        .setLabel('Criar Função')
                        .setEmoji('1251441497346281482')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId('deleteFuncTicket')
                        .setLabel('Deletar Função')
                        .setEmoji('1251441845242695710')
                        .setStyle(4)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('customTicketPanel')
                        .setLabel('Customizar Embed')
                        .setEmoji('1273127418386976788')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('manageFuncTicket')
                        .setLabel('Gerenciar Funções')
                        .setEmoji('1276564808723861667')
                        .setStyle(1),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('sendTicketPanel')
                        .setLabel('Enviar Painel')
                        .setEmoji('1263220780615991306')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('updateTicketPanel')
                        .setLabel('Atualizar Painel')
                        .setEmoji('1262641711834861599')
                        .setStyle(2),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar1")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function MarcaSetup(client, interaction) {
    interaction.update({
        content: `Escolha a opção que deseja configurar.`,
        embeds: [],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('QRcodeSetupLogo')
                        .setLabel('Logo QrCode')
                        .setStyle(2)
                        .setEmoji('1319043538947801179'),
                    new ButtonBuilder()
                        .setCustomId('QRcodeSetupColor')
                        .setLabel('Cor QrCode')
                        .setStyle(2)
                        .setEmoji('1261436901941055560'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('msgbuySetup')
                        .setLabel('Mensagem Pós Venda')
                        .setStyle(2)
                        .setEmoji('1319131699321503834'),
                    new ButtonBuilder()
                        .setCustomId('emojiFeedback')
                        .setLabel('Auto-React Feedback')
                        .setStyle(2)
                        .setEmoji('1319043602604752997'),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltarLojaSetup")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        files: [],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function rendimentosOptions(client, interaction) {
    const dataOrderArray = Carrinhos.all();

    let totalDiario = 0.00;
    let totalSemanal = 0.00;
    let totalQuinzenal = 0.00;
    let totalMensal = 0.00;
    let total = 0.00;

    const agora = new Date();

    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 1, 0);
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay() + 1);
    inicioSemana.setHours(0, 1, 0, 0);

    const inicioQuinzena = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() >= 16 ? 16 : 1, 0, 1, 0);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 1, 0);

    if (Array.isArray(dataOrderArray) && dataOrderArray.length > 0) {
        for (const orderEntry of dataOrderArray) {
            const userOrders = orderEntry.data;

            for (const carrinhoId in userOrders) {
                const data = userOrders[carrinhoId];

                if (data.status !== "approved") continue;

                const infoOrder = data.info_order;
                const pagamento = data.payment_info?.[0];

                if (!infoOrder || !pagamento) continue;

                const valor = parseFloat(pagamento.total);
                const dataApproved = new Date(pagamento.approvation_date);

                if (dataApproved >= inicioDia) totalDiario += valor;
                if (dataApproved >= inicioSemana) totalSemanal += valor;
                if (dataApproved >= inicioQuinzena) totalQuinzenal += valor;
                if (dataApproved >= inicioMes) totalMensal += valor;

                total += valor;
            }
        }
    }

    totalDiario = totalDiario.toFixed(2);
    totalSemanal = totalSemanal.toFixed(2);
    totalQuinzenal = totalQuinzenal.toFixed(2);
    totalMensal = totalMensal.toFixed(2);
    total = total.toFixed(2);


    const embed = new EmbedBuilder()
        .setAuthor({ name: `Relatório de Rendimentos`, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .setDescription(`**Rendimento Diário:** \`R$ ${totalDiario}\`\n**Rendimento Semanal:** \`R$ ${totalSemanal}\`\n**Rendimento Quinzenal:** \`R$ ${totalQuinzenal}\`\n**Rendimento Mensal:** \`R$ ${totalMensal}\`\n**Rendimento Total:** \`R$ ${total}\`\n`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    try {
        await interaction.update({
            content: ``,
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("voltarLojaSetup")
                            .setLabel("Voltar")
                            .setStyle(2)
                            .setEmoji('1251441490576805979'),
                    ),
            ],
            flags: MessageFlagsBitField.Flags.Ephemeral
        });
    } catch (error) {
        console.log(error);
    }
}

async function detailPayments(option, client, interaction) {

    switch (option) {
        case 1: {
            const Config = await General.get(`System.Payments.mercadopago`);

            interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                        .setTitle(`MercadoPago`)
                        .setDescription(`**Token Mercado Pago:** ${Config.token == null ? `\`\`\`Não definido\`\`\`` : `||\`\`\`${"*".repeat(Config.token.length - 15)}${Config.token.slice(-15)}\`\`\`||`}`)
                        .addFields(
                            { name: `**Modelo de Integração**`, value: `O sistema de gerenciamento de pedidos atual conta com a integração do modelo checkout transparnte do Mercadopago.` },
                        )
                        .setColor(General.get("System.Colors.main"))
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('setMPtoken')
                                .setLabel('Acess Token')
                                .setStyle(2),
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("voltarpaysetup")
                                .setLabel("Voltar")
                                .setStyle(2)
                                .setEmoji('1251441490576805979')
                        )
                ],
                flags: MessageFlagsBitField.Flags.Ephemeral
            });
            break;
        }
        case 2: {
            const Config = await General.get(`System.Payments.semiauto`);

            interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                        .setTitle(`Semi-Automático`)
                        .setDescription(`**Chave Pix:** ${Config.key == '' ? `\`\`\`Não definido\`\`\`` : `||\`\`\`${"*".repeat(Config.key.length - 6)}${Config.key.slice(-6)}\`\`\`||`}`)
                        .addFields(
                            { name: `**Modelo de Integração**`, value: `O sistema de gerenciamento de pedidos atual para pedidos com aprovação manual, é totalmente independente, sendo gerado o Qrcode personalizado a seu gosto para o cliente efetuar o pagamento.` },
                        )
                        .setColor(General.get("System.Colors.main"))
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('configpix')
                                .setLabel('Chave Pix')
                                .setStyle(2)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("voltarpaysetup")
                                .setLabel("Voltar")
                                .setStyle(2)
                                .setEmoji('1251441490576805979')
                        )
                ],
                flags: MessageFlagsBitField.Flags.Ephemeral
            });
            break;
        }
        case 3: {
            const Config = await General.get(`System.Payments.efi`);

            interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                        .setTitle(`EFI-bank`)
                        .setDescription(`
**Token EFI:** ${Config.token == null ? `\`\`\`Não definido\`\`\`` : `||\`\`\`${Config.token}\`\`\`||`}
                            `)
                        .setColor(General.get("System.Colors.main"))
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('setEficertificate')
                                .setLabel('Ceritificado EFI')
                                .setEmoji('1273127418386976788')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId("voltarpaysetup")
                                .setLabel("Voltar")
                                .setStyle(2)
                                .setEmoji('1251441490576805979')
                        )
                ],
                flags: MessageFlagsBitField.Flags.Ephemeral
            });
            break;
        }
        case 4: {
            const Config = await General.get(`System.Payments.stripe`);

            interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
                        .setTitle(`Stripe`)
                        .setDescription(`Status: ${Config.status ? '**Ligado**' : '**Desligado**'}\n\n**Secret Key:** ${Config.token == null ? `\`\`\`Não definido\`\`\`` : `||\`\`\`${"*".repeat(Config.token.length - 15)}${Config.token.slice(-15)}\`\`\`||`}`)
                        .addFields(
                            { name: `**Modelo de Integração**`, value: `O sistema de gerenciamento de pedidos atual conta com a integração do modelo checkout sessions, com a finalização do pagamento sendo em uma redirect_page da Stripe.` },
                        )
                        .setColor(General.get("System.Colors.main"))
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('setStripetoken')
                                .setLabel('Secret Key')
                                .setStyle(2),
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("voltarpaysetup")
                                .setLabel("Voltar")
                                .setStyle(2)
                                .setEmoji('1251441490576805979')
                        )
                ],
                flags: MessageFlagsBitField.Flags.Ephemeral
            });
            break;
        }
    }
}

async function plansSetup(client, interaction) {

    interaction.update({
        content: `Escolha a opção que deseja.`,
        embeds: [],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('createPlans')
                        .setLabel('Criar Assinatura')
                        .setEmoji('1251441497346281482')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId('managePlans')
                        .setLabel('Assinaturas')
                        .setEmoji('1276564808723861667')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId('deletePlans')
                        .setLabel('Excluir Assinaturas')
                        .setEmoji('1251441411266711573')
                        .setStyle(4),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltarLojaSetup`)
                        .setLabel(`Voltar`)
                        .setEmoji(`1251441490576805979`)
                        .setStyle(2)
                )
        ],
        files: [],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

module.exports = {
    Main,
    Configurações,
    RoleSetup,
    ChannelSetup,
    PaymentSetup,
    Utils,
    Customizar,
    LojaSetup,
    TicketSetup,
    MarcaSetup,
    rendimentosOptions,
    detailPayments,
    plansSetup
};
