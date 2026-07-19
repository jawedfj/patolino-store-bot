require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

const tokenPath = path.join(__dirname, "token.json");
let fileConfig = {};

if (fs.existsSync(tokenPath)) {
    try {
        fileConfig = require(tokenPath);
    } catch (error) {
        console.error("[CONFIG] Nao foi possivel ler o token.json:", error.message);
    }
}

const rawDono = process.env.ID_DONO || process.env.OWNER_ID || fileConfig.ID_DONO || "";
const OWNERS = rawDono.split(",").map(id => id.trim()).filter(Boolean);

const config = {
    token: process.env.DISCORD_TOKEN || process.env.TOKEN || fileConfig.token,
    ID_DONO: OWNERS[0] || "",
    OWNERS
};

function validateConfig() {
    if (!config.token || typeof config.token !== "string" || config.token.trim() === "") {
        throw new Error("Token do bot nao configurado. Defina DISCORD_TOKEN no .env ou preencha token.json.");
    }

    if (!config.ID_DONO || typeof config.ID_DONO !== "string" || config.ID_DONO.trim() === "") {
        console.warn("[CONFIG] ID_DONO/OWNER_ID nao configurado. Algumas funcoes de permissao podem nao funcionar.");
    }
}

module.exports = {
    ...config,
    validateConfig
};
