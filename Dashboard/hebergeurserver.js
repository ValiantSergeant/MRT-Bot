import express from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import { fileURLToPath } from 'url';
import axios from 'axios'; 
import db from '../Events/loadDatabase.js';
import { getAllCommands } from './utils.js';
import config from "../config.json" with { type: 'json' };
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();
const app = express();

let logsMemoire = []; 
let isGeminiValid = false;
let lastGeminiCheck = 0;

async function addPanelLog(action) {
    const timestamp = new Date().toLocaleString('fr-FR');
    const logEntry = `[${timestamp}] 🛠️ ${action}`;
    
    logsMemoire.push(logEntry);
    if (logsMemoire.length > 50) logsMemoire.shift();

    if (config.panelLogs && config.panelLogs.startsWith('http')) {
        try {
            await axios.post(config.panelLogs, {
                embeds: [{
                    title: "Action Dashboard",
                    description: logEntry,
                    color: 0x5865F2
                }]
            });
        } catch (e) {
            console.error("[LOGS] Erreur Webhook:", e.message);
        }
    }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'mrt_bot_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

function findFileRecursive(dir, fileName) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findFileRecursive(fullPath, fileName);
            if (found) return found;
        } else if (file === fileName) {
            return fullPath;
        }
    }
    return null;
}

function checkAuth(req, res, next) {
    if (req.session.loggedIn) return next();
    res.redirect('/login');
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

app.get('/login', (req, res) => {
    const guild = global.client?.guilds.cache.get(config.panelGuildId);
    const stats = {
        serverName: guild ? guild.name : "Serveur Discord",
        serverIcon: guild ? guild.iconURL({ extension: 'png', size: 512 }) : 'https://cdn.discordapp.com/embed/avatars/0.png'
    };
    res.render('login', { error: null, stats });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const guild = global.client?.guilds.cache.get(config.panelGuildId);
    const stats = {
        serverName: guild ? guild.name : "Serveur Discord",
        serverIcon: guild ? guild.iconURL({ extension: 'png', size: 512 }) : 'https://cdn.discordapp.com/embed/avatars/0.png'
    };

    if (username === config.panelUser && password === config.panelPass) {
        req.session.loggedIn = true;
        addPanelLog(`Connexion de ${username}`);
        res.redirect('/select-server');
    } else {
        res.render('login', { error: "Identifiants incorrects", stats });
    }
});

// ─── SELECT SERVER ────────────────────────────────────────────────────────────

app.get('/select-server', checkAuth, (req, res) => {
    const guilds = global.client?.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL({ dynamic: true, size: 128 }) || null
    })) || [];
    res.render('select-server', { guilds });
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

