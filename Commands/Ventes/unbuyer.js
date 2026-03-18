import { PermissionFlagsBits } from 'discord.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../../config.json');
import db from '../../Events/loadDatabase.js';

export const command = {
    name: "unbuyer",
    aliases: ["removebuyer"],
    description: "Retire le rôle acheteur et supprime la vente des stats",
    run: async (bot, message, args) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Tu n'as pas la permission.");
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply("⚠️ Usage: `+unbuyer <@membre>`");

        const roleId = config.shop.buyerRoleId;

        try {
            await target.roles.remove(roleId);
            
            db.run('DELETE FROM sales WHERE userId = ?', [target.id], (err) => {
                if (err) console.error(err);
                message.reply(`🗑️ Rôle retiré et données de vente supprimées pour **${target.user.username}**.`);
            });
        } catch (error) {
            message.reply("❌ Erreur lors du retrait du rôle.");
        }
    }
};