const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, MessageFlagsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, ActivityType } = require("discord.js");
const { Main,
    Configurações,
    RoleSetup,
    ChannelSetup,
    PaymentSetup,
    Utils,
    Customizar,
    LojaSetup,
    TicketSetup,
    MarcaSetup,
    detailPayments,
    rendimentosOptions,
    plansSetup } = require("../../Functions/telas")
const { ProductSetup, VariantSetup, CouponSetup } = require("../../Functions/products_setup")
const { PlanConfig } = require("../../Functions/plans")

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {

        const ButtonAction = interaction.isButton();

        if (ButtonAction) {
            const [CustomId, productID] = interaction.customId.split('_');
            switch (CustomId) {
                case "MPSetup":
                    await detailPayments(1, client, interaction)
                    break;
                case "SemiAutoPaySetup":
                    await detailPayments(2, client, interaction)
                    break;
                case "EFISetup":
                    await detailPayments(3, client, interaction)
                    break;
                case "StripePaySetup":
                    await detailPayments(4, client, interaction)
                    break;
                case "CryptoPaySetup":
                    await detailPayments(4, client, interaction)
                    break;
                case "GerenciarLoja":
                    await LojaSetup(client, interaction);
                    break;
                case "GerenciarTickets":
                    await TicketSetup(client, interaction);
                    break;
                case "PersonalizaAPP":
                    await Customizar(client, interaction);
                    break;
                case "utilsFunctions":
                    await Utils(client, interaction);
                    break;
                case "GerenciarCanais":
                    await ChannelSetup(client, interaction);
                    break;
                case "GerenciarCargos":
                    await RoleSetup(client, interaction);
                    break;
                case "MetodosPagamento":
                    await PaymentSetup(client, interaction);
                    break;
                case "GerenciarDefinicoes":
                    await Configurações(client, interaction);
                    break;
                case "marcaLoja":
                    await MarcaSetup(client, interaction);
                    break;
                case "rendimentosOptions":
                    await rendimentosOptions(client, interaction);
                    break;
                case "cuponsProduct":
                    await CouponSetup(client, interaction, productID);
                    break;
                case "plansConfig":
                    await plansSetup(client, interaction);
                    break;
            }
        }

        //Botões "Voltar"
        if (ButtonAction) {
            const [CustomId, productID, VarianteID] = interaction.customId.split('_');
            switch (CustomId) {
                case "voltarpaysetup":
                    await PaymentSetup(client, interaction);
                    break;
                case "voltarcfgchannel":
                    await ChannelSetup(client, interaction);
                    break;
                case "voltarcfgrole":
                    await RoleSetup(client, interaction);
                    break;
                case "voltarLojaSetup":
                    await LojaSetup(client, interaction);
                    break;
                case "voltar2":
                    await Configurações(client, interaction);
                    break;
                case "voltar1":
                    await Main(client, interaction);
                    break;
                case "voltarcfgcticket":
                    await TicketSetup(client, interaction);
                    break;
                case "voltarProductSetup":
                    await ProductSetup(client, interaction, productID);
                    break;
                case "voltarCouponSetup":
                    await CouponSetup(client, interaction, productID);
                    break;
                case "VoltarVariant":
                    await VariantSetup(client, interaction, productID, VarianteID);
                    break;
                case "voltarplansSetup":
                    await plansSetup(client, interaction);
                    break;
                case "voltarplanConfig":
                    await PlanConfig(client, interaction, productID);
                    break;
            }
        }
    }
}