const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, MessageFlagsBitField } = require("discord.js");
const { General, Produtos } = require("../Database/index");
const { timing } = require("./utils")

async function ProductSetup(client, interaction, productID) {
    const Product = await Produtos.get(`Products.${productID}`);

    let embed = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .setTitle(`Titulo do Produto: **${Product.title}**`)
        .setDescription(`Decrição do Produto:\n\n${Product.description}\n\n-# Variantes existentes: ${Object.keys(Product.sub_products).length} | Cupons existentes: ${Product.coupons.length}`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`optionsCustomProduct_${productID}`)
        .setPlaceholder('Personalizações do Anúncio')
        .setMaxValues(1)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${Product.configs.vendidos ? `Desativar Exibição` : `Ativar Exibição`}`)
                .setDescription(`Ativar/Desativar exibição de unidades vendidas`)
                .setEmoji(`${Product.configs.vendidos ? `🔴` : `🟢`}`)
                .setValue(`ExibitionVendidos`),
            new StringSelectMenuOptionBuilder()
                .setLabel(`${Product.configs.embed ? `Desativar Embed` : `Ativar Embed`}`)
                .setDescription(`Altere a exibição do anúncio para Embed/Content`)
                .setEmoji(`${Product.configs.embed ? `🔴` : `🟢`}`)
                .setValue(`ExibitionEmbed`),
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    interaction.update({
        content: ``,
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`customProduct_${productID}`)
                        .setLabel('Customizar Produto')
                        .setEmoji('1273127418386976788')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`cuponsProduct_${productID}`)
                        .setLabel('Cupons')
                        .setEmoji('1251441496104636496')
                        .setStyle(2),
                ), row,
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`createSubproduct_${productID}`)
                        .setLabel('Criar Variante')
                        .setEmoji('1251441497346281482')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId(`manageSubproduct_${productID}`)
                        .setLabel('Configurar Variantes')
                        .setEmoji('1276564808723861667')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId(`deleteSubproduct_${productID}`)
                        .setLabel('Deletar Variante')
                        .setEmoji('1251441411266711573')
                        .setStyle(4)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`sendAnnounceproduct_${productID}`)
                        .setLabel('Postar Anuncio')
                        .setEmoji('1263220780615991306')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`updateAnnounceproduct_${productID}`)
                        .setLabel('Atualizar Anuncio')
                        .setEmoji('1262641711834861599')
                        .setStyle(2),
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
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function VariantSetup(client, interaction, productID, VariantID) {
    const Product = await Produtos.get(`Products.${productID}.sub_products.${VariantID}`);

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    let embed = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .setTitle(`Titulo da Variante: **${Product.title}**`)
        .setDescription(`Preço: **${formattedPrice.format(Number(Product.price))}**\n\nVendas realizadas: **${Product.info.vendas}**\nUnidades vendidas: **${Product.info.vendidos}**\nTotal obtido: **${formattedPrice.format(Number(Product.info.total))}**\n\n-# Estoque restante: ${Product.stock.length}`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();


    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`optionsSubProduct_${productID}_${VariantID}`)
        .setPlaceholder('Personalizações da Variante')
        .setMaxValues(1)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${Product.coupons ? `Desativar Cupons` : `Ativar Cupons`}`)
                .setDescription(`Ativar/Desativar uso de cupons nesta variante`)
                .setEmoji(`${Product.coupons ? `🔴` : `🟢`}`)
                .setValue(`statusCuponSubProduct`),
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    interaction.update({
        content: ``,
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`customSubProduct_${productID}_${VariantID}`)
                        .setLabel('Editar variante')
                        .setEmoji('1251441839404220417')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`estoqueSubproduct_${productID}_${VariantID}`)
                        .setLabel('Estoque')
                        .setEmoji('1286148930182058056')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId(`deleteestoqueSubproduct_${productID}_${VariantID}`)
                        .setLabel('Limpar Estoque')
                        .setEmoji('1251441411266711573')
                        .setStyle(4),
                ), row,
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltarProductSetup_${productID}`)
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function CouponSetup(client, interaction, productID) {
    const data = await Produtos.get(`Products.${productID}.coupons`);

    let embed = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .setTitle(`Painel de Cupons`)
        .setDescription(`${timing()} **${interaction.user.username}**, selecione abaxio a opção que deseja.`)
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();


    if (data.length > 0) {
        data.forEach(cpn => {
            embed.addFields({ name: `**${cpn.name}**`, value: `**Porcetagem:** \`${cpn.percent}\`\n**Usos:** ${cpn.uses}` });
        });
    }

    interaction.update({
        content: ``,
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`createCoupon_${productID}`)
                        .setLabel('Criar cupom')
                        .setEmoji('1251441497346281482')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId(`deleteCoupon_${productID}`)
                        .setLabel('Deletar cupom')
                        .setEmoji('1251441411266711573')
                        .setStyle(4),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltarProductSetup_${productID}`)
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function CreateAnnounce(channel, productID, interaction, client) {
    const data = await Produtos.get(`Products.${productID}`);

    const Variantes = Object.keys(data.sub_products)

    const channelAnnounce = client.channels.cache.get(channel)
    if (!channelAnnounce) {
        console.error("Canal não encontrado ou bot não tem acesso ao canal.");
        return interaction.editReply({ content: `Canal não encontrado ou bot não tem acesso ao canal.`, flags: MessageFlagsBitField.Flags.Ephemeral })
    }

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    let rowBuy = new ActionRowBuilder()
    if (Variantes.length == 1) {
        const dataVariant = Object.values(data.sub_products);
        let announceDescription;

        const button = new ButtonBuilder()
            .setCustomId(`openOrder_${productID}_${dataVariant[0]?.id}`)
            .setLabel(`Comprar`)
            .setStyle(3)
            .setEmoji(`${dataVariant[0].emoji ? dataVariant[0].emoji : '1297811409132064768'}`)

        rowBuy.addComponents(button);

        if (data.configs.embed == true) {

            let embed = new EmbedBuilder()
                .setTitle(`${data.title}`)
                .setColor(General.get("System.Colors.main"))

            announceDescription = `${data.description}\n
Produto: \`${dataVariant[0].title}\`
Valor: \`R$ ${formattedPrice.format(dataVariant[0].price)}\`
Estoque: \`${dataVariant[0].stock.length}\`\n
${data.configs.vendidos ? `-# Vendidos +${Number(dataVariant[0].info.vendidos)} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `${interaction.guild.name} | ©️ Todos os direitos reservados.`}`

            if (data.bannerURL !== '') {
                embed.setImage(data.bannerURL)
            }
            if (data.iconURL !== '') {
                embed.setThumbnail(data.iconURL)
            }
            embed.setDescription(announceDescription)

            if (data.announce_info.length > 0) {
                try {
                    const dataAnnounce = data.announce_info[0]
                    const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
                    const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)
                    await msgAnnounce.delete();
                    Produtos.set(`Products.${productID}.announce_info`, []);
                } catch (error) {
                    Produtos.set(`Products.${productID}.announce_info`, []);
                    console.log(error)
                }
            }

            channelAnnounce.send({ embeds: [embed], components: [rowBuy] }).then(msg => {
                Produtos.push(`Products.${productID}.announce_info`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });

                const buttonAnnounce = new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver anúncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const rowAnnounce = new ActionRowBuilder().addComponents(buttonAnnounce);
                interaction.editReply({ content: `Anuncio criado com sucesso!`, components: [rowAnnounce], flags: MessageFlagsBitField.Flags.Ephemeral });
            }).catch(err => {
                console.error("Erro ao enviar mensagem:", err);
                interaction.editReply({ content: `houve um erro na criação do anúncio.\n\`${err}\``, flags: MessageFlagsBitField.Flags.Ephemeral });
            });
        } else {

            announceDescription = `# ${data.title}\n\n${data.description}\n
Produto: \`${dataVariant[0].title}\`
Valor: \`${formattedPrice.format(dataVariant[0].price)}\`
Estoque: \`${dataVariant[0].stock.length}\`\n
${data.configs.vendidos ? `-# Vendidos +${dataVariant[0].info.vendidos} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `${interaction.guild.name} | ©️ Todos os direitos reservados.`}`


            if (data.announce_info.length > 0) {
                try {
                    const dataAnnounce = data.announce_info[0]
                    const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
                    const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)
                    await msgAnnounce.delete();
                    Produtos.set(`Products.${productID}.announce_info`, []);
                } catch (error) {
                    Produtos.set(`Products.${productID}.announce_info`, []);
                    console.log(error)
                }
            }

            channelAnnounce.send({ content: announceDescription, embeds: [], components: [rowBuy], files: data.bannerURL ? [data.bannerURL] : [] }).then(msg => {
                Produtos.push(`Products.${productID}.announce_info`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });

                const buttonAnnounce = new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver anúncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const rowAnnounce = new ActionRowBuilder().addComponents(buttonAnnounce);
                interaction.editReply({ content: `Anuncio criado com sucesso!`, components: [rowAnnounce], flags: MessageFlagsBitField.Flags.Ephemeral });
            }).catch(err => {
                console.error("Erro ao enviar mensagem:", err);
                interaction.editReply({ content: `houve um erro na criação do anúncio.\n\`${err}\``, flags: MessageFlagsBitField.Flags.Ephemeral });
            });
        }

    } else if (Variantes.length > 1) {

        let announceDescription;
        rowBuy = [];
        let count = 0;

        const productEntries = Object.values(data.sub_products);
        for (let i = 0; i < productEntries.length; i += 25) {
            const productBatch = productEntries.slice(i, i + 25);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`openOrder_${productID}_${i / 25}`)
                .setPlaceholder(`Clique para selecionar um Produto`)
                .setMaxValues(1);

            productBatch.forEach(prod => {
                selectMenu.addOptions({
                    label: prod.title?.substring(0, 100) || "Sem título",
                    description: `Valor: ${formattedPrice.format(prod.price)} | Estoque: ${prod.stock.length}`,
                    value: prod.id.toString(),
                    emoji: prod.emoji || '1297811409132064768'
                });

                if (prod.info.vendidos > 0) {
                    count = count + prod.info.vendidos;
                }
            });

            rowBuy.push(new ActionRowBuilder().addComponents(selectMenu));
        }

        if (data.configs.embed == true) {

            let embed = new EmbedBuilder()
                .setTitle(`${data.title}`)
                .setColor(General.get("System.Colors.main"))

            announceDescription = `${data.description}\n\n${data.configs.vendidos ? `-# Vendidos +${Number(count)} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `${interaction.guild.name} | ©️ Todos os direitos reservados.`}`

            if (data.bannerURL !== '') {
                embed.setImage(data.bannerURL)
            }
            if (data.iconURL !== '') {
                embed.setThumbnail(data.iconURL)
            }
            embed.setDescription(announceDescription)

            if (data.announce_info.length > 0) {
                try {
                    const dataAnnounce = data.announce_info[0]
                    const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
                    const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)
                    await msgAnnounce.delete();
                    Produtos.set(`Products.${productID}.announce_info`, []);
                } catch (error) {
                    Produtos.set(`Products.${productID}.announce_info`, []);
                    console.log(error)
                }
            }

            channelAnnounce.send({ embeds: [embed], components: [...rowBuy] }).then(msg => {
                Produtos.push(`Products.${productID}.announce_info`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });

                const buttonAnnounce = new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver anúncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const rowAnnounce = new ActionRowBuilder().addComponents(buttonAnnounce);
                interaction.editReply({ content: `Anuncio criado com sucesso!`, components: [rowAnnounce], flags: MessageFlagsBitField.Flags.Ephemeral });
            }).catch(err => {
                console.error("Erro ao enviar mensagem:", err);
                interaction.editReply({ content: `houve um erro na criação do anúncio.\n\`${err}\``, flags: MessageFlagsBitField.Flags.Ephemeral });
            });
        } else {

            announceDescription = `# ${data.title}\n\n${data.description}\n\n${data.configs.vendidos ? `-# Vendidos +${count} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `©️ ${interaction.guild.name} Todos os direitos reservados.`}`

            if (data.announce_info.length > 0) {
                try {
                    const dataAnnounce = data.announce_info[0]
                    const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
                    const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)
                    await msgAnnounce.delete();
                    Produtos.set(`Products.${productID}.announce_info`, []);
                } catch (error) {
                    Produtos.set(`Products.${productID}.announce_info`, []);
                    console.log(error)
                }
            }

            channelAnnounce.send({ content: announceDescription, embeds: [], components: [...rowBuy], files: data.bannerURL ? [data.bannerURL] : [] }).then(msg => {
                Produtos.push(`Products.${productID}.announce_info`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });

                const buttonAnnounce = new ButtonBuilder()
                    .setURL(`${msg.url}`)
                    .setLabel(`Ver anúncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const rowAnnounce = new ActionRowBuilder().addComponents(buttonAnnounce);
                interaction.editReply({ content: `Anuncio criado com sucesso!`, components: [rowAnnounce], flags: MessageFlagsBitField.Flags.Ephemeral });
            }).catch(err => {
                console.error("Erro ao enviar mensagem:", err);
                interaction.editReply({ content: `houve um erro na criação do anúncio.\n\`${err}\``, flags: MessageFlagsBitField.Flags.Ephemeral });
            });
        }
    }

}

