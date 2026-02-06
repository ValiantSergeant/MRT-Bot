import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'bio',
    helpname: 'bio <set/color/bg/music/social/text/clear>',
    description: 'Configure ta page de bio web personnalisée',
    run: async (bot, message, args, config, db) => {
        const subCommand = args[0]?.toLowerCase();

        if (!subCommand) {
            const helpEmbed = new EmbedBuilder()
                .setTitle("🌟 Ta Page Bio Personnalisée")
                .setDescription("Configure ta vitrine web en quelques secondes !")
                .addFields(
                    { name: "🔗 `+bio set <pseudo>`", value: "Définit ton URL unique" },
                    { name: "🎨 `+bio color <#hex>`", value: "Change la couleur des boutons" },
                    { name: "🖼️ `+bio bg <url/image>`", value: "Change l'image de fond" },
                    { name: "🎵 `+bio music <url_directe>`", value: "Ajoute un fond sonore (mp3)" },
                    { name: "📱 `+bio social <nom> <url>`", value: "Ajoute un réseau social" },
                    { name: "📝 `+bio text <texte>`", value: "Modifie ta description" },
                    { name: "🗑️ `+bio clear`", value: "Supprime ta page" }
                )
                .setColor(config.color || "#5865F2");
            return message.reply({ embeds: [helpEmbed] });
        }

        const userId = message.author.id;

        await new Promise((resolve) => {
            db.run('INSERT OR IGNORE INTO user_bios (userId, display_name, avatar_url) VALUES (?, ?, ?)',
                [userId, message.author.username, message.author.displayAvatarURL({ extension: 'png' })], () => resolve());
        });

        if (subCommand === 'set') {
            const slug = args[1]?.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!slug || slug.length < 3) return message.reply("❌ Pseudo invalide (min 3 carac).");

            db.get('SELECT userId FROM user_bios WHERE slug = ?', [slug], (err, row) => {
                if (row && row.userId !== userId) return message.reply("❌ Ce pseudo est déjà pris.");
                db.run('UPDATE user_bios SET slug = ? WHERE userId = ?', [slug, userId], () => {
                    const route = config.bioRoute || "b";
                    const base = config.panelURL?.replace(/\/$/, "") || "http://localhost:3000";
                    message.reply(`✅ Page créée : **${base}/${route}/${slug}**`);
                });
            });
        }

        if (subCommand === 'bg') {
            let bgURL = null;

            if (message.attachments.size > 0) {
                bgURL = message.attachments.first().url;
            } else if (args[1]) {
                bgURL = args[1];
            }

            if (!bgURL) return message.reply("❌ Merci de fournir un lien d'image ou d'envoyer une image avec la commande.");

            db.run('UPDATE user_bios SET background_url = ? WHERE userId = ?', [bgURL, userId], () => {
                message.reply("🖼️ Ton image de fond a été mise à jour !");
            });
        }

        if (subCommand === 'music') {
            let newMusic = args[1];
            if (!newMusic) return message.reply("❌ Fournis un lien (MP3 ou Spotify).");

            if (newMusic.includes('spotify.com')) {
                const trackMatch = newMusic.match(/track\/([a-zA-Z0-9]+)/);
                const plMatch = newMusic.match(/playlist\/([a-zA-Z0-9]+)/);
                if (trackMatch) newMusic = `spotify:track:${trackMatch[1]}`;
                else if (plMatch) newMusic = `spotify:playlist:${plMatch[1]}`;
            }

            db.get('SELECT music_url FROM user_bios WHERE userId = ?', [userId], (err, row) => {
                let currentMusic = row?.music_url;
                let finalMusic = newMusic;

                if (currentMusic && !newMusic.includes('spotify:') && !currentMusic.includes('spotify:')) {
                    finalMusic = `${currentMusic},${newMusic}`;
                }

                db.run('UPDATE user_bios SET music_url = ? WHERE userId = ?', [finalMusic, userId], () => {
                    message.reply(finalMusic.includes(',') ? "🎵 Musique ajoutée à ta playlist aléatoire !" : "🎵 Musique mise à jour !");
                });
            });
        }

        if (subCommand === 'color') {
            const color = args[1];
            if (!/^#[0-9A-F]{6}$/i.test(color)) return message.reply("❌ Format hexadécimal requis (ex: #FF0000).");
            db.run('UPDATE user_bios SET color = ? WHERE userId = ?', [color, userId], () => {
                message.reply(`🎨 Couleur mise à jour : \`${color}\``);
            });
        }

        if (subCommand === 'social') {
            const name = args[1];
            const url = args[2];
            if (!name || !url) return message.reply("❌ Utilisation : `+bio social <nom> <url>`");
            db.get('SELECT social_links FROM user_bios WHERE userId = ?', [userId], (err, row) => {
                let links = row?.social_links ? JSON.parse(row.social_links) : {};
                links[name] = url;
                db.run('UPDATE user_bios SET social_links = ? WHERE userId = ?', [JSON.stringify(links), userId], () => {
                    message.reply(`📱 Réseau **${name}** ajouté !`);
                });
            });
        }

        if (subCommand === 'text') {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply("❌ Merci de fournir un texte.");
            db.run('UPDATE user_bios SET bio = ? WHERE userId = ?', [text, userId], () => {
                message.reply("📝 Description mise à jour !");
            });
        }

        if (subCommand === 'clear') {
            db.run('DELETE FROM user_bios WHERE userId = ?', [userId], () => {
                message.reply("🗑️ Ta bio a été supprimée.");
            });
        }
    }
};