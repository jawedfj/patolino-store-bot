const { JsonDatabase } = require("wio.db");
const { UpdateMsgs, UpdateSelects } = require("../Paginas/UpdateMsgs");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, WebhookClient } = require("discord.js");
const { getCache, checkOwner } = require("../connect_api");
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const dbOpenedCarts = new JsonDatabase({ databasePath: "./databases/dbOpenedCarts.json" })
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })


async function findProductInfo(productId) {
    try {
        // 1. Verificar em dbPanels (produto em painel) - PRIMEIRO VERIFICA OS PAINÉIS
        const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" });
        const allPanels = dbPanels.all();

        for (const panel of allPanels) {
            const panelId = panel.ID;
            const panelData = panel.data;

            if (panelData && panelData.products) {
                // Verificar se o produto está neste painel
                const products = Object.keys(panelData.products || {});

                if (products.includes(productId) && panelData.msgLocalization && panelData.msgLocalization.channelId) {
                    return {
                        channelId: panelData.msgLocalization.channelId,
                        displayType: "panel", // Produto em painel
                        panelId: panelId,
                        messageId: panelData.msgLocalization.messageId || null
                    };
                }
            }
        }

        // 2. Verificar em dbProducts (produto individual) - SÓ VERIFICA PRODUTOS INDIVIDUAIS SE NÃO ENCONTRAR EM PAINÉIS
        const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
        const msgLocalization = await dbProducts.get(`${productId}.msgLocalization`);

        if (msgLocalization && msgLocalization.channelId) {
            return {
                channelId: msgLocalization.channelId,
                displayType: "product", // Produto individual
                messageId: msgLocalization.messageId || null
            };
        }

        return null;
    } catch (error) {
        console.error(`Erro ao buscar informações para o produto ${productId}: ${error.message}`);
        return null;
    }
}

