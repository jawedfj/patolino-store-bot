const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, MessageFlagsBitField } = require("discord.js");
const { QrCodePix } = require('qrcode-pix');
const { General, Produtos, Carrinhos, Tickets } = require("../Database/index");
const { QRCodeStyling } = require('qr-code-styling-node/lib/qr-code-styling.common');
const canvas = require('canvas');
const { default: MercadoPagoConfig, Payment, Preference } = require("mercadopago");
const Stripe = require('stripe');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require("sharp");
const moment1 = require('moment-timezone');
const { createCanvas, loadImage } = require('canvas');
const { logorderCreate } = require("../Functions/logs")


/**
 * 
 * @param {string} data - Dados a serem codificados no QR Code.
 * @param {string} imagePath - Caminho (local ou URL) da imagem a ser exibida no centro.
 */
class QrCodeStylish {
    constructor({ imagePath }) {
        this.imagePath = imagePath;
    }

    async generate(data) {
        try {
            const roundedImageBase64 = await createRoundedImage(this.imagePath, 100);
            const colorsQR = await General.get(`System.Marca.qrcode`)

            this.options = createOptions(data, roundedImageBase64, colorsQR.primary, colorsQR.secondary);

            this.qrCodeImage = createQRCodeStyling(canvas, this.options);

            return await getRawData(this.qrCodeImage);
        } catch (error) {
            return { status: 'error', response: error.message };
        }
    }
}

/**
 * @param {string} imagePath - Caminho ou URL da imagem.
 * @returns {Promise<string>} - Data URI (base64) ou URL da imagem.
 */
