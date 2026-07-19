const axios = require("axios")
require("./Functions/safe-components");
const config = require("./config")
const { Client, GatewayIntentBits, Collection, ActivityType } = require("discord.js");
const { readdirSync } = require("node:fs")
const { JsonDatabase } = require("wio.db");
const { getCache, checkOwner } = require("./Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbDataTickets = new JsonDatabase({ databasePath: "./databases/data_ticket.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

const CREDIT_NAME = "";
const CREDIT_URL = "";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();
const handlers = readdirSync("./src/handler").filter((file) => file.endsWith('.js'));
for (const file of handlers) {
    require(`./src/handler/${file}`)(client);
};
client.handleCommands("./src/slashCommands");

client.on('guildBanRemove', (ban) => {
    console.log(`guildBanRemove: ${ban}`);
});

client.once('ready', async () => {
    if (dbConfigs.get('dbRedefine') === false || dbConfigs.get('dbRedefine') === null) {
        dbConfigs.set('ticket.ticket.cargo_staff', [])
        dbConfigs.set('dbRedefine', true)
    }

    const guilds = client.guilds.cache;
    try {
        guilds.forEach(async guild => {
            const allData = dbDataTickets.all();
            let totalCanais = 0
            for (const key in allData) {
                const channelID = allData[key].ID
                const channel = guild.channels.cache.get(channelID);
                if (!channel) {
                    totalCanais++
                    dbDataTickets.delete(channelID);
                }
            }
        });
    } catch (error) {
        console.log(error)
    }

    

    /**
     * @typedef {Object} CacheData
     * @property {string} [status] - Status atual do cache
     */

    /**
     * Atualiza a presença e descrição do bot Discord
     * @returns {Promise<void>}
     */
    const updateBotProfile = async () => {
        try {
            // Obter dados do cache com tratamento de tipo
            /** @type {CacheData|false} */
            const cacheData = getCache(null, 'additional');
            //console.log('Cache data:', cacheData);

            // Verificar se o cache está disponível
            if (cacheData === false) {
                console.log('Cache não disponível, tentando novamente em 20 segundos');
                setTimeout(updateBotProfile, 20000);
                return;
            }

            // Verificar se a atualização é necessária
            if (!Array.isArray(cacheData) || !cacheData.includes('status')) {
                await Promise.all([
                    updateBotPresence(),
                    updateBotDescription()
                ]);
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil do bot:', error);
        }
    };

    /**
     * Atualiza a presença do bot no Discord
     * @returns {Promise<void>}
     */
    const updateBotPresence = async () => {
        try {
            client.user.setPresence({
                activities: [{
                    name: `Patolino Store`,
                    type: ActivityType.Custom
                }],
                status: 'online',
            });
            //console.log('Presença do bot atualizada com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
        }
    };

    /**
     * Atualiza a descrição do bot via API Discord
     * @returns {Promise<void>}
     */
    const updateBotDescription = async () => {
        // Descrição formatada do bot
        const description = [
            `**Patolino Store**`,
        ].join('\n');

        // Dados para atualização
        const updateData = {
            description,
            custom_install_url: CREDIT_URL,
            install_params: null
        };

        try {
            const url = `https://discord.com/api/v9/applications/${client.user.id}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bot ${config.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API retornou status ${response.status}: ${JSON.stringify(errorData)}`);
            }

            //console.log('Descrição do bot atualizada com sucesso');
        } catch (error) {
            //console.error('Erro ao atualizar descrição:', error);
            // Implementação de retry com backoff exponencial seria ideal aqui
        }
    };

    // Configuração de execução inicial e periódica
    const THIRTY_MINUTES = 60000 * 30;

    // Executar imediatamente
    updateBotProfile();

    // Configurar execução periódica
    const intervalId = setInterval(updateBotProfile, THIRTY_MINUTES);

    // Armazenar o intervalId em uma propriedade do cliente para acesso global
    client.profileUpdateInterval = intervalId;

    // Definir função de limpeza como método do cliente
    client.cleanupProfileUpdater = () => {
        if (client.profileUpdateInterval) {
            clearInterval(client.profileUpdateInterval);
            client.profileUpdateInterval = null;
            //console.log('Limpeza do atualizador de perfil realizada');
        }
    };

    console.log(`[SERVERS] Limite removido. Bot autorizado em ${client.guilds.cache.size} servidor(es).`);
    return;

    try {
        const getMember = await client.users.fetch(getCache(null, 'owner'));
        if (client.guilds.cache.size > 1) {
            const embedSend = new EmbedBuilder()
                .setTitle('❗ | Servidores em excesso.')
                .setDescription([
                    `- Olá ${getMember}!`,
                    `- Percebemos que sua aplicação estava em mais de 1 servidor e isso não é permitido por nossa equipe.`,
                    `- Caso queira adiciona-la em mais de um servidor compre outra permissão.`,
                    `- Caso isso tenha ocorrido sem sua permissão contate nosso suporte em: <#1289642313467039929>.`,
                    `\u200b`,
                    `- Caso tenha saido do nosso servidor (CLIQUE AQUI)[https://discord.gg/]`
                ].join('\n'))
                .setColor(0xFF0000)
                .setFooter({ text: `NeverMiss Applications - Todos os direitos reservados.` })

            await getMember.send({ embeds: [embedSend] })
            for (const guild of guilds.values()) {
                try {
                    console.log(`[SERVERS] Permanecendo no servidor: ${guild.name}`);
                    console.log(`Saí do servidor: ${guild.name}`);
                } catch (error) {
                    console.error(`Erro ao sair do servidor ${guild.name}:`, error);
                }
            }
        }
    } catch (error) {
        if (error.code === 50035) {
            return
        } else {
            console.log(`${error}`)
        }
    }
});

