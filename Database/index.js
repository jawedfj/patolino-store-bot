const { JsonDatabase } = require("wio.db");

const General = new JsonDatabase({
  databasePath: "./Database/settings.json"
});

const Produtos = new JsonDatabase({
  databasePath: "./Database/produtos.json"
});

const Carrinhos = new JsonDatabase({
  databasePath: "./Database/carrinhos.json"
});

const Usuarios = new JsonDatabase({
  databasePath: "./Database/usuarios.json"
});

const Tickets = new JsonDatabase({
  databasePath: "./Database/tickets.json"
});

const Emojis = new JsonDatabase({
  databasePath: "./Database/emojis.json"
});

const Clientes = new JsonDatabase({
  databasePath: "./Database/clientes.json"
});

const Planos = new JsonDatabase({
  databasePath: "./Database/plans.json"
});

module.exports = {
  General,
  Produtos,
  Carrinhos,
  Usuarios,
  Tickets,
  Emojis,
  Clientes,
  Planos
}
