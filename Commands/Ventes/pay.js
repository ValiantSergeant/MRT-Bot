import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../../config.json');

export const command = {
    name: "pay",
    aliases: ["paypal", "crypto", "paiement"],
    run: async (bot, message, args) => {
        const montant = args[0];
        const methode = args[1]?.toLowerCase();

        if (!montant || isNaN(montant)) return message.reply("⚠️ Usage: `+pay <montant> [btc/ltc]`");

        const embed = new EmbedBuilder()
            .setColor(config.color || '#96480C')
            .setTimestamp()
            .setFooter({ text: `Facture pour ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder();

        if (methode === "btc" || methode === "ltc") {
            const addr = methode === "btc" ? config.shop.btc : config.shop.ltc;
            const logo = methode === "btc" ? config.shop.logo_btc : config.shop.logo_ltc;
            
            embed
                .setTitle(`🪙 Paiement par ${methode.toUpperCase()}`)
                .setThumbnail(logo)
                .setDescription(`Merci d'envoyer l'équivalent de **${montant}€**.\n\n**Adresse de réception :**\n\`${addr}\``)
                .addFields({ name: "⚠️ Attention", value: "Vérifiez bien l'adresse et le réseau avant d'envoyer." });
        } else {
            const paypalLink = `${config.shop.paypal}/${montant}`;
            
            embed
                .setTitle(`💳 Paiement par PayPal - ${montant}€`)
                .setThumbnail(config.shop.logo_paypal)
                .setDescription(`Cliquez sur le bouton ci-dessous pour procéder au paiement.\n\n⚠️ **IMPORTANT :**\n- Sélectionnez obligatoirement **Amis et Proches**.\n- Ne mettez **aucun message** ou note lors de l'envoi.`)
                .addFields({ name: "📸 Screenshot requis", value: "Envoyez une preuve de paiement une fois terminé." })
                .setImage(config.shop.image);

            row.addComponents(
                new ButtonBuilder()
                    .setLabel('💳 Payer avec PayPal')
                    .setStyle(ButtonStyle.Link)
                    .setURL(paypalLink),
                new ButtonBuilder()
                    .setLabel('📸 Voir l\'exemple')
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.shop.image)
            );
        }

        message.reply({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });
    }
};