import puppeteer from 'puppeteer';
import { AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../Events/loadDatabase.js';

const cooldowns = new Map();

export const command = {
    name: "screenshot",
    aliases: ["ss", "web"],
    description: "Prend une capture d'écran d'un site web",
    run: async (bot, message, args) => {
        const userId = message.author.id;
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        const fullArgs = args.join(" ").toLowerCase();
        if (fullArgs === "on js" || fullArgs === "off js") {
            if (!isAdmin) return message.reply("❌ Seuls les administrateurs peuvent changer le mode JS.");
            
            const mode = fullArgs === "on js" ? 1 : 0;
            db.run('INSERT OR REPLACE INTO settings (key, value) VALUES ("ss_js", ?)', [mode], (err) => {
                if (err) return message.reply("❌ Erreur lors de la sauvegarde.");
                message.reply(`✅ Le JavaScript est désormais **${mode === 1 ? "ACTIVÉ" : "DÉSACTIVÉ"}** pour tous les prochains screenshots.`);
            });
            return;
        }

        const now = Date.now();
        const cooldownAmount = 30 * 1000;
        if (cooldowns.has(userId) && !isAdmin) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`⚠️ Patience ! Réessaie dans ${timeLeft.toFixed(1)}s.`);
            }
        }

        let url = args[0];
        if (!url) return message.reply("⚠️ Usage: `+screenshot <url>`\n🔧 Config: `+screenshot on js` ou `+screenshot off js` (Admin)");
        if (!url.startsWith("http")) url = "https://" + url;

        db.get('SELECT value FROM settings WHERE key = "ss_js"', async (err, row) => {
            const jsEnabled = row ? row.value === 1 : false;

            const msg = await message.reply(`📸 Capture en cours... (JS global: **${jsEnabled ? "ON" : "OFF"}**)`);

            let browser;
            try {
                browser = await puppeteer.launch({
                    headless: "new",
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });

                const page = await browser.newPage();
                await page.setJavaScriptEnabled(jsEnabled);
                await page.setViewport({ width: 1280, height: 800 });

                await page.goto(url, { 
                    waitUntil: jsEnabled ? 'networkidle0' : 'networkidle2', 
                    timeout: 30000 
                });

                if (jsEnabled) await new Promise(r => setTimeout(r, 2000));

                const screenshot = await page.screenshot({ type: 'jpeg', quality: 70 });
                await browser.close();

                const attachment = new AttachmentBuilder(screenshot, { name: 'screenshot.jpg' });

                if (!isAdmin) {
                    cooldowns.set(userId, now);
                    setTimeout(() => cooldowns.delete(userId), cooldownAmount);
                }

                try { await msg.delete(); } catch (e) { }
                message.reply({ content: `🌐 Capture de : <${url}>`, files: [attachment] });

            } catch (error) {
                if (browser) await browser.close();
                try { await msg.edit("❌ Impossible de charger le site."); } catch (e) { }
            }
        });
    }
};