async function enviarLogCompra(client, user, infocart, guild) {
    try {
        // Recuperar o canal de logs público
        const channelLogsPublic = await client.channels.fetch(dbConfigs.get(`vendas.channels.channelLogsPublicId`));
        if (!channelLogsPublic) {
            console.error("Canal de logs públicos não encontrado");
            return;
        }

        // Preparar dados dos produtos
        let totalPrice = 0;
        let totalItems = 0;
        let productNames = [];
        let buyChannelId = null;
        let productDisplayInfo = []; // Nova array para guardar informações de exibição

        const productIds = Object.keys(infocart.products || {});
        for (const pId of productIds) {
            const productDetails = infocart.products[pId];
            const productId = productDetails.productId;
            const productName = productDetails.productName;
            const quantity = productDetails.purchaseAmount;

            productNames.push(productName);
            totalItems += quantity;

            // Calcular preço total
            const price = await dbProducts.get(`${productId}.price`) || 0;
            totalPrice += Number(price) * quantity;

            // Buscar informações de exibição do produto
            const productInfo = await findProductInfo(productId);
            if (productInfo) {
                productDisplayInfo.push({
                    id: productId,
                    name: productName,
                    displayType: productInfo.displayType,
                    channelId: productInfo.channelId,
                    panelId: productInfo.panelId || null
                });

                // Se ainda não temos um canal para o botão "Comprar", usar o deste produto
                if (!buyChannelId) {
                    buyChannelId = productInfo.channelId;
                }
            }
        }

        // Se não encontramos um canal específico, tentar usar o canal de loja geral
        if (!buyChannelId) {
            buyChannelId = dbConfigs.get(`vendas.channels.storeChannelId`);
        }

        // Formatação da data atual para a descrição
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });

        // Formatação da data para o footer
        const formattedDate = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const fullDateString = `${formattedDate} às ${timeString}`;

        // Criar a descrição com informações detalhadas
        let description = `**Informações do Pedido**\nComprador: <@${user.id}>\nProduto: **${productNames.join(", ")}**\nValor Total: \`${Number(totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\` - \`${totalItems}\` **unidade(s)**`;
        
        // Adicionar informações de tipo de exibição dos produtos (opcional)
        if (productDisplayInfo.length > 0) {
            const displayDetails = productDisplayInfo.map(p => {
                if (p.displayType === "panel") {
                    return `• ${p.name} (Em Painel: ${p.panelId})`;
                } else {
                    return `• ${p.name} (Produto Individual)`;
                }
            });
            
            // Adicionar estas informações na descrição se necessário
            // description += "\n\n**Detalhes de Exibição:**\n" + displayDetails.join("\n");
            
            // Ou armazenar para uso interno/logs
            console.log("Informações de exibição dos produtos:", displayDetails);
        }

        const corEmbed = dbConfigs.get('vendas.embeds.color');

        // Criar o embed com as novas informações no footer
        const embed = new EmbedBuilder()
            .setColor(corEmbed && corEmbed.trim() !== 'none' ? corEmbed : '#3e008f')
            .setAuthor({
                name: 'Ordem Aprovada',
                iconURL: 'https://cdn.discordapp.com/emojis/1365039595779264632.webp?size=96'
            })
            .setTitle(`Compra realizada`)
            .setDescription(description)
            .setFooter({
                text: `${guild.name} • ${fullDateString}`,
                iconURL: guild.iconURL({ dynamic: true })
            });

        // Criar componentes (botões)
        const row = new ActionRowBuilder();

        // Verificar se temos um canal válido para o botão "Comprar"
        if (buyChannelId) {
            try {
                // Validar se o canal existe
                await client.channels.fetch(buyChannelId);

                // Criar URL do canal
                const channelURL = `https://discord.com/channels/${guild.id}/${buyChannelId}`;

                // Adicionar botão "Comprar" com link para o canal
                row.addComponents(
                    new ButtonBuilder()
                        .setURL(channelURL)
                        .setLabel('Comprar')
                        .setEmoji('<:1289360573112516751:1364987325762895882>')
                        .setStyle(5) // Estilo LINK (5)
                );
            } catch (channelError) {
                // Botão desabilitado como fallback
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('comprar_disabled')
                        .setLabel('Comprar')
                        .setEmoji('<:1289360573112516751:1364987325762895882>')
                        .setStyle(2) // Estilo SECONDARY (2)
                        .setDisabled(true)
                );
            }
        } else {
            // Botão desabilitado se não houver canal
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('comprar_disabled')
                    .setLabel('Comprar')
                    .setEmoji('<:1289360573112516751:1364987325762895882>')
                    .setStyle(2) // Estilo SECONDARY (2)
                    .setDisabled(true)
            );
        }

        // Enviar a mensagem com a menção do usuário
        const sentMessage = await channelLogsPublic.send({
            embeds: [embed],
            components: [row]
        });

        // Atualizar a mensagem com o botão de compartilhar
        const messageURL = `https://discord.com/channels/${guild.id}/${channelLogsPublic.id}/${sentMessage.id}`;

        const updatedRow = new ActionRowBuilder();

        // Manter o botão de comprar
        if (buyChannelId) {
            try {
                const channelURL = `https://discord.com/channels/${guild.id}/${buyChannelId}`;
                updatedRow.addComponents(
                    new ButtonBuilder()
                        .setURL(channelURL)
                        .setLabel('Comprar')
                        .setEmoji('<:1289360573112516751:1364987325762895882>')
                        .setStyle(5) // Estilo LINK (5)
                );
            } catch (error) {
                updatedRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('comprar_disabled')
                        .setLabel('Comprar')
                        .setEmoji('<:1289360573112516751:1364987325762895882>')
                        .setStyle(2) // Estilo SECONDARY (2)
                        .setDisabled(true)
                );
            }
        } else {
            updatedRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('comprar_disabled')
                    .setLabel('Comprar')
                    .setEmoji('<:1289360573112516751:1364987325762895882>')
                    .setStyle(2) // Estilo SECONDARY (2)
                    .setDisabled(true)
            );
        }

        // Atualizar a mensagem com os botões corretos
        await sentMessage.edit({ components: [updatedRow] });
        
        // Retornar informações para uso em outros lugares
        return {
            logMessageId: sentMessage.id,
            productDisplayInfo: productDisplayInfo
        };
    } catch (error) {
        console.error(`Erro ao enviar log público: ${error.message}`);
        return null;
    }
}

