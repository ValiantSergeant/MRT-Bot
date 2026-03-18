import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../../config.json');
import db from '../../Events/loadDatabase.js';

export const command = {
    name: "shopstats",
    aliases: ["sales", "stats"],
    description: "Affiche les statistiques des ventes",
    run: async (bot, message, args) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Tu n'as pas la permission.");
        }

        db.all('SELECT date FROM sales', [], (err, rows) => {
            if (err) return message.reply("❌ Erreur lors de la lecture de la base de données.");

            const total = rows.length;
            const now = Date.now();
            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            const ceMois = rows.filter(row => (now - row.date) < oneMonth).length;

            const embed = new EmbedBuilder()
                .setTitle("📈 Statistiques de la Boutique")
                .setColor(config.color || '#96480C')
                .addFields(
                    { name: "💰 Total des ventes", value: `${total} vente(s)`, inline: true },
                    { name: "📅 Ce mois-ci", value: `${ceMois} vente(s)`, inline: true }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        });
    }
};