const fs = require("node:fs");
const path = require("node:path");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "jawedfj/patolino-store-bot";
const DB_DIR = path.join(__dirname, "..", "databases");
const BRANCH = "master";

const DB_FILES = [
    "dbConfigs.json",
    "dbPermissions.json",
    "dbProducts.json",
    "dbPanels.json",
    "dbOpenedCarts.json",
    "dbOpenedPayments.json",
    "dbPurchases.json",
    "dbSales.json",
    "dbCoupons.json",
    "dbGifts.json",
    "dbProfiles.json",
    "dbGiveaways.json",
    "dbModeration.json",
    "dbLock_unlock.json",
    "data_ticket.json",
    "tickets.json",
    "dbRankingTicket.json",
    "PagamentosNu.json",
    "emojis.json",
    "emojis-globais.json"
];

async function githubRequest(endpoint, method = "GET", body = null) {
    const url = `https://api.github.com/repos/${REPO}/contents/${endpoint}`;
    const headers = {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "patolino-store-bot"
    };

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, options);
    if (response.status === 204) return null;
    return response.json();
}

async function loadFromGitHub() {
    if (!GITHUB_TOKEN) {
        console.log("[GitHub Sync] GITHUB_TOKEN nao configurado, pulando carregamento.");
        return;
    }

    console.log("[GitHub Sync] Carregando databases do GitHub...");
    let loaded = 0;

    for (const file of DB_FILES) {
        try {
            const data = await githubRequest(`databases/${file}`);
            if (data && data.content) {
                const content = Buffer.from(data.content, "base64").toString("utf-8");
                const filePath = path.join(DB_DIR, file);
                fs.writeFileSync(filePath, content, "utf-8");
                loaded++;
            }
        } catch (error) {
            // arquivo pode nao existir no repo ainda, tudo bem
        }
    }

    console.log(`[GitHub Sync] ${loaded} databases carregados do GitHub.`);
}

async function backupToGitHub() {
    if (!GITHUB_TOKEN) return;

    let backed = 0;

    for (const file of DB_FILES) {
        try {
            const filePath = path.join(DB_DIR, file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, "utf-8");
            const encoded = Buffer.from(content).toString("base64");

            // pegar SHA atual pra fazer update
            let sha = null;
            try {
                const existing = await githubRequest(`databases/${file}`);
                if (existing && existing.sha) sha = existing.sha;
            } catch (e) {
                // arquivo nao existe no repo ainda
            }

            const body = {
                message: `backup: update ${file}`,
                content: encoded,
                branch: BRANCH
            };
            if (sha) body.sha = sha;

            await githubRequest(`databases/${file}`, "PUT", body);
            backed++;
        } catch (error) {
            // ignora erros individuais
        }
    }

    if (backed > 0) {
        console.log(`[GitHub Sync] ${backed} databases salvos no GitHub.`);
    }
}

function startSync(intervalMs = 120000) {
    // backup periodico
    setInterval(backupToGitHub, intervalMs);
    console.log(`[GitHub Sync] Backup periodico a cada ${intervalMs / 1000}s.`);
}

module.exports = { loadFromGitHub, backupToGitHub, startSync };