async function UpdateAnnounce(productID, interaction, client) {
    const data = await Produtos.get(`Products.${productID}`);

    const Variantes = Object.keys(data.sub_products)

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });
    let rowBuy = new ActionRowBuilder()

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    if (Variantes.length == 1) {
        const dataVariant = Object.values(data.sub_products);
        let announceDescription;

        const button = new ButtonBuilder()
            .setCustomId(`openOrder_${productID}_${dataVariant[0]?.id}`)
            .setLabel(`Comprar`)
            .setStyle(3)
            .setEmoji(`${dataVariant[0].emoji ? dataVariant[0].emoji : '1297811409132064768'}`)

        rowBuy.addComponents(button);

        if (data.configs.embed == true) {

            let embed = new EmbedBuilder()
                .setTitle(`${data.title}`)
                .setColor(General.get("System.Colors.main"))

            announceDescription = `${data.description}\n
Produto: \`${dataVariant[0].title}\`
Valor: \`${formattedPrice.format(dataVariant[0].price)}\`
Estoque: \`${dataVariant[0].stock.length}\`
${data.configs.vendidos ? `\n-# Vendidos +${Number(dataVariant[0].info.vendidos)} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `${interaction.guild.name} | ©️ Todos os direitos reservados.`}`

            if (data.bannerURL !== '') {
                embed.setImage(data.bannerURL)
            }
            if (data.iconURL !== '') {
                embed.setThumbnail(data.iconURL)
            }
            embed.setDescription(announceDescription)

            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O anúncio não foi criado ou foi deletado, portanto não é possivel atualiza-lo.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const dataAnnounce = data.announce_info[0]
            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O canal do anúncio não existe ou foi deletado, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `A mensagem do anúncio não existe ou foi deletada, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }

            try {
                const button = new ButtonBuilder()
                    .setURL(`${msgAnnounce.url}`)
                    .setLabel(`Ver Anuncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const row = new ActionRowBuilder().addComponents(button)

                msgAnnounce.edit({ content: ``, embeds: [embed], components: [rowBuy], files: [] });
                interaction.editReply({ content: `Anuncio atualizado!`, components: [row], flags: MessageFlagsBitField.Flags.Ephemeral });
            } catch (error) {
                interaction.editReply({ content: `Houve um erro.\n \`${error}\``, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }
        } else {

            announceDescription = `# ${data.title}\n\n${data.description}\n
Produto: \`${dataVariant[0].title}\`
Valor: \`${formattedPrice.format(dataVariant[0].price)}\`
Estoque: \`${dataVariant[0].stock.length}\`
${data.configs.vendidos ? `\n-# Vendidos +${dataVariant[0].info.vendidos} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `${interaction.guild.name} | ©️ Todos os direitos reservados.`}`


            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O anúncio não foi criado ou foi deletado, portanto não é possivel atualiza-lo.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const dataAnnounce = data.announce_info[0]
            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O canal do anúncio não existe ou foi deletado, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `A mensagem do anúncio não existe ou foi deletada, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }

            try {
                const button = new ButtonBuilder()
                    .setURL(`${msgAnnounce.url}`)
                    .setLabel(`Ver Anuncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const row = new ActionRowBuilder().addComponents(button)

                msgAnnounce.edit({ content: announceDescription, embeds: [], components: [rowBuy], files: data.bannerURL ? [data.bannerURL] : [] });
                interaction.editReply({ content: `Anuncio atualizado!`, components: [row], flags: MessageFlagsBitField.Flags.Ephemeral });
            } catch (error) {
                interaction.editReply({ content: `Houve um erro.\n \`${error}\``, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }
        }

    } else if (Variantes.length > 1) {

        let announceDescription;
        rowBuy = [];
        let count = 0;

        const productEntries = Object.values(data.sub_products);
        for (let i = 0; i < productEntries.length; i += 25) {
            const productBatch = productEntries.slice(i, i + 25);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`openOrder_${productID}_${i / 25}`)
                .setPlaceholder(`Clique para selecionar um Produto`)
                .setMaxValues(1);

            productBatch.forEach(prod => {
                selectMenu.addOptions({
                    label: prod.title?.substring(0, 100) || "Sem título",
                    description: `Valor: ${formattedPrice.format(prod.price)} | Estoque: ${prod.stock.length}`,
                    value: prod.id.toString(),
                    emoji: prod.emoji || '1297811409132064768'
                });

                if (prod.info.vendidos > 0) {
                    count = count + prod.info.vendidos;
                }
            });

            rowBuy.push(new ActionRowBuilder().addComponents(selectMenu));
        }

        if (data.configs.embed == true) {

            let embed = new EmbedBuilder()
                .setTitle(`${data.title}`)
                .setColor(General.get("System.Colors.main"))

            announceDescription = `${data.description}\n${data.configs.vendidos ? `\n-# Vendidos +${Number(count)} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `${interaction.guild.name} | ©️ Todos os direitos reservados.`}`

            if (data.bannerURL !== '') {
                embed.setImage(data.bannerURL)
            }
            if (data.iconURL !== '') {
                embed.setThumbnail(data.iconURL)
            }
            embed.setDescription(announceDescription)

            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O anúncio não foi criado ou foi deletado, portanto não é possivel atualiza-lo.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const dataAnnounce = data.announce_info[0]
            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O canal do anúncio não existe ou foi deletado, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `A mensagem do anúncio não existe ou foi deletada, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }

            try {
                const button = new ButtonBuilder()
                    .setURL(`${msgAnnounce.url}`)
                    .setLabel(`Ver Anuncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const row = new ActionRowBuilder().addComponents(button)

                msgAnnounce.edit({ content: ``, embeds: [embed], components: [...rowBuy], files: [] });
                interaction.editReply({ content: `Anuncio atualizado!`, components: [row], flags: MessageFlagsBitField.Flags.Ephemeral });
            } catch (error) {
                interaction.editReply({ content: `Houve um erro.\n \`${error}\``, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }
        } else {

            announceDescription = `# ${data.title}\n\n${data.description}\n\n${data.configs.vendidos ? `-# Vendidos +${count} | ${interaction.guild.name} ©️ Todos os direitos reservados.` : `©️ ${interaction.guild.name} Todos os direitos reservados.`}`

            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O anúncio não foi criado ou foi deletado, portanto não é possivel atualiza-lo.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const dataAnnounce = data.announce_info[0]
            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `O canal do anúncio não existe ou foi deletado, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return interaction.editReply({ content: `A mensagem do anúncio não existe ou foi deletada, portanto não é possivel atualizar o anúncio.`, flags: MessageFlagsBitField.Flags.Ephemeral })
            }

            try {
                const button = new ButtonBuilder()
                    .setURL(`${msgAnnounce.url}`)
                    .setLabel(`Ver Anuncio`)
                    .setStyle(5)
                    .setEmoji('1251441846601912452')

                const row = new ActionRowBuilder().addComponents(button)

                msgAnnounce.edit({ content: announceDescription, embeds: [], components: [...rowBuy], files: data.bannerURL ? [data.bannerURL] : [] });
                interaction.editReply({ content: `Anuncio atualizado!`, components: [row], flags: MessageFlagsBitField.Flags.Ephemeral });
            } catch (error) {
                interaction.editReply({ content: `Houve um erro.\n \`${error}\``, components: [], flags: MessageFlagsBitField.Flags.Ephemeral });
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }

        }
    }

}

