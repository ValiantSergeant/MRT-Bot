import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const command = {
    name: 'js',
    description: 'Codex JS : Bases, Bot et Serveur',
    run: async (bot, message, args, config) => {
        const category = args[0]?.toLowerCase();
        const option = args[1]?.toLowerCase();

        const codex = {
            bases: {
                title: "🟨 Bases de JS",
                description: "Les fondations du langage.",
                options: {
                    variables: {
                        title: "🟨 Variables (const/let)",
                        code: "```javascript\n// const = constante, let = variable\nconst nomDuBot = 'MRT Bot';\nlet version = 1.0;\n\nversion = 1.1; // OK\n// nomDuBot = 'Autre'; // ERREUR\n```"
                    },
                    fonctions: {
                        title: "🟨 Fonctions",
                        code: "```javascript\n// Fonction fléchée\nconst saluer = (nom) => {\n    return `Bonjour ${nom}`;\n};\nconsole.log(saluer('Martin'));\n```"
                    }
                }
            },
            bot: {
                title: "🟨 Discord.js (Bot)",
                description: "Interagir avec Discord.",
                options: {
                    command: {
                        title: "🟨 Structure Commande",
                        code: "```javascript\n// Commande de base avec embed et bouton\nexport const command = {\n    name: 'ping',\n    description: 'Affiche la latence',\n    run: async (bot, message, args, config) => {\n        const embed = new EmbedBuilder()\n            .setTitle('🏓 Pong!')\n            .setDescription(`Latence : ${bot.ws.ping}ms`)\n            .setColor('#5865F2');\n\n        const row = new ActionRowBuilder().addComponents(\n            new ButtonBuilder()\n                .setLabel('Actualiser')\n                .setStyle(ButtonStyle.Primary)\n                .setCustomId('refresh')\n        );\n\n        message.reply({ embeds: [embed], components: [row] });\n    }\n};\n```"
                    }
                }
            },
            node: {
                title: "🟨 Node.js (Serveur)",
                description: "Script de base.",
                options: {
                    api: {
                        title: "🟨 Créer une API (Express)",
                        code: "```javascript\nimport express from 'express';\nconst app = express();\n\n// Route GET qui renvoie du JSON\napp.get('/api/status', (req, res) => {\n    res.json({ \n        status: 'online',\n        users: 150 \n    });\n});\n\napp.listen(3000, () => console.log('API sur port 3000'));\n```"
                    }
                }
            }
        };

        // --- GESTION D'AFFICHAGE ---
        if (!category || !codex[category]) {
            const help = new EmbedBuilder()
                .setTitle("🟨 Codex JavaScript")
                .setDescription("Usage : `+js <bases|bot|node>`")
                .setColor("#F7DF1E");
            return message.reply({ embeds: [help] });
        }

        const cat = codex[category];
        if (!option || !cat.options[option]) {
            const optionsList = Object.keys(cat.options).map(o => `• \`${o}\` : ${cat.options[o].title}`).join('\n');
            const helpCat = new EmbedBuilder()
                .setTitle(cat.title)
                .setDescription(`${cat.description}\n\nOptions :\n${optionsList}`)
                .setColor("#F7DF1E");
            return message.reply({ embeds: [helpCat] });
        }

        const opt = cat.options[option];
        message.reply({ embeds: [new EmbedBuilder().setTitle(opt.title).setDescription(opt.code).setColor("#F7DF1E")] });
    }
};