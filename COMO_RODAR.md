# Como rodar o bot

1. Instale o Node.js LTS.
2. Abra esta pasta no VS Code.
3. No terminal, rode:

```bash
npm install
```

4. Crie um arquivo `.env` seguindo o exemplo do `.env.example`:

```env
DISCORD_TOKEN=seu_token_valido_do_bot
ID_DONO=seu_id_do_discord
```

5. Rode pelo terminal:

```bash
npm start
```

Ou aperte `F5` no VS Code e escolha `Rodar Bot Nexos Vendas`.

Se aparecer `Token invalido`, gere um token novo no Discord Developer Portal e atualize o `.env`.

Se os comandos `/` nao aparecerem, use o link de convite que o bot mostra no terminal ao iniciar. Ele inclui os escopos `bot` e `applications.commands`, que sao necessarios para os slash commands aparecerem no Discord.
