import { PermissionFlagsBits } from 'discord.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../../config.json');
import db from '../../Events/loadDatabase.js';

export const command = {
    name: "buyer",
    aliases: ["addbuyer"],
    description: "Ajoute le rôle acheteur et enregistre la vente",
    run: async (bot, message, args) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Tu n'as pas la permission.");
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply("⚠️ Usage: `+buyer <@membre>`");

        const roleId = config.shop.buyerRoleId;
        
        try {
            await target.roles.add(roleId);
            
            db.run('INSERT INTO sales (userId, date) VALUES (?, ?)', [target.id, Date.now()], (err) => {
                if (err) console.error(err);
                message.reply(`✅ **${target.user.username}** est maintenant acheteur. Vente enregistrée !`);
            });
        } catch (error) {
            message.reply("❌ Impossible d'ajouter le rôle. Vérifie mes permissions.");
        }
    }
};