async function UpdateStock(productID, client) {
    const data = await Produtos.get(`Products.${productID}`);

    if (data.announce_info.length < 1) return

    const Variantes = Object.keys(data.sub_products)
    if (Variantes.length == 0) return console.log('Nao possui variantes para atualizar')

    let rowBuy = new ActionRowBuilder()

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    if (Variantes.length == 1) {

        const dataVariant = Object.values(data.sub_products);
        let announceDescription;

        data.announce_info[0].msgid

        const button = new ButtonBuilder()
            .setCustomId(`openOrder_${productID}_${dataVariant[0]?.id}`)
            .setLabel(`Comprar`)
            .setStyle(3)
            .setEmoji(`${dataVariant[0].emoji ? dataVariant[0].emoji : '1297811409132064768'}`)

        rowBuy.addComponents(button);

        if (data.configs.embed == true) {
            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const dataAnnounce = data.announce_info[0]

            const Guild = await client.guilds.fetch(dataAnnounce.guildid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar guilda: ${dataAnnounce.guildid} - Os dados foram deletados.`)
                    return;
                }
            });

            let embed = new EmbedBuilder()
                .setTitle(`${data.title}`)
                .setColor(General.get("System.Colors.main"))

            announceDescription = `${data.description}\n
Produto: \`${dataVariant[0].title}\`
Valor: \`${formattedPrice.format(dataVariant[0].price)}\`
Estoque: \`${dataVariant[0].stock.length}\`
${data.configs.vendidos ? `\n-# Vendidos +${Number(dataVariant[0].info.vendidos)} | ${Guild.name} ©️ Todos os direitos reservados.` : `${Guild.name} | ©️ Todos os direitos reservados.`}`

            if (data.bannerURL !== '') {
                embed.setImage(data.bannerURL)
            }
            if (data.iconURL !== '') {
                embed.setThumbnail(data.iconURL)
            }
            embed.setDescription(announceDescription)

            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }

            try {
                msgAnnounce.edit({ content: ``, embeds: [embed], components: [rowBuy], files: [] });
            } catch (error) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }
        } else {
            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const dataAnnounce = data.announce_info[0];

            const Guild = await client.guilds.fetch(dataAnnounce.guildid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar guilda: ${dataAnnounce.guildid} - Os dados foram deletados.`)
                    return;
                }
            });

            announceDescription = `# ${data.title}\n\n${data.description}\n
Produto: \`${dataVariant[0].title}\`
Valor: \`${formattedPrice.format(dataVariant[0].price)}\`
Estoque: \`${dataVariant[0].stock.length}\`
${data.configs.vendidos ? `\n-# Vendidos +${dataVariant[0].info.vendidos} | ${Guild.name} ©️ Todos os direitos reservados.` : `${Guild.name} | ©️ Todos os direitos reservados.`}`

            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }

            try {
                msgAnnounce.edit({ content: announceDescription, embeds: [], components: [rowBuy], files: data.bannerURL ? [data.bannerURL] : [] });
            } catch (error) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }
        }

    } else if (Variantes.length > 1) {

        let announceDescription;
        rowBuy = [];
        let count = 0;

        const productEntries = Object.values(data.sub_products);
        for (let i = 0; i < productEntries.length; i += 25) {
            const productBatch = productEntries.slice(i, i + 25);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`openOrder_${productID}_${i / 25}`)
                .setPlaceholder(`Clique para selecionar um Produto`)
                .setMaxValues(1);

            productBatch.forEach(prod => {
                selectMenu.addOptions({
                    label: prod.title?.substring(0, 100) || "Sem título",
                    description: `Valor: ${formattedPrice.format(prod.price)} | Estoque: ${prod.stock.length}`,
                    value: prod.id.toString(),
                    emoji: prod.emoji || '1297811409132064768'
                });

                if (prod.info.vendidos > 0) {
                    count = count + prod.info.vendidos;
                }
            });

            rowBuy.push(new ActionRowBuilder().addComponents(selectMenu));
        }

        if (data.configs.embed == true) {

            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const dataAnnounce = data.announce_info[0]

            const Guild = await client.guilds.fetch(dataAnnounce.guildid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar guilda: ${dataAnnounce.guildid} - Os dados foram deletados.`)
                    return;
                }
            });

            let embed = new EmbedBuilder()
                .setTitle(`${data.title}`)
                .setColor(General.get("System.Colors.main"))

            announceDescription = `${data.description}\n${data.configs.vendidos ? `\n-# Vendidos +${Number(count)} | ${Guild.name} ©️ Todos os direitos reservados.` : `${Guild.name} | ©️ Todos os direitos reservados.`}`

            if (data.bannerURL !== '') {
                embed.setImage(data.bannerURL)
            }
            if (data.iconURL !== '') {
                embed.setThumbnail(data.iconURL)
            }
            embed.setDescription(announceDescription)


            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }

            try {
                msgAnnounce.edit({ content: ``, embeds: [embed], components: [...rowBuy], files: [] });
            } catch (error) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }
        } else {
            if (data.announce_info.length < 1) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const dataAnnounce = data.announce_info[0]

            const Guild = await client.guilds.fetch(dataAnnounce.guildid).catch((error) => {
                if (error) {
                    console.log(`Erro ao encontrar guilda: ${dataAnnounce.guildid} - Os dados foram deletados.`)
                    return;
                }
            });

            announceDescription = `# ${data.title}\n\n${data.description}\n\n${data.configs.vendidos ? `-# Vendidos +${count} | ${Guild.name} ©️ Todos os direitos reservados.` : `©️ ${Guild.name} Todos os direitos reservados.`}`


            const channelAnnounce = await client.channels.cache.get(dataAnnounce.channelid)
            if (!channelAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }
            const msgAnnounce = await channelAnnounce.messages.fetch(dataAnnounce.msgid)

            if (!msgAnnounce) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                return
            }

            try {
                msgAnnounce.edit({ content: announceDescription, embeds: [], components: [...rowBuy], files: data.bannerURL ? [data.bannerURL] : [] });
            } catch (error) {
                Produtos.set(`Products.${productID}.announce_info`, []);
                console.log(error)
            }

        }
    }

}

