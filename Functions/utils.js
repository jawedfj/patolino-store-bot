const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, MessageFlagsBitField, ChannelType, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, ActivityType } = require("discord.js");
const { General, Usuarios, Produtos } = require("../Database/index");
const { Console } = require("../Functions/console");
const axios = require('axios');

function genRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const segmentLength = 4;
    const totalSegments = 4;
    let randomString = '';

    for (let i = 0; i < totalSegments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            segment += characters[randomIndex];
        }
        randomString += segment;
    }

    return randomString;
}

function createID() {
    const characters = '0123456789ABCDEFJKILMNOPQRSTUVWXYZ0123456789abcdefijklmnopqrstuvwxys0123456789';
    let randomString = '';

    for (let i = 0; i < 16; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters[randomIndex];
    }

    return randomString
}

function timing() {
    const horabrasil = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(horabrasil).getHours();

    if (hora >= 0 && hora < 6) {
        return 'Boa madrugada';
    } else if (hora < 12) {
        return 'Bom dia';
    } else if (hora < 18) {
        return 'Boa tarde';
    } else {
        return 'Boa noite';
    }
}

async function downloadFile(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('utf-8');
    } catch (error) {
        console.error('Erro ao baixar o arquivo:', error.message);
        throw error;
    }
}

async function notifyStock(quantidade, productID, VariantID, interaction) {
    const data = await Produtos.get(`Products.${productID}.sub_products.${VariantID}`);
    const usersEspera = data.notify
    const dataMsg = await Produtos.get(`Products.${productID}.announce_info`);

    const component = [];
    if (dataMsg.length > 0) {
        component.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${dataMsg[0].channelid}`)
                    .setLabel('Comprar')
                    .setStyle(5)
            )
        );
    }
    let count = 0;
    for (const a of usersEspera) {
        const user = interaction.guild.members.cache.get(a);
        if (user) {
            const userName = user.user.username;
            try {
                await user.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Olá ${userName}`)
                            .setDescription(`Notamos que estava aguardando estoque do produto **${data.title}**.\nO estoque do produto foi abastecido com \`${quantidade}\` unidade(s).\n`)
                            .setColor(General.get('System.Colors.main'))
                            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    ],
                    components: component
                });
                count++;
            } catch (error) {
                console.log(`Erro ao notificar ${userName}:`, error);
            }
        }
    }
    await Produtos.set(`Products.${productID}.sub_products.${VariantID}.notify`, []);

    if (count > 0) {
        interaction.followUp({
            content: `\`${count}\` usuário(s) foram notificados sobre o reabastecimento de estoque.`,
            flags: MessageFlagsBitField.Flags.Ephemeral
        });
    }

}

module.exports = {
    genRandomString,
    timing,
    createID,
    downloadFile,
    notifyStock,
}