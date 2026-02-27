import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'lua',
    description: 'Codex Lua : Bases, FiveM et Roblox',
    run: async (bot, message, args, config) => {
        const category = args[0]?.toLowerCase(); // fivem, roblox, ou bases
        const option = args[1]?.toLowerCase();   // l'option spécifique

        const codex = {
            // ==========================================
            // --- BASES LUA ---
            // ==========================================
            bases: {
                title: "🌙 Bases du Langage Lua",
                description: "Les fondations du langage.",
                options: {
                    tables: {
                        title: "🌙 Tables (Listes et Dictionnaires)",
                        code: "```lua\n-- TABLE LISTE : Stocke plusieurs éléments (index commence à 1)\nlocal inventaire = {'Épée', 'Potion', 'Bouclier'}\nprint(inventaire[1]) -- Affiche: Épée\n\n-- TABLE DICTIONNAIRE : Stocke des données clés-valeurs\nlocal joueur = {\n    nom = 'Alexia',\n    vie = 100\n}\nprint(joueur.nom) -- Affiche: Alexia\n```"
                    }
                }
            },
            // ==========================================
            // --- FIVEM ---
            // ==========================================
            fivem: {
                title: "⚡ Scripting FiveM (Serveur)",
                description: "Communication et commandes serveur.",
                options: {
                    events: {
                        title: "⚡ Comprendre les Events (Client <-> Serveur)",
                        code: "```lua\n-- COTE SERVEUR : On écoute un message du client\nRegisterNetEvent('inventaire:prendreObjet')\nAddEventHandler('inventaire:prendreObjet', function(nomObjet)\n    -- 'source' est l'ID unique du joueur qui envoie l'event\n    local src = source \n    print(src .. ' a pris un : ' .. nomObjet)\nend)\n```"
                    },
                    command: {
                        title: "⚡ Créer une commande chat",
                        code: "```lua\n-- Enregistre la commande /heal\nRegisterCommand('heal', function(source, args, rawCommand)\n    -- 'source' est le joueur qui tape la commande\n    print('Le joueur ' .. source .. ' s'est soigné')\n    -- Ici le code pour soigner le joueur\nend, false) -- false = tout le monde peut l'utiliser\n```"
                    }
                }
            },
            // ==========================================
            // --- ROBLOX ---
            // ==========================================
            roblox: {
                title: "🧱 Scripting Roblox (Studio)",
                description: "Manipulation d'objets (Parts) et interactions.",
                options: {
                    parts: {
                        title: "🧱 Manipulation de Parts (Objets)",
                        code: "```lua\n-- On cible une pièce nommée 'Part' dans l'espace de jeu\nlocal piece = game.Workspace.Part\n\n-- On change sa couleur en rouge\npiece.BrickColor = BrickColor.new('Really red')\n\n-- On la rend transparente\npiece.Transparency = 0.5\n```"
                    },
                    touched: {
                        title: "🧱 Détecter un contact (Touched)",
                        code: "```lua\nlocal piece = script.Parent\n\n-- On écoute l'événement 'Touched' (quand on touche)\npiece.Touched:Connect(function(otherPart)\n    print('Quelqu'un a touché la pièce !')\n    -- Ici le code pour tuer ou téléporter le joueur\nend)\n```"
                    }
                }
            }
        };

        // --- GESTION DE L'AFFICHAGE ---

        // 1. Si aucune catégorie n'est précisée, afficher le menu principal
        if (!category || !codex[category]) {
            const help = new EmbedBuilder()
                .setTitle("🌙 Codex Lua Universel")
                .setDescription("Utilisation : `+lua <fivem|roblox|bases>`\n\nCatégories disponibles :\n• `bases` : Fondations du langage\n• `fivem` : Serveur et events\n• `roblox` : Manipulation d'objets")
                .setColor("#000080");
            return message.reply({ embeds: [help] });
        }

        const cat = codex[category];

        // 2. Si une catégorie est précise mais pas d'option, afficher les options de la catégorie
        if (!option || !cat.options[option]) {
            const optionsList = Object.keys(cat.options).map(o => `• \`${o}\` : ${cat.options[o].title}`).join('\n');
            const helpCat = new EmbedBuilder()
                .setTitle(cat.title)
                .setDescription(`${cat.description}\n\nOptions disponibles :\n${optionsList}\n\nUtilisation : \`+lua ${category} <option>\``)
                .setColor("#000080");
            return message.reply({ embeds: [helpCat] });
        }

        // 3. Si option précise, afficher le code
        const opt = cat.options[option];
        message.reply({
            embeds: [new EmbedBuilder()
                .setTitle(opt.title)
                .setDescription(opt.code)
                .setColor("#000080")]
        });
    }
};