async function estoqueSetup(productID, VariantID, interaction) {

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`addestoqueLine_${productID}_${VariantID}`)
                .setLabel('Estoque por linha')
                .setEmoji(`1264379774793420811`)
                .setStyle(2),

            new ButtonBuilder()
                .setCustomId(`estoqueArquivo_${productID}_${VariantID}`)
                .setLabel('Estoque em arquivo')
                .setEmoji(`1319043529363816599`)
                .setStyle(2),
        )

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`estoquefantasma_${productID}_${VariantID}`)
                .setLabel('Estoque fantasma')
                .setEmoji(`1178347870747906131`)
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId(`downloadStock_${productID}_${VariantID}`)
                .setLabel('Backup Estoque')
                .setEmoji(`1319043620594126899`)
                .setStyle(2),
        )

    const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`VoltarVariant_${productID}_${VariantID}`)
                .setLabel('Voltar')
                .setEmoji(`1251441490576805979`)
                .setStyle(2)
        )

    await interaction.update({ embeds: [], content: `Selecione o método`, components: [row2, row3, row4], flags: MessageFlagsBitField.Flags.Ephemeral });
}

module.exports = {
    ProductSetup,
    VariantSetup,
    CouponSetup,
    CreateAnnounce,
    estoqueSetup,
    UpdateAnnounce,
    UpdateStock
}