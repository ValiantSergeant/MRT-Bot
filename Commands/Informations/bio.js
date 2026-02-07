import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'bio',
    helpname: 'bio <set/color/bg/music/social/text/playlist/location/preview/clear>',
    description: 'Configure ta page de bio web personnalisée',
    run: async (bot, message, args, config, db) => {
        const subCommand = args[0]?.toLowerCase();

        if (!subCommand) {
            const helpEmbed = new EmbedBuilder()
                .setTitle("🌟 Configuration de ta Bio")
                .setDescription("Personnalise ton espace web avec ces commandes :")
                .addFields(
                    { name: "🔗 `+bio set <pseudo>`", value: "Définit ton URL unique", inline: true },
                    { name: "🎨 `+bio color <#hex>`", value: "Couleur des accents", inline: true },
                    { name: "🖼️ `+bio bg <url/image>`", value: "Image de fond", inline: true },
                    { name: "🎵 `+bio music <infos>`", value: "Lecteur MP3 (lien_mp3|lien_img|titre|artiste)" },
                    { name: "📍 `+bio location <ville>`", value: "Affiche ta localisation", inline: true },
                    { name: "🎼 `+bio playlist <url>`", value: "Lien du bouton Spotify", inline: true },
                    { name: "👀 `+bio preview`", value: "Voir ta page actuelle", inline: true },
                    { name: "📱 `+bio social <nom> <url>`", value: "Ajoute un réseau", inline: true },
                    { name: "🗑️ `+bio clear`", value: "Supprime ta page", inline: true }
                )
                .setFooter({ text: "Configure ta page de bio web personnalisée" })
                .setColor(config.color || "#ffffff");
            return message.reply({ embeds: [helpEmbed] });
        }

        const userId = message.author.id;

        await new Promise((resolve) => {
            db.run('INSERT OR IGNORE INTO user_bios (userId, display_name, avatar_url) VALUES (?, ?, ?)',
                [userId, message.author.username, message.author.displayAvatarURL({ extension: 'png' })], () => resolve());
        });

        if (subCommand === 'set') {
            const slug = args[1]?.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!slug || slug.length < 3) return message.reply("❌ Pseudo invalide.");

            db.get('SELECT userId FROM user_bios WHERE slug = ?', [slug], (err, row) => {
                if (row && row.userId !== userId) return message.reply("❌ Ce pseudo est déjà pris.");
                db.run('UPDATE user_bios SET slug = ? WHERE userId = ?', [slug, userId], () => {
                    const base = config.panelURL?.replace(/\/$/, "") || "http://localhost:3000";
                    message.reply(`✅ Page créée : **${base}/${config.bioRoute || "b"}/${slug}**`);
                });
            });
        }

        if (subCommand === 'location') {
            const loc = args.slice(1).join(' ');
            if (!loc) return message.reply("❌ Fournis une localisation.");
            db.run('UPDATE user_bios SET location = ? WHERE userId = ?', [loc, userId], () => {
                message.reply(`📍 Localisation mise à jour : **${loc}**`);
            });
        }

        if (subCommand === 'preview') {
            db.get('SELECT slug, color FROM user_bios WHERE userId = ?', [userId], (err, row) => {
                if (!row || !row.slug) return message.reply("❌ Tu n'as pas de page. Fais `+bio set`.");
                const base = config.panelURL?.replace(/\/$/, "") || "http://localhost:3000";
                const url = `${base}/${config.bioRoute || "b"}/${row.slug}`;
                const embed = new EmbedBuilder()
                    .setTitle("👀 Aperçu de ta bio")
                    .setDescription(`Ta page est disponible ici : [${url}](${url})`)
                    .setColor(row.color || "#ffffff")
                    .setThumbnail(message.author.displayAvatarURL());
                message.reply({ embeds: [embed] });
            });
        }

        if (subCommand === 'bg') {
            let bgURL = message.attachments.size > 0 ? message.attachments.first().url : args[1];
            if (!bgURL) return message.reply("❌ Fournis un lien d'image.");
            db.run('UPDATE user_bios SET background_url = ? WHERE userId = ?', [bgURL, userId], () => {
                message.reply("🖼️ Fond mis à jour !");
            });
        }

        if (subCommand === 'music') {
            const musicData = args.slice(1).join(' ');
            if (!musicData) return message.reply("❌ Format : `mp3|img|titre|artiste`.");
            db.run('UPDATE user_bios SET music_url = ? WHERE userId = ?', [musicData, userId], () => {
                message.reply("🎵 Musique mise à jour !");
            });
        }

        if (subCommand === 'playlist') {
            const url = args[1];
            if (!url) return message.reply("❌ Fournis un lien.");
            db.run('UPDATE user_bios SET playlist_url = ? WHERE userId = ?', [url, userId], () => {
                message.reply("🎼 Playlist mise à jour !");
            });
        }

        if (subCommand === 'color') {
            const color = args[1];
            if (!/^#[0-9A-F]{6}$/i.test(color)) return message.reply("❌ Format hexadécimal requis.");
            db.run('UPDATE user_bios SET color = ? WHERE userId = ?', [color, userId], () => {
                message.reply(`🎨 Couleur mise à jour : \`${color}\``);
            });
        }

        if (subCommand === 'social') {
            const name = args[1], url = args[2];
            if (!name || !url) return message.reply("❌ `+bio social <nom> <url>`");
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
            if (!text) return message.reply("❌ Fournis une description.");
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