client.on('guildCreate', async guild => {
    console.log(`Bot entrou em um novo servidor: ${guild.name}.`);
    return;

    try {
        const getMember = await client.users.fetch(getCache(null, 'owner'))

        if (client.guilds.cache.size > 1) {
            try {
                await getMember.send({ content: `❗ | Houve uma tentativa de adicionar sua aplicação em outro servidor, por questões de segurança a aplicação saiu desse servidor.\n⏩ | Servidor em questão **${guild.name}**.` })
            } catch (error) {
                console.error(`Descrição do erro: ${error}`)
            }
            Promise.resolve()
                .then(() => console.log(`[SERVERS] Permanecendo no servidor: ${guild.name}`))
                .catch(console.error);
        }
    } catch (error) {
        if (error.code === 50035) {
            console.log()
        } else {
            console.log(`${error.message}`)
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const { JsonDatabase } = require("wio.db")
    const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
    if (dbConfigs.get(`ticket.sugest.sistema`) === "ON") {
        const channelId = dbConfigs.get(`ticket.sugest.channel`)
        if (message.channel.id === channelId) {
            await message.react(dbConfigs.get(`ticket.sugest.certo`) || '✔')
            await message.react(dbConfigs.get(`ticket.sugest.errado`) || '❌')
            const user = message.author;

            const thread = await message.startThread({
                name: `Sugestão de ${user.displayName}`,
                autoArchiveDuration: 10080,
                reason: `Sugestão de ${user.displayName}`
            });
            await thread.send(`Olá ${user} 👋, obrigado por enviar sua sugestão! Caso necessário, explique melhor a mesma.`);
        }
    }

});

function handleError(error, origin) {
    const message = error?.message || String(error);
    const stack = error?.stack || "Stack indisponivel";

    console.error(`\n--------------------------------`);
    console.error(`Error occurred: ${message}`);
    console.error(`Origin: ${origin}`);
    console.error('Stack Trace:\n', stack);
    console.error(`--------------------------------\n`);
}

process.on('unhandledRejection', (error, origin) => {
    handleError(error, origin);
});
process.on('uncaughtException', (error, origin) => {
    handleError(error, origin);
});
process.on('uncaughtExceptionMonitor', (error, origin) => {
    handleError(error, origin);
});

async function startBot() {
    try {
        const { loadFromGitHub, startSync } = require("./databases/github_sync");
        await loadFromGitHub();
        config.validateConfig();
        await client.login(config.token);
        startSync(120000);
    } catch (error) {
        const message = error?.message || String(error);

        if (message.includes("invalid token") || error?.code === "TokenInvalid") {
            console.error("[LOGIN] Token invalido. Gere um novo token no Discord Developer Portal e coloque em DISCORD_TOKEN no .env ou em token.json.");
        } else {
            console.error("[LOGIN] Falha ao iniciar o bot:", message);
        }

        process.exitCode = 1;
        setTimeout(() => process.exit(1), 100);
    }
}

module.exports = client;
if (require.main === module) {
    startBot();
}