async function getImageDataUri(imagePath) {
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {

        return imagePath;
    } else {
        const absolutePath = path.resolve(__dirname, imagePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Arquivo de imagem não encontrado: ${absolutePath}`);
        }
        const imageBuffer = fs.readFileSync(absolutePath);

        const ext = path.extname(absolutePath).toLowerCase();
        let mimeType = "image/png"; 
        if (ext === ".jpg" || ext === ".jpeg") {
            mimeType = "image/jpeg";
        } else if (ext === ".gif") {
            mimeType = "image/gif";
        }
        return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    }
}

/**
 * @param {string} data - 
 * @param {string} image - Data URI ou URL da imagem.
 * @param {string} [color="#000000"] 
 * @param {string} [backgroundColor="#ffffff"] - Cor de fundo do QR Code.
 * @returns {Object} - 
 */
function createOptions(data, image, color1, color2) {
    return {
        width: 464,
        height: 464,
        data,
        image,
        margin: 0,
        dotsOptions: {
            type: "extra-rounded",
            gradient: {
                type: 'radial',
                colorStops: [
                    { offset: 0, color: color1 }, // Cor mais forte nas quinas
                    { offset: 1, color: color2 }  // Cor que decai para o centro
                ]
            }
        },
        backgroundOptions: {
            color: '#ffffff'
        },
        imageOptions: {
            crossOrigin: "anonymous",
            imageSize: 0.5,
            margin: 0,
            hideBackgroundDots: false
        },
        cornersDotOptions: {
            type: 'dots',
            gradient: {
                type: 'radial',
                colorStops: [
                    { offset: 0, color: color1 },
                    { offset: 1, color: color2 }
                ]
            }
        },
        cornersSquareOptions: {
            type: 'dots',
            gradient: {
                type: 'radial',
                colorStops: [
                    { offset: 0, color: color1 },
                    { offset: 1, color: color2 }
                ]
            }
        },
        outerBorder: {
            width: 0,
            color: '#ff00ff'
        }
    };
}

/**
 * @param {object} nodeCanvas 
 * @param {object} options 
 * @returns {QRCodeStyling}
 */
function createQRCodeStyling(nodeCanvas, options) {
    return new QRCodeStyling({
        nodeCanvas, ...options
    });
}

/**
 * @param {QRCodeStyling} qrCodeImage 
 * @returns {Promise<object>} 
 */
async function getRawData(qrCodeImage) {
    try {
        const rawData = await qrCodeImage.getRawData("png");
        return {
            status: 'success',
            response: rawData.toString('base64')
        };
    } catch (error) {
        return {
            status: 'error',
            response: error.message
        };
    }
}

async function createRoundedImage(imagePath, size) {
    try {
        const absoluteImagePath = path.resolve(__dirname, imagePath);

        if (!fs.existsSync(absoluteImagePath)) {
            throw new Error(`Arquivo não encontrado: ${absoluteImagePath}`);
        }

        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        const img = await loadImage(absoluteImagePath);

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, 0, 0, size, size);

        return canvas.toDataURL();
    } catch (error) {
        console.error("error_createRoundedImage:", error);
        throw error;
    }
}

async function finalyPay(buyerID, orderID, option, interaction, client) {
    await interaction.deferUpdate();
    await interaction.editReply({ content: `Gerando Pagamento..\n\`🟩\``, components: [] });

    const data = await Carrinhos.get(`${buyerID}.${orderID}`);

    switch (option) {
        case "mercadopago": {
            const pix = await pixMercadopago(data);

            await interaction.editReply({ content: `Gerando Pagamento..\n\`🟩🟩\``, components: [] });

            const qrCodeInstance = new QrCodeStylish({ imagePath: "../assets/logoqr.png" });
            const qrcode = await qrCodeInstance.generate(pix.data);
            const buffer = Buffer.from(qrcode.response, "base64");
            const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

            await interaction.editReply({ content: `Criando Qrcode..\n\`🟩🟩🟩\``, components: [] });

            const options = {
                timeZone: "America/Sao_Paulo", hour12: false,
                hour: "2-digit", minute: "2-digit",
                day: "2-digit", month: "2-digit",
            };

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setColor(General.get("System.Colors.main"))
                .setDescription(`**O pagamento irá expirar em** \`${pix.expire.toLocaleString("pt-BR", options)}\``)
                .addFields({
                    name: `Código copia e cola`,
                    value: `\`\`\`${pix.data}\`\`\``
                })
                .setFooter(
                    { text: `${interaction.guild.name} ©️ Todos os direitos reservados.`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                )

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`copiaecola_${buyerID}_${orderID}`)
                    .setLabel('Código copia e cola')
                    .setEmoji(`1349633661552562317`)
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId(`cancelOrder_${buyerID}_${orderID}`)
                    .setLabel('Cancelar Ordem')
                    .setEmoji('1251441411266711573')
                    .setStyle(4)
            );
            embed.setImage('attachment://payment.png');

            logorderCreate(data, interaction.user, interaction, client);

            await interaction.editReply({ content: `Pagamento criado com sucesso.\n\`🟩🟩🟩🟩\``, components: [] });

            await interaction.editReply({ content: `${interaction.user} | <@&${General.get('Config.Roles.admin')}>`, embeds: [embed], components: [row1], files: [attachment] });
            interaction.channel.setName(`💱・Aguardando Pagamento・${buyerID}`)
            break;
        }
        case "semiauto": {
            const pix = await pixManual(data);
            await interaction.editReply({ content: `Gerando Pagamento..\n\`🟩🟩\``, components: [] });

            const qrCodeInstance = new QrCodeStylish({ imagePath: "../assets/logoqr.png" });
            const qrcode = await qrCodeInstance.generate(pix.data);
            const buffer = Buffer.from(qrcode.response, "base64");
            const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
            await interaction.editReply({ content: `Criando Qrcode..\n\`🟩🟩🟩\``, components: [] });

            const options = {
                timeZone: "America/Sao_Paulo", hour12: false,
                day: "2-digit", month: "2-digit",
                hour: "2-digit", minute: "2-digit",
            };

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setColor(General.get("System.Colors.main"))
                .setDescription(`**O pagamento irá expirar em** \`${pix.expire.toLocaleString("pt-BR", options)}\``)
                .addFields({
                    name: `Código copia e cola`,
                    value: `\`\`\`${pix.data}\`\`\``
                })
                .setFooter(
                    { text: `${interaction.guild.name} ©️ Todos os direitos reservados.`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                )

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`copiaecola_${buyerID}_${orderID}`)
                    .setLabel('Código copia e cola')
                    .setEmoji(`1349633661552562317`)
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId(`cancelOrder_${buyerID}_${orderID}`)
                    .setLabel('Cancelar Ordem')
                    .setEmoji('1251441411266711573')
                    .setStyle(4)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirmPay_${buyerID}_${orderID}`)
                    .setLabel('Confirmar pagamento')
                    .setEmoji('1251441846601912452')
                    .setStyle(3),
                new ButtonBuilder()
                    .setCustomId(`confirmProof_${buyerID}_${orderID}`)
                    .setLabel('Enviar Comprovante')
                    .setEmoji('1276927585544044598')
                    .setStyle(1),

            );
            embed.setImage('attachment://payment.png');

            logorderCreate(data, interaction.user, interaction, client);

            await interaction.editReply({ content: `Pagamento criado com sucesso.\n\`🟩🟩🟩🟩\``, components: [] });

            await interaction.editReply({ content: `${interaction.user} | <@&${General.get('Config.Roles.admin')}>`, embeds: [embed], components: [row2, row1], files: [attachment] });
            interaction.channel.setName(`💱・Aguardando Pagamento・${buyerID}`);
            break;
        }
        case "crypto": {
            const Config = await General.get(`System.Payments.efi`);

            break;
        }
        case "stripe": {
            const invoice = await Stripepay(data);

            await interaction.editReply({ content: `Gerando Pagamento..\n\`🟩🟩\``, components: [] });

            const qrCodeInstance = new QrCodeStylish({ imagePath: "../assets/logoqr.png" });
            const qrcode = await qrCodeInstance.generate(invoice.data);
            const buffer = Buffer.from(qrcode.response, "base64");
            const processedBuffer = await sharp(buffer)
            .trim() 
            .toBuffer();

            const attachment = new AttachmentBuilder(processedBuffer, { name: "payment.png" });

            await interaction.editReply({ content: `Criando Qrcode..\n\`🟩🟩🟩\``, components: [] });

            const options = {
                timeZone: "America/Sao_Paulo", hour12: false,
                hour: "2-digit", minute: "2-digit",
                day: "2-digit", month: "2-digit",
            };

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setColor(General.get("System.Colors.main"))
                .setDescription(`**O pagamento irá expirar em** \`${invoice.expire.toLocaleString("pt-BR", options)}\`
Prossiga para o site para concluir o pagamento, cliquei no link abaixo, o pedido será aprovado assim que for pago.
                `)
                .addFields({
                    name: `Link de Pagamento`,
                    value: `[ Pague Aqui ](${invoice.data})`
                })
                .setFooter(
                    { text: `${interaction.guild.name} ©️ Todos os direitos reservados.`, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                )

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`copiaecola_${buyerID}_${orderID}`)
                    .setLabel('Código copia e cola')
                    .setEmoji(`1349633661552562317`)
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId(`cancelOrder_${buyerID}_${orderID}`)
                    .setLabel('Cancelar Ordem')
                    .setEmoji('1251441411266711573')
                    .setStyle(4)
            );
            embed.setImage('attachment://payment.png');

            logorderCreate(data, interaction.user, interaction, client);

            await interaction.editReply({ content: `Pagamento criado com sucesso.\n\`🟩🟩🟩🟩\``, components: [] });

            await interaction.editReply({ content: `${interaction.user} | <@&${General.get('Config.Roles.admin')}>`, embeds: [embed], components: [row1], files: [attachment] });
            interaction.channel.setName(`💱・Aguardando Pagamento・${buyerID}`);
            break;
        }
    }
}

