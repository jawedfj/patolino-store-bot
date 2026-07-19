const { MessageFlags, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { writeFile, unlink } = require("node:fs");
const { JsonDatabase } = require("wio.db");
const { getCache, checkOwner } = require("../../../Functions/connect_api");
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("entregar")
        .setDescription("Entregue um produto para um usuário!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Produto")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addUserOption(opUser => opUser
            .setName(`usuário`)
            .setDescription(`Selecione um usuário`)
            .setRequired(true)
        )
        .addIntegerOption(opInteger => opInteger
            .setName(`unidade`)
            .setDescription(`Quantia de itens que será entregue`)
            .setMaxValue(100)
            .setMinValue(1)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
      //  let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
      //  if (type?.Vendas?.status !== true) {
          //  interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
        //    return
      //  }



        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
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

        for (const product of dbProducts.all()) {
            choices.push({
                name: `ID: ${product.ID} | Nome: ${product.data.name}`,
                value: product.ID,
            });
        };
        choices.sort((a, b) => a.value - b.value);

        const searchId = interaction.options.getString("id");
        if (searchId) {
            const filteredChoices = choices.filter(choice => {
                return choice.value.startsWith(searchId);
            });
            await interaction.respond(
                filteredChoices.map(choice => ({ name: choice.name, value: choice.value })),
            );
        } else {
            const limitedChoices = choices.slice(0, 25);
            await interaction.respond(
                limitedChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        };
    },

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
    //    let type = getCache(null, 'type')
        let name = interaction.customId == 'configVendas' ? 'Vendas' : 'Ticket';
    //    if (type?.Vendas?.status !== true) {
        //    interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
     //       return
     //   }

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = checkOwner(interaction.user.id);

        if (!isInDb && !isOwner) {
            await interaction.reply({
                content: `❌ | Você não tem permissão para usar este comando.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        const idProduct = interaction.options.getString("id");
        const userProduct = interaction.options.getUser("usuário");
        const quantityItems = interaction.options.getInteger("unidade");

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await interaction.reply({
            content: `🔁 | Enviando produto(s) ...`,
            flags: MessageFlags.Ephemeral
        }).then(async (msg) => {
            const nameP = await dbProducts.get(`${idProduct}.name`);
            const estoqueP = await dbProducts.get(`${idProduct}.stock`);

            if (estoqueP.length < 1) {
                await interaction.editReply({
                    content: `❌ | Este produto está sem estoque.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            } else if (estoqueP.length < Number(quantityItems)) {
                await interaction.editReply({
                    content: `❌ | Este produto tem apenas **${estoqueP.length}** itens em estoque.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            };

            const purchasedItems = await estoqueP.splice(0, Number(quantityItems));

            let itensRemoved = ``;
            for (let i = 0; i < purchasedItems.length; i++) {
                itensRemoved += `\n📦 | Entrega do Produto: ${nameP} - ${i + 1}/${Number(quantityItems)}\n${purchasedItems[i]}\n`;
            };

            const embedProduct = new EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                .setTitle(`${client.user.username} | Entrega`)
                .addFields(
                    { name: `🪐 | Produto(s) Entregue(s):`, value: `${nameP} x${quantityItems}` },
                    { name: `👤 | Entregue por:`, value: `${interaction.user} | ${interaction.user.username}` }
                )
                .setColor(colorC !== "none" ? colorC : "#460580")
                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` })

            await userProduct.send({
                content: `${userProduct}`,
                embeds: [embedProduct]
            }).then(async (msg) => {
                if (Number(quantityItems) <= 7) {
                    await userProduct.send({
                        content: `${itensRemoved}`
                    }).catch((async (err) => {
                        const fileName = `${nameP}.txt`;
                        writeFile(fileName, itensRemoved, (err) => {
                            if (err) throw err;
                        });
                        const fileAttachment = new AttachmentBuilder(fileName);

                        await userProduct.send({
                            files: [fileAttachment]
                        }).then((msg) => {
                            unlink(fileName, (err) => {
                                if (err) throw err;
                            });
                        });
                    }));
                } else {
                    const fileName = `${nameP}.txt`;
                    writeFile(fileName, itensRemoved, (err) => {
                        if (err) throw err;
                    });
                    const fileAttachment = new AttachmentBuilder(fileName);
                    await userProduct.send({
                        files: [fileAttachment]
                    }).then((msg) => {
                        unlink(fileName, (err) => {
                            if (err) throw err;
                        });
                    });
                };

                await dbProducts.set(`${idProduct}.stock`, estoqueP);
                await interaction.editReply({
                    content: `✅ | Produto(s) enviado(s) com sucesso para a DM do usuário ${userProduct}.`,
                    flags: MessageFlags.Ephemeral
                });
            }).catch(async (err) => {
                console.error(err);
                await interaction.editReply({
                    content: `❌ | Ocorreu um erro ao enviar o produto na DM do usuário ${userProduct}.`,
                    flags: MessageFlags.Ephemeral
                });
            });
        });
    },
};