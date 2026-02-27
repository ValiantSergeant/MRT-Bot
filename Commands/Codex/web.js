import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'web',
    description: 'Codex Web : HTML et CSS',
    run: async (bot, message, args, config) => {
        const category = args[0]?.toLowerCase();
        const option = args[1]?.toLowerCase();

        const codex = {
            html: {
                title: "🌐 HTML5 : Structure",
                description: "Le squelette de la page.",
                options: {
                    simple: {
                        title: "🌐 Structure Simple",
                        code: "```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Mon Site</title>\n</head>\n<body>\n    <h1>Bonjour</h1>\n</body>\n</html>\n```"
                    },
                    dashboard: {
                        title: "🌐 Template Dashboard (Tailwind)",
                        code: "```html\n<!DOCTYPE html>\n<html lang='fr'>\n<head>\n    <script src='[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)'></script>\n</head>\n<body class='bg-zinc-950 text-white'>\n    <div class='flex h-screen'>\n        <nav class='w-64 bg-zinc-900 p-6 border-r border-zinc-800'>\n            <h1 class='text-2xl font-bold text-indigo-400'>MRT Bot</h1>\n        </nav>\n        <main class='flex-1 p-10'>\n            <h2 class='text-4xl font-bold'>Bienvenue</h2>\n        </main>\n    </div>\n</body>\n</html>\n```"
                    }
                }
            },
            css: {
                title: "🌐 CSS : Styles",
                description: "Rendre le site joli.",
                options: {
                    couleurs: {
                        title: "🌐 Couleurs de base",
                        code: "```css\nbody {\n  background-color: #0f0f0f;\n  color: white;\n  font-family: Arial;\n}\nh1 {\n  color: #5865F2; /* Bleu Discord */\n  text-align: center;\n}\n```"
                    },
                    glass: {
                        title: "🌐 Effet Verre (Glassmorphism)",
                        code: "```css\n.glass-card {\n    background: rgba(255, 255, 255, 0.05);\n    backdrop-filter: blur(10px);\n    border: 1px solid rgba(255, 255, 255, 0.1);\n    border-radius: 16px;\n    padding: 20px;\n}\n```"
                    }
                }
            }
        };

        // --- GESTION D'AFFICHAGE ---
        if (!category || !codex[category]) {
            const help = new EmbedBuilder()
                .setTitle("🌐 Codex Web")
                .setDescription("Usage : `+web <html|css>`")
                .setColor("#E34F26");
            return message.reply({ embeds: [help] });
        }

        const cat = codex[category];
        if (!option || !cat.options[option]) {
            const optionsList = Object.keys(cat.options).map(o => `• \`${o}\` : ${cat.options[o].title}`).join('\n');
            const helpCat = new EmbedBuilder()
                .setTitle(cat.title)
                .setDescription(`${cat.description}\n\nOptions :\n${optionsList}`)
                .setColor("#E34F26");
            return message.reply({ embeds: [helpCat] });
        }

        const opt = cat.options[option];
        message.reply({ embeds: [new EmbedBuilder().setTitle(opt.title).setDescription(opt.code).setColor("#E34F26")] });
    }
};