async function refundpartialMP(id, refundvalue) {
    try {
        const body =
        {
            amount: `${refundvalue.toFixed(2)}`
        }

        await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, body, {
            headers: {
                Authorization: `Bearer ${acesstoken}`
            }
        });

    } catch (error) {
        console.log(error)
    }

}

async function pixManual(data) {
    const Config = await General.get(`System.Payments.semiauto`);

    const struct = {
        version: '01',
        key: `${Config.key}`,
        name: `SEU NOME`,
        city: 'BRASILIA',
        cep: '28360000',
        value: Number(data.info_order.value),
    };
    const qrCodePix = QrCodePix(struct);
    const chavealeatorio = qrCodePix.payload();

    let creation = new Date();
    let expire = new Date(creation.getTime() + 10 * 60 * 1000);

    await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.status`, 'pending');
    await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.expiration_date`, expire);

    let paymentStruct = {
        method: "semiauto",
        total: data.info_order.value,
        copypaste: chavealeatorio,
        creation_date: creation,
        expiration_date: expire,
        proof: false,
    }

    await Carrinhos.push(`${data.info_order.id_costumer}.${data.id_order}.payment_info`, paymentStruct);
    return {
        data: chavealeatorio,
        expire: expire
    }
}

async function Stripepay(data) {
    const Config = await General.get(`System.Payments.stripe`);
    const stripe = Stripe(Config.token);

    let creation = new Date();
    let expire = new Date(creation.getTime() + 30 * 60 * 1000);

    const amountInCents = Math.round(data.info_order.value * 100);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'brl',
                product_data: {
                    name: `Sem informações adicionais`,
                },
                unit_amount: amountInCents,
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `https://discord.com/channels/${data.id_order}/${data.id_order}`,
        expires_at: expire
    });

    await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.status`, 'pending');
    await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.expiration_date`, expire);

    let paymentStruct = {
        id_stripe: session.id,
        method: "stripe",
        total: data.info_order.value,
        invoice_page: session.url,
        creation_date: creation,
        expiration_date: expire,
    }

    await Carrinhos.push(`${data.info_order.id_costumer}.${data.id_order}.payment_info`, paymentStruct);
    return {
        data: session.url,
        expire: `${Date.now() + 60000}`
    }
}

