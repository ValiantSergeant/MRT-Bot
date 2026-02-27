import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'sql',
    description: 'Bases du SQL expliquées',
    run: async (bot, message, args, config) => {
        const query = args[0]?.toLowerCase();

        const modules = {
            select: {
                title: "🗄️ SQL : Lire des données",
                desc: "Pour récupérer des informations stockées.",
                code: "```sql\n-- On sélectionne TOUTES les colonnes (*) de la table 'utilisateurs'\nSELECT * FROM utilisateurs;\n\n-- On sélectionne seulement le nom et l'id, MAIS seulement si l'argent > 1000\nSELECT nom, id FROM utilisateurs WHERE argent > 1000;\n\n-- On trie les résultats par argent, du plus grand au plus petit\nSELECT * FROM utilisateurs ORDER BY argent DESC;\n```"
            },
            insert: {
                title: "🗄️ SQL : Ajouter des données",
                desc: "Pour insérer de nouvelles informations.",
                code: "```sql\n-- On ajoute un nouvel utilisateur avec ses informations\nINSERT INTO utilisateurs (id, nom, argent) \nVALUES ('discord_id_123', 'Alexia', 500);\n\n-- INSERT OR REPLACE permet de mettre à jour si l'id existe déjà\nINSERT OR REPLACE INTO whitelist (id) VALUES ('discord_id_123');\n```"
            }
        };

        if (!query || !modules[query]) {
            const help = new EmbedBuilder()
                .setTitle("🗄️ Codex SQL (Débutant)")
                .setDescription("Apprends les bases :\n• `select` : Lire et filtrer des données\n• `insert` : Ajouter ou mettre à jour des données")
                .setColor("#4479A1");
            return message.reply({ embeds: [help] });
        }

        const mod = modules[query];
        message.reply({
            embeds: [new EmbedBuilder().setTitle(mod.title).setDescription(`${mod.desc}\n${mod.code}`).setColor("#4479A1")]
        });
    }
};