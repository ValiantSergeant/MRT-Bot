import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'python',
    description: 'Codex Python : Bases et Scripts',
    run: async (bot, message, args, config) => {
        const category = args[0]?.toLowerCase();
        const option = args[1]?.toLowerCase();

        const codex = {
            bases: {
                title: "🐍 Bases de Python",
                description: "Les fondations du langage.",
                options: {
                    listes: {
                        title: "🐍 Manipuler les Listes",
                        code: "```python\n# On crée une liste avec des crochets\nutilisateurs = ['Alice', 'Bob']\n\n# On ajoute un nom à la fin\nutilisateurs.append('Charlie')\n\n# On affiche le premier élément (index 0)\nprint(utilisateurs[0])\n```"
                    },
                    boucles: {
                        title: "🐍 Boucles FOR",
                        code: "```python\n# Répéter une action pour chaque élément\nfor i in range(3):\n    print(f'Tour numéro {i}')\n```"
                    }
                }
            },
            bot: {
                title: "🐍 Discord.py (Bot)",
                description: "Bases de discord.py.",
                options: {
                    simple: {
                        title: "🐍 Bot Simple",
                        code: "```python\nimport discord\nfrom discord.ext import commands\n\n# Configuration des intents (permissions)\nintents = discord.Intents.default()\nintents.message_content = True\n\nbot = commands.Bot(command_prefix='!', intents=intents)\n\n@bot.event\nasync def on_ready():\n    print(f'Connecté : {bot.user}')\n\n@bot.command()\nasync def ping(ctx):\n    await ctx.send('Pong!')\n\nbot.run('TOKEN_ICI')\n```"
                    }
                }
            }
        };

        // --- GESTION D'AFFICHAGE ---
        if (!category || !codex[category]) {
            const help = new EmbedBuilder()
                .setTitle("🐍 Codex Python")
                .setDescription("Usage : `+python <bases|bot>`")
                .setColor("#3776AB");
            return message.reply({ embeds: [help] });
        }

        const cat = codex[category];
        if (!option || !cat.options[option]) {
            const optionsList = Object.keys(cat.options).map(o => `• \`${o}\` : ${cat.options[o].title}`).join('\n');
            const helpCat = new EmbedBuilder()
                .setTitle(cat.title)
                .setDescription(`${cat.description}\n\nOptions :\n${optionsList}`)
                .setColor("#3776AB");
            return message.reply({ embeds: [helpCat] });
        }

        const opt = cat.options[option];
        message.reply({ embeds: [new EmbedBuilder().setTitle(opt.title).setDescription(opt.code).setColor("#3776AB")] });
    }
};