async function pixMercadopago(data) {
    const Config = await General.get(`System.Payments.mercadopago`);
    const Clientes = new MercadoPagoConfig({ accessToken: Config.token });
    const payments = new Payment(Clientes);

    const expireMP = moment1().tz("America/Argentina/Buenos_Aires").add(Number(10), 'minutes').toISOString();
    let creation = new Date();
    let expire = new Date(creation.getTime() + 10 * 60 * 1000);

    const payment_data = {
        transaction_amount: Number(data.info_order.value),
        description: `Sem informações adicionais.`,
        payment_method_id: 'pix',
        payer: {
            email: `SEU_EMAIL@gmail.com`,
            first_name: 'SeuNome',
            last_name: 'Sobrenome',
            identification: {
                type: 'CPF',
                number: '00000000000'
            },
            address: {
                zip_code: '00000000',
                street_name: 'Sua Rua',
                street_number: '000',
                neighborhood: 'Seu Bairro',
                city: 'Sua Cidade',
                federal_unit: 'SP'
            }
        },
        date_of_expiration: expireMP
    };

    const invoice = await payments.create({ body: payment_data });

    if (!invoice || invoice.status === 'error') {
        console.log('Erro ao gerar pagamento com Mercado Pago');
        return
    }

    await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.status`, 'pending');
    await Carrinhos.set(`${data.info_order.id_costumer}.${data.id_order}.info_order.expiration_date`, expire);
    const pixCode = invoice.point_of_interaction.transaction_data.qr_code;

    let paymentStruct = {
        id_mercadopago: invoice.id,
        method: "mercadopago",
        total: data.info_order.value,
        copypaste: pixCode,
        creation_date: creation,
        expiration_date: expire,
    }

    await Carrinhos.push(`${data.info_order.id_costumer}.${data.id_order}.payment_info`, paymentStruct);
    return {
        data: pixCode,
        expire: expire
    }
}

async function checkpayMP(id) {
    const Config = await General.get(`System.Payments.mercadopago`);
    try {
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: {
                'Authorization': `Bearer ${Config.token}`
            }
        });
        return response.data.status;

    } catch (error) {
        return false;
    }
}

async function checkpayStripe(id) {
    const Config = await General.get(`System.Payments.stripe`);
    const stripe = Stripe(Config.token);

    try {
        const sessionDetails = await stripe.checkout.sessions.retrieve(id);
        return sessionDetails.payment_status;
    } catch (error) {
        return false;
    }
}

module.exports = {
    QrCodeStylish,
    finalyPay,
    checkpayMP,
    checkpayStripe
}
