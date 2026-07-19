const { ButtonBuilder } = require("discord.js");

const originalSetEmoji = ButtonBuilder.prototype.setEmoji;

const fallbackByName = {
    cart: "🛒",
    carrinho: "🛒",
    ticket: "🎫",
    suporte: "🎫",
    bell: "🔔",
    mais: "➕",
    cor: "🎨",
    banco: "🏦",
    wallet: "💰",
    cadeado: "🔒",
    config: "⚙️",
    voltar: "↩️",
    stripe: "💳",
    qrcode: "🔳",
    pix: "🔷",
    lixo: "🗑️",
    editar: "✏️",
    link: "🔗",
    dinheiro: "💵",
    moedas: "🪙",
    user: "👤",
    users: "👥",
    mensagem: "💬",
    doc: "📄",
    check: "✅",
    cancelar: "❌",
    loading: "🔄"
};

function fallbackForEmoji(emoji) {
    if (typeof emoji !== "string") {
        return emoji;
    }

    const customMatch = emoji.match(/^<a?:([^:>]+):\d+>$/);
    if (customMatch) {
        return fallbackByName[customMatch[1]] || "⚙️";
    }

    if (/^\d{17,20}$/.test(emoji)) {
        return "⚙️";
    }

    return emoji;
}

if (!ButtonBuilder.prototype.__safeEmojiPatchApplied) {
    ButtonBuilder.prototype.setEmoji = function setSafeEmoji(emoji) {
        return originalSetEmoji.call(this, fallbackForEmoji(emoji));
    };

    ButtonBuilder.prototype.__safeEmojiPatchApplied = true;
}