let notentregarepeat = {}
let entregaon = false
async function EntregarCarrinho(client) {
    let dataehorarioformatado = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    if (entregaon) return
    entregaon = true
    let AllPedidosaApproved = dbOpenedCarts.all().filter(pedido => pedido.data.status === 'approved')

    for (let i = 0; i < AllPedidosaApproved.length; i++) {
        if (notentregarepeat[AllPedidosaApproved[i].ID]) continue
        notentregarepeat[AllPedidosaApproved[i].ID] = true
        let produtosname = []
        let infocart = AllPedidosaApproved[i].data

        const productIds = Object.keys(infocart.products)
        for (const pId of productIds) {
            const productDetails = infocart.products[pId];
            let qtdprodutos = productDetails.purchaseAmount
            let idproduto = productDetails.productId

            produtosname.push({
                Name: idproduto,
                Qtd: qtdprodutos,
            });

        }
        let qtddd = 0
        let finalproduto = ''
        let finalproduto2 = ''
        let logmessage5 = ''
        for (var ie = 0; ie < produtosname.length; ie++) {
            qtddd += produtosname[ie].Qtd
            let nameProd = produtosname[ie].Name
            const estoque = await dbProducts.get(`${nameProd}.stock`) || [];
            for (let j = 0; j < produtosname[ie].Qtd; j++) {

                const produto = estoque.length > 0 ? estoque.shift() : '`Estoque desse produto esgotou - Contate um STAFF`';
                finalproduto += `📦 | Entrega do Produto: ${produtosname[ie].Name} - ${j + 1}/${produtosname[ie].Qtd}\n${produto}\n\n`;
                finalproduto2 += `${produto}\n`;
            }
            let purchaseAmount = produtosname[ie].Qtd
            let price = await dbProducts.get(`${nameProd}.price`)
            price = Number(price) * purchaseAmount

            logmessage5 += `\`${purchaseAmount}x ${produtosname[ie].Name} | ${Number(price).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n`

            await dbProducts.set(`${nameProd}.stock`, estoque);
            UpdateMsgs(client, nameProd)
            UpdateSelects(client, nameProd)

            try {
                const roleProduct = await dbProducts.get(`${nameProd}.role`)
                const member = await client.guilds.cache.get(infocart.guildId).members.fetch(infocart.userId)
                await member.roles.add(roleProduct)
            } catch (error) {
            }

            try {
                const roleConfig = await dbConfigs.get(`vendas.roles.roleCustomerId`)

                const member = await client.guilds.cache.get(infocart.guildId).members.fetch(infocart.userId)
                await member.roles.add(roleConfig)
            } catch (error) {
            }
        }
        let channel
        try {
            channel = await client.channels.fetch(AllPedidosaApproved[i].ID)
        } catch (error) {
            await dbOpenedCarts.delete(AllPedidosaApproved[i].ID)
            continue; // Pular para o próximo pedido se o canal não existir
        }
        let guild = client.guilds.cache.get(infocart.guildId)


        let user = await client.users.fetch(infocart.userId)
        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setAuthor({ name: `Entrega realizada!`, iconURL: 'https://cdn.discordapp.com/emojis/1182868166813171742.webp?size=44&quality=lossless' })
            .setDescription(`Seu produto foi anexado a essa mensagem.`)
            .addFields(
                { name: `Detalhes:`, value: `${logmessage5}` },
                { name: `Id da Compra:`, value: `\`${infocart.paymentID}\`` },
            )
            .setFooter({ text: `Seu(s) Produto(s) estão abaixo:`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null });

        let dmFechada = false
        let msgprivado
        try {
            msgprivado = await user.send({ embeds: [embed] })
            if (finalproduto.length >= 500) {
                let fileName = `entrega_produtos.txt`;
                let fileBuffer = Buffer.from(finalproduto2, 'utf-8');
                await msgprivado.reply({ files: [{ attachment: fileBuffer, name: fileName }] })
            } else {
                await user.send({ content: finalproduto })
            }
        } catch (error) {
            dmFechada = true
        }

        const embed2 = new EmbedBuilder()
            .setColor(`#00FF00`)
            .setTitle(`🎉 Pagamento Aprovado 🎉`)
            .setDescription(`<@${user.id}>, **Pagamento aprovado!** Confira sua DM para mais informações.\n\n-# 🕒 Este canal será excluído automaticamente em **1 minuto**. Agradecemos por confiar em nossos serviços!`);
        const row = new ActionRowBuilder()
        if (dmFechada) {
            row.addComponents(
                new ButtonBuilder()
                    .setURL('https://www.youtube.com/')
                    .setLabel('Atalho Para DM')
                    .setStyle(5)
                    .setDisabled(true))
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setURL(msgprivado.url)
                    .setLabel('Atalho Para DM')
                    .setStyle(5)
                    .setDisabled(false))
        }
        try {
            await channel.send({ embeds: [embed2], components: [row] })
        } catch (error) {
            // Erro ao enviar mensagem no canal
        }

        if (dmFechada) {
            const embed2 = new EmbedBuilder()
                .setColor(`#00FF00`)
                .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
                .setDescription(`- Olá <@${AllPedidosaApproved[i].data.userId}> seu pedido foi aprovado mas não consegui enviar a mensagem privada, enviarei o produto aqui.`)

            let msgentregachat = await channel.send({ embeds: [embed2] })
            if (finalproduto.length >= 500) {
                let fileName = `entrega_produtos.txt`;
                let fileBuffer = Buffer.from(finalproduto2, 'utf-8');
                await msgentregachat.reply({ files: [{ attachment: fileBuffer, name: fileName }] })
            } else {
                await channel.send({ content: finalproduto })
            }

            setTimeout(async () => {
                try {
                    await channel.delete()
                } catch (error) {
                    // Erro ao deletar canal
                }
            }, 60000 * 5);
        }

        const embedlogsucess = new EmbedBuilder()
            .setColor('Purple')
            .setAuthor({ name: `Entrega realizada!`, iconURL: 'https://cdn.discordapp.com/emojis/1230562879116152923.webp?size=44&quality=lossless' })
            .setDescription(`- O usuário <@${AllPedidosaApproved[i].data.userId}> teve seu pedido entregue.`)
            .setFields(
                { name: `Detalhes`, value: `${logmessage5}`, inline: false },
                { name: `ID do Pedido`, value: `\`${infocart.paymentID}\``, inline: false },
            )
            .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
            .setTimestamp()

        let fileName = `entrega_produtos.txt`;
        let fileBuffer2 = Buffer.from(finalproduto2, 'utf-8');
        try {
            let channellog = await client.channels.fetch(infocart.log.channel)
            let message = await channellog.messages.fetch(infocart.log.message)
            message.reply({ embeds: [embedlogsucess], files: [{ attachment: fileBuffer2, name: fileName }] })
        } catch (error) {
            // Erro ao enviar log
        }

        await dbOpenedCarts.set(`${AllPedidosaApproved[i].ID}.status`, 'entregue')

        // Enviar o log público no novo formato
        await enviarLogCompra(client, user, infocart, guild);

        if (dmFechada !== true) {
            setTimeout(async () => {
                try {
                    await channel.delete()
                } catch (error) {
                    // Erro ao deletar canal
                }
            }, 60000 * 1);
        }

        // Removido o bloco de código de avaliação

        try {
            const channelLogsavaliar = await dbConfigs.get(`vendas.channels.avaliar`)
            let channelavaliar = await client.channels.fetch(channelLogsavaliar)
            channelavaliar.send({ content: `<@${user.id}>` }).then(async (msg) => {
                try {
                    await msg.delete()
                } catch (error) {
                    // Erro ao deletar mensagem
                }
            })
        } catch (error) {
            // Erro ao enviar notificação
        }

        if (infocart.paymentType == "esales") {
            // envie um webhook de logs completa com  os dados do pedido entregue , produto entregue e o id do pedido
            let getOwner = await getCache(null, "owner")
            const webhooklogEmbed = new EmbedBuilder()
                .setColor('Purple')
                .setAuthor({ name: `Entrega realizada!`, iconURL: 'https://cdn.discordapp.com/emojis/1230562879116152923.webp?size=44&quality=lossless' })
                .setDescription(`- O usuário <@${AllPedidosaApproved[i].data.userId}> teve seu pedido entregue.`)
                .setFields(
                    { name: `Detalhes`, value: `${logmessage5}`, inline: false },
                    { name: `ID do Pedido`, value: `\`${infocart.paymentID}\``, inline: false },
                )
                .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                .setTimestamp()

            let txtfile = `entrega_produtos.txt`;
            let txtfilebuffer = Buffer.from(finalproduto, 'utf-8');
            /* const webhook = new WebhookClient({ url: `` });
            await webhook.send({
                content: `<@${user.id}> (\`${user.id}\`) - Entrega realizada! | Vendedor Responsável: <@${getOwner}> (\`${getOwner}\`)`,
                username: `e-Sales | Logs de Entrega`,
                embeds: [webhooklogEmbed],
                files: [{ attachment: txtfilebuffer, name: txtfile }]
            }).catch((error) => {
                console.log(error)
            }) */

            try {
                const supportEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('Compra Realizada com Sucesso!')
                    .setDescription('Compra processada pelo sistema **e-Sales** com total segurança.')
                    .setThumbnail('https://cdn.discordapp.com/emojis/1306963747960782998.webp?size=96')
                    .addFields(
                        {
                            name: 'Problema com o produto?',
                            value: 'Use `/compras` para abrir um ticket de suporte.'
                        }
                    )
                    .setFooter({
                        text: '🔒 Sua compra está protegida pelo Sistema e-Sales'
                    })
                    .setTimestamp();

                await channel.send({ embeds: [supportEmbed] });
            } catch (error) {
                console.error('Erro:', error);
                try {
                    await channel.send('✅ Compra realizada! Use `/compras` para suporte ou reembolso.');
                } catch (secondError) {
                    console.error('Erro no fallback:', secondError);
                }
            }

            try {
                const supportEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('✅ Compra Realizada com Sucesso!')
                    .setDescription('Compra processada pelo sistema **e-Sales** com total segurança.')
                    .setThumbnail('https://cdn.discordapp.com/emojis/1306963747960782998.webp?size=96')
                    .addFields(
                        {
                            name: '❓ Problema com o produto?',
                            value: 'Use `/compras` para abrir um ticket de suporte.'
                        }
                    )
                    .setFooter({
                        text: '🔒 Sua compra está protegida pelo Sistema e-Sales'
                    })
                    .setTimestamp();

                await user.send({ embeds: [supportEmbed] });
            } catch (error) {
                console.error('Erro:', error);
                try {
                    await user.send('✅ Compra realizada! Use `/compras` para suporte ou reembolso.');
                } catch (secondError) {
                    console.error('Erro no fallback:', secondError);
                }
            }
        }
    }
    entregaon = false
}

module.exports = {
    EntregarCarrinho
    // Removida a exportação de AvaliacaoCancel
}