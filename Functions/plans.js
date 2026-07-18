const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, MessageFlagsBitField, RoleSelectMenuBuilder } = require("discord.js");
const { General, Planos } = require("../Database/index");

async function PlanConfig(client, interaction, planID) {
    const Plano = await Planos.get(`plans.${planID}`);

    const embed = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ format: "png", dynamic: true, size: 128 }) })
        .setTitle(`Titulo do Plano: **${Plano.title}**`)
        .setDescription(`Decrição do Plano:\n\n${Plano.description}\n\n-# Cargo de Assinante: ${Plano.role_plan !== '' ? `<@&${Plano.role_plan}>` : `\`Não definido\``}`)
        .addFields(
            {
                name: `**Informações**`, value: `Assinaturas ativas: \`${Plano.subscribers_total}\`\nKeys: Restam \`${Plano.keys.length}\` para serem resgatadas.`, inline: true
            }
        )
        .setColor(General.get("System.Colors.main"))
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    const selectMenu = new ActionRowBuilder()
        .addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId(`choseRoleplan_${planID}`)
                .setPlaceholder(`Cargo de Assinante`)
                .setMaxValues(1)
        );

    interaction.update({
        content: ``,
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`customPlan_${planID}`)
                        .setLabel('Editar Plano')
                        .setEmoji('1273127418386976788')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`createkeyPlan_${planID}`)
                        .setLabel('Criar Keys')
                        .setEmoji('1251441497346281482')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId(`deletekeyPlan_${planID}`)
                        .setLabel('Deletar Keys')
                        .setEmoji('1251441411266711573')
                        .setStyle(4),
                ), selectMenu,
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tutorialPlan_${planID}`)
                        .setLabel('Tutorial')
                        .setEmoji('1357965294911361095')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`giftPlan_${planID}`)
                        .setLabel('Brinde Assinante')
                        .setEmoji('1357969349855416507')
                        .setStyle(1),
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltarplansSetup")
                        .setLabel("Voltar")
                        .setStyle(2)
                        .setEmoji('1251441490576805979')
                ),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral
    });
}

async function RedeemPlan(user, client, interaction) {
    if (!user.roles.cache.has(data.role_plan)) {
        try {
          await user.roles.add(data.role_plan);
        } catch (error) {
          console.error(error);
        }
      }
}


module.exports = {
    PlanConfig
};