app.get('/', checkAuth, async (req, res) => {
    // Redirige vers la sélection si aucun guild précisé dans l'URL
    if (!req.query.guild) return res.redirect('/select-server');

    try {
        const allCommands = await getAllCommands();

        const guilds = global.client?.guilds.cache.map(g => ({
            id: g.id,
            name: g.name,
            icon: g.iconURL({ dynamic: true, size: 128 }) || 'https://i.ytimg.com/vi/4VxEPhl03ww/maxresdefault.jpg'
        })) || [];

        const guildId = req.query.guild;

        const stats = {
            ping: global.client?.ws.ping || 0,
            serverName: global.client?.guilds.cache.get(guildId)?.name || "Global",
            guilds: global.client?.guilds.cache.size || 0,
            users: global.client?.users.cache.size || 0,
            ram: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
        };

        db.all('SELECT * FROM modules WHERE guildId = ?', [guildId], (err, moduleRows) => {
            db.all('SELECT * FROM commands_status WHERE guildId = ?', [guildId], (err2, cmdStatusRows) => {
                res.render('index', {
                    modules: moduleRows || [],
                    allCommands: allCommands || [],
                    commandsStatus: cmdStatusRows || [],  // aligné avec index.ejs
                    stats,
                    guilds,
                    guildId,                              // utilisé dans les forms toggle-command
                    currentGuildId: guildId               // utilisé dans la sidebar pour la classe active
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur de chargement du Dashboard.");
    }
});

// ─── API STATS ────────────────────────────────────────────────────────────────

app.get('/api/stats', checkAuth, async (req, res) => {
    const guild = global.client?.guilds.cache.get(config.panelGuildId);

    // Vérifie la clé Gemini toutes les 5 minutes max
    if (config.geminiKey && Date.now() - lastGeminiCheck > 300000) {
        try {
            const genAI = new GoogleGenerativeAI(config.geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            await model.generateContent("ping");
            isGeminiValid = true;
        } catch (e) {
            isGeminiValid = false;
        }
        lastGeminiCheck = Date.now();
    }

    res.json({
        ping: global.client?.ws.ping || 0,
        serverName: guild ? guild.name : "Serveur introuvable",
        users: guild ? guild.memberCount : 0,
        ram: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        icon: guild ? guild.iconURL({ dynamic: true, size: 64 }) : null,
        geminiKey: !!config.geminiKey,
        geminiValid: isGeminiValid
    });
});

// ─── AI CHAT ─────────────────────────────────────────────────────────────────

app.post('/api/ai-chat', checkAuth, async (req, res) => {
    const { message, code, fileName, history } = req.body;
    if (!config.geminiKey) return res.status(400).json({ error: "Clé manquante" });

    try {
        const genAI = new GoogleGenerativeAI(config.geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const context = history.map(h => `User: ${h.user}\nBot: ${h.bot}`).join("\n");

        const prompt = `Tu es un expert en Discord.js.\nFichier actuel : ${fileName}\nCode actuel :\n${code}\n\nHistorique :\n${context}\n\nQuestion : ${message}\n\nRéponds brièvement. Si modif, utilise [CODE_START] et [CODE_END].`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let reply = text;
        let newCode = null;

        if (text.includes("[CODE_START]") && text.includes("[CODE_END]")) {
            newCode = text.split("[CODE_START]")[1].split("[CODE_END]")[0].trim();
            newCode = newCode.replace(/```javascript/g, "").replace(/```/g, "").trim();
            reply = text.split("[CODE_START]")[0].trim();
        }

        res.json({ reply, newCode });
    } catch (e) {
        res.status(500).json({ error: "Erreur IA" });
    }
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────

app.get('/get-panel-logs', checkAuth, (req, res) => {
    res.json({ logs: logsMemoire });
});

// ─── SCRIPTS ─────────────────────────────────────────────────────────────────

app.get('/get-script/:name', checkAuth, (req, res) => {
    const name = req.params.name;
    const filePath = (name === "config.json")
        ? path.join(rootDir, 'config.json')
        : findFileRecursive(path.join(rootDir, 'Commands'), name + '.js');

    if (filePath && fs.existsSync(filePath)) {
        res.json({ content: fs.readFileSync(filePath, 'utf8') });
    } else {
        res.status(404).json({ error: "Fichier non trouvé" });
    }
});

app.post('/save-script', checkAuth, (req, res) => {
    const { fileName, content } = req.body;
    const filePath = (fileName === "config.json")
        ? path.join(rootDir, 'config.json')
        : findFileRecursive(path.join(rootDir, 'Commands'), fileName + '.js');

    if (filePath) {
        fs.writeFileSync(filePath, content, 'utf8');
        addPanelLog(`Modification du fichier : ${fileName}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Localisation impossible" });
    }
});

// ─── SQL ──────────────────────────────────────────────────────────────────────

app.post('/sql-query', checkAuth, (req, res) => {
    const { query } = req.body;
    const action = query.trim().split(' ')[0].toUpperCase();
    addPanelLog(`SQL : ${query.substring(0, 50)}`);

    if (action === 'SELECT') {
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ type: 'data', rows });
        });
    } else {
        db.run(query, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ type: 'info', message: `Succès. Changements : ${this.changes}` });
        });
    }
});

app.get('/sql-tables', checkAuth, (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.name));
    });
});

app.get('/download-db', checkAuth, (req, res) => {
    const dbPath = path.join(rootDir, 'database.sqlite3');
    if (fs.existsSync(dbPath)) {
        addPanelLog("Téléchargement de la base de données");
        res.download(dbPath);
    } else {
        res.status(404).send("Base de données introuvable.");
    }
});

// ─── TOGGLES ──────────────────────────────────────────────────────────────────

app.post('/toggle-module', checkAuth, (req, res) => {
    const { moduleName, currentState } = req.body;
    const newState = currentState === '1' ? 0 : 1;

    // Récupère le guildId depuis le referer pour rediriger au bon endroit
    let guildId = 'GLOBAL';
    try {
        const referer = req.headers.referer || '';
        const url = new URL(referer, `http://${req.headers.host}`);
        guildId = url.searchParams.get('guild') || 'GLOBAL';
    } catch(e) {}

    addPanelLog(`Module [${moduleName}] -> ${newState === 1 ? 'ON' : 'OFF'} (${guildId})`);

    db.run(
        'INSERT OR REPLACE INTO modules (guildId, moduleName, enabled) VALUES (?, ?, ?)',
        [guildId, moduleName, newState],
        () => res.redirect(`/?guild=${guildId}`)
    );
});

app.post('/toggle-command', checkAuth, (req, res) => {
    const { commandName, currentState, guildId } = req.body;
    const newState = currentState === '1' ? 0 : 1;

    addPanelLog(`Commande [${commandName}] -> ${newState === 1 ? 'ON' : 'OFF'} (${guildId})`);

    db.run(
        'INSERT OR REPLACE INTO commands_status (guildId, commandName, enabled) VALUES (?, ?, ?)',
        [guildId, commandName, newState],
        () => res.redirect(`/?guild=${guildId}`)
    );
});

// ─── BIO PAGES ────────────────────────────────────────────────────────────────

const bioPath = config.bioRoute || "b";
app.get(`/${bioPath}/:slug`, async (req, res) => {
    const slug = req.params.slug;

    db.get('SELECT * FROM user_bios WHERE slug = ?', [slug], async (err, row) => {
        if (!row) return res.status(404).send("Cette bio n'existe pas.");

        let socials = {};
        try {
            socials = row.social_links ? JSON.parse(row.social_links) : {};
        } catch {}

        let presence = null;
        let userAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

        try {
            const guild = global.client.guilds.cache.get(config.panelGuildId);
            if (guild && row.userId) {
                const member = await guild.members.fetch(row.userId);
                presence = member.presence;
                userAvatar = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            }
        } catch (e) {
            console.warn("Impossible de récupérer la présence :", e.message);
        }

        res.render('bio', { data: row, socials, config, presence, userAvatar });
    });
});

// ─── START ────────────────────────────────────────────────────────────────────

export function startDashboard() {
    let port = process.env.PORT || 3000;
    try {
        if (config.panelURL) {
            const url = new URL(config.panelURL);
            port = url.port || (url.protocol === 'https:' ? 443 : 80);
        }
    } catch(e) {
        port = process.env.PORT || 3000;
    }
    app.listen(port, '0.0.0.0', () => {
        console.log(`[DASHBOARD] Prêt sur le port ${port}`);
    });
}
