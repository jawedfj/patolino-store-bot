const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'jawedfj/patolino-store-bot';
const GITHUB_PATH = 'bot/Database';
const DB_DIR = path.join(__dirname);

const FILES_TO_SYNC = [
    'settings.json',
    'produtos.json',
    'carrinhos.json',
    'usuarios.json',
    'tickets.json',
    'emojis.json',
    'clientes.json',
    'plans.json'
];

function githubRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function getFileFromGitHub(filename) {
    if (!GITHUB_TOKEN) return null;
    try {
        const res = await githubRequest({
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}/${filename}`,
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'patolino-bot',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (res.status === 200 && res.data.content) {
            return {
                content: Buffer.from(res.data.content, 'base64').toString('utf8'),
                sha: res.data.sha
            };
        }
        return null;
    } catch (e) {
        console.error(`[GITHUB_SYNC] Erro ao baixar ${filename}:`, e.message);
        return null;
    }
}

async function pushFileToGitHub(filename, content, sha) {
    if (!GITHUB_TOKEN) return false;
    try {
        const body = JSON.stringify({
            message: `backup: update ${filename}`,
            content: Buffer.from(content).toString('base64'),
            sha: sha || undefined
        });
        const res = await githubRequest({
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}/${filename}`,
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'patolino-bot',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, body);
        return res.status === 200;
    } catch (e) {
        console.error(`[GITHUB_SYNC] Erro ao enviar ${filename}:`, e.message);
        return false;
    }
}

async function loadAllFromGitHub() {
    console.log('[GITHUB_SYNC] Carregando dados do GitHub...');
    for (const filename of FILES_TO_SYNC) {
        const filePath = path.join(DB_DIR, filename);
        const result = await getFileFromGitHub(filename);
        if (result && result.content) {
            fs.writeFileSync(filePath, result.content, 'utf8');
            console.log(`[GITHUB_SYNC] ✓ ${filename} carregado do GitHub`);
        } else {
            console.log(`[GITHUB_SYNC] - ${filename} não encontrado no GitHub, usando local`);
        }
    }
    console.log('[GITHUB_SYNC] Dados carregados com sucesso!');
}

const fileSHAs = {};

async function backupAllToGitHub() {
    if (!GITHUB_TOKEN) return;
    for (const filename of FILES_TO_SYNC) {
        const filePath = path.join(DB_DIR, filename);
        if (!fs.existsSync(filePath)) continue;
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const currentSHA = fileSHAs[filename];

            if (!currentSHA) {
                const existing = await getFileFromGitHub(filename);
                if (existing) fileSHAs[filename] = existing.sha;
            }

            const success = await pushFileToGitHub(filename, content, fileSHAs[filename]);
            if (success) {
                const updated = await getFileFromGitHub(filename);
                if (updated) fileSHAs[filename] = updated.sha;
            }
        } catch (e) {
            console.error(`[GITHUB_SYNC] Erro no backup de ${filename}:`, e.message);
        }
    }
}

module.exports = { loadAllFromGitHub, backupAllToGitHub };
