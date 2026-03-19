import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../config.json' with { type: 'json' };
import * as Discord from "discord.js";

export const command = {
    name: 'captcha',
    helpname: 'captcha [role]',
    description: 'Permet de configurer/envoyer le captcha',
    help: 'captcha [role]',
    run: async (bot, message, args, config) => {
        const cCheckPerm = async (message, commandName) => {
            if (config.owners.includes(message.author.id)) {
                return true;
            }

            const cPublicStatut = await new Promise((resolve, reject) => {
                db.get('SELECT statut FROM public WHERE guild = ? AND statut = ?', [message.guild.id, 'on'], (err, row) => {
                    if (err) reject(err);
                    resolve(!!row);
                });
            });

            if (cPublicStatut) {
                const cCheckPublicCmd = await new Promise((resolve, reject) => {
                    db.get(
                        'SELECT command FROM cmdperm WHERE perm = ? AND command = ? AND guild = ?',
                        ['public', commandName, message.guild.id],
                        (err, row) => {
                            if (err) reject(err);
                            resolve(!!row);
                        }
                    );
                });

                if (cCheckPublicCmd) {
                    return true;
                }
            }

            try {
                const cCheckUserWl = await new Promise((resolve, reject) => {
                    db.get('SELECT id FROM whitelist WHERE id = ?', [message.author.id], (err, row) => {
                        if (err) reject(err);
                        resolve(!!row);
                    });
                });

                if (cCheckUserWl) {
                    return true;
                }

                const cCheckDbOwner = await new Promise((resolve, reject) => {
                    db.get('SELECT id FROM owner WHERE id = ?', [message.author.id], (err, row) => {
                        if (err) reject(err);
                        resolve(!!row);
                    });
                });

                if (cCheckDbOwner) {
                    return true;
                }

                const cRoles = message.member.roles.cache.map(role => role.id);

                const cPermissions = await new Promise((resolve, reject) => {
                    db.all('SELECT perm FROM permissions WHERE id IN (' + cRoles.map(() => '?').join(',') + ') AND guild = ?', [...cRoles, message.guild.id], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows.map(row => row.perm));
                    });
                });

                if (cPermissions.length === 0) {
                    return false;
                }

                const cCheckCmdPermLevel = await new Promise((resolve, reject) => {
                    db.all('SELECT command FROM cmdperm WHERE perm IN (' + cPermissions.map(() => '?').join(',') + ') AND guild = ?', [...cPermissions, message.guild.id], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows.map(row => row.command));
                    });
                });

                return cCheckCmdPermLevel.includes(commandName);
            } catch (error) {
                console.error(error);
                return false;
            }
        };

        if (!(await cCheckPerm(message, command.name))) {
            const cNoAcces = new EmbedBuilder()
                .setDescription("Vous n'avez pas la permission d'utiliser cette commande")
                .setColor(config.color);
            return message.reply({ embeds: [cNoAcces], allowedMentions: { repliedUser: true } }).then(m => setTimeout(() => m.delete().catch(() => { }), 2000));
        }

        if (args[0]) {
            const cRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
            if (!cRole) {
                return message.reply("Rôle invalide ou introuvable.");
            }

            db.run(`CREATE TABLE IF NOT EXISTS captcha (guild TEXT PRIMARY KEY, id TEXT)`, [], (err) => {
                if (err) console.error(err);
                db.run(`INSERT OR REPLACE INTO captcha (guild, id) VALUES (?, ?)`, [message.guild.id, cRole.id], (err) => {
                    if (err) console.error(err);
                    message.reply(`Le rôle captcha a bien été configuré.`);
                });
            });
            return;
        }

        db.get('SELECT id FROM captcha WHERE guild = ?', [message.guild.id], async (err, row) => {
            if (err) console.error(err);
            if (!row) {
                return message.reply("Utilisez captcha <role> pour configurer le role.");
            }

            const cVrf = new EmbedBuilder()
                .setTitle(config.captcha.titre)
                .setDescription(config.captcha.description)
                .setColor(config.captcha.color);

            if (config.captcha.image && config.captcha.image.trim() !== '') {
                cVrf.setImage(config.captcha.image);
            }

            const cButton = new ButtonBuilder()
                .setCustomId('cbutton')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(config.captcha.emoji);

            const cArw = new ActionRowBuilder().addComponents(cButton);

            await message.channel.send({ embeds: [cVrf], components: [cArw] });
        });
    },
}