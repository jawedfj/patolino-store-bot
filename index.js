const { Client, GatewayIntentBits, Collection, Partials, Options } = require("discord.js");
const http = require("http");
console.clear()

const token = process.env.DISCORD_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("❌ DISCORD_TOKEN não configurado. Adicione o token do bot nas variáveis de ambiente.");
  process.exit(1);
}

const { loadAllFromGitHub, backupAllToGitHub } = require('./Database/github_sync');

const client = new Client({

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],

  partials: [
    Partials.Message,
    Partials.Channel
  ],

  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    ReactionManager: 0,
    GuildEmojiManager: 0,
    GuildStickerManager: 0,
    GuildInviteManager: 0,
    GuildScheduledEventManager: 0,
    GuildBanManager: 0,
    VoiceStateManager: 0,
    PresenceManager: 0,
    MessageManager: { maxSize: 50 },
  }),

  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: { interval: 300, lifetime: 600 },
    users:    { interval: 600, filter: () => (user) => user.bot && user.id !== user.client.user.id },
  },

});

module.exports = client;

client.slashCommands = new Collection();

async function startBot() {
  await loadAllFromGitHub();

  const evento = require("./handler/Events");
  evento.run(client);
  require("./handler/index")(client);

  client.setMaxListeners(20);

  client.login(token);

  setInterval(async () => {
    await backupAllToGitHub();
  }, 2 * 60 * 1000);
}

startBot();

const axios = require('axios');

axios.patch('https://discord.com/api/v10/applications/@me', {
    description: '',
  }, {
  headers: {
    Authorization: 'Bot ' + token,
    'Content-Type': 'application/json',
  },
}).catch(() => {});

// Servidor HTTP para UptimeRobot manter o bot ativo 24/7
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  if (req.url === "/banner.png") {
    const filePath = path.join(__dirname, "assets", "banner.png");
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(data);
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot online!");
  }
}).listen(PORT, () => {
  console.log(`[UPTIMEROBOT] Servidor de ping ativo na porta ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log(`🚫 Erro Detectado:\n\n` + reason, promise)
});

process.on('uncaughtException', (error, origin) => {
  console.log(`🚫 Erro Detectado:\n\n` + error, origin)
});
