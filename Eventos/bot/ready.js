const colors = require("colors");
const { General } = require("../../Database/index");

module.exports = {
    name: "ready",
    run: async (client) => {

        console.log(colors.green('[STATUS]') + " " + client.user.username + " acabou de iniciar.");
        console.log(colors.green("[STATUS]") + " Online em " + client.guilds.cache.size + " servidores");
        console.log(" ");
        console.log(colors.grey("[OWNERS]") + " IDs: " + General.get('owner').join(', '));
        console.log(colors.cyan("[UPDATES]") + " Bot atualizado com sucesso!");

    }
}
