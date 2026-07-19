const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, AttachmentBuilder, ComponentType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache, checkOwner } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("criar-painel-ticket")
        .setDescription("Crie um novo painel de ticket.")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("Qual será o id do painel")
            .setMaxLength(20)
            .setRequired(true)
        )
        .addStringOption(opString => opString
            .setName(`tipo`)
            .setDescription(`Qual será o tipo do painel`)
            .addChoices(
                { name: "Botão", value: "button" },
                { name: "Select Menu", value: "select" }
            )
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const choices = [];
        //let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        //if (type?.Ticket?.status !== true) {
            //interaction.reply({ content: `❌ | Você não possui acesso a nosso módulo de **TICKET**, adquira um em nosso site renovando seu bot. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            //return
        //}

        const isInDb = (await dbPerms.get("ticket"))?.includes(interaction.user.id);
        const isOwner = checkOwner(interaction.user.id);

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value })),
            );
            return;
        }

        const id = interaction.options.getString("id");
        const tipo = interaction.options.getString("tipo");


        if (dbTickets.get(`${id}`)) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Este id ja existe! Coloque outro id.` })
            return;
        }

        if (tipo === "button") {
            dbTickets.set(`${id}`, {
                idpainel: id,
                tipo: tipo,
                desc: "Clique no botão de abrir ticket para obter ajuda de um **STAFF**",
                title: `${interaction.guild.name} | Suporte`
            })
            const embed = new EmbedBuilder()
                .setTitle(`${dbTickets.get(`${id}.title`)}`)
                .setDescription(`${dbTickets.get(`${id}.desc`)}`)
                .setColor(dbConfigs.get(`ticket.color`) || "Default")

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${id}`)
                        .setEmoji("🎫")
                        .setLabel(`Abrir Ticket`)
                        .setStyle(1)
                )
            interaction.channel.send({ embeds: [embed], components: [row] }).then(msg => {
                dbTickets.set(`${id}.idmsg`, `${msg.id}`)
                dbTickets.set(`${id}.idcanal`, `${interaction.channel.id}`)
                dbTickets.set(`${id}.modal.assunto`, "ON")
                dbTickets.set(`${id}.modal.desc`, "OFF")
                dbTickets.set(`${id}.modal.finaliza`, "ON")
                dbTickets.set(`${id}.buttons`, [
                    {
                        id: 1,
                        style: 1,
                        text: "Abrir Ticket",
                        emoji: `🎫`,
                        msg: {
                            mensagem: "",
                            sistema: "ON"
                        }
                    }
                ])
            })
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`6`)} | Painel criado e enviado com sucesso!` })
        } else if (tipo === "select") {
            dbTickets.set(`${id}`, {
                idpainel: id,
                tipo: tipo,
                desc: "Clique na seleção abaixo para abrir ticket e obter ajuda de um **STAFF**",
                title: `${interaction.guild.name} | Atendimento`,
                placeholder: "Selecione uma opção...",
                select: [
                    {
                        text: "Abrir Ticket",
                        desc: "Clique aqui para abrir",
                        emoji: `${dbEmojis.get(`26`)}`,
                        categoria: "",
                        id: 1,
                        msg: {
                            mensagem: "",
                            sistema: "ON"
                        }
                    }
                ]
            })
            const embed = new EmbedBuilder()
                .setTitle(`${dbTickets.get(`${id}.title`)}`)
                .setDescription(`${dbTickets.get(`${id}.desc`)}`)
                .setColor(dbConfigs.get(`ticket.color`) || "Default")

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`select_ticket`)
                        .setPlaceholder(`Selecione uma opção...`)
                        .addOptions(
                            {
                                label: "Abrir Ticket",
                                description: "Clique aqui para abrir",
                                emoji: `${dbEmojis.get(`26`)}`,
                                value: `${id}_primeiropainel`
                            }
                        )
                )
            interaction.channel.send({ embeds: [embed], components: [row] }).then(msg => {
                dbTickets.set(`${id}.idmsg`, `${msg.id}`)
                dbTickets.set(`${id}.idcanal`, `${interaction.channel.id}`)
                dbTickets.set(`${id}.modal.assunto`, "ON")
                dbTickets.set(`${id}.modal.desc`, "OFF")
                dbTickets.set(`${id}.modal.finaliza`, "ON")
            })
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`6`)} | Painel criado e enviado com sucesso! O select menu não funcionará até configurar o sistema!` })
        } else {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Coloque um tipo de painel válido!` })
            return;
        }
    }
}