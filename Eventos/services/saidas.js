const { General } = require("../../Database/index");

module.exports = {
    name: 'guildMemberRemove',
    run: async (member, client) => {

        if (member.bot) return;

        const TrafegoLogs = General.get(`Config.logs.trafego`);
        const ChannelLog = client.channels.cache.get(TrafegoLogs);
        if (!ChannelLog) return;

        try {
            ChannelLog.send({ content: `**Saida**\nO usuário ${member} se retirou do servidor, que pena!.` });
        } catch (error) {
            console.error('Erro log Saidas:', error);
        }
    }
}
